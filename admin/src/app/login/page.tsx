"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { motion, useReducedMotion } from "framer-motion";

import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-login-serif",
});

const rise = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/select-site");
    }
  }, [isAuthenticated, isLoading, router]);

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      className={cn(
        instrumentSerif.variable,
        "flex min-h-screen items-center justify-center bg-[#F4F1EA] px-4 py-6 sm:px-6 lg:px-8",
      )}
    >
      <div className="grid w-full max-w-6xl items-stretch gap-5 lg:grid-cols-2 lg:gap-8">
        <motion.aside
          className="relative hidden min-h-[560px] overflow-hidden rounded-[28px] bg-[#14181c] px-10 py-12 text-white shadow-[0_24px_60px_rgb(20_35_45_/12%)] lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-14"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={rise}
          transition={{ ...transition, delay: reduceMotion ? 0 : 0.05 }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(40_127_123_/22%),transparent_55%)]" />
          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-medium tracking-[0.22em] text-white/55 uppercase">
              SkinDx Bioceutical Admin
            </p>
            <h1
              className="mt-8 text-[2.75rem] leading-[1.15] tracking-tight text-white xl:text-[3.25rem]"
              style={{ fontFamily: "var(--font-login-serif), ui-serif, Georgia, serif" }}
            >
              Clinical precision for every{" "}
              <em className="text-primary" style={{ fontStyle: "italic" }}>
                website
              </em>{" "}
              you manage.
            </h1>
          </div>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/70">
              Manage the SkinDx.in ecommerce storefront and the SkinDx.com corporate website from one
              calm, secure workspace.
            </p>

        </motion.aside>

        <motion.main
          className="flex items-center justify-center"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={rise}
          transition={{ ...transition, delay: reduceMotion ? 0 : 0.18 }}
        >
          <div className="w-full max-w-[420px]">
            <div className="mb-6 lg:hidden">
              <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
                SkinDx Bioc
              </p>
              <h1
                className="mt-2 text-3xl tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-login-serif), ui-serif, Georgia, serif" }}
              >
                Clinical precision for every website you manage.
              </h1>
            </div>
            <LoginForm serifClassName={instrumentSerif.className} />
          </div>
        </motion.main>
      </div>
    </div>
  );
}
