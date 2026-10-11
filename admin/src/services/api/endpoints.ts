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
  },
  media: {
    uploadImage: "/media/images",
  },
} as const;
