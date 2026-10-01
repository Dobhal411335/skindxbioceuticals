import { userRepository } from './user.repository';

/**
 * User service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class UserService {
  constructor(private readonly repository = userRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const userService = new UserService();
