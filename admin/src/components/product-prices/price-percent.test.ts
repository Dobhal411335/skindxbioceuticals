/**
 * Mirrors backend applyPercentToAmount rounding for client-side sanity checks.
 * Server remains the source of truth for applied prices.
 */
function applyPercentToAmount(amount: number, percent: number): number {
  const next = Math.round(amount * (1 + percent / 100) * 100) / 100;
  return next < 0 ? 0 : next;
}

function parsePercentInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value === 0) return null;
  if (value <= -100 || value > 1000) return null;
  return value;
}

describe("product price percent helpers", () => {
  it("parses non-zero percent within bounds", () => {
    expect(parsePercentInput("10")).toBe(10);
    expect(parsePercentInput("-5.5")).toBe(-5.5);
    expect(parsePercentInput("0")).toBeNull();
    expect(parsePercentInput("-100")).toBeNull();
    expect(parsePercentInput("")).toBeNull();
  });

  it("rounds money to two decimals", () => {
    expect(applyPercentToAmount(100, 10)).toBe(110);
    expect(applyPercentToAmount(100, -10)).toBe(90);
    expect(applyPercentToAmount(33.33, 10)).toBe(36.66);
  });
});
