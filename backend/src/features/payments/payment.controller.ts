import type { Request, Response } from 'express';
import { sendSuccess } from '@/utils/apiResponse';
import { ValidationError } from '@/utils/AppError';
import { paymentService } from './payment.service';
import type {
  CreatePaymentOrderBody,
  VerifyPaymentBody,
} from './payment.validation';

export class PaymentController {
  constructor(private readonly service = paymentService) {}

  createOrder = async (req: Request, res: Response): Promise<void> => {
    const idempotencyKey = req.header('Idempotency-Key')?.trim();
    if (!idempotencyKey) {
      throw new ValidationError('Idempotency-Key header is required');
    }
    const body = req.body as CreatePaymentOrderBody;
    const data = await this.service.createOrder({
      body,
      userId: req.user?.id,
      idempotencyKey,
    });
    sendSuccess(res, data, 'Payment order created');
  };

  verify = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as VerifyPaymentBody;
    const data = await this.service.verifyPayment({
      body,
      userId: req.user?.id,
    });
    sendSuccess(res, data, 'Payment verified');
  };

  status = async (req: Request, res: Response): Promise<void> => {
    const orderId = req.params.orderId as string;
    const guestSessionToken =
      typeof req.query.guestSessionToken === 'string'
        ? req.query.guestSessionToken
        : undefined;
    const data = await this.service.getStatus({
      orderId,
      userId: req.user?.id,
      guestSessionToken,
    });
    sendSuccess(res, data, 'Payment status');
  };

  confirmation = async (req: Request, res: Response): Promise<void> => {
    const orderId =
      typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
    const confirmationToken =
      typeof req.query.confirmationToken === 'string'
        ? req.query.confirmationToken
        : undefined;
    const data = await this.service.getConfirmation({
      orderId,
      confirmationToken,
      userId: req.user?.id,
    });
    sendSuccess(res, data, 'Order confirmation');
  };

  webhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.header('X-Razorpay-Signature') ?? undefined;
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    await this.service.handleWebhook(rawBody, signature);
    res.status(200).json({ success: true });
  };
}

export const paymentController = new PaymentController();
