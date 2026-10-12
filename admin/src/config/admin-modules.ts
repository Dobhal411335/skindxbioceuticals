import type { SiteCode } from "@/types/auth";

export type AdminModuleStatus = "live" | "shell";

export interface AdminModuleDefinition {
  id: string;
  slug: string;
  label: string;
  description: string;
  sites: readonly SiteCode[];
  status: AdminModuleStatus;
}

function shell(
  id: string,
  slug: string,
  label: string,
  description: string,
  sites: readonly SiteCode[],
): AdminModuleDefinition {
  return { id, slug, label, description, sites, status: "shell" };
}

function live(
  id: string,
  slug: string,
  label: string,
  description: string,
  sites: readonly SiteCode[],
): AdminModuleDefinition {
  return { id, slug, label, description, sites, status: "live" };
}

const BANNER_MODULES: AdminModuleDefinition[] = [
  live(
    "banner-top-advertisement",
    "banners/top-advertisement",
    "Top Advertisement Banner",
    "Manage announcement bar, header utility strip, and feature benefits for this website.",
    ["IN", "COM"],
  ),
  live(
    "banner-about-us",
    "banners/about-us",
    "About Us Banner",
    "Manage the home About Us promo header, about cards carousel, and dual bottom block for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-promotional",
    "banners/promotional",
    "Promotional Banner",
    "Manage promotional banners for this website.",
    ["IN", "COM"],
  ),
  live(
    "banner-hero",
    "banners/hero",
    "Hero Banner",
    "Manage home hero carousel slides (image-only full-width, split dual, and associate-brand grid) for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-featured-offered",
    "banners/featured-offered",
    "Featured Offered Banner",
    "Manage featured offer banners for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-offer-details",
    "banners/offer-details",
    "Offer Details",
    "Manage offer detail content associated with promotional banners.",
    ["IN", "COM"],
  ),
  shell(
    "banner-featured-product",
    "banners/featured-product",
    "Manage Featured Product",
    "Feature products in banner placements for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-category-advertisement",
    "banners/category-advertisement",
    "Category Advertisement",
    "Manage category advertisement banners for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-popup",
    "banners/popup",
    "PopUp Banner",
    "Manage popup banners for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-consultancy",
    "banners/consultancy",
    "Consultancy Banner",
    "Manage consultancy banners for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-section-1",
    "banners/section-1",
    "Banner Section 1st",
    "Manage the first banner section for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-section-2",
    "banners/section-2",
    "Banner Section 2nd",
    "Manage the second banner section for this website.",
    ["IN", "COM"],
  ),
  shell(
    "banner-section-3",
    "banners/section-3",
    "Banner Section 3rd",
    "Manage the third banner section for this website.",
    ["IN", "COM"],
  ),
];

/**
 * Site-scoped admin modules. Shell modules render a reusable placeholder page
 * without fabricated CRUD or fake data. Every sidebar leaf href maps here.
 */
