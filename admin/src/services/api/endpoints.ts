export const endpoints = {
  auth: {
    adminLogin: "/auth/admin/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  admin: {
    sites: "/admin/sites",
    dashboard: (siteCode: string) => `/admin/sites/${siteCode}/dashboard`,
    companyBasicInfo: (siteCode: string) =>
      `/admin/sites/${siteCode}/company-basic-info`,
    navbarSections: (siteCode: string) =>
      `/admin/sites/${siteCode}/navbar-sections`,
    navbarSection: (siteCode: string, sectionId: string) =>
      `/admin/sites/${siteCode}/navbar-sections/${sectionId}`,
    socialPosts: (siteCode: string) =>
      `/admin/sites/${siteCode}/social-posts`,
    socialPost: (siteCode: string, postId: string) =>
      `/admin/sites/${siteCode}/social-posts/${postId}`,
    gallery: (siteCode: string) => `/admin/sites/${siteCode}/gallery`,
    galleryItem: (siteCode: string, itemId: string) =>
      `/admin/sites/${siteCode}/gallery/${itemId}`,
    customerReviews: (siteCode: string) =>
      `/admin/sites/${siteCode}/customer-reviews`,
    customerReview: (siteCode: string, reviewId: string) =>
      `/admin/sites/${siteCode}/customer-reviews/${reviewId}`,
    footer: (siteCode: string) => `/admin/sites/${siteCode}/footer`,
    topAdvertisement: (siteCode: string) =>
      `/admin/sites/${siteCode}/top-advertisement`,
    aboutUsBanner: (siteCode: string) =>
      `/admin/sites/${siteCode}/about-us-banner`,
    faq: (siteCode: string) => `/admin/sites/${siteCode}/faq`,
    heroBanners: (siteCode: string) =>
      `/admin/sites/${siteCode}/hero-banners`,
    categories: (siteCode: string) =>
      `/admin/sites/${siteCode}/categories`,
    category: (siteCode: string, categoryId: string) =>
      `/admin/sites/${siteCode}/categories/${categoryId}`,
    subcategories: (siteCode: string, categoryId: string) =>
      `/admin/sites/${siteCode}/categories/${categoryId}/subcategories`,
    subcategory: (
      siteCode: string,
      categoryId: string,
      subcategoryId: string,
    ) =>
      `/admin/sites/${siteCode}/categories/${categoryId}/subcategories/${subcategoryId}`,
    subcategoryProducts: (siteCode: string, subcategoryId: string) =>
      `/admin/sites/${siteCode}/subcategories/${subcategoryId}/products`,
    subcategoryProduct: (
      siteCode: string,
      subcategoryId: string,
      productId: string,
    ) =>
      `/admin/sites/${siteCode}/subcategories/${subcategoryId}/products/${productId}`,
  },
  media: {
    uploadImage: "/media/images",
    uploadVideo: "/media/videos",
  },
} as const;
