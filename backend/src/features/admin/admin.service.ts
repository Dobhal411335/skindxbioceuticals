import { adminRepository } from './admin.repository';

/**
 * Admin service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class AdminService {
  constructor(private readonly repository = adminRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const adminService = new AdminService();
