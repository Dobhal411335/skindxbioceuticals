import dotenv from 'dotenv';

/**
 * Jest setupFiles — runs before any test module imports.
 * Loads local .env, then points Prisma at a dedicated *_test database.
 */
dotenv.config();

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '5001';
process.env.API_PREFIX = process.env.API_PREFIX ?? '/api/v1';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-min-32-characters!!';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-32-characters!';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
process.env.ADMIN_BOOTSTRAP_SECRET =
  process.env.ADMIN_BOOTSTRAP_SECRET ?? 'test-bootstrap-secret-min-32-chars!!';
process.env.CORS_ORIGINS =
  process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3002';

process.env.BREVO_API_KEY = process.env.BREVO_API_KEY ?? 'test-brevo-api-key';
process.env.BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL ?? 'noreply@test.example.com';
process.env.BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME ?? 'SkinDx Bioc Test';
process.env.COMPANY_NAME = process.env.COMPANY_NAME ?? 'SkinDx Bioc';
process.env.SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@test.example.com';
process.env.SITE_IN_URL = process.env.SITE_IN_URL ?? 'http://localhost:3000';
process.env.SITE_COM_URL = process.env.SITE_COM_URL ?? 'http://localhost:3001';

process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? 'test-cloudinary-key';
process.env.CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET ?? 'test-cloudinary-secret';

process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id.apps.googleusercontent.com';
process.env.AUTH_REFRESH_COOKIE_NAME =
  process.env.AUTH_REFRESH_COOKIE_NAME ?? 'skindx_refresh_token';
process.env.AUTH_COOKIE_SAME_SITE = process.env.AUTH_COOKIE_SAME_SITE ?? 'lax';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE ?? 'false';

process.env.OTP_LENGTH = process.env.OTP_LENGTH ?? '6';
process.env.OTP_EXPIRES_IN_MINUTES = process.env.OTP_EXPIRES_IN_MINUTES ?? '10';
process.env.OTP_MAX_ATTEMPTS = process.env.OTP_MAX_ATTEMPTS ?? '5';
process.env.OTP_RESEND_COOLDOWN_SECONDS =
  process.env.OTP_RESEND_COOLDOWN_SECONDS ?? '60';

function toIsolatedTestUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Prefer schema isolation so remote hosts without CREATE DATABASE still work.
    if (process.env.DATABASE_URL_TEST_MODE === 'database') {
      const rawPath = parsed.pathname.replace(/^\//, '');
      const [dbName, ...rest] = rawPath.split('/');
      if (dbName) {
        const nextName = dbName.endsWith('_test') ? dbName : `${dbName}_test`;
        parsed.pathname = `/${[nextName, ...rest].join('/')}`;
      }
      return parsed.toString();
    }

    parsed.searchParams.set('schema', 'test');
    return parsed.toString();
  } catch {
    return url;
  }
}

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
} else if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = toIsolatedTestUrl(process.env.DATABASE_URL);
} else {
  process.env.DATABASE_URL =
    'postgresql://postgres:postgres@localhost:5432/skindxbioceuticals_test?schema=public';
}
