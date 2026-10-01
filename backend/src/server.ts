import { createApp } from '@/app';
import { appConfig } from '@/config';
import { prisma } from '@/lib/prisma';

async function bootstrap(): Promise<void> {
  const app = createApp();

  try {
    await prisma.$connect();
    console.warn(`🗄️  Database connected`);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }

  const server = app.listen(appConfig.port, () => {
    console.warn(
      `🚀 Server running on port ${appConfig.port} [${appConfig.nodeEnv}] — ${appConfig.apiPrefix}`,
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.warn(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.warn('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
