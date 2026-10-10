import type { SiteCode, UserRole } from './common';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface RequestSite {
  id: string;
  code: SiteCode;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      site?: RequestSite;
    }
  }
}

export {};
