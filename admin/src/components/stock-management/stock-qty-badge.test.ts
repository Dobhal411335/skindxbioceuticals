import { stockQtyBadgeClass, variantQtyLabel } from "./stock-qty-badge";

describe("stockQtyBadgeClass", () => {
  it("maps qty thresholds to green / yellow / red", () => {
    expect(stockQtyBadgeClass(11)).toContain("emerald");
    expect(stockQtyBadgeClass(10)).toContain("amber");
    expect(stockQtyBadgeClass(6)).toContain("amber");
    expect(stockQtyBadgeClass(5)).toContain("red");
    expect(stockQtyBadgeClass(0)).toContain("red");
  });
});

describe("variantQtyLabel", () => {
  it("prefers size/color over name", () => {
    expect(variantQtyLabel("M", "Blue", "Offer")).toBe("M / Blue");
    expect(variantQtyLabel("L", null, "Offer")).toBe("L");
    expect(variantQtyLabel(null, null, "Default")).toBe("Default");
  });
});
