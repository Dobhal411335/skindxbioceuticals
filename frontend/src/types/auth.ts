export type AuthLinkedProvider = "GOOGLE";

export type AuthUser = {
  id: string;
  email: string;
  role?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  hasPassword?: boolean;
  linkedProviders?: AuthLinkedProvider[];
  createdAt?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type SessionAuthResult = {
  accessToken: string;
  user: AuthUser;
};

/** @deprecated Prefer SessionAuthResult — kept for existing Google imports */
export type GoogleAuthResult = SessionAuthResult;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterPendingResult = {
  verificationRequired: true;
  email: string;
};

export type VerifyEmailPayload = {
  email: string;
  otp: string;
};

export type ResendVerificationPayload = {
  email: string;
};
