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
  "manage-footer": endpoints.admin.footer,
  "banner-top-advertisement": endpoints.admin.topAdvertisement,
  "banner-about-us": endpoints.admin.aboutUsBanner,
};

describe("admin modules", () => {
  it("registers the same module set for IN and COM", () => {
    const inIds = getModulesForSite("IN").map((module) => module.id).sort();
    const comIds = getModulesForSite("COM").map((module) => module.id).sort();
    expect(inIds).toEqual(comIds);
  });

  it("resolves nested slugs for both sites", () => {
    expect(findModuleBySlug("IN", ["stock-management"])?.id).toBe("stock-management");
    expect(findModuleBySlug("COM", ["stock-management"])?.id).toBe("stock-management");
    expect(findModuleBySlug("IN", ["company-basic-info"])?.id).toBe("company-info");
    expect(findModuleBySlug("COM", ["company-basic-info"])?.id).toBe("company-info");
    expect(findModuleBySlug("IN", ["manage-navbar"])?.id).toBe("manage-navbar");
    expect(findModuleBySlug("COM", ["manage-navbar"])?.id).toBe("manage-navbar");
    expect(findModuleBySlug("IN", ["manage-footer"])?.id).toBe("manage-footer");
    expect(findModuleBySlug("COM", ["manage-footer"])?.id).toBe("manage-footer");
    expect(findModuleBySlug("COM", ["banners", "about-us"])?.id).toBe("banner-about-us");
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
