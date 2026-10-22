import request from 'supertest';
import { createApp } from '@/app';
import * as uploadSingleImageModule from '@/lib/cloudinary/uploads/upload-single-image';

jest.mock('@/lib/cloudinary/uploads/upload-single-image');

const app = createApp();

describe('Checkout Prescription Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects upload when no file is sent', async () => {
    const res = await request(app).post('/api/v1/checkout/prescription');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-image files', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/prescription')
      .attach('file', Buffer.from('hello text'), 'notes.txt');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('successfully uploads prescription image to Cloudinary', async () => {
    (uploadSingleImageModule.uploadSingleImage as jest.Mock).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/skindx/image/upload/v123/prescription.jpg',
      publicId: 'skindx/in/prescriptions/prescription_123',
    });

    const res = await request(app)
      .post('/api/v1/checkout/prescription')
      .query({ siteCode: 'IN' })
      .attach('file', Buffer.from('fake-image-bytes'), 'prescription.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe(
      'https://res.cloudinary.com/skindx/image/upload/v123/prescription.jpg',
    );
    expect(res.body.data.publicId).toBe('skindx/in/prescriptions/prescription_123');
  });
});
