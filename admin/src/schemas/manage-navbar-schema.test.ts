import {
  toNavbarSectionPayload,
  validateNavbarSectionForm,
} from "@/schemas/manage-navbar-schema";
import { createEmptyFormValues } from "@/components/manage-navbar/manage-navbar-form-utils";

describe("manage-navbar-schema", () => {
  it("requires a section title", () => {
    const result = validateNavbarSectionForm(createEmptyFormValues());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.title).toMatch(/required/i);
    }
  });

  it("builds a payload with trimmed values and filtered empty sub-links", () => {
    const values = createEmptyFormValues();
    values.title = "  Shop  ";
    values.url = "/shop";
    values.order = "2";
    values.subSections = [
      {
        title: "Serums",
        url: "/shop/serums",
        description: "  Daily serums  ",
        order: "",
        active: true,
      },
      {
        title: "   ",
        url: "/ignored",
        description: "",
        order: "9",
        active: true,
      },
    ];

    const payload = toNavbarSectionPayload(values, 5);
    expect(payload).toEqual({
      title: "Shop",
      url: "/shop",
      menuHeading: "",
      menuDescription: "",
      active: true,
      order: 2,
      subSections: [
        {
          title: "Serums",
          url: "/shop/serums",
          description: "Daily serums",
          active: true,
          order: 1,
        },
      ],
    });
  });
});
