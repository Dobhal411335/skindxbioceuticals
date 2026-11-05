import request from 'supertest';
import { createApp } from '@/app';
import { uploadSingleImage } from '@/lib/cloudinary/uploads/upload-single-image';

jest.mock('@/lib/cloudinary/uploads/upload-single-image', () => ({
  uploadSingleImage: jest.fn(),
}));

const app = createApp();

describe('Public doctor appointment medical history upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests without a file', async () => {
    const res = await request(app).post(
      '/api/v1/sites/IN/doctor-appointments/medical-history',
    );

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(uploadSingleImage).not.toHaveBeenCalled();
  });

  it('rejects non-image uploads', async () => {
    const res = await request(app)
      .post('/api/v1/sites/IN/doctor-appointments/medical-history')
      .attach('file', Buffer.from('%PDF-1.4'), 'notes.pdf');

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(uploadSingleImage).not.toHaveBeenCalled();
  });

  it('uploads an image to Cloudinary under doctors/medical-history', async () => {
    (uploadSingleImage as jest.Mock).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/skindx/image/upload/v1/history.jpg',
      publicId: 'skindx/in/doctors/medical-history/history',
    });

    const res = await request(app)
      .post('/api/v1/sites/IN/doctor-appointments/medical-history')
      .attach('file', Buffer.from('fake-image-bytes'), 'history.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe(
      'https://res.cloudinary.com/skindx/image/upload/v1/history.jpg',
    );
    expect(res.body.data.publicId).toBe(
      'skindx/in/doctors/medical-history/history',
    );
    expect(uploadSingleImage).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'history.jpg',
        mimetype: 'image/jpeg',
      }),
      expect.objectContaining({
        siteCode: 'IN',
        feature: 'doctors',
        entityId: 'medical-history',
      }),
    );
  });
});
