"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  fetchSearchCatalogIndex,
  filterSearchCatalogEntries,
  resolveSearchDestination,
  type SearchCatalogEntry,
} from "@/features/catalog/catalog.service";
import { fetchCatalogProducts } from "@/features/products/product.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULT_LIMIT = 8;
const CATEGORY_RESULT_LIMIT = 6;

export type SearchResultItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
};

type SearchUiContextValue = {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  query: string;
  setQuery: (value: string) => void;
  results: SearchResultItem[];
  categoryResults: SearchCatalogEntry[];
  catalogIndex: SearchCatalogEntry[];
  isSearching: boolean;
  /** True after a non-empty debounced query has finished loading. */
  hasCompletedSearch: boolean;
  resolveDestination: (query: string) => string;
};

const SearchUiContext = createContext<SearchUiContextValue | null>(null);

export function SearchUiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [categoryResults, setCategoryResults] = useState<SearchCatalogEntry[]>([]);
  const [catalogIndex, setCatalogIndex] = useState<SearchCatalogEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const fetchGenerationRef = useRef(0);
  const catalogLoadedRef = useRef(false);

  const resetSearchState = useCallback(() => {
    fetchGenerationRef.current += 1;
    setQueryState("");
    setResults([]);
    setCategoryResults([]);
    setIsSearching(false);
    setHasCompletedSearch(false);
  }, []);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    resetSearchState();
  }, [resetSearchState]);
  const toggleSearch = useCallback(() => {
    setIsOpen((value) => {
      if (value) {
        resetSearchState();
        return false;
      }
      return true;
    });
  }, [resetSearchState]);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
  }, []);

  const resolveDestination = useCallback(
    (value: string) => resolveSearchDestination(value, catalogIndex),
    [catalogIndex],
  );

  useEffect(() => {
    if (!isOpen || catalogLoadedRef.current) return;

    let cancelled = false;
    void (async () => {
      const index = await fetchSearchCatalogIndex();
      if (cancelled) return;
      catalogLoadedRef.current = true;
      setCatalogIndex(index);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      fetchGenerationRef.current += 1;
      setResults([]);
      setCategoryResults([]);
      setIsSearching(false);
      setHasCompletedSearch(false);
      return;
    }

    const generation = ++fetchGenerationRef.current;
    setIsSearching(true);
    setHasCompletedSearch(false);
    setCategoryResults(
      filterSearchCatalogEntries(catalogIndex, trimmed, CATEGORY_RESULT_LIMIT),
    );

    void (async () => {
      const result = await fetchCatalogProducts({
        q: trimmed,
        limit: SEARCH_RESULT_LIMIT,
        page: 1,
      });

      if (generation !== fetchGenerationRef.current) return;

      setResults(
        result.items.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          imageUrl: item.imageUrl,
        })),
      );
      setIsSearching(false);
      setHasCompletedSearch(true);
    })();
  }, [debouncedQuery, isOpen, catalogIndex]);

  // Show skeleton immediately while the user types before debounce settles.
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setIsSearching(false);
      setCategoryResults([]);
      return;
    }
    if (trimmed !== debouncedQuery.trim()) {
      setIsSearching(true);
      setHasCompletedSearch(false);
      setCategoryResults(
        filterSearchCatalogEntries(catalogIndex, trimmed, CATEGORY_RESULT_LIMIT),
      );
    }
  }, [query, debouncedQuery, isOpen, catalogIndex]);

  const value = useMemo(
    () => ({
      isOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      query,
      setQuery,
      results,
      categoryResults,
      catalogIndex,
      isSearching,
      hasCompletedSearch,
      resolveDestination,
    }),
    [
      isOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      query,
      setQuery,
      results,
      categoryResults,
      catalogIndex,
      isSearching,
      hasCompletedSearch,
      resolveDestination,
    ],
  );

  return (
    <SearchUiContext.Provider value={value}>{children}</SearchUiContext.Provider>
  );
}

export function useSearchUi() {
  const context = useContext(SearchUiContext);
  if (!context) {
    throw new Error("useSearchUi must be used within SearchUiProvider");
  }
  return context;
}
