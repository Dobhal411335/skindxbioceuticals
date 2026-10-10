import { getSidebarConfig } from "@/config/sidebar";

describe("getSidebarConfig", () => {
  it("marks dashboard and switcher as active for IN", () => {
    const sections = getSidebarConfig("IN");
    const shared = sections[0]!;
    const dashboard = shared.items.find((item) => item.id === "dashboard");
    const switcher = shared.items.find((item) => item.id === "switch-site");

    expect(dashboard?.status).toBe("active");
    expect(dashboard?.href).toBe("/admin/in/dashboard");
    expect(switcher?.status).toBe("active");
  });

  it("includes planned catalog items for IN and enquiry items for COM", () => {
    const inConfig = getSidebarConfig("IN");
    const comConfig = getSidebarConfig("COM");

    const flat = (sections: ReturnType<typeof getSidebarConfig>) =>
      sections.flatMap((section) => section.items);

    expect(flat(inConfig).some((item) => item.id === "catalog-root")).toBe(true);
    expect(flat(comConfig).some((item) => item.id === "enquiries-root")).toBe(true);
    expect(flat(inConfig).find((item) => item.id === "catalog-root")?.status).toBe("planned");
  });
});
