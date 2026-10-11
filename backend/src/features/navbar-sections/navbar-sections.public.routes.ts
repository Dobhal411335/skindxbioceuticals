import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { navbarSectionsController } from './navbar-sections.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/navbar-sections`.
 */
export const navbarSectionsPublicRoutes = Router({ mergeParams: true });

navbarSectionsPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(navbarSectionsController.listPublic),
);
