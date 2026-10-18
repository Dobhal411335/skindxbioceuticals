import type { Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '@/lib/prisma';
import {
  CloudinaryError,
  uploadSingleImage,
  uploadSinglePdf,
} from '@/lib/cloudinary';
import type { SiteCode } from '@/types/common';
import { sendCreated, sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { vendorsService } from './vendors.service';
import type {
  VendorApplicationCreateBody,
  VendorApplicationListQuery,
  VendorApplicationStatusPatch,
  VendorCredentialActivePatch,
  VendorCredentialsListQuery,
} from './vendors.validation';

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

export const vendorDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export class VendorsController {
  constructor(private readonly service = vendorsService) {}

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
      body: req.body as VendorApplicationCreateBody,
    });

    if (!data) {
      sendCreated(res, { id: null, accepted: true }, 'Application received');
      return;
    }

    sendCreated(res, data, 'Vendor application submitted');
  };

  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    const siteCode = normalizeSiteCode(req.params.siteCode);
    const mime = file.mimetype.toLowerCase();
    const options = {
      siteCode,
      feature: 'documents' as const,
      entityId: 'vendor-applications',
    };

    try {
      if (mime === 'application/pdf') {
        const result = await uploadSinglePdf(file, options);
        sendCreated(
          res,
          { url: result.secureUrl, publicId: result.publicId },
          'Document uploaded',
        );
        return;
      }

      if (mime.startsWith('image/')) {
        const result = await uploadSingleImage(file, options);
        sendCreated(
          res,
          { url: result.secureUrl, publicId: result.publicId },
          'Document uploaded',
        );
        return;
      }

      throw new ValidationError('Only image or PDF uploads are allowed');
    } catch (error) {
      if (error instanceof CloudinaryError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Failed to upload document');
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }
    const query = req.query as unknown as VendorApplicationListQuery;
    const data = await this.service.listApplications(
      req.site.id,
      req.site.code,
      query,
    );
    sendSuccess(res, data, 'Vendor applications');
  };

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }
    const data = await this.service.getApplication(
      req.site.id,
      req.site.code,
      String(req.params.applicationId),
    );
    sendSuccess(res, data, 'Vendor application');
  };

  patchStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }
    const data = await this.service.patchStatus(
      req.site.id,
      req.site.code,
      String(req.params.applicationId),
      req.body as VendorApplicationStatusPatch,
    );
    const message =
      data.application.status === 'APPROVED'
        ? data.emailSent
          ? 'Vendor approved and credentials sent via email'
          : 'Vendor approved'
        : 'Vendor application status updated';
    sendSuccess(res, data, message);
  };

  listCredentials = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }
    const query = req.query as unknown as VendorCredentialsListQuery;
    const data = await this.service.listCredentials(
      req.site.id,
      req.site.code,
      query,
    );
    sendSuccess(res, data, 'Vendor credentials');
  };

  patchActive = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }
    const data = await this.service.patchActive(
      req.site.id,
      req.site.code,
      String(req.params.applicationId),
      req.body as VendorCredentialActivePatch,
    );
    sendSuccess(res, data, 'Vendor account status updated');
  };

  regeneratePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }
    const data = await this.service.regeneratePassword(
      req.site.id,
      req.site.code,
      String(req.params.applicationId),
    );
    sendSuccess(
      res,
      data,
      data.emailSent
        ? 'Password regenerated and credentials sent via email'
        : 'Vendor password regenerated',
    );
  };
}

export const vendorsController = new VendorsController();
