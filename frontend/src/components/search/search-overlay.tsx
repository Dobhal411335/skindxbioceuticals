"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { useSearchUi } from "@/components/search/search-ui-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "https://placehold.co/96x96/png?text=SkinDx";
const SKELETON_COUNT = 5;

function SearchResultSkeleton() {
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index} className="flex items-center gap-4 px-1 py-3">
          <Skeleton className="size-14 shrink-0 rounded-md sm:size-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SearchOverlay() {
  const {
    isOpen,
    closeSearch,
    query,
    setQuery,
    results,
    isSearching,
    hasCompletedSearch,
  } = useSearchUi();
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

  const trimmedQuery = query.trim();
  const showSkeleton = Boolean(trimmedQuery) && isSearching;
  const showNoResults =
    Boolean(trimmedQuery) && hasCompletedSearch && !isSearching && results.length === 0;
  const showResults = results.length > 0 && !isSearching;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background/70 backdrop-blur-md",
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
            const nextQuery = query.trim();
            closeSearch();
            router.push(
              nextQuery
                ? `/category?q=${encodeURIComponent(nextQuery)}`
                : "/category",
            );
          }}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search products"
            autoComplete="off"
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

      {trimmedQuery ? (
        <div className="container-page relative z-10 max-h-[min(70vh,32rem)] overflow-y-auto bg-background/90 py-4">
          {showSkeleton ? <SearchResultSkeleton /> : null}

          {showNoResults ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products found for &ldquo;{trimmedQuery}&rdquo;.
            </p>
          ) : null}

          {showResults ? (
            <ul
              className="divide-y divide-border"
              role="listbox"
              aria-label="Product results"
            >
              {results.map((product) => {
                const href = `/products/${encodeURIComponent(product.slug)}`;
                const imageUrl = product.imageUrl || PLACEHOLDER_IMAGE;
                return (
                  <li key={product.id}>
                    <Link
                      href={href}
                      role="option"
                      className={cn(
                        "flex items-center gap-4 px-1 py-3 transition-colors",
                        "hover:bg-surface focus-visible:bg-surface focus-visible:outline-none",
                      )}
                      onClick={closeSearch}
                    >
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface sm:size-16">
                        <Image
                          src={imageUrl}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </span>
                      <span className="min-w-0 flex-1 text-base font-medium text-foreground">
                        {product.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {showResults ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Press Enter to browse all matches on the category page.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
