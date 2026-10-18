import type { Application } from 'express';
import { Router } from 'express';
import { appConfig } from '@/config';
import { authRoutes } from '@/features/auth/auth.routes';
import { meRoutes } from '@/features/me/me.routes';
import { userRoutes } from '@/features/users/user.routes';
import { productRoutes } from '@/features/products/product.routes';
import { productPublicRoutes } from '@/features/products/product.public.routes';
import { categoryPublicRoutes } from '@/features/categories/category.public.routes';
import { cartRoutes } from '@/features/cart/cart.routes';
import { guestCheckoutRoutes } from '@/features/checkout/guest-checkout.routes';
import { wishlistRoutes } from '@/features/wishlist/wishlist.routes';
import { orderRoutes } from '@/features/orders/order.routes';
import { paymentRoutes } from '@/features/payments/payment.routes';
import { couponRoutes } from '@/features/coupons/coupon.routes';
import { reviewRoutes } from '@/features/reviews/review.routes';
import { inventoryRoutes } from '@/features/inventory/inventory.routes';
import { enquiryRoutes } from '@/features/enquiries/enquiry.routes';
import { adminRoutes } from '@/features/admin/admin.routes';
import { companyBasicInfoPublicRoutes } from '@/features/company-basic-info/company-basic-info.public.routes';
import { navbarSectionsPublicRoutes } from '@/features/navbar-sections/navbar-sections.public.routes';
import { socialPostsPublicRoutes } from '@/features/social-posts/social-posts.public.routes';
import { galleryPublicRoutes } from '@/features/gallery/gallery.public.routes';
import { customerReviewsPublicRoutes } from '@/features/customer-reviews/customer-reviews.public.routes';
import { footerPublicRoutes } from '@/features/footer/footer.public.routes';
import { topAdvertisementPublicRoutes } from '@/features/top-advertisement/top-advertisement.public.routes';
import { popupBannerPublicRoutes } from '@/features/popup-banner/popup-banner.public.routes';
import { aboutUsBannerPublicRoutes } from '@/features/about-us-banner/about-us-banner.public.routes';
import { promoBannerPublicRoutes } from '@/features/promo-banner/promo-banner.public.routes';
import { collectionBannerPublicRoutes } from '@/features/collection-banner/collection-banner.public.routes';
import { faqPublicRoutes } from '@/features/faq/faq.public.routes';
import { insightsPublicRoutes } from '@/features/insights/insights.public.routes';
import { heroBannerPublicRoutes } from '@/features/hero-banner/hero-banner.public.routes';
import { blogPublicRoutes } from '@/features/blog/blog.public.routes';
import { doctorProfilesPublicRoutes } from '@/features/doctors/doctor-profiles.public.routes';
import { doctorPagePublicRoutes } from '@/features/doctors/doctor-page.public.routes';
import { doctorAppointmentsPublicRoutes } from '@/features/doctor-appointments/doctor-appointments.public.routes';
import { vendorsPublicRoutes } from '@/features/vendors/vendors.public.routes';
import { mediaRoutes } from '@/features/media/media.routes';
import { settingsRoutes } from '@/features/settings/settings.routes';
import { shippingRoutes } from '@/features/shipping/shipping.routes';

/**
 * Mounts all feature routers under `/api/v1` (configurable via API_PREFIX).
 */
export function registerRoutes(app: Application): void {
  const v1 = Router();

  v1.use('/auth', authRoutes);
  v1.use('/me', meRoutes);
  v1.use('/users', userRoutes);
  v1.use('/products', productRoutes);
  v1.use('/cart', cartRoutes);
  v1.use('/checkout/guest', guestCheckoutRoutes);
  v1.use('/wishlist', wishlistRoutes);
  v1.use('/orders', orderRoutes);
  v1.use('/payments', paymentRoutes);
  v1.use('/coupons', couponRoutes);
  v1.use('/reviews', reviewRoutes);
  v1.use('/inventory', inventoryRoutes);
  v1.use('/enquiries', enquiryRoutes);
  v1.use('/admin', adminRoutes);
  v1.use('/media', mediaRoutes);
  v1.use('/settings', settingsRoutes);
  v1.use('/shipping', shippingRoutes);
  v1.use('/sites/:siteCode/company-basic-info', companyBasicInfoPublicRoutes);
  v1.use('/sites/:siteCode/navbar-sections', navbarSectionsPublicRoutes);
  v1.use('/sites/:siteCode/social-posts', socialPostsPublicRoutes);
  v1.use('/sites/:siteCode/gallery', galleryPublicRoutes);
  v1.use('/sites/:siteCode/customer-reviews', customerReviewsPublicRoutes);
  v1.use('/sites/:siteCode/footer', footerPublicRoutes);
  v1.use('/sites/:siteCode/top-advertisement', topAdvertisementPublicRoutes);
  v1.use('/sites/:siteCode/popup-banner', popupBannerPublicRoutes);
  v1.use('/sites/:siteCode/about-us-banner', aboutUsBannerPublicRoutes);
  v1.use('/sites/:siteCode/promo-banners', promoBannerPublicRoutes);
  v1.use('/sites/:siteCode/collection-banners', collectionBannerPublicRoutes);
  v1.use('/sites/:siteCode/faq', faqPublicRoutes);
  v1.use('/sites/:siteCode/insights', insightsPublicRoutes);
  v1.use('/sites/:siteCode/hero-banners', heroBannerPublicRoutes);
  v1.use('/sites/:siteCode/blogs', blogPublicRoutes);
  v1.use('/sites/:siteCode/doctors', doctorProfilesPublicRoutes);
  v1.use('/sites/:siteCode/doctor-page', doctorPagePublicRoutes);
  v1.use('/sites/:siteCode/doctor-appointments', doctorAppointmentsPublicRoutes);
  v1.use('/sites/:siteCode/vendors', vendorsPublicRoutes);
  v1.use('/sites/:siteCode/categories', categoryPublicRoutes);
  v1.use('/sites/:siteCode/products', productPublicRoutes);

  app.use(appConfig.apiPrefix, v1);
}
