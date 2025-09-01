/**
 * Theme Configuration
 *
 * Centralized theme settings and utilities for the application.
 * This file contains theme constants, color mappings, and utility functions.
 */

export const THEME_STORAGE_KEY = "theme";

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export const THEME_TRANSITIONS = {
  FAST: "transition-colors duration-150 ease-in-out",
  NORMAL: "transition-colors duration-300 ease-in-out",
  SLOW: "transition-colors duration-500 ease-in-out",
};

export const THEME_COLORS = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    primary: "hsl(221.2 83.2% 53.3%)",
    secondary: "hsl(210 40% 96%)",
    accent: "hsl(210 40% 96%)",
    muted: "hsl(210 40% 96%)",
    border: "hsl(214.3 31.8% 91.4%)",
  },
  dark: {
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    primary: "hsl(217.2 91.2% 59.8%)",
    secondary: "hsl(217.2 32.6% 17.5%)",
    accent: "hsl(217.2 32.6% 17.5%)",
    muted: "hsl(217.2 32.6% 17.5%)",
    border: "hsl(217.2 32.6% 17.5%)",
  },
};

/**
 * Get system theme preference
 */
export const getSystemTheme = () => {
  if (typeof window === "undefined") return THEME_MODES.LIGHT;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEME_MODES.DARK
    : THEME_MODES.LIGHT;
};

/**
 * Get saved theme from localStorage
 */
export const getSavedTheme = () => {
  if (typeof window === "undefined") return THEME_MODES.SYSTEM;

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved && Object.values(THEME_MODES).includes(saved)
      ? saved
      : THEME_MODES.SYSTEM;
  } catch {
    return THEME_MODES.SYSTEM;
  }
};

/**
 * Save theme to localStorage
 */
export const saveTheme = (theme) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Failed to save theme preference:", error);
  }
};

/**
 * Apply theme class to document
 */
export const applyTheme = (theme, systemTheme) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const effectiveTheme = theme === THEME_MODES.SYSTEM ? systemTheme : theme;

  // Remove all theme classes
  root.classList.remove(THEME_MODES.LIGHT, THEME_MODES.DARK);

  // Add current theme class
  root.classList.add(effectiveTheme);

  return effectiveTheme;
};

/**
 * Create media query listener for system theme changes
 */
export const createSystemThemeListener = (callback) => {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e) => {
    const systemTheme = e.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT;
    callback(systemTheme);
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => mediaQuery.removeEventListener("change", handleChange);
};
