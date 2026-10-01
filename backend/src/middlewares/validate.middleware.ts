import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '@/utils/AppError';

type RequestValidationTarget = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates request body, query, and/or params with Zod schemas.
 * Replaces the corresponding request properties with parsed (typed) values.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const targets: RequestValidationTarget[] = ['body', 'query', 'params'];

      for (const target of targets) {
        const schema = schemas[target];
        if (!schema) continue;

        const result = schema.safeParse(req[target]);

        if (!result.success) {
          throw new ValidationError('Validation failed', result.error.flatten());
        }

        req[target] = result.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
