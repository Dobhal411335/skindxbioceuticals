import { logger } from '@/lib/logger';
import { emailService } from '@/lib/email';
import type { SiteCode } from '@/types/common';
import { NotFoundError } from '@/utils/AppError';
import { enquiryRepository } from './enquiry.repository';
import type {
  EnquiryCreateBody,
  EnquiryListQuery,
  EnquiryPatchBody,
} from './enquiry.validation';
import type {
  EnquiryDto,
  EnquiryRecord,
  EnquirySourceValue,
  SiteCodeDto,
} from './enquiry.types';

export function toEnquiryDto(record: EnquiryRecord, siteCode: SiteCodeDto): EnquiryDto {
  return {
    id: record.id,
    siteCode,
    name: record.name,
    email: record.email,
    phone: record.phone,
    subject: record.subject,
    message: record.message,
    source: record.source,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function sourceForSite(siteCode: SiteCode): EnquirySourceValue {
  return siteCode === 'IN' ? 'WEBSITE_IN' : 'WEBSITE_COM';
}

export class EnquiryService {
  constructor(
    private readonly repository = enquiryRepository,
    private readonly mail = emailService,
  ) {}

  async createPublic(input: {
    siteId: string;
    siteCode: SiteCode;
    body: EnquiryCreateBody;
  }): Promise<EnquiryDto | null> {
    if ((input.body.website ?? '').trim().length > 0) {
      logger.info(
        {
          event: 'enquiry.honeypot_rejected',
          siteCode: input.siteCode,
        },
        'Contact enquiry honeypot triggered',
      );
      return null;
    }

    const record = await this.repository.create(input.siteId, {
      name: input.body.name,
      email: input.body.email,
      phone: input.body.phone,
      subject: input.body.subject?.trim() || 'Contact Us',
      message: input.body.message,
      source: sourceForSite(input.siteCode),
    });

    logger.info(
      {
        event: 'enquiry.created',
        siteCode: input.siteCode,
        enquiryId: record.id,
        source: record.source,
      },
      'Contact enquiry created',
    );

    void this.mail
      .sendEnquiryConfirmationEmail({
        to: { email: record.email, name: record.name },
        siteCode: input.siteCode,
        enquiryReference: record.id.slice(0, 8).toUpperCase(),
      })
      .catch((err) => {
        logger.error(
          { err, enquiryId: record.id },
          'Failed to send enquiry confirmation email',
        );
      });

    return toEnquiryDto(record, input.siteCode);
  }

  async listForSite(
    siteId: string,
    siteCode: SiteCode,
    query: EnquiryListQuery,
  ): Promise<EnquiryDto[]> {
    const rows = await this.repository.listBySiteId(siteId, {
      name: query.name,
      email: query.email,
      phone: query.phone,
      from: query.from,
      to: query.to,
      status: query.status,
    });

    logger.info(
      {
        event: 'enquiry.list',
        siteCode,
        count: rows.length,
        hasNameFilter: Boolean(query.name),
        hasEmailFilter: Boolean(query.email),
        hasPhoneFilter: Boolean(query.phone),
        hasDateFilter: Boolean(query.from || query.to),
      },
      'Contact enquiries listed',
    );

    return rows.map((row) => toEnquiryDto(row, siteCode));
  }

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    enquiryId: string,
  ): Promise<EnquiryDto> {
    const row = await this.repository.findByIdForSite(siteId, enquiryId);
    if (!row) {
      throw new NotFoundError('Enquiry not found');
    }
    return toEnquiryDto(row, siteCode);
  }

  async patchForSite(
    siteId: string,
    siteCode: SiteCode,
    enquiryId: string,
    body: EnquiryPatchBody,
  ): Promise<EnquiryDto> {
    const row = await this.repository.updateStatusForSite(
      siteId,
      enquiryId,
      body.status,
    );
    if (!row) {
      throw new NotFoundError('Enquiry not found');
    }

    logger.info(
      {
        event: 'enquiry.status_updated',
        siteCode,
        enquiryId,
        status: body.status,
      },
      'Contact enquiry status updated',
    );

    return toEnquiryDto(row, siteCode);
  }
}

export const enquiryService = new EnquiryService();
