import { AppError } from '@/utils/AppError';

/**
 * Safe application error for Brevo / email provider failures.
 * Never includes API keys or full provider payloads in the public message.
 */
export class EmailProviderError extends AppError {
  public readonly providerCode?: string;

  constructor(message = 'Failed to submit email to provider', providerCode?: string) {
    super(message, 502, providerCode ? { providerCode } : undefined);
    this.providerCode = providerCode;
    Object.setPrototypeOf(this, EmailProviderError.prototype);
  }
}

export class EmailValidationError extends AppError {
  constructor(message = 'Invalid email input', errors?: unknown) {
    super(message, 422, errors);
    Object.setPrototypeOf(this, EmailValidationError.prototype);
  }
}
