"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/select-site");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=1600&q=80"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-linear-to-br from-[#0f2a27]/92 via-[#1D3B68]/85 to-[#0b1628]/90" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-white/70">
              SkinDx Bioc
            </p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight">
              Clinical precision for every website you manage.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/75">
            Secure administration for the India ecommerce storefront and the Global corporate
            website — one authenticated workspace, site-scoped permissions.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-background px-6 py-12">
        <LoginForm />
      </main>
    </div>
  );
}
