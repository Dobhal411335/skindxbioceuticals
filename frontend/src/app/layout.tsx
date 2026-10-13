import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Outfit,
} from "next/font/google";

import { buildCompanyMetadata } from "@/features/company-basic-info/build-company-metadata";
import { getCompanyBasicInfo } from "@/features/company-basic-info/company-basic-info.service";

import { Providers } from "./providers";

import "./globals.css";

/** Soft geometric sans — modern beauty / wellness UI. */
const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

/** Clean mono for SKUs / product codes. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/** Elegant editorial serif for product & section headlines. */
const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanyBasicInfo();
  return buildCompanyMetadata(company);
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${outfit.variable} ${plexMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
