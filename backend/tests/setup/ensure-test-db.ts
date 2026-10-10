/**
 * Ensures a disposable test schema/database URL is migrated before integration tests.
 * Prefer DATABASE_URL_TEST; otherwise derive a `*_test` database name from DATABASE_URL,
 * falling back to `schema=test` on the same database if CREATE DATABASE is unavailable.
 */
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

dotenv.config();

function withDatabaseName(url: string, dbName: string): string {
  const parsed = new URL(url);
  const rawPath = parsed.pathname.replace(/^\//, '');
  const parts = rawPath.split('/');
  parts[0] = dbName;
  parsed.pathname = `/${parts.join('/')}`;
  return parsed.toString();
}

function withSchema(url: string, schema: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set('schema', schema);
  return parsed.toString();
}

async function canConnect(url: string): Promise<boolean> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await client.$disconnect();
  }
}

async function main(): Promise<void> {
  const sourceUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
  if (!sourceUrl) {
    throw new Error('DATABASE_URL or DATABASE_URL_TEST is required');
  }

  let testUrl = process.env.DATABASE_URL_TEST;

  if (!testUrl) {
    const parsed = new URL(sourceUrl);
    const currentDb = parsed.pathname.replace(/^\//, '').split('/')[0] ?? 'skindxbioceuticals';
    const testDb = currentDb.endsWith('_test') ? currentDb : `${currentDb}_test`;
    const candidate = withDatabaseName(sourceUrl, testDb);

    if (await canConnect(candidate)) {
      testUrl = candidate;
    } else {
      // Fall back to isolated schema on the development database
      testUrl = withSchema(sourceUrl, 'test');
      console.warn(
        `[test-db] Could not open ${testDb}; using schema=test on the configured database instead.`,
      );
    }
  }

  process.env.DATABASE_URL = testUrl;
  console.log('[test-db] Migrating test database…');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testUrl },
  });
  console.log('[test-db] Ready');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
