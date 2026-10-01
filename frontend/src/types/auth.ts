export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};
