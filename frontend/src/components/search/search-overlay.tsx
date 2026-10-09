"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { useSearchUi } from "@/components/search/search-ui-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchOverlay() {
  const { isOpen, closeSearch } = useSearchUi();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeSearch]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background/80 backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="Dismiss search"
        onClick={closeSearch}
      />
      <div className="animate-in slide-in-from-top-2 border-b border-foreground bg-background duration-300">
        <form
          className="container-page flex items-center gap-3 py-5"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const query = String(form.get("q") ?? "").trim();
            closeSearch();
            router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
          }}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            type="search"
            name="q"
            placeholder="Search"
            aria-label="Search products and pages"
            className="h-12 flex-1 border-0 bg-transparent px-0 text-lg shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close search"
            onClick={closeSearch}
          >
            <X className="size-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
