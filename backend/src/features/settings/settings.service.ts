import { settingsRepository } from './settings.repository';

/**
 * Settings service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class SettingsService {
  constructor(private readonly repository = settingsRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const settingsService = new SettingsService();
