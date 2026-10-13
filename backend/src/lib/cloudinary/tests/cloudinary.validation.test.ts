import { uploadOptionsSchema } from '../cloudinary.validation';
import { validateUpload } from '../utils/validate-upload';
import { CloudinaryValidationError } from '../cloudinary.errors';

describe('Cloudinary Validation', () => {
  describe('uploadOptionsSchema', () => {
    it('should validate correct options', () => {
      const result = uploadOptionsSchema.safeParse({
        siteCode: 'IN',
        feature: 'products',
        entityId: '123',
      });
      expect(result.success).toBe(true);
    });

    it('should allow insights feature folder', () => {
      const result = uploadOptionsSchema.safeParse({
        siteCode: 'IN',
        feature: 'insights',
      });
      expect(result.success).toBe(true);
    });

    it('should allow doctors feature folder', () => {
      const result = uploadOptionsSchema.safeParse({
        siteCode: 'IN',
        feature: 'doctors',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid siteCode', () => {
      const result = uploadOptionsSchema.safeParse({
        siteCode: 'INVALID',
        feature: 'products',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid feature', () => {
      const result = uploadOptionsSchema.safeParse({
        siteCode: 'IN',
        feature: 'invalid-feature',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateUpload', () => {
    const mockFile = (name: string, size: number): Express.Multer.File =>
      ({
        originalname: name,
        size,
      }) as Express.Multer.File;

    it('should validate correct image', () => {
      expect(() => validateUpload(mockFile('test.jpg', 1024), 'image')).not.toThrow();
    });

    it('should reject invalid image format', () => {
      expect(() => validateUpload(mockFile('test.txt', 1024), 'image')).toThrow(
        CloudinaryValidationError,
      );
    });

    it('should reject image exceeding size limit', () => {
      expect(() => validateUpload(mockFile('test.jpg', 20 * 1024 * 1024), 'image')).toThrow(
        CloudinaryValidationError,
      );
    });

    it('should validate correct video', () => {
      expect(() => validateUpload(mockFile('test.mp4', 1024), 'video')).not.toThrow();
    });

    it('should validate correct pdf', () => {
      expect(() => validateUpload(mockFile('test.pdf', 1024), 'raw')).not.toThrow();
    });
  });
});
