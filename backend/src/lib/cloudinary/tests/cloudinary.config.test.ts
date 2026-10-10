import { cloudinary } from '../cloudinary.config';

jest.mock('../../../config/env', () => ({
  env: {
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
  },
}));

describe('Cloudinary Config', () => {
  it('should initialize cloudinary with correct credentials', () => {
    const config = cloudinary.config();
    expect(config.cloud_name).toBe('test-cloud');
    expect(config.api_key).toBe('test-key');
    expect(config.api_secret).toBe('test-secret');
    expect(config.secure).toBe(true);
  });
});
