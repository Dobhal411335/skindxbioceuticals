import type { Request, Response } from 'express';

import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { careerApplicationService } from './career-applications.service';
import type {
  CareerApplicationCreateBody,
  CareerApplicationListQuery,
  CareerApplicationPatchBody,
} from './career-applications.validation';

const SITE_CODES = new Set<SiteCode>(['IN', 'COM']);

function normalizeSiteCode(value: unknown): SiteCode {
  if (typeof value !== 'string') {
    throw new ValidationError('Site code is required');
  }
  const code = value.trim().toUpperCase() as SiteCode;
  if (!SITE_CODES.has(code)) {
    throw new ValidationError('Invalid site code');
  }
  return code;
}

export class CareerApplicationController {
  constructor(private readonly service = careerApplicationService) {}

  createPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) throw new NotFoundError('Site not found');

    const body = req.body as CareerApplicationCreateBody;
    if (!req.file && !body.companyWebsite.trim()) {
      throw new ValidationError('Resume is required');
    }

    const data = await this.service.createPublic({
      siteId: site.id,
      siteCode,
      body,
      file: req.file,
    });

    sendSuccess(
      res,
      data ?? { id: null, accepted: true },
      'Application received',
      201,
    );
  };

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.listForSite(
      req.site.id,
      req.site.code,
      req.query as unknown as CareerApplicationListQuery,
    );
    sendSuccess(res, data, 'Career applications');
  };

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.getForSite(
      req.site.id,
      req.site.code,
      String(req.params.applicationId),
    );
    sendSuccess(res, data, 'Career application');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.patchForSite(
      req.site.id,
      req.site.code,
      String(req.params.applicationId),
      req.body as CareerApplicationPatchBody,
    );
    sendSuccess(res, data, 'Career application status updated');
  };

  resumeAccess = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.resumeAccessForSite(
      req.site.id,
      req.site.code,
      String(req.params.applicationId),
    );
    sendSuccess(res, data, 'Career application resume');
  };
}

export const careerApplicationController = new CareerApplicationController();
