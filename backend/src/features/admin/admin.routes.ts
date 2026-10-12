import { Router } from 'express';
import { adminController } from './admin.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { companyBasicInfoRoutes } from '@/features/company-basic-info/company-basic-info.routes';
import { navbarSectionsRoutes } from '@/features/navbar-sections/navbar-sections.routes';
import { socialPostsRoutes } from '@/features/social-posts/social-posts.routes';
import { galleryRoutes } from '@/features/gallery/gallery.routes';
import { customerReviewsRoutes } from '@/features/customer-reviews/customer-reviews.routes';
import { footerRoutes } from '@/features/footer/footer.routes';
import { topAdvertisementRoutes } from '@/features/top-advertisement/top-advertisement.routes';
import { aboutUsBannerRoutes } from '@/features/about-us-banner/about-us-banner.routes';
import { faqRoutes } from '@/features/faq/faq.routes';
import { heroBannerRoutes } from '@/features/hero-banner/hero-banner.routes';
import { categoryRoutes } from '@/features/categories/category.routes';
import { catalogProductRoutes } from '@/features/products/product.routes';
import { dashboardQuerySchema, siteCodeParamSchema } from './admin.validation';

/**
 * Admin routes - wiring only.
 * Protected by JWT auth + ADMIN / SUPER_ADMIN roles.
 */
const router = Router();

router.get('/status', asyncHandler(adminController.status));

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/sites', asyncHandler(adminController.listSites));

router.get(
  '/sites/:siteCode/dashboard',
  validate({ params: siteCodeParamSchema, query: dashboardQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminController.dashboard),
);

router.use('/sites/:siteCode/company-basic-info', companyBasicInfoRoutes);
router.use('/sites/:siteCode/navbar-sections', navbarSectionsRoutes);
router.use('/sites/:siteCode/social-posts', socialPostsRoutes);
router.use('/sites/:siteCode/gallery', galleryRoutes);
router.use('/sites/:siteCode/customer-reviews', customerReviewsRoutes);
router.use('/sites/:siteCode/footer', footerRoutes);
router.use('/sites/:siteCode/top-advertisement', topAdvertisementRoutes);
router.use('/sites/:siteCode/about-us-banner', aboutUsBannerRoutes);
router.use('/sites/:siteCode/faq', faqRoutes);
router.use('/sites/:siteCode/hero-banners', heroBannerRoutes);
router.use('/sites/:siteCode/categories', categoryRoutes);
router.use(
  '/sites/:siteCode/subcategories/:subcategoryId/products',
  catalogProductRoutes,
);

export const adminRoutes = router;
