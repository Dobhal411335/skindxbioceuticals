import express from 'express';
import request from 'supertest';
import { requestLoggerMiddleware } from '@/lib/logger';
import * as loggerModule from '@/lib/logger';
import { AppError } from '@/utils/AppError';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { asyncHandler } from '@/utils/asyncHandler';

describe('errorMiddleware logging', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not log expected AppError as unexpected server errors', async () => {
    const errorSpy = jest.spyOn(loggerModule.logger, 'error');
    const app = express();
    app.use(requestLoggerMiddleware);
    app.get(
      '/boom-expected',
      asyncHandler(async () => {
        throw new AppError('Nope', 400);
      }),
    );
    app.use(errorMiddleware);

    const res = await request(app).get('/boom-expected').expect(400);
    expect(res.body.requestId).toBeTruthy();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs unexpected errors once with requestId', async () => {
    const errorSpy = jest.spyOn(loggerModule.logger, 'error');
    const app = express();
    app.use(requestLoggerMiddleware);
    app.get(
      '/boom-unexpected',
      asyncHandler(async () => {
        throw new Error('surprise');
      }),
    );
    app.use(errorMiddleware);

    const res = await request(app).get('/boom-unexpected').expect(500);
    expect(res.body.requestId).toBeTruthy();

    const unexpected = errorSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'object' && call[0] !== null && call[0].event === 'app.unexpected_error',
    );
    expect(unexpected).toHaveLength(1);
    expect(unexpected[0]?.[0]).toMatchObject({ requestId: res.body.requestId });
  });
});