export const ADMIN_MODULES: readonly AdminModuleDefinition[] = [
  shell(
    "profile",
    "profile",
    "Profile / account",
    "View your administrator profile and account details for this workspace.",
    ["IN", "COM"],
  ),

  // .in — operations & people
  shell(
    "stock-management",
    "stock-management",
    "Stock Management",
    "Review and manage inventory stock for the .in ecommerce storefront.",
    ["IN", "COM"],
  ),
  live(
    "website-faq",
    "website-faq",
    "Website FAQ Section",
    "Manage FAQ sections and questions shown on the selected website.",
    ["IN", "COM"],
  ),
  shell(
    "create-person-profile",
    "create-person-profile",
    "Create Person Profile",
    "Create and maintain person profiles used by ecommerce operations.",
    ["IN", "COM"],
  ),
  shell(
    "become-partner",
    "vendor/become-partner",
    "Become Partner",
    "Manage partner onboarding content and applications.",
    ["IN", "COM"],
  ),
  shell(
    "partner-login-details",
    "vendor/partner-login-details",
    "Partner Login Details",
    "Review partner login and access details for vendor operations.",
    ["IN", "COM"],
  ),

  // .in — product management
  shell(
    "add-direct-product",
    "products/add-direct",
    "Add Direct Product",
    "Add a product directly to the .in catalog.",
    ["IN", "COM"],
  ),
  shell(
    "create-tax-provision",
    "products/create-tax-provision",
    "Create Tax Provision",
    "Configure tax provisions used when creating products.",
    ["IN", "COM"],
  ),
  shell(
    "create-menu",
    "products/create-menu",
    "Create Menu",
    "Create product menu groupings for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "create-sub-menu",
    "products/create-sub-menu",
    "Create Sub Menu",
    "Create product sub-menu groupings for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "manage-products-category",
    "products/manage-category",
    "Manage Products & Category",
    "Manage products and categories for the .in ecommerce catalog.",
    ["IN", "COM"],
  ),
  shell(
    "create-combo-product",
    "products/create-combo",
    "Create Combo Product",
    "Create combo product offerings for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "view-all-products",
    "products/view-all",
    "View All Products",
    "Browse all products in the .in catalog.",
    ["IN", "COM"],
  ),
  shell(
    "create-price-list-increase",
    "products/price-list-increase",
    "Create Price List Increase",
    "Plan and apply price list increases for the .in catalog.",
    ["IN", "COM"],
  ),

  // .in — marketing
  shell(
    "create-discount-coupon",
    "marketing/create-discount-coupon",
    "Create Discount Coupon",
    "Create discount coupons for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "manage-banners-hub",
    "manage-banners",
    "Manage Banners",
    "Overview of banner modules available for this website.",
    ["IN", "COM"],
  ),
  ...BANNER_MODULES,

  // .in — reviews, news, doctors
  shell(
    "create-reviews",
    "reviews/create",
    "Create Reviews",
    "Create review records pending moderation for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "approve-reject-reviews",
    "reviews/approve-reject",
    "Approve/Reject Section",
    "Approve or reject customer reviews for the .in storefront.",
    ["IN", "COM"],
  ),
  live(
    "customer-review",
    "reviews/customer",
    "Customer Review",
    "Manage curated customer testimonials shown on the storefront home page.",
    ["IN", "COM"],
  ),
  shell(
    "create-news-promotion",
    "news/create",
    "Create News or Promotion",
    "Publish news notices and promotions for the .in website.",
    ["IN", "COM"],
  ),
  shell(
    "create-doctor-profile",
    "doctors/create-profile",
    "Create Profile",
    "Create a doctor profile for the .in website.",
    ["IN", "COM"],
  ),
  shell(
    "view-doctor-profiles",
    "doctors/view-list",
    "View Profile List",
    "Browse doctor profiles managed for the .in website.",
    ["IN", "COM"],
  ),

  // .in — orders & reports
  shell(
    "order-enquiry",
    "orders/enquiry",
    "Enquiry Order",
    "Review enquiry-related order records for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "order-cod-log",
    "orders/cod-log",
    "COD Order Log",
    "Cash-on-delivery order log for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "order-online-log",
    "orders/online-log",
    "Online Order Log",
    "Online payment order log for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "order-vendor",
    "orders/vendor",
    "Vendor Order",
    "Vendor order records for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "order-cancel",
    "orders/cancel",
    "Cancel Order",
    "Cancelled order records for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "order-doctor-contact",
    "orders/doctor-contact-request",
    "Doctor's Profile Contact Request",
    "Contact requests associated with doctor profiles.",
    ["IN", "COM"],
  ),

  // Retained modern .in modules
  shell(
    "payment-records",
    "payments",
    "Payment records",
    "Razorpay payment records for the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "payment-failures",
    "payments/failures",
    "Payment failures",
    "Failed or incomplete payment attempts.",
    ["IN", "COM"],
  ),
  shell(
    "reconciliation",
    "payments/reconciliation",
    "Reconciliation",
    "Payment reconciliation workspace for .in.",
    ["IN", "COM"],
  ),
  shell(
    "customer-list",
    "customers",
    "Customer list",
    "Customer accounts associated with the .in storefront.",
    ["IN", "COM"],
  ),
  shell(
    "customer-details",
    "customers/details",
    "Customer details",
    "Customer profile and order history detail views.",
    ["IN", "COM"],
  ),
  shell(
    "shipping",
    "shipping",
    "Shipping",
    "Shipping configuration and fulfilment settings for .in.",
    ["IN", "COM"],
  ),
  shell(
    "media-library",
    "media",
    "Media Library",
    "Cloudinary-backed media library for this website.",
    ["IN", "COM"],
  ),

  // company & content
  live(
    "company-info",
    "company-basic-info",
    "Company Basic Info",
    "Company profile and basic information for the selected website.",
    ["IN", "COM"],
  ),
  live(
    "gallery",
    "gallery",
    "Gallery Section",
    "Site-scoped gallery images and short videos for the storefront lookbook.",
    ["IN", "COM"],
  ),
  live(
    "manage-navbar",
    "manage-navbar",
    "Manage Navbar",
    "Primary navigation items for the selected website.",
    ["IN", "COM"],
  ),
  live(
    "social-media-post",
    "social-media-post",
    "Social Media Post",
    "Instagram and Facebook posts managed per website.",
    ["IN", "COM"],
  ),
  shell(
    "create-webpages",
    "create-webpages",
    "Create Webpages",
    "Create new content pages for the .com website.",
    ["IN", "COM"],
  ),
  live(
    "manage-footer",
    "manage-footer",
    "Manage Footer",
    "Footer columns, brand copy, logo, and social links for the selected website.",
    ["IN", "COM"],
  ),
  shell(
    "product-information",
    "product-information",
    "Product Information",
    "Maintain corporate product information for the .com website.",
    ["IN", "COM"],
  ),
  shell(
    "categories-com",
    "categories",
    "Categories",
    "Organize product information categories for the .com website.",
    ["IN", "COM"],
  ),
  shell(
    "faqs-com",
    "faqs",
    "FAQs",
    "Frequently asked questions for the .com website.",
    ["IN", "COM"],
  ),
  shell(
    "blog-resources",
    "blog-resources",
    "Blog / Resources",
    "Educational blog posts and resources for the .com website.",
    ["IN", "COM"],
  ),
  shell(
    "seo",
    "seo-settings",
    "SEO Settings",
    "SEO metadata and indexing settings for the .com website.",
    ["IN", "COM"],
  ),

  // .com — enquiries
  shell(
    "enquiry-management",
    "enquiries",
    "Enquiry Management",
    "Manage enquiries submitted through the .com website.",
    ["IN", "COM"],
  ),
  shell(
    "new-enquiries",
    "enquiries/new",
    "New Enquiries",
    "Newly received enquiries awaiting triage.",
    ["IN", "COM"],
  ),
  shell(
    "in-progress-enquiries",
    "enquiries/in-progress",
    "In-Progress Enquiries",
    "Enquiries currently being handled.",
    ["IN", "COM"],
  ),
  shell(
    "resolved-enquiries",
    "enquiries/resolved",
    "Resolved Enquiries",
    "Enquiries that have been resolved.",
    ["IN", "COM"],
  ),

  // Administration
  shell(
    "site-settings",
    "site-settings",
    "Site Settings",
    "General site configuration for the selected website.",
    ["IN", "COM"],
  ),
  shell(
    "admin-users",
    "admin-users",
    "Admin Users & Permissions",
    "Manage administrator accounts, roles, and site permissions.",
    ["IN", "COM"],
  ),
  shell(
    "audit-logs",
    "audit-logs",
    "Audit Logs",
    "Review audited administrative actions for the selected website context.",
    ["IN", "COM"],
  ),
];

export function moduleHref(siteCode: SiteCode, slug: string): string {
  return `/admin/${siteCode.toLowerCase()}/${slug}`;
}

export function findModuleBySlug(
  siteCode: SiteCode,
  slugParts: string[],
): AdminModuleDefinition | undefined {
  const slug = slugParts.join("/");
  return ADMIN_MODULES.find(
    (module) => module.slug === slug && module.sites.includes(siteCode),
  );
}

export function getModulesForSite(siteCode: SiteCode): AdminModuleDefinition[] {
  return ADMIN_MODULES.filter((module) => module.sites.includes(siteCode));
}
