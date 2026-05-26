"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

type ThemeMode = "light" | "dark";

type ThemeContextType = {
  mode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "theme-mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with "light" to match server render and avoid hydration mismatch.
  const [mode, setMode] = useState<ThemeMode>("light");

  // Sync theme from localStorage on mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const resolved = saved === "dark" || saved === "light" ? saved : "light";
    setMode(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeContext.Provider>
  );
}
