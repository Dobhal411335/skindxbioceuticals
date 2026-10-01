import { blogRepository } from './blog.repository';

/**
 * Blog service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class BlogService {
  constructor(private readonly repository = blogRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const blogService = new BlogService();
