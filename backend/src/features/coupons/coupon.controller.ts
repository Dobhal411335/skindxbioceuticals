import type { Request, Response } from 'express';
import { sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import { couponService } from './coupon.service';
import type { CouponBody, CouponPatchBody } from './coupon.validation';

/**
 * Coupon controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class CouponController {
  constructor(private readonly service = couponService) {}

  /**
   * Placeholder health/status handler for the public coupon module scaffold.
   */
  status = (_req: Request, res: Response): void => {
    sendSuccess(res, { feature: 'coupon', ready: false }, 'Coupon module scaffolded');
  };

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listForSite(req.site.id, req.site.code);
    sendSuccess(res, data, 'Coupons');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as CouponBody,
    });

    sendSuccess(res, data, 'Coupon created', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      couponId: String(req.params.couponId),
      body: req.body as CouponBody,
    });

    sendSuccess(res, data, 'Coupon updated');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      couponId: String(req.params.couponId),
      body: req.body as CouponPatchBody,
    });

    sendSuccess(res, data, 'Coupon updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      couponId: String(req.params.couponId),
    });

    sendSuccess(res, null, 'Coupon deleted');
  };
}

export const couponController = new CouponController();
