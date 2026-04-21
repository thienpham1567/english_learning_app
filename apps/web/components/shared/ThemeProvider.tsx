"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ConfigProvider, theme as antTheme } from "antd";

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

/**
 * Palette: #74C4C9 · #90D0D4 · #ACDCDF · #C7E7E9 · #E3F3F4
 */
const lightTokens = {
  colorPrimary: "#74C4C9",
  colorBgContainer: "#ffffff",
  colorBgLayout: "#f6fbfb",
  colorBgBase: "#f6fbfb",
  colorText: "#1e3a3c",
  colorTextSecondary: "#4a6b6d",
  colorBorder: "#c7e7e9",
  colorBorderSecondary: "#90d0d4",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#74C4C9",
  colorInfo: "#90D0D4",
  colorWarning: "#ACDCDF",
};

const darkTokens = {
  colorPrimary: "#90d0d4",
  colorBgContainer: "#152526",
  colorBgLayout: "#0f1d1e",
  colorBgBase: "#0f1d1e",
  colorText: "#dceef0",
  colorTextSecondary: "#96c0c3",
  colorBorder: "#243536",
  colorBorderSecondary: "#2f4647",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#90d0d4",
  colorInfo: "#6ab0b4",
  colorWarning: "#4a8e92",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : "light";
  });

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

  const isDark = mode === "dark";

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: isDark ? darkTokens : lightTokens,
          components: {
            Menu: {
              darkItemBg: "transparent",
              darkItemColor: "rgba(255,255,255,0.7)",
              darkItemHoverBg: "rgba(255,255,255,0.06)",
              darkItemSelectedBg: "rgba(116,196,201,0.14)",
              darkItemSelectedColor: isDark ? "#90d0d4" : "#74C4C9",
            },
            Layout: {
              siderBg: isDark ? "#0b1718" : "#1e3a3c",
              headerBg: isDark ? "#152526" : "#ffffff",
              bodyBg: isDark ? "#0f1d1e" : "#f6fbfb",
            },
            Button: {
              borderRadius: 12,
              controlHeight: 40,
            },
            Card: {
              borderRadius: 16,
            },
            Input: {
              borderRadius: 12,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
