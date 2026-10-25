import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { clinicalConfidenceService } from './clinical-confidence.service';

const normalizeSite = (value: unknown) => {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (code !== 'IN' && code !== 'COM') throw new ValidationError('Invalid site code');
  return code as 'IN' | 'COM';
};

export const clinicalConfidenceController = {
  get: async (req: Request, res: Response) => {
    if (!req.site) throw new UnauthorizedError();
    sendSuccess(
      res,
      await clinicalConfidenceService.getForSite(req.site.id, req.site.code),
      'Clinical confidence banner',
    );
  },
  getPublic: async (req: Request, res: Response) => {
    const siteCode = normalizeSite(req.params.siteCode);
    const site = await prisma.site.findFirst({ where: { code: siteCode, isActive: true } });
    if (!site) throw new NotFoundError('Site not found');
    sendSuccess(
      res,
      await clinicalConfidenceService.getForSite(site.id, siteCode),
      'Clinical confidence banner',
    );
  },
  upsert: async (req: Request, res: Response) => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    sendSuccess(
      res,
      await clinicalConfidenceService.upsertForSite({
        siteId: req.site.id,
        siteCode: req.site.code,
        body: req.body,
      }),
      'Clinical confidence banner saved',
    );
  },
};
