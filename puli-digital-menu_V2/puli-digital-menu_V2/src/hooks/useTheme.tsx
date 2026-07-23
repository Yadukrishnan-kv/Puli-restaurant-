import { useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "puli-theme";

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      document.documentElement.dataset.theme = stored;
      return stored;
    }
    document.documentElement.dataset.theme = "light";
    return "light";
  });

  const updateTheme = (next: Theme) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return [theme, updateTheme];
}

