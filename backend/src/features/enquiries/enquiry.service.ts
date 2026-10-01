import { enquiryRepository } from './enquiry.repository';

/**
 * Enquiry service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class EnquiryService {
  constructor(private readonly repository = enquiryRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const enquiryService = new EnquiryService();
