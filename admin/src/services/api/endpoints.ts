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
    popupBanner: (siteCode: string) =>
      `/admin/sites/${siteCode}/popup-banner`,
    aboutUsBanner: (siteCode: string) =>
      `/admin/sites/${siteCode}/about-us-banner`,
    promoBanners: (siteCode: string) =>
      `/admin/sites/${siteCode}/promo-banners`,
    collectionBanners: (siteCode: string) =>
      `/admin/sites/${siteCode}/collection-banners`,
    faq: (siteCode: string) => `/admin/sites/${siteCode}/faq`,
    insights: (siteCode: string) => `/admin/sites/${siteCode}/insights`,
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
    subcategoryById: (siteCode: string, subcategoryId: string) =>
      `/admin/sites/${siteCode}/subcategories/${subcategoryId}`,
    subcategoryProducts: (siteCode: string, subcategoryId: string) =>
      `/admin/sites/${siteCode}/subcategories/${subcategoryId}/products`,
    subcategoryProduct: (
      siteCode: string,
      subcategoryId: string,
      productId: string,
    ) =>
      `/admin/sites/${siteCode}/subcategories/${subcategoryId}/products/${productId}`,
    directProducts: (siteCode: string) =>
      `/admin/sites/${siteCode}/products/direct`,
    directProduct: (siteCode: string, productId: string) =>
      `/admin/sites/${siteCode}/products/direct/${productId}`,
    products: (siteCode: string) => `/admin/sites/${siteCode}/products`,
    product: (siteCode: string, productId: string) =>
      `/admin/sites/${siteCode}/products/${productId}`,
    productEdit: (siteCode: string, productId: string) =>
      `/admin/sites/${siteCode}/products/${productId}/edit`,
    productCatalogColors: (siteCode: string) =>
      `/admin/sites/${siteCode}/products/catalog-colors`,
    productCatalogTags: (siteCode: string) =>
      `/admin/sites/${siteCode}/products/catalog-tags`,
    productSection: (
      siteCode: string,
      productId: string,
      section: string,
    ) => `/admin/sites/${siteCode}/products/${productId}/sections/${section}`,
    productEditorialReview: (
      siteCode: string,
      productId: string,
      reviewId: string,
    ) =>
      `/admin/sites/${siteCode}/products/${productId}/sections/reviews/${reviewId}`,
    coupons: (siteCode: string) => `/admin/sites/${siteCode}/coupons`,
    coupon: (siteCode: string, couponId: string) =>
      `/admin/sites/${siteCode}/coupons/${couponId}`,
    blogs: (siteCode: string) => `/admin/sites/${siteCode}/blogs`,
    blog: (siteCode: string, blogId: string) =>
      `/admin/sites/${siteCode}/blogs/${blogId}`,
    doctors: (siteCode: string) => `/admin/sites/${siteCode}/doctors`,
    doctor: (siteCode: string, doctorId: string) =>
      `/admin/sites/${siteCode}/doctors/${doctorId}`,
    doctorPage: (siteCode: string) => `/admin/sites/${siteCode}/doctor-page`,
    doctorAppointments: (siteCode: string) =>
      `/admin/sites/${siteCode}/doctor-appointments`,
    doctorAppointment: (siteCode: string, appointmentId: string) =>
      `/admin/sites/${siteCode}/doctor-appointments/${appointmentId}`,
    vendorApplications: (siteCode: string) =>
      `/admin/sites/${siteCode}/vendors/applications`,
    vendorApplication: (siteCode: string, applicationId: string) =>
      `/admin/sites/${siteCode}/vendors/applications/${applicationId}`,
    vendorApplicationStatus: (siteCode: string, applicationId: string) =>
      `/admin/sites/${siteCode}/vendors/applications/${applicationId}/status`,
    vendorCredentials: (siteCode: string) =>
      `/admin/sites/${siteCode}/vendors/credentials`,
    vendorCredentialActive: (siteCode: string, applicationId: string) =>
      `/admin/sites/${siteCode}/vendors/credentials/${applicationId}/active`,
    vendorCredentialRegenerate: (siteCode: string, applicationId: string) =>
      `/admin/sites/${siteCode}/vendors/credentials/${applicationId}/regenerate-password`,
    ordersOnlineLog: (siteCode: string) =>
      `/admin/sites/${siteCode}/orders/online-log`,
    ordersCancelled: (siteCode: string) =>
      `/admin/sites/${siteCode}/orders/cancelled`,
    stock: (siteCode: string) => `/admin/sites/${siteCode}/stock`,
    stockVariant: (siteCode: string, variantId: string) =>
      `/admin/sites/${siteCode}/stock/variants/${variantId}`,
    productPrices: (siteCode: string) =>
      `/admin/sites/${siteCode}/product-prices`,
    productPricesApply: (siteCode: string) =>
      `/admin/sites/${siteCode}/product-prices/apply`,
  },
  media: {
    uploadImage: "/media/images",
    uploadVideo: "/media/videos",
    bulkDelete: "/media/bulk-delete",
  },
} as const;
