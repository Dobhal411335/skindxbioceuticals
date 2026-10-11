import {
  getActiveAncestorIds,
  getBreadcrumbs,
  getClickableNavItems,
  getSidebarConfig,
} from "@/config/sidebar";
import { findModuleBySlug } from "@/config/admin-modules";

function flattenIds(siteCode: "IN" | "COM"): string[] {
  const ids: string[] = [];

  function walk(items: ReturnType<typeof getSidebarConfig>[number]["items"]) {
    for (const item of items) {
      ids.push(item.id);
      if (item.children?.length) walk(item.children);
    }
  }

  for (const section of getSidebarConfig(siteCode)) {
    walk(section.items);
  }

  return ids;
}

describe("getSidebarConfig", () => {
  it("uses the same navigation ids for IN and COM", () => {
    expect(flattenIds("IN")).toEqual(flattenIds("COM"));
  });

  it("puts Dashboard Home with company children first, keeps Website switcher, omits Profile/Logout", () => {
    const shared = getSidebarConfig("IN")[0]!;
    const dashboard = shared.items.find((item) => item.id === "dashboard");
    const switcher = shared.items.find((item) => item.id === "switch-site");
    const ids = flattenIds("IN");

    expect(shared.items[0]?.id).toBe("dashboard");
    expect(dashboard?.label).toBe("Dashboard Home");
    expect(dashboard?.children?.map((child) => child.id)).toEqual([
      "company-info",
      "gallery",
      "manage-navbar",
      "social-media-post",
      "create-webpages",
      "manage-footer",
    ]);
    expect(switcher?.status).toBe("active");
    expect(ids).not.toEqual(expect.arrayContaining(["profile", "logout"]));
  });

  it("includes the unified screenshot modules for both sites", () => {
    const ids = flattenIds("COM");

    expect(ids).toEqual(
      expect.arrayContaining([
        "manage-banners",
        "banner-top-advertisement",
        "banner-about-us",
        "sub-dashboard",
        "stock-management",
        "vendor-partner",
        "add-direct-product",
        "create-product",
        "manage-products-category",
        "create-discount-coupon",
        "create-reviews",
        "create-news-promotion",
        "create-doctor-profile",
        "order-cod-log",
      ]),
    );
  });

  it("makes listed modules clickable with site-scoped hrefs that resolve in the registry", () => {
    const inItems = getClickableNavItems("IN");
    const comItems = getClickableNavItems("COM");

    expect(inItems.find((item) => item.id === "company-info")?.href).toBe(
      "/admin/in/company-basic-info",
    );
    expect(comItems.find((item) => item.id === "company-info")?.href).toBe(
      "/admin/com/company-basic-info",
    );
    expect(inItems.find((item) => item.id === "stock-management")?.href).toBe(
      "/admin/in/stock-management",
    );
    expect(comItems.find((item) => item.id === "stock-management")?.href).toBe(
      "/admin/com/stock-management",
    );

    for (const item of [...inItems, ...comItems]) {
      expect(item.href).toBeTruthy();
      if (item.href?.startsWith("/admin/")) {
        const parts = item.href.replace(/^\/admin\/(in|com)\//, "").split("/");
        const site = item.href.includes("/admin/in/") ? "IN" : "COM";
        if (item.id !== "dashboard" && item.id !== "switch-site") {
          expect(findModuleBySlug(site, parts)).toBeTruthy();
        }
      }
    }
  });

  it("auto-expands ancestors and builds breadcrumbs for nested routes on both sites", () => {
    expect(getActiveAncestorIds("IN", "/admin/in/banners/top-advertisement")).toContain(
      "manage-banners",
    );
    expect(getActiveAncestorIds("COM", "/admin/com/company-basic-info")).toContain("dashboard");

    const crumbs = getBreadcrumbs("IN", "/admin/in/company-basic-info");
    expect(crumbs.map((crumb) => crumb.label)).toEqual(
      expect.arrayContaining(["Sites", "SkinDx.in", "Company Basic Info"]),
    );
  });
});
