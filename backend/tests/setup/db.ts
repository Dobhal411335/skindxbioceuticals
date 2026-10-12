import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import type { SiteCode, SiteRole, UserRole } from '@/types/common';

/**
 * Clears mutable tables between integration tests while preserving seeded sites.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.emailOutbox.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.externalIdentity.deleteMany(),
    prisma.siteMembership.deleteMany(),
    prisma.companyBasicInfo.deleteMany(),
    prisma.navbarSubSection.deleteMany(),
    prisma.navbarSection.deleteMany(),
    prisma.socialPost.deleteMany(),
    prisma.galleryItem.deleteMany(),
    prisma.customerReview.deleteMany(),
    prisma.footerLink.deleteMany(),
    prisma.footerColumn.deleteMany(),
    prisma.footerConfig.deleteMany(),
    prisma.topAdvertisementItem.deleteMany(),
    prisma.topAdvertisementConfig.deleteMany(),
    prisma.aboutUsAboutCard.deleteMany(),
    prisma.aboutUsHighlightItem.deleteMany(),
    prisma.aboutUsTextSlide.deleteMany(),
    prisma.aboutUsBannerConfig.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.review.deleteMany(),
    prisma.productMedia.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.enquiry.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function ensureSites(): Promise<{ inId: string; comId: string }> {
  const inSite = await prisma.site.upsert({
    where: { code: 'IN' },
    update: {},
    create: {
      code: 'IN',
      name: 'India Ecommerce Storefront',
      domain: 'skindxbioceuticals.in',
      isActive: true,
    },
  });

  const comSite = await prisma.site.upsert({
    where: { code: 'COM' },
    update: {},
    create: {
      code: 'COM',
      name: 'Global Content & Enquiry Site',
      domain: 'skindxbioceuticals.com',
      isActive: true,
    },
  });

  return { inId: inSite.id, comId: comSite.id };
}

export async function createAdminUser(options: {
  email: string;
  password: string;
  role?: UserRole;
  siteCodes?: SiteCode[];
  siteRole?: SiteRole;
  firstName?: string;
  lastName?: string;
}) {
  const sites = await ensureSites();
  const passwordHash = await hashPassword(options.password);
  const role = options.role ?? 'ADMIN';
  const siteCodes = options.siteCodes ?? (role === 'SUPER_ADMIN' ? (['IN', 'COM'] as SiteCode[]) : ['IN']);
  const siteRole = options.siteRole ?? 'ADMIN';

  const siteIdByCode: Record<SiteCode, string> = {
    IN: sites.inId,
    COM: sites.comId,
  };

  return prisma.user.create({
    data: {
      email: options.email.toLowerCase(),
      passwordHash,
      firstName: options.firstName ?? 'Test',
      lastName: options.lastName ?? 'Admin',
      role,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      siteMemberships: {
        create: siteCodes.map((code) => ({
          siteId: siteIdByCode[code],
          role: siteRole,
        })),
      },
    },
    include: {
      siteMemberships: {
        include: { site: true },
      },
    },
  });
}
