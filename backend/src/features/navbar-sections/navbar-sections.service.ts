import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError } from '@/utils/AppError';
import { navbarSectionsRepository } from './navbar-sections.repository';
import type {
  NavbarSectionBody,
  NavbarSectionPatchBody,
} from './navbar-sections.validation';
import type {
  NavbarSectionDto,
  NavbarSectionRecord,
  NavbarSectionWrite,
  SiteCodeDto,
} from './navbar-sections.types';

export function toNavbarSectionDto(
  record: NavbarSectionRecord,
  siteCode: SiteCodeDto,
): NavbarSectionDto {
  return {
    id: record.id,
    siteCode,
    title: record.title,
    url: record.url,
    menuHeading: record.menuHeading,
    menuDescription: record.menuDescription,
    active: record.active,
    order: record.order,
    subSections: record.subSections.map((sub) => ({
      id: sub.id,
      title: sub.title,
      url: sub.url,
      description: sub.description,
      active: sub.active,
      order: sub.order,
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToWrite(
  body: NavbarSectionBody,
  fallbackOrder: number,
): NavbarSectionWrite {
  return {
    title: body.title,
    url: body.url || '#',
    menuHeading: body.menuHeading || '',
    menuDescription: body.menuDescription || '',
    active: body.active,
    order: body.order ?? fallbackOrder,
    subSections: body.subSections.map((sub, index) => ({
      title: sub.title,
      url: sub.url || '#',
      description: sub.description || '',
      active: sub.active,
      order: sub.order || index + 1,
    })),
  };
}

export class NavbarSectionsService {
  constructor(private readonly repository = navbarSectionsRepository) {}

  async listForSite(siteId: string, siteCode: SiteCode): Promise<NavbarSectionDto[]> {
    const rows = await this.repository.listBySiteId(siteId);
    return rows.map((row) => toNavbarSectionDto(row, siteCode));
  }

  async listActiveForSite(
    siteId: string,
    siteCode: SiteCode,
  ): Promise<NavbarSectionDto[]> {
    const rows = await this.repository.listActiveBySiteId(siteId);
    return rows.map((row) => toNavbarSectionDto(row, siteCode));
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: NavbarSectionBody;
  }): Promise<NavbarSectionDto> {
    const nextOrder = await this.repository.nextOrder(input.siteId);
    const data = bodyToWrite(input.body, nextOrder);
    const record = await this.repository.create(input.siteId, data);

    logger.info(
      {
        event: 'navbar_section.created',
        siteCode: input.siteCode,
        userId: input.userId,
        navbarSectionId: record.id,
      },
      'Navbar section created',
    );

    return toNavbarSectionDto(record, input.siteCode);
  }

  async updateForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    sectionId: string;
    body: NavbarSectionBody;
  }): Promise<NavbarSectionDto> {
    const existing = await this.repository.findByIdForSite(
      input.siteId,
      input.sectionId,
    );
    if (!existing) {
      throw new NotFoundError('Navbar section not found');
    }

    const data = bodyToWrite(input.body, existing.order);
    const record = await this.repository.update(
      input.siteId,
      input.sectionId,
      data,
    );
    if (!record) {
      throw new NotFoundError('Navbar section not found');
    }

    logger.info(
      {
        event: 'navbar_section.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        navbarSectionId: record.id,
      },
      'Navbar section updated',
    );

    return toNavbarSectionDto(record, input.siteCode);
  }

  async patchActiveForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    sectionId: string;
    body: NavbarSectionPatchBody;
  }): Promise<NavbarSectionDto> {
    const record = await this.repository.setActive(
      input.siteId,
      input.sectionId,
      input.body.active,
    );
    if (!record) {
      throw new NotFoundError('Navbar section not found');
    }

    logger.info(
      {
        event: 'navbar_section.active_patched',
        siteCode: input.siteCode,
        userId: input.userId,
        navbarSectionId: record.id,
        active: record.active,
      },
      'Navbar section active status updated',
    );

    return toNavbarSectionDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    sectionId: string;
  }): Promise<void> {
    const deleted = await this.repository.delete(input.siteId, input.sectionId);
    if (!deleted) {
      throw new NotFoundError('Navbar section not found');
    }

    logger.info(
      {
        event: 'navbar_section.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        navbarSectionId: input.sectionId,
      },
      'Navbar section deleted',
    );
  }
}

export const navbarSectionsService = new NavbarSectionsService();
