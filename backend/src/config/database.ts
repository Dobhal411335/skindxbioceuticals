import { env } from './env';

/**
 * Database configuration derived from validated environment variables.
 * Connection is managed exclusively through the Prisma client (`src/lib/prisma.ts`).
 */
export const databaseConfig = {
  url: env.DATABASE_URL,
} as const;
