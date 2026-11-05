import { cloudinary } from '../cloudinary.config';
import {
  buildRawPdfDownloadUrl,
  rawPublicIdFromDeliveryUrl,
} from '../utils/raw-pdf-download-url';

jest.mock('../cloudinary.config', () => ({
  cloudinary: {
    utils: {
      private_download_url: jest.fn(() => 'https://api.cloudinary.com/v1_1/demo/raw/download?signed=1'),
    },
  },
}));

describe('raw PDF download URLs', () => {
  it('reads the public id from a raw delivery URL', () => {
    expect(
      rawPublicIdFromDeliveryUrl(
        'https://res.cloudinary.com/demo/raw/upload/v123/skindx/in/products/sheet.pdf',
      ),
    ).toBe('skindx/in/products/sheet.pdf');
    expect(
      rawPublicIdFromDeliveryUrl(
        'https://res.cloudinary.com/demo/raw/upload/s--abc--/v9/folder/file.pdf',
      ),
    ).toBe('folder/file.pdf');
    expect(rawPublicIdFromDeliveryUrl('https://example.com/file.pdf')).toBeNull();
  });

  it('builds a short-lived signed raw download URL', () => {
    const url = buildRawPdfDownloadUrl('skindx/in/products/sheet.pdf');

    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/raw/download?signed=1');
    expect(cloudinary.utils.private_download_url).toHaveBeenCalledWith(
      'skindx/in/products/sheet.pdf',
      'pdf',
      expect.objectContaining({
        resource_type: 'raw',
        type: 'upload',
        expires_at: expect.any(Number),
      }),
    );
  });
});
