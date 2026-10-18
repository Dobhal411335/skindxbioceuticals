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
import { popupBannerRoutes } from '@/features/popup-banner/popup-banner.routes';
import { aboutUsBannerRoutes } from '@/features/about-us-banner/about-us-banner.routes';
import { promoBannerRoutes } from '@/features/promo-banner/promo-banner.routes';
import { collectionBannerRoutes } from '@/features/collection-banner/collection-banner.routes';
import { faqRoutes } from '@/features/faq/faq.routes';
import { insightsRoutes } from '@/features/insights/insights.routes';
import { heroBannerRoutes } from '@/features/hero-banner/hero-banner.routes';
import { categoryRoutes } from '@/features/categories/category.routes';
import { subcategoryAdminRoutes } from '@/features/categories/subcategory.admin.routes';
import { catalogProductRoutes } from '@/features/products/product.routes';
import { productEditRoutes } from '@/features/products/product-edit.routes';
import { couponAdminRoutes } from '@/features/coupons/coupon.admin.routes';
import { blogAdminRoutes } from '@/features/blog/blog.routes';
import { doctorProfilesRoutes } from '@/features/doctors/doctor-profiles.routes';
import { doctorPageRoutes } from '@/features/doctors/doctor-page.routes';
import { doctorAppointmentsRoutes } from '@/features/doctor-appointments/doctor-appointments.routes';
import { adminOrdersRoutes } from '@/features/admin-orders/admin-orders.routes';
import { inventoryAdminRoutes } from '@/features/inventory/inventory.admin.routes';
import { productPricesAdminRoutes } from '@/features/product-prices/product-prices.admin.routes';
import { vendorsAdminRoutes } from '@/features/vendors/vendors.routes';
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
router.use('/sites/:siteCode/popup-banner', popupBannerRoutes);
router.use('/sites/:siteCode/about-us-banner', aboutUsBannerRoutes);
router.use('/sites/:siteCode/promo-banners', promoBannerRoutes);
router.use('/sites/:siteCode/collection-banners', collectionBannerRoutes);
router.use('/sites/:siteCode/faq', faqRoutes);
router.use('/sites/:siteCode/insights', insightsRoutes);
router.use('/sites/:siteCode/hero-banners', heroBannerRoutes);
router.use('/sites/:siteCode/categories', categoryRoutes);
router.use(
  '/sites/:siteCode/subcategories/:subcategoryId/products',
  catalogProductRoutes,
);
router.use('/sites/:siteCode/products', productEditRoutes);
router.use('/sites/:siteCode/coupons', couponAdminRoutes);
router.use('/sites/:siteCode/subcategories', subcategoryAdminRoutes);
router.use('/sites/:siteCode/blogs', blogAdminRoutes);
router.use('/sites/:siteCode/doctors', doctorProfilesRoutes);
router.use('/sites/:siteCode/doctor-page', doctorPageRoutes);
router.use('/sites/:siteCode/doctor-appointments', doctorAppointmentsRoutes);
router.use('/sites/:siteCode/vendors', vendorsAdminRoutes);
router.use('/sites/:siteCode/orders', adminOrdersRoutes);
router.use('/sites/:siteCode/stock', inventoryAdminRoutes);
router.use('/sites/:siteCode/product-prices', productPricesAdminRoutes);

export const adminRoutes = router;
