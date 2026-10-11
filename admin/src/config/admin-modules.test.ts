import { findModuleBySlug, getModulesForSite } from "@/config/admin-modules";

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
    expect(findModuleBySlug("COM", ["banners", "philosophy"])?.id).toBe("banner-philosophy");
  });
});
