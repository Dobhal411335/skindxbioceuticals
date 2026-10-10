import { PassThrough } from 'node:stream';
import {
  createAppLogger,
  createPinoLogger,
  resolveLogLevel,
  redactValue,
  sanitizeUrl,
  REDACTED,
  LOGGER_SERVICE_NAME,
} from '@/lib/logger';

function collectLogs(stream: PassThrough): Promise<Record<string, unknown>[]> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (!text) {
        resolve([]);
        return;
      }
      resolve(
        text
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as Record<string, unknown>),
      );
    });
  });
}

describe('logger configuration', () => {
  it('resolves default levels by environment', () => {
    expect(resolveLogLevel('development')).toBe('debug');
    expect(resolveLogLevel('test')).toBe('silent');
    expect(resolveLogLevel('production')).toBe('info');
    expect(resolveLogLevel('production', 'warn')).toBe('warn');
  });

  it('includes service and env bindings in structured output', async () => {
    const stream = new PassThrough();
    const pending = collectLogs(stream);
    const log = createAppLogger({
      nodeEnv: 'production',
      level: 'info',
      forceJson: true,
      destination: stream,
    });

    log.info({ event: 'test.event' }, 'hello');
    stream.end();

    const lines = await pending;
    expect(lines).toHaveLength(1);
    expect(lines[0]?.service).toBe(LOGGER_SERVICE_NAME);
    expect(lines[0]?.env).toBe('production');
    expect(lines[0]?.event).toBe('test.event');
    expect(lines[0]?.msg).toBe('hello');
  });

  it('filters messages below the configured level', async () => {
    const stream = new PassThrough();
    const pending = collectLogs(stream);
    const log = createAppLogger({
      nodeEnv: 'production',
      level: 'warn',
      forceJson: true,
      destination: stream,
    });

    log.debug({ event: 'hidden' }, 'debug');
    log.info({ event: 'hidden' }, 'info');
    log.warn({ event: 'visible' }, 'warn');
    stream.end();

    const lines = await pending;
    expect(lines).toHaveLength(1);
    expect(lines[0]?.event).toBe('visible');
  });

  it('keeps test environment quiet by default level', () => {
    const pinoLogger = createPinoLogger({ nodeEnv: 'test', forceJson: true });
    expect(pinoLogger.level).toBe('silent');
  });
});

describe('sensitive-data redaction', () => {
  it('redacts password, otp, and token fields', () => {
    const redacted = redactValue({
      email: 'user@example.com',
      password: 'super-secret',
      otp: '123456',
      accessToken: 'tok_abc',
      nested: { refreshToken: 'ref_xyz', note: 'ok' },
    }) as Record<string, unknown>;

    expect(redacted.email).toBe('user@example.com');
    expect(redacted.password).toBe(REDACTED);
    expect(redacted.otp).toBe(REDACTED);
    expect(redacted.accessToken).toBe(REDACTED);
    expect((redacted.nested as Record<string, unknown>).refreshToken).toBe(REDACTED);
    expect((redacted.nested as Record<string, unknown>).note).toBe('ok');
  });

  it('does not emit secrets in captured log lines', async () => {
    const stream = new PassThrough();
    const pending = collectLogs(stream);
    const log = createAppLogger({
      nodeEnv: 'production',
      level: 'info',
      forceJson: true,
      destination: stream,
    });

    log.info(
      {
        event: 'auth.login.failure',
        password: 'hunter2',
        otp: '999999',
        accessToken: 'secret-token',
      },
      'login failed',
    );
    stream.end();

    const lines = await pending;
    const raw = JSON.stringify(lines);
    expect(raw).not.toContain('hunter2');
    expect(raw).not.toContain('999999');
    expect(raw).not.toContain('secret-token');
    expect(raw).toContain(REDACTED);
  });

  it('sanitizes sensitive query parameters from URLs', () => {
    const sanitized = sanitizeUrl('/api/v1/auth/reset?token=abc&email=a@b.com');
    // URLSearchParams may percent-encode brackets in the redaction marker.
    expect(decodeURIComponent(sanitized)).toContain(`token=${REDACTED}`);
    expect(sanitized).not.toContain('token=abc');
    expect(sanitized).toContain('email=');
    expect(sanitizeUrl('/ok')).toBe('/ok');
  });
});

describe('logger failure isolation', () => {
  it('does not throw when child bindings are redacted', () => {
    const stream = new PassThrough();
    const log = createAppLogger({
      nodeEnv: 'production',
      level: 'info',
      forceJson: true,
      destination: stream,
    });
    expect(() => {
      log.child({ requestId: 'req_test_1', password: 'x' }).info('ok');
    }).not.toThrow();
    stream.end();
  });
});
