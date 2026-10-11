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
  },
  CART: {
    ROOT: "/cart",
    ITEM: (id: string) => `/cart/items/${id}`,
  },
  WISHLIST: {
    ROOT: "/wishlist",
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
} as const;
