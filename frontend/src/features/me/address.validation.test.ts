import { addressFormSchema } from "@/features/me/address.validation";

describe("addressFormSchema", () => {
  it("accepts a valid address", () => {
    const parsed = addressFormSchema.safeParse({
      label: "Home",
      line1: "12 MG Road",
      line2: "",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "IN",
      isDefault: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown states", () => {
    const parsed = addressFormSchema.safeParse({
      line1: "12 MG Road",
      city: "Bengaluru",
      state: "KA",
      postalCode: "560001",
      country: "IN",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const parsed = addressFormSchema.safeParse({
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
    });
    expect(parsed.success).toBe(false);
  });
});
