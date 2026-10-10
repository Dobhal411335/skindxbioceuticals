import { uploadOptionsSchema } from '../../lib/cloudinary';
import { bulkDeleteSchema } from './media.types';

export const validateUploadQuery = (query: unknown) => {
  return uploadOptionsSchema.parse(query);
};

export const validateBulkDelete = (body: unknown) => {
  return bulkDeleteSchema.parse(body);
};
