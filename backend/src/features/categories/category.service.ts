import { categoryRepository } from './category.repository';

/**
 * Category service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class CategoryService {
  constructor(private readonly repository = categoryRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const categoryService = new CategoryService();
