import { createApp } from '@/app';
import { appConfig } from '@/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

async function bootstrap(): Promise<void> {
  const app = createApp();

  try {
    await prisma.$connect();
    logger.info({ event: 'db.connect.success', context: 'DB' }, 'Database connected');
  } catch (error) {
    logger.fatal(
      {
        event: 'db.connect.failure',
        context: 'DB',
        err: error,
      },
      'Failed to connect to database',
    );
    process.exit(1);
  }

  const server = app.listen(appConfig.port, () => {
    logger.info(
      {
        event: 'server.listen',
        context: 'APP',
        port: appConfig.port,
        apiPrefix: appConfig.apiPrefix,
      },
      `Server running on port ${appConfig.port}`,
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ event: 'server.shutdown', context: 'APP', signal }, 'Shutting down gracefully');
    server.close(async () => {
      await prisma.$disconnect();
      logger.info({ event: 'server.closed', context: 'APP' }, 'Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
