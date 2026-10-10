import request from 'supertest';
import { createApp } from '../../app';
import { MediaService } from './media.service';
import { verifyAccessToken } from '../../lib/jwt';

jest.mock('./media.service');
jest.mock('../../lib/jwt');

const app = createApp();

describe('Media API Routes', () => {
  const mockToken = 'mock-admin-token';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (verifyAccessToken as jest.Mock).mockReturnValue({
      sub: mockUserId,
      email: 'admin@test.com',
      role: 'ADMIN',
    });
  });

  describe('POST /api/v1/media/images', () => {
    it('should upload an image successfully', async () => {
      const mockResult = {
        media: { id: 'media-123', url: 'https://test.com/image.jpg' },
        result: { publicId: 'test_id', secureUrl: 'https://test.com/image.jpg' },
      };

      (MediaService.uploadImage as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/media/images')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ siteCode: 'IN', feature: 'products' })
        .attach('file', Buffer.from('test image content'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(MediaService.uploadImage).toHaveBeenCalled();
    });

    it('should return 400 if no file is provided', async () => {
      const response = await request(app)
        .post('/api/v1/media/images')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ siteCode: 'IN', feature: 'products' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No file uploaded');
    });
  });

  describe('DELETE /api/v1/media/:assetId', () => {
    it('should delete media successfully', async () => {
      (MediaService.deleteMedia as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/api/v1/media/media-123')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(MediaService.deleteMedia).toHaveBeenCalledWith('media-123');
    });
  });
});
