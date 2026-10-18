import { randomBytes } from 'crypto';
import type { VendorApplicationStatus } from '@prisma/client';
import { emailService } from '@/lib/email';
import { logger } from '@/lib/logger';
import { hashPassword } from '@/lib/password';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError, ValidationError } from '@/utils/AppError';
import { vendorsRepository } from './vendors.repository';
import type {
  VendorApplicationCreateBody,
  VendorApplicationListQuery,
  VendorApplicationStatusPatch,
  VendorCredentialActivePatch,
  VendorCredentialsListQuery,
} from './vendors.validation';
import type {
  VendorApplicationDetailDto,
  VendorApplicationListItemDto,
  VendorApplicationRecord,
  VendorApplicationStatusPatchResultDto,
  VendorCredentialDto,
  VendorCredentialMutateResultDto,
  VendorDocumentRef,
  SiteCodeDto,
} from './vendors.types';

function parseDocument(value: unknown): VendorDocumentRef | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.url !== 'string' || typeof record.publicId !== 'string') {
    return null;
  }
  return { url: record.url, publicId: record.publicId };
}

function toListItem(
  record: VendorApplicationRecord,
  siteCode: SiteCodeDto,
): VendorApplicationListItemDto {
  return {
    id: record.id,
    siteCode,
    businessName: record.businessName,
    contactPerson: record.contactPerson,
    mobile: record.mobile,
    email: record.email,
    gstNumber: record.gstNumber,
    status: record.status,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toDetail(
  record: VendorApplicationRecord,
  siteCode: SiteCodeDto,
): VendorApplicationDetailDto {
  return {
    ...toListItem(record, siteCode),
    businessType: record.businessType,
    industryCategory: record.industryCategory,
    yearOfEstablishment: record.yearOfEstablishment,
    legalStructure: record.legalStructure,
    isGstRegistered: record.isGstRegistered,
    panNumber: record.panNumber,
    msmeNumber: record.msmeNumber,
    gstCertificate: parseDocument(record.gstCertificate),
    panCard: parseDocument(record.panCard),
    msmeCertificate: parseDocument(record.msmeCertificate),
    cancelledCheque: parseDocument(record.cancelledCheque),
    productCatalog: parseDocument(record.productCatalog),
    businessCard: parseDocument(record.businessCard),
    aadhaarUpload: parseDocument(record.aadhaarUpload),
    authorizedPersonPhoto: parseDocument(record.authorizedPersonPhoto),
    designation: record.designation,
    alternateMobile: record.alternateMobile,
    whatsappNumber: record.whatsappNumber,
    address: record.address,
    city: record.city,
    state: record.state,
    pincode: record.pincode,
    country: record.country,
    deliveryCapability: record.deliveryCapability,
    bankName: record.bankName,
    accountHolderName: record.accountHolderName,
    accountNumber: record.accountNumber,
    ifscCode: record.ifscCode,
    branch: record.branch,
    qualityCertifications: record.qualityCertifications,
    returnPolicy: record.returnPolicy,
    aadhaarNumber: record.aadhaarNumber,
    referredBy: record.referredBy,
    additionalNotes: record.additionalNotes,
    notes: record.notes,
    username: record.username,
    userId: record.userId,
  };
}

function toCredential(
  record: VendorApplicationRecord,
  siteCode: SiteCodeDto,
): VendorCredentialDto {
  return {
    id: record.id,
    siteCode,
    businessName: record.businessName,
    contactPerson: record.contactPerson,
    email: record.email,
    mobile: record.mobile,
    username: record.username ?? '',
    passwordPlain: record.passwordPlain ?? '',
    isActive: record.isActive,
    status: record.status,
    userId: record.userId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function generateUsername(contactPerson: string): string {
  const base = contactPerson
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12);
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${base || 'vendor'}${suffix}`;
}

function generatePassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  const bytes = randomBytes(10);
  let password = '';
  for (let i = 0; i < 10; i += 1) {
    password += chars.charAt(bytes[i]! % chars.length);
  }
  return password;
}

export class VendorsService {
  constructor(
    private readonly repository = vendorsRepository,
    private readonly mail = emailService,
  ) {}

  async createPublic(input: {
    siteId: string;
    siteCode: SiteCode;
    body: VendorApplicationCreateBody;
  }): Promise<VendorApplicationListItemDto | null> {
    if ((input.body.website ?? '').trim().length > 0) {
      logger.info(
        { event: 'vendor_application.honeypot_rejected', siteCode: input.siteCode },
        'Vendor application honeypot triggered',
      );
      return null;
    }

    const existing = await this.repository.findDuplicate(
      input.siteId,
      input.body.email,
      input.body.mobile,
    );
    if (existing) {
      throw new ConflictError(
        'An application with this email or mobile already exists for this site',
      );
    }

    const record = await this.repository.create(input.siteId, input.body);
    logger.info(
      {
        event: 'vendor_application.created',
        siteCode: input.siteCode,
        applicationId: record.id,
      },
      'Vendor application submitted',
    );
    return toListItem(record, input.siteCode);
  }

  async listApplications(
    siteId: string,
    siteCode: SiteCode,
    query: VendorApplicationListQuery,
  ): Promise<VendorApplicationListItemDto[]> {
    const status =
      query.status === 'all' ? undefined : (query.status as VendorApplicationStatus);
    const rows = await this.repository.listBySite(siteId, {
      status,
      q: query.q,
    });
    return rows.map((row) => toListItem(row, siteCode));
  }

  async getApplication(
    siteId: string,
    siteCode: SiteCode,
    applicationId: string,
  ): Promise<VendorApplicationDetailDto> {
    const record = await this.repository.findByIdForSite(siteId, applicationId);
    if (!record) {
      throw new NotFoundError('Vendor application not found');
    }
    return toDetail(record, siteCode);
  }

  async patchStatus(
    siteId: string,
    siteCode: SiteCode,
    applicationId: string,
    body: VendorApplicationStatusPatch,
  ): Promise<VendorApplicationStatusPatchResultDto> {
    const record = await this.repository.findByIdForSite(siteId, applicationId);
    if (!record) {
      throw new NotFoundError('Vendor application not found');
    }

    if (body.status === 'APPROVED') {
      return this.approveApplication(siteId, siteCode, record, body.notes);
    }

    const isActive = false;
    const updated = await this.repository.updateStatus(applicationId, {
      status: body.status,
      isActive,
      notes: body.notes,
    });

    if (record.userId) {
      await this.repository.updateUserStatus(record.userId, 'INACTIVE');
    }

    logger.info(
      {
        event: 'vendor_application.status_updated',
        siteCode,
        applicationId,
        status: body.status,
      },
      'Vendor application status updated',
    );

    return {
      application: toDetail(updated, siteCode),
      credentials: null,
      emailSent: false,
    };
  }

  private async approveApplication(
    siteId: string,
    siteCode: SiteCode,
    record: VendorApplicationRecord,
    notes?: string | null,
  ): Promise<VendorApplicationStatusPatchResultDto> {
    if (record.status === 'APPROVED' && record.userId && record.username) {
      const reactivated = await this.repository.updateStatus(record.id, {
        status: 'APPROVED',
        isActive: true,
        notes,
      });
      await this.repository.updateUserStatus(record.userId, 'ACTIVE');
      return {
        application: toDetail(reactivated, siteCode),
        credentials: record.passwordPlain
          ? {
              username: record.username,
              password: record.passwordPlain,
              email: record.email,
            }
          : null,
        emailSent: false,
      };
    }

    let username = generateUsername(record.contactPerson).toLowerCase();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (!(await this.repository.usernameExists(username))) break;
      username = generateUsername(record.contactPerson).toLowerCase();
    }
    if (await this.repository.usernameExists(username)) {
      throw new ConflictError('Unable to allocate a unique vendor username');
    }

    // Hash once for login; keep plaintext separately for admin reveal/email only.
    const passwordPlain = generatePassword();
    const passwordHash = await hashPassword(passwordPlain);

    const existingUser = await this.repository.findUserByEmail(record.email);
    let userId = record.userId;

    if (existingUser) {
      if (existingUser.role !== 'VENDOR') {
        throw new ConflictError(
          'This email is already registered as a non-vendor account',
        );
      }
      userId = existingUser.id;
      await this.repository.updateVendorUserCredentials(existingUser.id, {
        username,
        passwordHash,
        firstName: record.contactPerson,
        phone: record.mobile,
        emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
      });
    } else {
      const user = await this.repository.createVendorUser({
        email: record.email,
        username,
        passwordHash,
        firstName: record.contactPerson,
        phone: record.mobile,
      });
      userId = user.id;
    }

    if (!userId) {
      throw new ValidationError('Failed to link vendor user');
    }

    const updated = await this.repository.approveWithCredentials({
      applicationId: record.id,
      siteId,
      username,
      passwordHash,
      passwordPlain,
      notes,
      userId,
    });

    let emailSent = false;
    try {
      await this.mail.sendVendorApprovedEmail({
        to: { email: record.email, name: record.contactPerson },
        siteCode,
        contactPerson: record.contactPerson,
        username,
        password: passwordPlain,
      });
      emailSent = true;
    } catch {
      logger.warn(
        {
          event: 'vendor_application.approval_email_failed',
          siteCode,
          applicationId: record.id,
        },
        'Vendor approval email failed after approve',
      );
    }

    logger.info(
      {
        event: 'vendor_application.approved',
        siteCode,
        applicationId: record.id,
        userId,
        emailSent,
      },
      'Vendor application approved',
    );

    return {
      application: toDetail(updated, siteCode),
      credentials: {
        username,
        password: passwordPlain,
        email: record.email,
      },
      emailSent,
    };
  }

  async listCredentials(
    siteId: string,
    siteCode: SiteCode,
    query: VendorCredentialsListQuery,
  ): Promise<VendorCredentialDto[]> {
    const isActive =
      query.isActive === 'all'
        ? undefined
        : query.isActive === 'true';
    const rows = await this.repository.listCredentials(siteId, {
      q: query.q,
      isActive,
    });
    return rows.map((row) => toCredential(row, siteCode));
  }

  async patchActive(
    siteId: string,
    siteCode: SiteCode,
    applicationId: string,
    body: VendorCredentialActivePatch,
  ): Promise<VendorCredentialDto> {
    const record = await this.repository.findByIdForSite(siteId, applicationId);
    if (!record || record.status !== 'APPROVED') {
      throw new NotFoundError('Approved vendor credentials not found');
    }

    const updated = await this.repository.setActive(applicationId, body.isActive);
    if (record.userId) {
      await this.repository.updateUserStatus(
        record.userId,
        body.isActive ? 'ACTIVE' : 'INACTIVE',
      );
    }

    logger.info(
      {
        event: 'vendor_credentials.active_updated',
        siteCode,
        applicationId,
        isActive: body.isActive,
      },
      'Vendor account active flag updated',
    );

    return toCredential(updated, siteCode);
  }

  async regeneratePassword(
    siteId: string,
    siteCode: SiteCode,
    applicationId: string,
  ): Promise<VendorCredentialMutateResultDto> {
    const record = await this.repository.findByIdForSite(siteId, applicationId);
    if (!record || record.status !== 'APPROVED' || !record.userId || !record.username) {
      throw new NotFoundError('Approved vendor credentials not found');
    }

    // Hash once — same bcrypt hash stored on User + VendorApplication; plain is not re-hashed.
    const passwordPlain = generatePassword();
    const passwordHash = await hashPassword(passwordPlain);
    const updated = await this.repository.regeneratePassword({
      applicationId,
      userId: record.userId,
      passwordHash,
      passwordPlain,
    });

    let emailSent = false;
    try {
      await this.mail.sendVendorApprovedEmail({
        to: { email: record.email, name: record.contactPerson },
        siteCode,
        contactPerson: record.contactPerson,
        username: record.username,
        password: passwordPlain,
      });
      emailSent = true;
    } catch {
      logger.warn(
        {
          event: 'vendor_credentials.regenerate_email_failed',
          siteCode,
          applicationId,
        },
        'Vendor password regenerate email failed',
      );
    }

    return {
      credential: toCredential(updated, siteCode),
      emailSent,
    };
  }
}

export const vendorsService = new VendorsService();
