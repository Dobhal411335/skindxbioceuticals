import type {
  AuthProvider,
  EmailOutboxStatus,
  Prisma,
  UserRole,
  VerificationPurpose,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';

const userWithMemberships = {
  siteMemberships: {
    include: {
      site: true,
    },
  },
  externalIdentities: true,
} satisfies Prisma.UserInclude;

export type UserWithMemberships = Prisma.UserGetPayload<{
  include: typeof userWithMemberships;
}>;

/**
 * Auth repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class AuthRepository {
  protected readonly db = prisma;

  async countAdministrators(): Promise<number> {
    return this.db.user.count({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithMemberships | null> {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userWithMemberships,
    });
  }

  async findByUsername(username: string): Promise<UserWithMemberships | null> {
    return this.db.user.findUnique({
      where: { username },
      include: userWithMemberships,
    });
  }

  async findById(id: string): Promise<UserWithMemberships | null> {
    return this.db.user.findUnique({
      where: { id },
      include: userWithMemberships,
    });
  }

  async findActiveSites() {
    return this.db.site.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findSitesByCodes(codes: string[]) {
    return this.db.site.findMany({
      where: {
        code: { in: codes },
        isActive: true,
      },
    });
  }

  /**
   * One-time first-admin bootstrap under a transaction advisory lock.
   */
  async bootstrapSuperAdmin(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<UserWithMemberships> {
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(872014001)`;

      const adminCount = await tx.user.count({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      });

      if (adminCount > 0) {
        throw new Error('ADMIN_ALREADY_EXISTS');
      }

      const sites = await tx.site.findMany({
        where: {
          code: { in: ['IN', 'COM'] },
          isActive: true,
        },
      });

      if (sites.length < 2) {
        throw new Error('SITES_NOT_SEEDED');
      }

      return tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          siteMemberships: {
            create: sites.map((site) => ({
              siteId: site.id,
              role: 'ADMIN',
            })),
          },
        },
        include: userWithMemberships,
      });
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async findByExternalIdentity(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<UserWithMemberships | null> {
    const identity = await this.db.externalIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      include: {
        user: {
          include: userWithMemberships,
        },
      },
    });

    return identity?.user ?? null;
  }

  async createGoogleCustomer(input: {
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    providerUserId: string;
    emailVerifiedAt: Date;
  }): Promise<UserWithMemberships> {
    return this.db.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: null,
        firstName: input.firstName,
        lastName: input.lastName,
        imageUrl: input.imageUrl,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerifiedAt: input.emailVerifiedAt,
        externalIdentities: {
          create: {
            provider: 'GOOGLE',
            providerUserId: input.providerUserId,
          },
        },
      },
      include: userWithMemberships,
    });
  }

  async findGoogleIdentityByProviderUserId(providerUserId: string) {
    return this.db.externalIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'GOOGLE',
          providerUserId,
        },
      },
    });
  }

  /**
   * Attach a verified Google identity to an existing customer and mark email verified.
   * Caller must ensure providerUserId is not linked to a different user.
   */
  async linkGoogleIdentityAndActivate(input: {
    userId: string;
    providerUserId: string;
    emailVerifiedAt: Date;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }): Promise<UserWithMemberships> {
    return this.db.$transaction(async (tx) => {
      const existingLink = await tx.externalIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: 'GOOGLE',
            providerUserId: input.providerUserId,
          },
        },
      });
      if (!existingLink) {
        await tx.externalIdentity.create({
          data: {
            userId: input.userId,
            provider: 'GOOGLE',
            providerUserId: input.providerUserId,
          },
        });
      }

      await tx.emailVerificationToken.updateMany({
        where: {
          userId: input.userId,
          purpose: 'EMAIL_VERIFICATION',
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      return tx.user.update({
        where: { id: input.userId },
        data: {
          status: 'ACTIVE',
          emailVerifiedAt: input.emailVerifiedAt,
          ...(input.firstName ? { firstName: input.firstName } : {}),
          ...(input.lastName ? { lastName: input.lastName } : {}),
          ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
        },
        include: userWithMemberships,
      });
    });
  }

  async createPendingPasswordCustomer(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName?: string;
  }): Promise<UserWithMemberships> {
    return this.db.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: 'CUSTOMER',
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      },
      include: userWithMemberships,
    });
  }

  async updatePendingPasswordCustomer(
    userId: string,
    input: {
      passwordHash: string;
      firstName: string;
      lastName?: string;
    },
  ): Promise<UserWithMemberships> {
    return this.db.user.update({
      where: { id: userId },
      data: {
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      },
      include: userWithMemberships,
    });
  }

  async invalidateUnconsumedVerificationTokens(
    userId: string,
    purpose: VerificationPurpose,
  ): Promise<void> {
    await this.db.emailVerificationToken.updateMany({
      where: {
        userId,
        purpose,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }

  async createVerificationToken(input: {
    userId: string;
    tokenHash: string;
    purpose: VerificationPurpose;
    expiresAt: Date;
  }) {
    return this.db.emailVerificationToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        purpose: input.purpose,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findLatestActiveVerificationToken(userId: string, purpose: VerificationPurpose) {
    return this.db.emailVerificationToken.findFirst({
      where: {
        userId,
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementVerificationAttempt(tokenId: string): Promise<number> {
    const updated = await this.db.emailVerificationToken.update({
      where: { id: tokenId },
      data: {
        attemptCount: { increment: 1 },
      },
    });
    return updated.attemptCount;
  }

  async consumeVerificationToken(tokenId: string): Promise<boolean> {
    const result = await this.db.emailVerificationToken.updateMany({
      where: {
        id: tokenId,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
    return result.count === 1;
  }

  /**
   * Atomically consume OTP and activate the customer account.
   * Returns null if the token was already consumed (concurrent race).
   */
  async verifyEmailAndActivate(input: {
    userId: string;
    tokenId: string;
  }): Promise<UserWithMemberships | null> {
    return this.db.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationToken.updateMany({
        where: {
          id: input.tokenId,
          userId: input.userId,
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      if (consumed.count !== 1) {
        return null;
      }

      return tx.user.update({
        where: { id: input.userId },
        data: {
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
        include: userWithMemberships,
      });
    });
  }

  async createEmailOutbox(input: {
    userId: string;
    templateKey: string;
    siteCode: string;
    payloadJson: Prisma.InputJsonValue;
  }) {
    return this.db.emailOutbox.create({
      data: {
        userId: input.userId,
        templateKey: input.templateKey,
        siteCode: input.siteCode,
        payloadJson: input.payloadJson,
        status: 'PENDING',
      },
    });
  }

  async markEmailOutboxSent(outboxId: string): Promise<void> {
    await this.db.emailOutbox.update({
      where: { id: outboxId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        attemptCount: { increment: 1 },
        lastError: null,
      },
    });
  }

  async markEmailOutboxFailed(outboxId: string, lastError: string): Promise<void> {
    await this.db.emailOutbox.update({
      where: { id: outboxId },
      data: {
        status: 'FAILED' as EmailOutboxStatus,
        attemptCount: { increment: 1 },
        lastError: lastError.slice(0, 500),
      },
    });
  }

  async markWelcomeEmailSent(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: {
        welcomeEmailSentAt: new Date(),
      },
    });
  }

  async storeRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.db.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: userWithMemberships,
        },
      },
    });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<UserWithMemberships> {
    return this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: userWithMemberships,
    });
  }

  async userHasSiteAccess(userId: string, siteId: string, role: UserRole): Promise<boolean> {
    if (role === 'SUPER_ADMIN') {
      return true;
    }

    const membership = await this.db.siteMembership.findUnique({
      where: {
        userId_siteId: { userId, siteId },
      },
    });

    return Boolean(membership);
  }
}

export const authRepository = new AuthRepository();
