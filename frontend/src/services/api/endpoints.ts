/**
 * Central API path placeholders for the SkinDX Bioceuticals backend.
 * Implement service callers in features/* — do not fetch from this file.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    VENDOR_LOGIN: "/auth/vendor/login",
    REGISTER: "/auth/register",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION: "/auth/resend-verification",
    GOOGLE: "/auth/google",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    PASSWORD: "/auth/password",
  },
  VENDORS: {
    APPLICATIONS: (siteCode: string) => `/sites/${siteCode}/vendors/applications`,
    DOCUMENTS: (siteCode: string) =>
      `/sites/${siteCode}/vendors/applications/documents`,
  },
  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id: string) => `/products/${id}`,
    CATEGORIES: "/products/categories",
    PUBLIC_LIST: (siteCode: string) => `/sites/${siteCode}/products`,
    PUBLIC_FACETS: (siteCode: string) => `/sites/${siteCode}/products/facets`,
    PUBLIC_DETAIL: (siteCode: string, slug: string) =>
      `/sites/${siteCode}/products/${encodeURIComponent(slug)}`,
  },
  CART: {
    ROOT: "/cart",
    ITEMS: "/cart/items",
    ITEM: (id: string) => `/cart/items/${id}`,
    SYNC: "/cart/sync",
  },
  WISHLIST: {
    ROOT: "/wishlist",
    SYNC: "/wishlist/sync",
    ITEM: (id: string) => `/wishlist/items/${id}`,
  },
  CHECKOUT: {
    ROOT: "/checkout",
    SESSION: "/checkout/session",
    GUEST_SESSION: "/checkout/guest/session",
    GUEST_SEND_OTP: "/checkout/guest/send-otp",
    GUEST_VERIFY_OTP: "/checkout/guest/verify-otp",
    UPLOAD_PRESCRIPTION: "/checkout/prescription",
  },
  PAYMENTS: {
    CREATE_ORDER: "/payments/create-order",
    VERIFY: "/payments/verify",
    STATUS: (orderId: string) => `/payments/status/${orderId}`,
    CONFIRMATION: "/payments/confirmation",
  },
  ORDERS: {
    LIST: "/orders",
    DETAIL: (id: string) => `/orders/${id}`,
  },
  ME: {
    ROOT: "/me",
    AVATAR: "/me/avatar",
    ADDRESSES: "/me/addresses",
    ADDRESS: (id: string) => `/me/addresses/${id}`,
  },
  COMPANY_BASIC_INFO: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/company-basic-info`,
  },
  NAVBAR_SECTIONS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/navbar-sections`,
  },
  SOCIAL_POSTS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/social-posts`,
  },
  FOOTER: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/footer`,
  },
  TOP_ADVERTISEMENT: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/top-advertisement`,
  },
  POPUP_BANNER: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/popup-banner`,
  },
  ABOUT_US_BANNER: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/about-us-banner`,
  },
  CUSTOMER_REVIEWS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/customer-reviews`,
  },
  FAQ: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/faq`,
  },
  INSIGHTS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/insights`,
  },
  HERO_BANNERS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/hero-banners`,
  },
  CATEGORIES: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/categories`,
    PUBLIC_DETAIL: (siteCode: string, categorySlug: string) =>
      `/sites/${siteCode}/categories/${encodeURIComponent(categorySlug)}`,
  },
  DOCTORS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/doctors`,
    APPOINTMENTS: (siteCode: string) =>
      `/sites/${siteCode}/doctor-appointments`,
  },
} as const;
