/**
 * Central API path placeholders for the SkinDX Bioceuticals backend.
 * Implement service callers in features/* — do not fetch from this file.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION: "/auth/resend-verification",
    GOOGLE: "/auth/google",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    PASSWORD: "/auth/password",
  },
  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id: string) => `/products/${id}`,
    CATEGORIES: "/products/categories",
    PUBLIC_DETAIL: (siteCode: string, slug: string) =>
      `/sites/${siteCode}/products/${encodeURIComponent(slug)}`,
  },
  CART: {
    ROOT: "/cart",
    ITEM: (id: string) => `/cart/items/${id}`,
  },
  WISHLIST: {
    ROOT: "/wishlist",
    SYNC: "/wishlist/sync",
    ITEM: (id: string) => `/wishlist/items/${id}`,
  },
  CHECKOUT: {
    ROOT: "/checkout",
    SESSION: "/checkout/session",
  },
  ORDERS: {
    LIST: "/orders",
    DETAIL: (id: string) => `/orders/${id}`,
  },
  ME: {
    ROOT: "/me",
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
  ABOUT_US_BANNER: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/about-us-banner`,
  },
  CUSTOMER_REVIEWS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/customer-reviews`,
  },
  FAQ: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/faq`,
  },
  HERO_BANNERS: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/hero-banners`,
  },
  CATEGORIES: {
    PUBLIC: (siteCode: string) => `/sites/${siteCode}/categories`,
    PUBLIC_DETAIL: (siteCode: string, categorySlug: string) =>
      `/sites/${siteCode}/categories/${encodeURIComponent(categorySlug)}`,
  },
} as const;
