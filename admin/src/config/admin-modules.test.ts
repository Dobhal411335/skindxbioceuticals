import { findModuleBySlug, getModulesForSite } from "@/config/admin-modules";
import { endpoints } from "@/services/api/endpoints";

/**
 * Every module marked `live` must have a registered admin API path builder.
 * Add an entry here when promoting a shell module to live.
 */
const LIVE_MODULE_ENDPOINT_BUILDERS: Record<string, (siteCode: string) => string> = {
  "company-info": endpoints.admin.companyBasicInfo,
  "manage-navbar": endpoints.admin.navbarSections,
  "social-media-post": endpoints.admin.socialPosts,
  gallery: endpoints.admin.gallery,
  "customer-review": endpoints.admin.customerReviews,
  "create-coupon-code": endpoints.admin.coupons,
  "manage-footer": endpoints.admin.footer,
  "banner-popup": endpoints.admin.popupBanner,
  "banner-top-advertisement": endpoints.admin.topAdvertisement,
  "banner-about-us": endpoints.admin.aboutUsBanner,
  "banner-promotional": endpoints.admin.promoBanners,
  "website-faq": endpoints.admin.faq,
  "manage-blog": endpoints.admin.blogs,
  "create-webpages": endpoints.admin.webpages,
  "manage-insights": endpoints.admin.insights,
  "banner-hero": endpoints.admin.heroBanners,
  "add-direct-product": endpoints.admin.directProducts,
  "create-category": endpoints.admin.categories,
  "manage-products-category": endpoints.admin.categories,
  "create-doctor-profile": endpoints.admin.doctors,
  "manage-doctor-page": endpoints.admin.doctorPage,
  "order-doctor-contact": endpoints.admin.doctorAppointments,
  "order-online-log": endpoints.admin.ordersOnlineLog,
  "order-cancel": endpoints.admin.ordersCancelled,
  "stock-management": endpoints.admin.stock,
  "update-product-prices": endpoints.admin.productPrices,
  "become-partner": endpoints.admin.vendorApplications,
  "partner-login-details": endpoints.admin.vendorCredentials,
};

describe("admin modules", () => {
  it("registers the same module set for IN and COM", () => {
    const inIds = getModulesForSite("IN").map((module) => module.id).sort();
    const comIds = getModulesForSite("COM").map((module) => module.id).sort();
    expect(inIds).toEqual(comIds);
  });

  it("resolves nested slugs for both sites", () => {
    expect(findModuleBySlug("IN", ["stock-management"])?.id).toBe("stock-management");
    expect(findModuleBySlug("IN", ["stock-management"])?.status).toBe("live");
    expect(findModuleBySlug("COM", ["stock-management"])?.id).toBe("stock-management");
    expect(findModuleBySlug("COM", ["stock-management"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["company-basic-info"])?.id).toBe("company-info");
    expect(findModuleBySlug("COM", ["company-basic-info"])?.id).toBe("company-info");
    expect(findModuleBySlug("IN", ["manage-navbar"])?.id).toBe("manage-navbar");
    expect(findModuleBySlug("COM", ["manage-navbar"])?.id).toBe("manage-navbar");
    expect(findModuleBySlug("IN", ["manage-footer"])?.id).toBe("manage-footer");
    expect(findModuleBySlug("COM", ["manage-footer"])?.id).toBe("manage-footer");
    expect(findModuleBySlug("COM", ["banners", "about-us"])?.id).toBe("banner-about-us");
    expect(findModuleBySlug("IN", ["banners", "hero"])?.id).toBe("banner-hero");
    expect(findModuleBySlug("IN", ["banners", "hero"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["website-faq"])?.id).toBe("website-faq");
    expect(findModuleBySlug("IN", ["website-faq"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["blog"])?.id).toBe("manage-blog");
    expect(findModuleBySlug("IN", ["blog"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["insights"])?.id).toBe("manage-insights");
    expect(findModuleBySlug("IN", ["insights"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["products", "add-direct"])?.id).toBe(
      "add-direct-product",
    );
    expect(findModuleBySlug("IN", ["products", "add-direct"])?.status).toBe("live");
    expect(findModuleBySlug("COM", ["products", "add-direct"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["products", "create-category"])?.id).toBe(
      "create-category",
    );
    expect(findModuleBySlug("IN", ["products", "create-category"])?.status).toBe(
      "live",
    );
    expect(findModuleBySlug("IN", ["products", "manage-category"])?.id).toBe(
      "manage-products-category",
    );
    expect(findModuleBySlug("IN", ["products", "update-prices"])?.id).toBe(
      "update-product-prices",
    );
    expect(findModuleBySlug("IN", ["products", "update-prices"])?.status).toBe(
      "live",
    );
    expect(findModuleBySlug("COM", ["products", "update-prices"])?.status).toBe(
      "live",
    );
    expect(findModuleBySlug("IN", ["marketing", "create-coupon-code"])?.id).toBe(
      "create-coupon-code",
    );
    expect(findModuleBySlug("IN", ["marketing", "create-coupon-code"])?.status).toBe(
      "live",
    );
    expect(findModuleBySlug("IN", ["doctors", "create-profile"])?.id).toBe(
      "create-doctor-profile",
    );
    expect(findModuleBySlug("IN", ["doctors", "create-profile"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["doctors", "manage-page"])?.id).toBe(
      "manage-doctor-page",
    );
    expect(findModuleBySlug("IN", ["doctors", "manage-page"])?.status).toBe("live");
    expect(findModuleBySlug("IN", ["doctors", "view-list"])).toBeUndefined();
  });

  it("maps every live module to a registered admin API endpoint", () => {
    for (const siteCode of ["IN", "COM"] as const) {
      const liveModules = getModulesForSite(siteCode).filter(
        (module) => module.status === "live",
      );
      expect(liveModules.length).toBeGreaterThan(0);

      for (const module of liveModules) {
        const builder = LIVE_MODULE_ENDPOINT_BUILDERS[module.id];
        if (!builder) {
          throw new Error(`Missing API endpoint mapping for live module: ${module.id}`);
        }
        const path = builder(siteCode);
        expect(path.startsWith("/")).toBe(true);
        expect(path).toContain(`/sites/${siteCode}/`);
      }
    }
  });
});
