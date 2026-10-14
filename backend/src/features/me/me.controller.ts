import type { Request, Response } from 'express';
import { UnauthorizedError } from '@/utils/AppError';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/apiResponse';
import { meService } from './me.service';
import type {
  AddressBodyInput,
  AddressIdParam,
  UpdateAddressInput,
  UpdateProfileInput,
} from './me.validation';

export class MeController {
  constructor(private readonly service = meService) {}

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const body = req.body as UpdateProfileInput;
    const data = await this.service.updateProfile(req.user.id, body);
    sendSuccess(res, data, 'Profile updated');
  };

  uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const data = await this.service.uploadAvatar(req.user.id, req.file);
    sendSuccess(res, data, 'Profile photo updated');
  };

  clearAvatar = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const data = await this.service.clearAvatar(req.user.id);
    sendSuccess(res, data, 'Profile photo removed');
  };

  listAddresses = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const data = await this.service.listAddresses(req.user.id);
    sendSuccess(res, { addresses: data }, 'Addresses');
  };

  createAddress = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const body = req.body as AddressBodyInput;
    const data = await this.service.createAddress(req.user.id, body);
    sendCreated(res, { address: data }, 'Address created');
  };

  updateAddress = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const params = req.params as unknown as AddressIdParam;
    const body = req.body as UpdateAddressInput;
    const data = await this.service.updateAddress(req.user.id, params.addressId, body);
    sendSuccess(res, { address: data }, 'Address updated');
  };

  deleteAddress = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const params = req.params as unknown as AddressIdParam;
    await this.service.deleteAddress(req.user.id, params.addressId);
    sendNoContent(res);
  };
}

export const meController = new MeController();
