import {
  toTopAdvertisementPayload,
  validateTopAdvertisementForm,
} from "@/schemas/top-advertisement-schema";
import type { TopAdvertisementFormValues } from "@/types/top-advertisement";

const validValues: TopAdvertisementFormValues = {
  announcements: [
    {
      text: "Free shipping",
      url: "/shop",
      active: true,
    },
  ],
  utilityItems: [
    {
      text: "India storefront",
      url: "",
      active: true,
    },
  ],
  benefits: [
    {
      text: "Secure payments",
      url: "",
      active: true,
    },
  ],
};

describe("top advertisement schema", () => {
  it("accepts valid form values and builds a payload", () => {
    const result = validateTopAdvertisementForm(validValues);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(toTopAdvertisementPayload(result.data)).toEqual({
      announcements: [
        { text: "Free shipping", url: "/shop", active: true },
      ],
      utilityItems: [
        { text: "India storefront", url: "", active: true },
      ],
      benefits: [{ text: "Secure payments", url: "", active: true }],
    });
  });

  it("rejects empty announcement text", () => {
    const result = validateTopAdvertisementForm({
      ...validValues,
      announcements: [
        {
          text: "   ",
          url: "",
          active: true,
        },
      ],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.announcements).toMatch(/needs text/i);
  });

  it("rejects empty benefit title", () => {
    const result = validateTopAdvertisementForm({
      ...validValues,
      benefits: [
        {
          text: "   ",
          url: "",
          active: true,
        },
      ],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.benefits).toMatch(/needs a title/i);
  });
});
