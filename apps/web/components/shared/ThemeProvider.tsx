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
 * Palette: #F2EAE0 · #B4D3D9 · #BDA6CE · #9B8EC7
 */
const lightTokens = {
  colorPrimary: "#9B8EC7",
  colorBgContainer: "#ffffff",
  colorBgLayout: "#faf8f5",
  colorBgBase: "#faf8f5",
  colorText: "#2d2640",
  colorTextSecondary: "#5e5475",
  colorBorder: "#e4ddd4",
  colorBorderSecondary: "#BDA6CE",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#9B8EC7",
  colorInfo: "#B4D3D9",
  colorWarning: "#F2EAE0",
};

const darkTokens = {
  colorPrimary: "#BDA6CE",
  colorBgContainer: "#211b30",
  colorBgLayout: "#1a1527",
  colorBgBase: "#1a1527",
  colorText: "#e8e0f0",
  colorTextSecondary: "#b3a6c8",
  colorBorder: "#322a45",
  colorBorderSecondary: "#3e3555",
  borderRadius: 12,
  fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
  colorSuccess: "#BDA6CE",
  colorInfo: "#9B8EC7",
  colorWarning: "#7a6aab",
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
              darkItemSelectedBg: "rgba(155,142,199,0.14)",
              darkItemSelectedColor: isDark ? "#BDA6CE" : "#9B8EC7",
            },
            Layout: {
              siderBg: isDark ? "#151020" : "#2d2640",
              headerBg: isDark ? "#211b30" : "#ffffff",
              bodyBg: isDark ? "#1a1527" : "#faf8f5",
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
