import type { Request, Response } from 'express';
import { sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import { adminService } from './admin.service';
import type { DashboardQuery } from './admin.validation';

/**
 * Admin controller - HTTP concerns only (req/res/status).
 */
export class AdminController {
  constructor(private readonly service = adminService) {}

  status = (_req: Request, res: Response): void => {
    sendSuccess(res, { feature: 'admin', ready: true }, 'Admin module ready');
  };

  listSites = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listAuthorizedSites(req.user.id, req.user.role);
    sendSuccess(res, data, 'Authorized sites');
  };

  dashboard = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.getDashboard({
      userId: req.user.id,
      role: req.user.role,
      siteId: req.site.id,
      siteCode: req.site.code,
      siteName: req.site.name,
      query: req.query as DashboardQuery,
    });

    sendSuccess(res, data, 'Dashboard statistics');
  };
}

export const adminController = new AdminController();
