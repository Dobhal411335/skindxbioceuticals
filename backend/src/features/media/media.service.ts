import { mediaRepository } from './media.repository';

/**
 * Media service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class MediaService {
  constructor(private readonly repository = mediaRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const mediaService = new MediaService();
