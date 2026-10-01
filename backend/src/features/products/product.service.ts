import { productRepository } from './product.repository';

/**
 * Product service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class ProductService {
  constructor(private readonly repository = productRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const productService = new ProductService();
