import express, { type Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { appConfig } from '@/config';
import { requestLoggerMiddleware } from '@/lib/logger';
import { registerRoutes } from '@/routes';
import { notFoundMiddleware } from '@/middlewares/notFound.middleware';
import { errorMiddleware } from '@/middlewares/error.middleware';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: appConfig.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });
  });

  registerRoutes(app);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
