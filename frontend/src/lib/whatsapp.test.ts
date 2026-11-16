import {
  buildProductEnquiryMessage,
  buildProductWhatsAppUrl,
  digitsOnly,
  toWhatsAppChatDigits,
} from "@/lib/whatsapp";

describe("whatsapp helpers", () => {
  it("strips non-digits", () => {
    expect(digitsOnly("+91 98765-43210")).toBe("919876543210");
  });

  it("prepends 91 for 10-digit admin WhatsApp numbers", () => {
    expect(toWhatsAppChatDigits("9876543210")).toBe("919876543210");
    expect(toWhatsAppChatDigits("", "9876543210")).toBe("919876543210");
    expect(toWhatsAppChatDigits("919876543210")).toBe("919876543210");
  });

  it("builds an enquiry message with greeting, name, and link", () => {
    const message = buildProductEnquiryMessage({
      productName: "Vitamin C Serum",
      productUrl: "https://example.com/products/vitamin-c-serum",
    });
    expect(message).toContain("Hello!");
    expect(message).toContain("Vitamin C Serum");
    expect(message).toContain("https://example.com/products/vitamin-c-serum");
    expect(message.toLowerCase()).toContain("enquire");
  });

  it("builds a wa.me URL or returns null when no number is configured", () => {
    expect(
      buildProductWhatsAppUrl({
        whatsappNumber: "",
        fallbackPhone: "",
        productName: "Serum",
        productSlug: "serum",
      }),
    ).toBeNull();

    const url = buildProductWhatsAppUrl({
      whatsappNumber: "9876543210",
      productName: "Serum",
      productSlug: "serum",
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(decodeURIComponent(url!)).toContain("Serum");
  });
});
