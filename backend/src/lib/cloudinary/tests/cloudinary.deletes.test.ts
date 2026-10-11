import { deleteSingleImage } from '../deletes/delete-single-image';
import { deleteMultipleImages } from '../deletes/delete-multiple-images';
import { cloudinary } from '../cloudinary.config';
import { CloudinaryError } from '../cloudinary.errors';

jest.mock('../cloudinary.config', () => ({
  cloudinary: {
    uploader: {
      destroy: jest.fn(),
    },
    api: {
      delete_resources: jest.fn(),
    },
  },
}));

describe('Cloudinary Deletes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteSingleImage', () => {
    it('should delete a single image successfully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      const result = await deleteSingleImage('test_public_id');

      expect(result.publicId).toBe('test_public_id');
      expect(result.result).toBe('ok');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test_public_id', {
        invalidate: true,
        resource_type: 'image',
      });
    });

    it('should pass video resource_type when deleting videos', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await deleteSingleImage('gallery/clip', { resourceType: 'video' });

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('gallery/clip', {
        invalidate: true,
        resource_type: 'video',
      });
    });

    it('should throw an error if deletion fails', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      await expect(deleteSingleImage('test_public_id')).rejects.toThrow(CloudinaryError);
    });
  });

  describe('deleteMultipleImages', () => {
    it('should delete multiple images successfully', async () => {
      (cloudinary.api.delete_resources as jest.Mock).mockResolvedValue({
        deleted: {
          id1: 'deleted',
          id2: 'not_found',
        },
      });

      const result = await deleteMultipleImages(['id1', 'id2']);

      expect(result.deleted).toContain('id1');
      expect(result.failed).toContainEqual({ publicId: 'id2', error: 'not_found' });
      expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(['id1', 'id2'], {
        invalidate: true,
        resource_type: 'image',
      });
    });
  });
});
