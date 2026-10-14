import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '@/utils/apiResponse';
import { guestCheckoutService } from './guest-checkout.service';
import type {
  GuestSendOtpBody,
  GuestSessionBody,
  GuestVerifyOtpBody,
} from './guest-checkout.validation';

export class GuestCheckoutController {
  constructor(private readonly service = guestCheckoutService) {}

  startSession = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as GuestSessionBody;
    const data = await this.service.startSession(body);
    sendCreated(res, data, 'Guest checkout session created');
  };

  sendOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as GuestSendOtpBody;
    const data = await this.service.sendOtp(body);
    sendSuccess(res, data, 'Verification code sent');
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as GuestVerifyOtpBody;
    const data = await this.service.verifyOtp(body);
    sendSuccess(res, data, 'Guest email verified');
  };
}

export const guestCheckoutController = new GuestCheckoutController();
