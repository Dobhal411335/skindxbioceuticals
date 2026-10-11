import type { Application } from 'express';
import { Router } from 'express';
import { appConfig } from '@/config';
import { authRoutes } from '@/features/auth/auth.routes';
import { meRoutes } from '@/features/me/me.routes';
import { userRoutes } from '@/features/users/user.routes';
import { productRoutes } from '@/features/products/product.routes';
import { categoryRoutes } from '@/features/categories/category.routes';
import { cartRoutes } from '@/features/cart/cart.routes';
import { wishlistRoutes } from '@/features/wishlist/wishlist.routes';
import { orderRoutes } from '@/features/orders/order.routes';
import { paymentRoutes } from '@/features/payments/payment.routes';
import { couponRoutes } from '@/features/coupons/coupon.routes';
import { reviewRoutes } from '@/features/reviews/review.routes';
import { inventoryRoutes } from '@/features/inventory/inventory.routes';
import { blogRoutes } from '@/features/blog/blog.routes';
import { enquiryRoutes } from '@/features/enquiries/enquiry.routes';
import { adminRoutes } from '@/features/admin/admin.routes';
import { companyBasicInfoPublicRoutes } from '@/features/company-basic-info/company-basic-info.public.routes';
import { navbarSectionsPublicRoutes } from '@/features/navbar-sections/navbar-sections.public.routes';
import { socialPostsPublicRoutes } from '@/features/social-posts/social-posts.public.routes';
import { galleryPublicRoutes } from '@/features/gallery/gallery.public.routes';
import { footerPublicRoutes } from '@/features/footer/footer.public.routes';
import { topAdvertisementPublicRoutes } from '@/features/top-advertisement/top-advertisement.public.routes';
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
  v1.use('/categories', categoryRoutes);
  v1.use('/cart', cartRoutes);
  v1.use('/wishlist', wishlistRoutes);
  v1.use('/orders', orderRoutes);
  v1.use('/payments', paymentRoutes);
  v1.use('/coupons', couponRoutes);
  v1.use('/reviews', reviewRoutes);
  v1.use('/inventory', inventoryRoutes);
  v1.use('/blog', blogRoutes);
  v1.use('/enquiries', enquiryRoutes);
  v1.use('/admin', adminRoutes);
  v1.use('/media', mediaRoutes);
  v1.use('/settings', settingsRoutes);
  v1.use('/shipping', shippingRoutes);
  v1.use('/sites/:siteCode/company-basic-info', companyBasicInfoPublicRoutes);
  v1.use('/sites/:siteCode/navbar-sections', navbarSectionsPublicRoutes);
  v1.use('/sites/:siteCode/social-posts', socialPostsPublicRoutes);
  v1.use('/sites/:siteCode/gallery', galleryPublicRoutes);
  v1.use('/sites/:siteCode/footer', footerPublicRoutes);
  v1.use('/sites/:siteCode/top-advertisement', topAdvertisementPublicRoutes);

  app.use(appConfig.apiPrefix, v1);
}
