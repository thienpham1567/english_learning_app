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
 * Palette: #9AB17A · #C3CC9B · #E4DFB5 · #FBE8CE
 */
const lightTokens = {
  colorPrimary: "#9AB17A",
  colorBgContainer: "#ffffff",
  colorBgLayout: "#faf8f3",
  colorBgBase: "#faf8f3",
  colorText: "#2d3a24",
  colorTextSecondary: "#5a6651",
  colorBorder: "#e4dfb5",
  colorBorderSecondary: "#c3cc9b",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#9AB17A",
  colorInfo: "#C3CC9B",
  colorWarning: "#E4DFB5",
};

const darkTokens = {
  colorPrimary: "#b1c892",
  colorBgContainer: "#1c2318",
  colorBgLayout: "#141a10",
  colorBgBase: "#141a10",
  colorText: "#e4eadc",
  colorTextSecondary: "#a5b096",
  colorBorder: "#2f3b26",
  colorBorderSecondary: "#3d4a32",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#b1c892",
  colorInfo: "#8a9472",
  colorWarning: "#6b6d4e",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  // Read saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === "dark" || saved === "light") {
      setMode(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

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
              darkItemSelectedBg: "rgba(154,177,122,0.14)",
              darkItemSelectedColor: isDark ? "#b1c892" : "#9AB17A",
            },
            Layout: {
              siderBg: isDark ? "#101510" : "#2d3a24",
              headerBg: isDark ? "#1c2318" : "#ffffff",
              bodyBg: isDark ? "#141a10" : "#faf8f3",
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
