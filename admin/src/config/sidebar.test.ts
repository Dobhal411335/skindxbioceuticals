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
        "banner-hero",
        "sub-dashboard",
        "stock-management",
        "website-faq",
        "manage-blog",
        "manage-insights",
        "vendor-partner",
        "add-direct-product",
        "create-product",
        "create-category",
        "manage-products-category",
        "create-coupon-code",
        "update-product-prices",
        "customer-review",
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
    expect(inItems.find((item) => item.id === "stock-management")?.status).toBe(
      "active",
    );
    expect(comItems.find((item) => item.id === "stock-management")?.href).toBe(
      "/admin/com/stock-management",
    );
    expect(comItems.find((item) => item.id === "stock-management")?.status).toBe(
      "active",
    );
    expect(inItems.find((item) => item.id === "customer-review")?.href).toBe(
      "/admin/in/reviews/customer",
    );
    expect(inItems.find((item) => item.id === "website-faq")?.href).toBe(
      "/admin/in/website-faq",
    );
    expect(inItems.find((item) => item.id === "website-faq")?.status).toBe("active");
    expect(inItems.find((item) => item.id === "manage-blog")?.href).toBe(
      "/admin/in/blog",
    );
    expect(inItems.find((item) => item.id === "manage-blog")?.status).toBe("active");
    expect(inItems.find((item) => item.id === "manage-insights")?.href).toBe(
      "/admin/in/insights",
    );
    expect(inItems.find((item) => item.id === "manage-insights")?.status).toBe(
      "active",
    );
    expect(inItems.find((item) => item.id === "add-direct-product")?.href).toBe(
      "/admin/in/products/add-direct",
    );
    expect(inItems.find((item) => item.id === "add-direct-product")?.status).toBe(
      "active",
    );
    expect(comItems.find((item) => item.id === "add-direct-product")?.status).toBe(
      "active",
    );
    expect(inItems.find((item) => item.id === "create-category")?.href).toBe(
      "/admin/in/products/create-category",
    );
    expect(inItems.find((item) => item.id === "create-category")?.status).toBe("active");
    expect(inItems.find((item) => item.id === "manage-products-category")?.status).toBe(
      "active",
    );
    expect(inItems.find((item) => item.id === "update-product-prices")?.href).toBe(
      "/admin/in/products/update-prices",
    );
    expect(inItems.find((item) => item.id === "update-product-prices")?.status).toBe(
      "active",
    );
    expect(comItems.find((item) => item.id === "update-product-prices")?.href).toBe(
      "/admin/com/products/update-prices",
    );
    expect(inItems.find((item) => item.id === "create-coupon-code")?.href).toBe(
      "/admin/in/marketing/create-coupon-code",
    );
    expect(inItems.find((item) => item.id === "create-coupon-code")?.status).toBe(
      "active",
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
