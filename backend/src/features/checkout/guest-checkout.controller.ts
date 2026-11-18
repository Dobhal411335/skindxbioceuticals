import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '@/utils/apiResponse';
import { ValidationError } from '@/utils/AppError';
import { guestCheckoutService } from './guest-checkout.service';
import type {
  GuestSendOtpBody,
  GuestSessionBody,
  GuestVerifyOtpBody,
} from './guest-checkout.validation';

function requireStorefrontSite(req: Request) {
  if (!req.site) {
    throw new ValidationError('Storefront site is required');
  }
  return req.site;
}

export class GuestCheckoutController {
  constructor(private readonly service = guestCheckoutService) {}

  startSession = async (req: Request, res: Response): Promise<void> => {
    const site = requireStorefrontSite(req);
    const body = req.body as GuestSessionBody;
    const data = await this.service.startSession(body, site);
    sendCreated(res, data, 'Guest checkout session created');
  };

  sendOtp = async (req: Request, res: Response): Promise<void> => {
    const site = requireStorefrontSite(req);
    const body = req.body as GuestSendOtpBody;
    const data = await this.service.sendOtp(body, site);
    sendSuccess(res, data, 'Verification code sent');
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const site = requireStorefrontSite(req);
    const body = req.body as GuestVerifyOtpBody;
    const data = await this.service.verifyOtp(body, site);
    sendSuccess(res, data, 'Guest email verified');
  };
}

export const guestCheckoutController = new GuestCheckoutController();
