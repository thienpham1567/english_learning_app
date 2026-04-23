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
 * Palette: #FAF7F3 · #F0E4D3 · #DCC5B2 · #D9A299
 */
const lightTokens = {
  colorPrimary: "#D9A299",
  colorBgContainer: "#ffffff",
  colorBgLayout: "#FAF7F3",
  colorBgBase: "#FAF7F3",
  colorText: "#3d2e2a",
  colorTextSecondary: "#7a6560",
  colorBorder: "#e8ddd4",
  colorBorderSecondary: "#DCC5B2",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#D9A299",
  colorInfo: "#DCC5B2",
  colorWarning: "#F0E4D3",
};

const darkTokens = {
  colorPrimary: "#DCC5B2",
  colorBgContainer: "#271d1a",
  colorBgLayout: "#1e1614",
  colorBgBase: "#1e1614",
  colorText: "#f0e4d3",
  colorTextSecondary: "#c8b5a5",
  colorBorder: "#3d2e2a",
  colorBorderSecondary: "#4d3d38",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#DCC5B2",
  colorInfo: "#D9A299",
  colorWarning: "#c07a70",
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
              darkItemSelectedBg: "rgba(217,162,153,0.14)",
              darkItemSelectedColor: isDark ? "#DCC5B2" : "#D9A299",
            },
            Layout: {
              siderBg: isDark ? "#16100e" : "#3d2e2a",
              headerBg: isDark ? "#271d1a" : "#ffffff",
              bodyBg: isDark ? "#1e1614" : "#FAF7F3",
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
