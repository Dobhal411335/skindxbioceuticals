import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { navbarSectionsController } from './navbar-sections.controller';
import {
  navbarSectionBodySchema,
  navbarSectionIdParamSchema,
  navbarSectionPatchSchema,
  normalizeNavbarSectionInput,
} from './navbar-sections.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const navbarSectionsRoutes = Router({ mergeParams: true });

navbarSectionsRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(navbarSectionsController.list),
);

navbarSectionsRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeNavbarSectionInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: navbarSectionBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(navbarSectionsController.create),
);

navbarSectionsRoutes.put(
  '/:sectionId',
  (req, _res, next) => {
    req.body = normalizeNavbarSectionInput(req.body);
    next();
  },
  validate({ params: navbarSectionIdParamSchema, body: navbarSectionBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(navbarSectionsController.update),
);

navbarSectionsRoutes.patch(
  '/:sectionId',
  validate({ params: navbarSectionIdParamSchema, body: navbarSectionPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(navbarSectionsController.patchActive),
);

navbarSectionsRoutes.delete(
  '/:sectionId',
  validate({ params: navbarSectionIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(navbarSectionsController.remove),
);
