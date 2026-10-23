import type { Request, Response } from 'express';
import { newsletterService } from './newsletter.service';
import type { SendPromotionalEmailBody } from './newsletter.types';

export class NewsletterController {
  constructor(private readonly service = newsletterService) {}

  subscribe = async (req: Request, res: Response): Promise<void> => {
    const siteCode = (req.params.siteCode || 'IN').toUpperCase() as 'IN' | 'COM';
    const { email } = req.body;
    const subscriber = await this.service.subscribe(siteCode, email);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscriber,
    });
  };

  unsubscribe = async (req: Request, res: Response): Promise<void> => {
    const token = ((req.query.token as string) || (req.body?.token as string) || '').trim();
    const result = await this.service.unsubscribe(token);

    const wantsJson =
      req.xhr ||
      Boolean(req.headers.accept?.includes('application/json')) ||
      Boolean(req.is('json')) ||
      req.method === 'POST';

    if (!wantsJson && req.accepts('html')) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Unsubscribed Successfully</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #f8fafc;
                color: #1e293b;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 16px;
              }
              .card {
                background: white;
                max-width: 480px;
                width: 100%;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                text-align: center;
              }
              .icon {
                font-size: 48px;
                margin-bottom: 16px;
                color: #10b981;
              }
              h1 {
                font-size: 22px;
                margin: 0 0 8px 0;
                font-weight: 600;
              }
              p {
                color: #64748b;
                font-size: 14px;
                line-height: 1.5;
                margin: 0 0 24px 0;
              }
              .badge {
                display: inline-block;
                background: #f1f5f9;
                color: #475569;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 13px;
                margin-bottom: 24px;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">✓</div>
              <h1>You Have Been Unsubscribed</h1>
              <p>You will no longer receive newsletter and promotional emails from us.</p>
              <div class="badge">${result.email}</div>
            </div>
          </body>
        </html>
      `);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: result,
    });
  };

  listSubscribers = async (req: Request, res: Response): Promise<void> => {
    const siteCode = (req.params.siteCode || 'IN').toUpperCase() as 'IN' | 'COM';
    const subscribers = await this.service.listSubscribers(siteCode);

    res.status(200).json({
      success: true,
      message: 'Subscribers retrieved successfully',
      data: subscribers,
    });
  };

  sendPromotionalEmail = async (req: Request, res: Response): Promise<void> => {
    const siteCode = (req.params.siteCode || 'IN').toUpperCase() as 'IN' | 'COM';
    const body = req.body as SendPromotionalEmailBody;
    const result = await this.service.sendPromotionalEmail(siteCode, body);

    res.status(200).json({
      success: true,
      message: `Promotional email sent to ${result.sentCount} recipient(s)`,
      data: result,
    });
  };
}

export const newsletterController = new NewsletterController();
