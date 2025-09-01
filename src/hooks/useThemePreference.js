import { useTheme } from '../contexts/ThemeContext';

/**
 * Custom hook for theme preference management
 * Provides convenient methods for theme operations
 */
export const useThemePreference = () => {
  const { 
    theme, 
    systemTheme, 
    effectiveTheme, 
    setTheme, 
    toggleTheme, 
    isSystemTheme, 
    THEME_OPTIONS 
  } = useTheme();

  const isDark = effectiveTheme === THEME_OPTIONS.DARK;
  const isLight = effectiveTheme === THEME_OPTIONS.LIGHT;

  const setLightTheme = () => setTheme(THEME_OPTIONS.LIGHT);
  const setDarkTheme = () => setTheme(THEME_OPTIONS.DARK);
  const setSystemTheme = () => setTheme(THEME_OPTIONS.SYSTEM);

  const getThemeIcon = () => {
    if (isSystemTheme) return 'monitor';
    return isDark ? 'moon' : 'sun';
  };

  const getThemeLabel = () => {
    if (isSystemTheme) return `System (${effectiveTheme})`;
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return {
    // Current state
    theme,
    systemTheme,
    effectiveTheme,
    isDark,
    isLight,
    isSystemTheme,
    
    // Actions
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    
    // Utilities
    getThemeIcon,
    getThemeLabel,
    
    // Constants
    THEME_OPTIONS,
  };
};