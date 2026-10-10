export class CloudinaryError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'CloudinaryError';
  }
}

export class CloudinaryValidationError extends CloudinaryError {
  constructor(message: string) {
    super(message);
    this.name = 'CloudinaryValidationError';
  }
}
