import { DeleteResult } from '../cloudinary.types';

export function normalizeDeleteResult(publicId: string, result: any): DeleteResult {
  return {
    publicId,
    result: result.result || 'unknown',
  };
}
