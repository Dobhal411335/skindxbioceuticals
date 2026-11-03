import { uploadSingleImage } from '../uploads/upload-single-image';
import { uploadSinglePdf } from '../uploads/upload-single-pdf';
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

  it('should upload PDFs as raw assets with a .pdf public_id', async () => {
    const pdfFile = {
      originalname: 'Ingredient Sheet.PDF',
      size: 2048,
      buffer: Buffer.from('%PDF'),
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
      callback(null, {
        public_id: 'skindx/in/products/ingredient-sheet-abc.pdf',
        secure_url:
          'https://res.cloudinary.com/demo/raw/upload/v1/skindx/in/products/ingredient-sheet-abc.pdf',
        format: 'pdf',
        resource_type: 'raw',
        bytes: 2048,
      });
      return { end: jest.fn() };
    });

    await uploadSinglePdf(pdfFile, mockOptions);

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'skindx/in/products',
        resource_type: 'raw',
        public_id: expect.stringMatching(/\.pdf$/),
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
