import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ThemeColors {
  // Backgrounds
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  headerBg: string;
  inputBg: string;
  inputBorder: string;
  navBg: string;
  sidebarBg: string;
  sidebarHover: string;
  frameBg: string;
  pillBg: string;
  // Dividers
  divider: string;
  // Text
  text: string;
  textSec: string;
  textMuted: string;
  // Shadows
  shadow: string;
  shadowSm: string;
  // State
  isDark: boolean;
  toggle: () => void;
}

const light: Omit<ThemeColors, "isDark" | "toggle"> = {
  pageBg: "#F8FAFC",
  cardBg: "#FFFFFF",
  cardBorder: "#E2E8F0",
  headerBg: "#FFFFFF",
  inputBg: "#FFFFFF",
  inputBorder: "#E2E8F0",
  navBg: "#FFFFFF",
  sidebarBg: "#0F172A",
  sidebarHover: "rgba(255,255,255,0.07)",
  frameBg: "#CBD5E1",
  pillBg: "#F1F5F9",
  divider: "#F1F5F9",
  text: "#0F172A",
  textSec: "#64748B",
  textMuted: "#94A3B8",
  shadow: "0 4px 12px rgba(0,0,0,0.08)",
  shadowSm: "0 2px 8px rgba(0,0,0,0.06)",
};

const dark: Omit<ThemeColors, "isDark" | "toggle"> = {
  pageBg: "#0B1120",
  cardBg: "#1E293B",
  cardBorder: "#334155",
  headerBg: "#1E293B",
  inputBg: "#0F172A",
  inputBorder: "#334155",
  navBg: "#1E293B",
  sidebarBg: "#020817",
  sidebarHover: "rgba(255,255,255,0.06)",
  frameBg: "#020817",
  pillBg: "#1E293B",
  divider: "#1E293B",
  text: "#F1F5F9",
  textSec: "#94A3B8",
  textMuted: "#64748B",
  shadow: "0 4px 16px rgba(0,0,0,0.35)",
  shadowSm: "0 2px 8px rgba(0,0,0,0.25)",
};

const ThemeContext = createContext<ThemeColors>({
  ...light,
  isDark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem("laundryku-theme") === "dark";
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("laundryku-theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  };

  const value: ThemeColors = {
    ...(isDark ? dark : light),
    isDark,
    toggle,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
