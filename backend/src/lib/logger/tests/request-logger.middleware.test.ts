import express, { type Express } from 'express';
import { PassThrough } from 'node:stream';
import request from 'supertest';
import * as loggerModule from '@/lib/logger';
import {
  createAppLogger,
  isValidRequestId,
  REQUEST_ID_RESPONSE_HEADER,
  resolveRequestId,
  requestLoggerMiddleware,
} from '@/lib/logger';

describe('request ID validation', () => {
  it('accepts well-formed IDs and rejects unsafe ones', () => {
    expect(isValidRequestId('req_abc123')).toBe(true);
    expect(isValidRequestId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidRequestId('short')).toBe(false);
    expect(isValidRequestId('bad id with spaces!!!!')).toBe(false);
    expect(isValidRequestId('x'.repeat(200))).toBe(false);
  });

  it('generates a replacement when the incoming ID is invalid', () => {
    const generated = resolveRequestId('<script>');
    expect(isValidRequestId(generated)).toBe(true);
    expect(generated).not.toBe('<script>');
  });

  it('keeps a valid incoming ID', () => {
    expect(resolveRequestId('client-req-001')).toBe('client-req-001');
  });
});

describe('requestLoggerMiddleware', () => {
  function buildApp(onLog?: (payload: Record<string, unknown>) => void): Express {
    const app = express();

    if (onLog) {
      jest.spyOn(loggerModule.logger, 'info').mockImplementation((ctx) => {
        if (typeof ctx === 'object') {
          onLog(ctx);
        }
      });
      jest.spyOn(loggerModule.logger, 'warn').mockImplementation((ctx) => {
        if (typeof ctx === 'object') {
          onLog(ctx);
        }
      });
      jest.spyOn(loggerModule.logger, 'error').mockImplementation((ctx) => {
        if (typeof ctx === 'object') {
          onLog(ctx);
        }
      });
      jest.spyOn(loggerModule.logger, 'debug').mockImplementation((ctx) => {
        if (typeof ctx === 'object') {
          onLog(ctx);
        }
      });
    }

    app.use(requestLoggerMiddleware);
    app.get('/health', (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.get('/api/v1/demo', (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.get('/api/v1/fail', (_req, res) => {
      res.status(500).json({ ok: false });
    });
    app.get('/api/v1/secret', (req, res) => {
      res.status(400).json({ q: req.query });
    });
    return app;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns X-Request-Id and logs status + duration once', async () => {
    const events: Record<string, unknown>[] = [];
    const app = buildApp((payload) => events.push(payload));

    const res = await request(app).get('/api/v1/demo').expect(200);

    expect(res.headers['x-request-id']).toBeTruthy();
    expect(isValidRequestId(res.headers['x-request-id'])).toBe(true);

    const completed = events.filter((e) => e.event === 'http.request.completed');
    expect(completed.length).toBe(1);
    expect(completed[0]?.method).toBe('GET');
    expect(completed[0]?.path).toBe('/api/v1/demo');
    expect(completed[0]?.statusCode).toBe(200);
    expect(typeof completed[0]?.durationMs).toBe('number');
    expect(completed[0]?.requestId).toBe(res.headers['x-request-id']);
  });

  it('accepts a valid client X-Request-Id', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/v1/demo')
      .set('X-Request-Id', 'client-corr-99')
      .expect(200);

    expect(res.headers['x-request-id']).toBe('client-corr-99');
  });

  it('replaces an invalid client X-Request-Id', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/demo').set('X-Request-Id', '!!').expect(200);

    expect(res.headers['x-request-id']).not.toBe('!!');
    expect(isValidRequestId(res.headers['x-request-id'])).toBe(true);
  });

  it('logs health checks at debug, not info', async () => {
    const infoSpy = jest.spyOn(loggerModule.logger, 'info');
    const debugSpy = jest.spyOn(loggerModule.logger, 'debug');
    const app = buildApp();

    await request(app).get('/health').expect(200);

    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();
  });

  it('uses error severity for 5xx responses', async () => {
    const errorSpy = jest.spyOn(loggerModule.logger, 'error');
    const app = buildApp();

    await request(app).get('/api/v1/fail').expect(500);

    expect(errorSpy).toHaveBeenCalled();
  });

  it('sanitizes sensitive query parameters in logged path', async () => {
    const events: Record<string, unknown>[] = [];
    const app = buildApp((payload) => events.push(payload));

    await request(app).get('/api/v1/secret?token=super-secret&x=1').expect(400);

    const completed = events.find((e) => e.event === 'http.request.completed');
    expect(String(completed?.path)).not.toContain('super-secret');
    expect(decodeURIComponent(String(completed?.path))).toContain('[REDACTED]');
  });

  it('does not break the request when the logger throws', async () => {
    jest.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
      throw new Error('logger down');
    });
    jest.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {
      throw new Error('logger down');
    });
    jest.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
      throw new Error('logger down');
    });
    jest.spyOn(loggerModule.logger, 'debug').mockImplementation(() => {
      throw new Error('logger down');
    });

    const app = buildApp();
    await request(app).get('/api/v1/demo').expect(200);
  });

  it('exposes response header constant for correlation', () => {
    expect(REQUEST_ID_RESPONSE_HEADER).toBe('X-Request-Id');
    const stream = new PassThrough();
    const log = createAppLogger({
      nodeEnv: 'production',
      level: 'info',
      forceJson: true,
      destination: stream,
    });
    log.info({ event: 'sink.ok' }, 'ok');
    stream.end();
  });
});
