import { z } from "zod";

export const addressFormSchema = z.object({
  label: z.string().trim().max(100).optional().or(z.literal("")),
  line1: z.string().trim().min(1, "Address line 1 is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  country: z.string().trim().length(2, "Use a 2-letter country code").default("IN"),
  isDefault: z.boolean().optional().default(false),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
