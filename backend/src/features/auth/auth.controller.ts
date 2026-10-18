import type { Request, Response } from 'express';
import {
  clearRefreshTokenCookie,
  getRefreshCookieName,
  setRefreshTokenCookie,
} from '@/lib/authCookie';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import { authService } from './auth.service';
import { googleAuthService } from './google-auth.service';
import type {
  AdminLoginInput,
  BootstrapAdminInput,
  ChangePasswordInput,
  GoogleAuthInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
  ResendVerificationInput,
  VendorLoginInput,
  VerifyEmailInput,
} from './auth.validation';

/**
 * Auth controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class AuthController {
  constructor(
    private readonly service = authService,
    private readonly google = googleAuthService,
  ) {}

  /**
   * Placeholder status handler for the auth feature module.
   */
  status = (_req: Request, res: Response): void => {
    sendSuccess(res, { feature: 'auth', ready: true }, 'Auth module ready');
  };

  bootstrapAdmin = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as BootstrapAdminInput;
    const data = await this.service.bootstrapAdmin(body);
    sendCreated(res, data, 'First administrator created');
  };

  adminLogin = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as AdminLoginInput;
    const data = await this.service.adminLogin(body);
    sendSuccess(res, data, 'Signed in successfully');
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RegisterInput;
    const data = await this.service.register(body);
    sendCreated(res, data, 'Registration successful. Please verify your email.');
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as VerifyEmailInput;
    const data = await this.service.verifyEmail(body);

    setRefreshTokenCookie(res, data.refreshToken);

    sendSuccess(
      res,
      {
        accessToken: data.accessToken,
        user: data.user,
      },
      'Email verified successfully',
    );
  };

  resendVerification = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as ResendVerificationInput;
    const data = await this.service.resendVerification(body);
    sendSuccess(res, data, 'If an unverified account exists, a new code has been sent.');
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as LoginInput;
    const data = await this.service.login(body);

    setRefreshTokenCookie(res, data.refreshToken);

    sendSuccess(
      res,
      {
        accessToken: data.accessToken,
        user: data.user,
      },
      'Signed in successfully',
    );
  };

  vendorLogin = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as VendorLoginInput;
    const data = await this.service.vendorLogin(body);

    setRefreshTokenCookie(res, data.refreshToken);

    sendSuccess(
      res,
      {
        accessToken: data.accessToken,
        user: data.user,
      },
      'Signed in as vendor successfully',
    );
  };

  googleAuth = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as GoogleAuthInput;
    const data = await this.google.authenticateWithCredential(body.credential);

    setRefreshTokenCookie(res, data.refreshToken);

    sendSuccess(
      res,
      {
        accessToken: data.accessToken,
        user: data.user,
      },
      'Signed in with Google successfully',
    );
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const body = (req.body ?? {}) as RefreshTokenInput;
    const cookieToken = req.cookies?.[getRefreshCookieName()] as string | undefined;
    const refreshToken = body.refreshToken ?? cookieToken;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const data = await this.service.refresh({ refreshToken });

    // Rotate cookie when the previous refresh token came from a cookie (customer/storefront).
    if (cookieToken && !body.refreshToken) {
      setRefreshTokenCookie(res, data.refreshToken);
      sendSuccess(
        res,
        {
          accessToken: data.accessToken,
          user: data.user,
        },
        'Token refreshed',
      );
      return;
    }

    sendSuccess(res, data, 'Token refreshed');
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const body = (req.body ?? {}) as LogoutInput;
    const cookieToken = req.cookies?.[getRefreshCookieName()] as string | undefined;
    const refreshToken = body.refreshToken ?? cookieToken;

    await this.service.logout(refreshToken);
    clearRefreshTokenCookie(res);
    sendNoContent(res);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.me(req.user.id);
    sendSuccess(res, data, 'Current user');
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const body = req.body as ChangePasswordInput;
    const data = await this.service.changePassword(req.user.id, body);

    setRefreshTokenCookie(res, data.refreshToken);

    sendSuccess(
      res,
      {
        accessToken: data.accessToken,
        user: data.user,
      },
      'Password updated successfully',
    );
  };
}

export const authController = new AuthController();
