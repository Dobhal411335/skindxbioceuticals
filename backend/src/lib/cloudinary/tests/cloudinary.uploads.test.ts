import { uploadSingleImage } from '../uploads/upload-single-image';
import { cloudinary } from '../cloudinary.config';
import { CloudinaryError } from '../cloudinary.errors';

jest.mock('../cloudinary.config', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('Cloudinary Uploads', () => {
  const mockFile = {
    originalname: 'test.jpg',
    size: 1024,
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  const mockOptions = {
    siteCode: 'IN' as const,
    feature: 'products' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload single image successfully', async () => {
    const mockResult = {
      public_id: 'test_id',
      secure_url: 'https://test.com/test.jpg',
      format: 'jpg',
      bytes: 1024,
    };

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
      callback(null, mockResult);
      return { end: jest.fn() };
    });

    const result = await uploadSingleImage(mockFile, mockOptions);

    expect(result.publicId).toBe('test_id');
    expect(result.secureUrl).toBe('https://test.com/test.jpg');
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'skindx/in/products',
        resource_type: 'image',
      }),
      expect.any(Function),
    );
  });

  it('should handle upload error', async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
      callback(new Error('Upload failed'));
      return { end: jest.fn() };
    });

    await expect(uploadSingleImage(mockFile, mockOptions)).rejects.toThrow(CloudinaryError);
  });
});
