# Theme System Documentation

## Overview

The Invoice Validation System includes a comprehensive light/dark theme toggle system with automatic system preference detection, smooth transitions, and persistent user preferences.

## Features

- **Three Theme Modes**: Light, Dark, and System (follows OS preference)
- **Persistent Storage**: User preferences saved in localStorage
- **System Detection**: Automatically detects and follows system dark/light mode
- **Smooth Transitions**: CSS transitions for seamless theme switching
- **Accessibility**: Screen reader announcements and proper ARIA labels
- **Multiple Integration Points**: Header toggle, user menu, and dedicated settings page

## Components

### ThemeProvider

The main context provider that manages theme state and system preference detection.

```jsx
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return <ThemeProvider>{/* Your app content */}</ThemeProvider>;
}
```

### ThemeToggle

A reusable button component for theme switching with customizable appearance.

```jsx
import ThemeToggle from './components/ui/ThemeToggle';

// Icon only (default)
<ThemeToggle />

// With label
<ThemeToggle showLabel={true} />

// Custom styling
<ThemeToggle
  variant="outline"
  size="sm"
  className="custom-class"
/>
```

### useTheme Hook

Access theme state and controls from any component.

```jsx
import { useTheme } from "./contexts/ThemeContext";

function MyComponent() {
  const {
    theme, // Current theme setting ('light', 'dark', 'system')
    effectiveTheme, // Actual theme being applied ('light' or 'dark')
    systemTheme, // Current system preference
    setTheme, // Function to set specific theme
    toggleTheme, // Function to cycle through themes
    isSystemTheme, // Boolean if using system preference
  } = useTheme();

  return (
    <div>
      Current theme: {theme}
      Effective theme: {effectiveTheme}
    </div>
  );
}
```

### useThemePreference Hook

Enhanced hook with additional utilities for theme management.

```jsx
import { useThemePreference } from "./hooks/useThemePreference";

function MyComponent() {
  const {
    isDark, // Boolean if dark theme is active
    isLight, // Boolean if light theme is active
    setDarkTheme, // Direct function to set dark theme
    setLightTheme, // Direct function to set light theme
    setSystemTheme, // Direct function to set system theme
    getThemeIcon, // Function returning appropriate icon name
    getThemeLabel, // Function returning formatted theme label
  } = useThemePreference();
}
```

## CSS Variables

The theme system uses CSS custom properties for consistent theming:

```css
/* Light theme (default) */
:root {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222.2 84% 4.9%);
  --color-primary: hsl(221.2 83.2% 53.3%);
  /* ... more variables */
}

/* Dark theme */
.dark {
  --color-background: hsl(222.2 84% 4.9%);
  --color-foreground: hsl(210 40% 98%);
  --color-primary: hsl(217.2 91.2% 59.8%);
  /* ... more variables */
}
```

## Tailwind Integration

Use Tailwind's CSS variable classes for theme-aware styling:

```jsx
// These classes automatically adapt to the current theme
<div className="bg-background text-foreground">
  <h1 className="text-primary">Themed Content</h1>
  <p className="text-muted-foreground">Secondary text</p>
</div>
```

## Configuration

Theme settings can be customized in `src/config/theme.js`:

```javascript
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
```

## Integration Points

### 1. Header Component

Theme toggle is integrated into the main header for easy access.

### 2. User Menu

Theme preferences are available in the user dropdown menu with current status display.

### 3. Settings Page

Dedicated theme settings page (`ThemeSettings.jsx`) provides detailed theme selection with descriptions.

### 4. Main App

Demo integration in the main app component shows theme status and provides a prominent toggle.

## Accessibility

- **Screen Reader Support**: Theme changes are announced to screen readers
- **Keyboard Navigation**: All theme controls are keyboard accessible
- **High Contrast**: Respects user's high contrast preferences
- **Reduced Motion**: Honors prefers-reduced-motion settings

## Browser Support

- **Modern Browsers**: Full support in all modern browsers
- **CSS Custom Properties**: Required for theming (IE11+ support)
- **localStorage**: Used for persistence (graceful fallback if unavailable)
- **matchMedia**: Used for system preference detection

## Testing

Theme system includes comprehensive tests:

```bash
# Run theme-specific tests
npm test ThemeContext.test.jsx

# Run all tests
npm test
```

## Best Practices

1. **Use CSS Variables**: Always use the provided CSS custom properties for colors
2. **Test Both Themes**: Ensure your components work in both light and dark modes
3. **Respect System Preferences**: Default to system theme when possible
4. **Smooth Transitions**: Use the provided transition classes for consistent animations
5. **Accessibility**: Always provide proper labels and announcements for theme changes

## Troubleshooting

### Theme Not Persisting

- Check localStorage permissions
- Verify ThemeProvider wraps your app
- Ensure no conflicting theme classes

### Styles Not Updating

- Verify CSS custom properties are used instead of hardcoded colors
- Check for CSS specificity issues
- Ensure theme classes are applied to document root

### System Theme Not Detected

- Verify browser supports `prefers-color-scheme`
- Check for JavaScript errors in console
- Ensure media query listener is properly attached
