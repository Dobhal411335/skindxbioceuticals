import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { doctorProfilesService } from './doctor-profiles.service';
import type {
  DoctorProfileBody,
  DoctorProfilePatchBody,
} from './doctor-profiles.validation';

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

export class DoctorProfilesController {
  constructor(private readonly service = doctorProfilesService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listForSite(req.site.id, req.site.code);
    sendSuccess(res, data, 'Doctor profiles');
  };

  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.listActiveForSite(site.id, siteCode);
    sendSuccess(res, data, 'Doctor profiles');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as DoctorProfileBody,
    });

    sendSuccess(res, data, 'Doctor profile created', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      doctorId: String(req.params.doctorId),
      body: req.body as DoctorProfileBody,
    });

    sendSuccess(res, data, 'Doctor profile updated');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      doctorId: String(req.params.doctorId),
      body: req.body as DoctorProfilePatchBody,
    });

    sendSuccess(res, data, 'Doctor profile updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      doctorId: String(req.params.doctorId),
    });

    sendSuccess(res, null, 'Doctor profile deleted');
  };
}

export const doctorProfilesController = new DoctorProfilesController();
