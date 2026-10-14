import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { doctorAppointmentsService } from './doctor-appointments.service';
import type {
  DoctorAppointmentCreateBody,
  DoctorAppointmentListQuery,
  DoctorAppointmentPatchBody,
} from './doctor-appointments.validation';

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

export class DoctorAppointmentsController {
  constructor(private readonly service = doctorAppointmentsService) {}

  createPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.createPublic({
      siteId: site.id,
      siteCode,
      body: req.body as DoctorAppointmentCreateBody,
    });

    // Honeypot path returns a generic success without leaking detection.
    if (!data) {
      sendSuccess(
        res,
        {
          id: null,
          accepted: true,
        },
        'Appointment request received',
        201,
      );
      return;
    }

    sendSuccess(res, data, 'Appointment request received', 201);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const query = req.query as unknown as DoctorAppointmentListQuery;
    const data = await this.service.listForSite(req.site.id, req.site.code, query);
    sendSuccess(res, data, 'Doctor appointment requests');
  };

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.getForSite(
      req.site.id,
      req.site.code,
      String(req.params.appointmentId),
    );
    sendSuccess(res, data, 'Doctor appointment request');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchForSite(
      req.site.id,
      req.site.code,
      String(req.params.appointmentId),
      req.body as DoctorAppointmentPatchBody,
    );
    sendSuccess(res, data, 'Doctor appointment status updated');
  };
}

export const doctorAppointmentsController = new DoctorAppointmentsController();
