"use client";

import { Search } from "lucide-react";

import { useSearchUi } from "@/components/search/search-ui-context";
import { Button } from "@/components/ui/button";

export function HeaderSearchButton() {
  const { openSearch } = useSearchUi();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Open search"
      onClick={openSearch}
    >
      <Search className="size-5" />
    </Button>
  );
}
