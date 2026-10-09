"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SearchUiContextValue = {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
};

const SearchUiContext = createContext<SearchUiContextValue | null>(null);

export function SearchUiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen((value) => !value), []);

  const value = useMemo(
    () => ({ isOpen, openSearch, closeSearch, toggleSearch }),
    [isOpen, openSearch, closeSearch, toggleSearch],
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
