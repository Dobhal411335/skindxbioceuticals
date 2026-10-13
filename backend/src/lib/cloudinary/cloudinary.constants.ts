export const CLOUDINARY_CONSTANTS = {
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  MAX_PDF_SIZE_BYTES: 20 * 1024 * 1024, // 20MB
  MAX_MULTIPLE_UPLOAD_COUNT: 10,
  MAX_MULTIPLE_DELETE_COUNT: 20,
  CONCURRENCY_LIMIT: 3,
};

export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
export const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov'];
export const ALLOWED_PDF_FORMATS = ['pdf'];

export const ALLOWED_SITE_CODES = ['IN', 'COM', 'SHARED'] as const;

export const ALLOWED_FEATURE_FOLDERS = [
  'products',
  'categories',
  'banners',
  'blog',
  'pages',
  'documents',
  'gallery',
  'branding',
  'footer',
  'social',
  'about',
  'hero',
  'reviews',
  'insights',
  'general',
] as const;
