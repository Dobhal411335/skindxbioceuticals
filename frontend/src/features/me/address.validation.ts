import { z } from "zod";

import { DEFAULT_COUNTRY_CODE, INDIA_STATES } from "@/utils/states";

export const addressFormSchema = z.object({
  label: z.string().trim().max(100).optional().or(z.literal("")),
  line1: z.string().trim().min(1, "Address line 1 is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.enum(INDIA_STATES, { message: "Select a state" }),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  /** ISO country code sent to the API; UI always shows India. */
  country: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code")
    .default(DEFAULT_COUNTRY_CODE),
  isDefault: z.boolean().optional().default(false),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
