import { createContext, useContext, useEffect, useMemo, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  THEME_MODES,
  getSavedTheme,
  getSystemTheme,
  saveTheme,
  applyTheme,
  createSystemThemeListener
} from '../config/theme';

const ThemeContext = createContext(null);

export const THEME_OPTIONS = THEME_MODES;

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  // 1) Initial states
  const [theme, setTheme] = useState(() => getSavedTheme() ?? THEME_OPTIONS.SYSTEM);
  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

  // 2) Single persistent live region for screen readers
  const srRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = document.createElement('div');
    node.setAttribute('aria-live', 'polite');
    node.setAttribute('aria-atomic', 'true');
    node.style.position = 'absolute';
    node.style.width = '1px';
    node.style.height = '1px';
    node.style.margin = '-1px';
    node.style.border = '0';
    node.style.padding = '0';
    node.style.overflow = 'hidden';
    node.style.clip = 'rect(0 0 0 0)';
    node.style.clipPath = 'inset(50%)';
    document.body.appendChild(node);
    srRef.current = node;
    return () => {
      if (node.parentNode) node.parentNode.removeChild(node);
    };
  }, []);

  // 3) Listen for system theme changes
  useEffect(() => createSystemThemeListener(setSystemTheme), []);

  // 4) Listen for cross-tab theme changes (localStorage sync)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e) => {
      if (e.key === 'app_theme' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.mode && parsed.mode !== theme) {
            setTheme(parsed.mode);
          }
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [theme]);

  // 5) Compute effective theme (what user actually sees)
  const effectiveTheme = useMemo(
    () => (theme === THEME_OPTIONS.SYSTEM ? systemTheme : theme),
    [theme, systemTheme]
  );

  // 6) Apply + persist theme when inputs change
  useEffect(() => {
    const applied = applyTheme(theme, systemTheme); // should set data-theme / class on <html> or <body>
    // persist the user preference (even if SYSTEM)
    saveTheme(theme);

    // Announce change once we know what's applied
    if (srRef.current) {
      srRef.current.textContent =
        `Theme changed to ${theme === THEME_OPTIONS.SYSTEM ? `system (${applied})` : applied}`;
    }
  }, [theme, systemTheme]);

  // 7) Actions
  const setThemePreference = useCallback((newTheme) => setTheme(newTheme), []);
  const toggleTheme = useCallback(() => {
    const order = [THEME_OPTIONS.LIGHT, THEME_OPTIONS.DARK, THEME_OPTIONS.SYSTEM];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      systemTheme,
      effectiveTheme,
      setTheme: setThemePreference,
      toggleTheme,
      isSystemTheme: theme === THEME_OPTIONS.SYSTEM,
      THEME_OPTIONS
    }),
    [theme, systemTheme, effectiveTheme, setThemePreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
