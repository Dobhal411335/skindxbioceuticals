import { reviewRepository } from './review.repository';

/**
 * Review service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class ReviewService {
  constructor(private readonly repository = reviewRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const reviewService = new ReviewService();
