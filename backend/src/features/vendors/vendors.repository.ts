import { Prisma, type VendorApplicationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { VendorApplicationCreateBody } from './vendors.validation';

function toJsonDoc(
  value: { url: string; publicId: string } | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value == null) return Prisma.JsonNull;
  return value;
}

export class VendorsRepository {
  async findDuplicate(
    siteId: string,
    email: string,
    mobile: string,
  ): Promise<{ id: string } | null> {
    return prisma.vendorApplication.findFirst({
      where: {
        siteId,
        OR: [{ email }, { mobile }],
      },
      select: { id: true },
    });
  }

  async create(siteId: string, body: VendorApplicationCreateBody) {
    return prisma.vendorApplication.create({
      data: {
        siteId,
        businessName: body.businessName,
        businessType: body.businessType,
        industryCategory: body.industryCategory,
        yearOfEstablishment: body.yearOfEstablishment,
        legalStructure: body.legalStructure,
        isGstRegistered: body.isGstRegistered,
        gstNumber: body.gstNumber ?? null,
        panNumber: body.panNumber,
        msmeNumber: body.msmeNumber ?? null,
        gstCertificate: toJsonDoc(body.gstCertificate ?? null),
        panCard: toJsonDoc(body.panCard),
        msmeCertificate: toJsonDoc(body.msmeCertificate ?? null),
        cancelledCheque: toJsonDoc(body.cancelledCheque),
        productCatalog: toJsonDoc(body.productCatalog),
        businessCard: toJsonDoc(body.businessCard ?? null),
        aadhaarUpload: toJsonDoc(body.aadhaarUpload ?? null),
        authorizedPersonPhoto: toJsonDoc(body.authorizedPersonPhoto),
        contactPerson: body.contactPerson,
        designation: body.designation,
        mobile: body.mobile,
        alternateMobile: body.alternateMobile ?? null,
        email: body.email,
        whatsappNumber: body.whatsappNumber ?? null,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        country: body.country,
        deliveryCapability: body.deliveryCapability,
        bankName: body.bankName,
        accountHolderName: body.accountHolderName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        branch: body.branch,
        qualityCertifications: body.qualityCertifications ?? null,
        returnPolicy: body.returnPolicy,
        aadhaarNumber: body.aadhaarNumber ?? null,
        referredBy: body.referredBy ?? null,
        additionalNotes: body.additionalNotes ?? null,
        status: 'PENDING',
        isActive: false,
      },
    });
  }

  async listBySite(
    siteId: string,
    filters: { status?: VendorApplicationStatus; q?: string },
  ) {
    const q = filters.q?.trim();
    return prisma.vendorApplication.findMany({
      where: {
        siteId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(q
          ? {
              OR: [
                { businessName: { contains: q, mode: 'insensitive' } },
                { contactPerson: { contains: q, mode: 'insensitive' } },
                { mobile: { contains: q } },
                { email: { contains: q, mode: 'insensitive' } },
                { gstNumber: { contains: q, mode: 'insensitive' } },
                { panNumber: { contains: q, mode: 'insensitive' } },
                { username: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listCredentials(
    siteId: string,
    filters: { q?: string; isActive?: boolean },
  ) {
    const q = filters.q?.trim();
    return prisma.vendorApplication.findMany({
      where: {
        siteId,
        status: 'APPROVED',
        username: { not: null },
        ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
        ...(q
          ? {
              OR: [
                { businessName: { contains: q, mode: 'insensitive' } },
                { contactPerson: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { username: { contains: q, mode: 'insensitive' } },
                { mobile: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByIdForSite(siteId: string, id: string) {
    return prisma.vendorApplication.findFirst({
      where: { id, siteId },
    });
  }

  async findByUsername(username: string) {
    return prisma.vendorApplication.findFirst({
      where: { username },
      include: { user: true, site: true },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: { siteMemberships: { include: { site: true } } },
    });
  }

  async usernameExists(username: string): Promise<boolean> {
    const [user, app] = await Promise.all([
      prisma.user.findUnique({ where: { username }, select: { id: true } }),
      prisma.vendorApplication.findFirst({
        where: { username },
        select: { id: true },
      }),
    ]);
    return Boolean(user || app);
  }

  async approveWithCredentials(input: {
    applicationId: string;
    siteId: string;
    username: string;
    passwordHash: string;
    passwordPlain: string;
    notes?: string | null;
    userId: string;
  }) {
    return prisma.vendorApplication.update({
      where: { id: input.applicationId },
      data: {
        status: 'APPROVED',
        isActive: true,
        username: input.username,
        passwordHash: input.passwordHash,
        passwordPlain: input.passwordPlain,
        userId: input.userId,
        notes: input.notes ?? undefined,
      },
    });
  }

  async createVendorUser(input: {
    email: string;
    username: string;
    passwordHash: string;
    firstName: string;
    phone: string;
  }) {
    return prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        phone: input.phone,
        role: 'VENDOR',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
      include: { siteMemberships: { include: { site: true } } },
    });
  }

  async updateStatus(
    applicationId: string,
    data: {
      status: VendorApplicationStatus;
      isActive: boolean;
      notes?: string | null;
    },
  ) {
    return prisma.vendorApplication.update({
      where: { id: applicationId },
      data: {
        status: data.status,
        isActive: data.isActive,
        notes: data.notes === undefined ? undefined : data.notes,
      },
    });
  }

  async setActive(applicationId: string, isActive: boolean) {
    return prisma.vendorApplication.update({
      where: { id: applicationId },
      data: { isActive },
    });
  }

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE') {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async updateVendorUserCredentials(
    userId: string,
    data: {
      username: string;
      passwordHash: string;
      firstName: string;
      phone: string;
      emailVerifiedAt?: Date;
    },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        username: data.username,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        phone: data.phone,
        emailVerifiedAt: data.emailVerifiedAt,
        status: 'ACTIVE',
        role: 'VENDOR',
      },
    });
  }

  async regeneratePassword(input: {
    applicationId: string;
    userId: string;
    passwordHash: string;
    passwordPlain: string;
  }) {
    await prisma.$transaction([
      prisma.vendorApplication.update({
        where: { id: input.applicationId },
        data: {
          passwordHash: input.passwordHash,
          passwordPlain: input.passwordPlain,
        },
      }),
      prisma.user.update({
        where: { id: input.userId },
        data: { passwordHash: input.passwordHash },
      }),
    ]);
    return prisma.vendorApplication.findUniqueOrThrow({
      where: { id: input.applicationId },
    });
  }
}

export const vendorsRepository = new VendorsRepository();
