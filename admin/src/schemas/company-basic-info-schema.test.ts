import {
  toCompanyBasicInfoPayload,
  validateCompanyBasicInfoForm,
} from "@/schemas/company-basic-info-schema";
import { createEmptyFormValues } from "@/components/company-basic-info/company-form-utils";

describe("companyBasicInfoFormSchema", () => {
  it("requires company name and domain", () => {
    const result = validateCompanyBasicInfoForm(createEmptyFormValues());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.companyName).toBeTruthy();
      expect(result.errors.companyDomainName).toBeTruthy();
    }
  });

  it("rejects short contact numbers", () => {
    const values = {
      ...createEmptyFormValues(),
      companyName: "Acme",
      companyDomainName: "acme.com",
      contactNumbers: ["123"],
    };
    const result = validateCompanyBasicInfoForm(values);
    expect(result.success).toBe(false);
  });

  it("builds a cleaned payload", () => {
    const payload = toCompanyBasicInfoPayload({
      ...createEmptyFormValues(),
      companyName: "  Acme  ",
      companyDomainName: "acme.com",
      contactNumbers: ["9876543210", ""],
      emails: [" hello@acme.com ", ""],
      keywords: ["one", ""],
    });

    expect(payload.companyName).toBe("Acme");
    expect(payload.contactNumbers).toEqual(["9876543210"]);
    expect(payload.emails).toEqual(["hello@acme.com"]);
    expect(payload.keywords).toEqual(["one"]);
  });
});
