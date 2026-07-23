import React, { createContext, useContext, useState, useCallback } from "react";
import type { DietaryTag, HighlightTag } from "../types/filters";

interface FilterState {
  hiddenAllergens: DietaryTag[];
  highlightFilters: HighlightTag[];
}

interface FilterContextValue extends FilterState {
  setHiddenAllergens: (value: DietaryTag[] | ((prev: DietaryTag[]) => DietaryTag[])) => void;
  setHighlightFilters: (value: HighlightTag[] | ((prev: HighlightTag[]) => HighlightTag[])) => void;
  toggleHiddenAllergen: (tag: DietaryTag) => void;
  toggleHighlight: (tag: HighlightTag) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hiddenAllergens, setHiddenAllergens] = useState<DietaryTag[]>([]);
  const [highlightFilters, setHighlightFilters] = useState<HighlightTag[]>([]);

  const toggleHiddenAllergen = useCallback((tag: DietaryTag) => {
    setHiddenAllergens((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
    );
  }, []);

  const toggleHighlight = useCallback((tag: HighlightTag) => {
    setHighlightFilters((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setHiddenAllergens([]);
    setHighlightFilters([]);
  }, []);

  const value: FilterContextValue = {
    hiddenAllergens,
    highlightFilters,
    setHiddenAllergens,
    setHighlightFilters,
    toggleHiddenAllergen,
    toggleHighlight,
    clearFilters,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within FilterProvider");
  return ctx;
}
