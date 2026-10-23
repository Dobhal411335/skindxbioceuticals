import { prisma } from '@/lib/prisma';

export interface SubscriberRecord {
  id: string;
  siteId: string;
  email: string;
  isActive: boolean;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveCategoryItem {
  id: string;
  name: string;
  slug: string;
}

export class NewsletterRepository {
  private get delegate() {
    return (prisma as any).newsletterSubscriber;
  }

  async findSiteByCode(code: string) {
    return prisma.site.findUnique({
      where: { code },
      select: { id: true, code: true, name: true },
    });
  }

  async findSubscriber(siteId: string, email: string): Promise<SubscriberRecord | null> {
    if (this.delegate) {
      return this.delegate.findUnique({
        where: {
          siteId_email: {
            siteId,
            email,
          },
        },
      });
    }

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, site_id AS "siteId", email, is_active AS "isActive", unsubscribe_token AS "unsubscribeToken", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM "newsletter_subscribers"
      WHERE "site_id" = ${siteId}::uuid AND "email" = ${email}
      LIMIT 1;
    `;
    return rows[0] ?? null;
  }

  async upsertSubscriber(siteId: string, email: string): Promise<SubscriberRecord> {
    if (this.delegate) {
      return this.delegate.upsert({
        where: {
          siteId_email: {
            siteId,
            email,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          siteId,
          email,
          isActive: true,
        },
      });
    }

    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO "newsletter_subscribers" ("id", "site_id", "email", "is_active", "unsubscribe_token", "created_at", "updated_at")
      VALUES (gen_random_uuid(), ${siteId}::uuid, ${email}, true, gen_random_uuid(), NOW(), NOW())
      ON CONFLICT ("site_id", "email")
      DO UPDATE SET "is_active" = true, "updated_at" = NOW()
      RETURNING id, site_id AS "siteId", email, is_active AS "isActive", unsubscribe_token AS "unsubscribeToken", created_at AS "createdAt", updated_at AS "updatedAt";
    `;
    return rows[0]!;
  }

  async findByToken(token: string): Promise<SubscriberRecord | null> {
    if (this.delegate) {
      return this.delegate.findFirst({
        where: {
          unsubscribeToken: token,
        },
      });
    }

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, site_id AS "siteId", email, is_active AS "isActive", unsubscribe_token AS "unsubscribeToken", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM "newsletter_subscribers"
      WHERE "unsubscribe_token"::text = ${token}
      LIMIT 1;
    `;
    return rows[0] ?? null;
  }

  async unsubscribeByToken(token: string): Promise<boolean> {
    if (this.delegate) {
      const result = await this.delegate.updateMany({
        where: {
          unsubscribeToken: token,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
      return result.count > 0;
    }

    const result = await prisma.$executeRaw`
      UPDATE "newsletter_subscribers"
      SET "is_active" = false, "updated_at" = NOW()
      WHERE "unsubscribe_token"::text = ${token}
        AND "is_active" = true;
    `;
    return result > 0;
  }

  async listSubscribers(siteId: string, onlyActive = true): Promise<SubscriberRecord[]> {
    if (this.delegate) {
      return this.delegate.findMany({
        where: {
          siteId,
          ...(onlyActive ? { isActive: true } : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (onlyActive) {
      return prisma.$queryRaw<any[]>`
        SELECT id, site_id AS "siteId", email, is_active AS "isActive", unsubscribe_token AS "unsubscribeToken", created_at AS "createdAt", updated_at AS "updatedAt"
        FROM "newsletter_subscribers"
        WHERE "site_id" = ${siteId}::uuid
          AND "is_active" = true
        ORDER BY "created_at" DESC;
      `;
    }

    return prisma.$queryRaw<any[]>`
      SELECT id, site_id AS "siteId", email, is_active AS "isActive", unsubscribe_token AS "unsubscribeToken", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM "newsletter_subscribers"
      WHERE "site_id" = ${siteId}::uuid
      ORDER BY "created_at" DESC;
    `;
  }

  async findSubscribersByEmails(siteId: string, emails: string[]): Promise<SubscriberRecord[]> {
    if (emails.length === 0) return [];

    if (this.delegate) {
      return this.delegate.findMany({
        where: {
          siteId,
          email: { in: emails },
          isActive: true,
        },
      });
    }

    return prisma.$queryRaw<any[]>`
      SELECT id, site_id AS "siteId", email, is_active AS "isActive", unsubscribe_token AS "unsubscribeToken", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM "newsletter_subscribers"
      WHERE "site_id" = ${siteId}::uuid
        AND "email" = ANY(${emails}::text[])
        AND "is_active" = true;
    `;
  }

  async listActiveCategories(siteId: string): Promise<ActiveCategoryItem[]> {
    return prisma.category.findMany({
      where: {
        siteId,
        parentId: null,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }
}

export const newsletterRepository = new NewsletterRepository();
