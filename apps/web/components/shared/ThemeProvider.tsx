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
 * Deep Navy & Warm Gold palette tokens for Ant Design.
 */
const lightTokens = {
  colorPrimary: "#C07D2B",
  colorBgContainer: "#ffffff",
  colorBgLayout: "#F7F8FC",
  colorBgBase: "#F7F8FC",
  colorText: "#1A2332",
  colorTextSecondary: "#4A5568",
  colorBorder: "#DFE3EC",
  colorBorderSecondary: "#C5CBD8",
  borderRadius: 14,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#10B981",
  colorInfo: "#3B82F6",
  colorWarning: "#F59E0B",
  colorError: "#EF4444",
};

const darkTokens = {
  colorPrimary: "#D4963A",
  colorBgContainer: "#1A2332",
  colorBgLayout: "#0F1419",
  colorBgBase: "#0F1419",
  colorText: "#E2E8F0",
  colorTextSecondary: "#94A3B8",
  colorBorder: "#2A3545",
  colorBorderSecondary: "#384860",
  borderRadius: 14,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#34D399",
  colorInfo: "#60A5FA",
  colorWarning: "#FBBF24",
  colorError: "#F87171",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with "light" to match server render and avoid hydration mismatch.
  // Real preference is synced from localStorage in the effect below.
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
              darkItemColor: "#94A3B8",
              darkItemHoverBg: "rgba(255,255,255,0.05)",
              darkItemSelectedBg: "rgba(212,150,58,0.12)",
              darkItemSelectedColor: "#D4963A",
            },
            Layout: {
              siderBg: isDark ? "#0A0E13" : "#1E293B",
              headerBg: isDark ? "#1A2332" : "#ffffff",
              bodyBg: isDark ? "#0F1419" : "#F7F8FC",
            },
            Button: {
              borderRadius: 14,
              controlHeight: 40,
            },
            Card: {
              borderRadius: 16,
            },
            Input: {
              borderRadius: 14,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

