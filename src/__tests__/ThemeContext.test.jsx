import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// Test component that uses the theme context
const TestComponent = () => {
  const { theme, effectiveTheme, toggleTheme, setTheme, THEME_OPTIONS } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="effective-theme">{effectiveTheme}</div>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle Theme
      </button>
      <button 
        onClick={() => setTheme(THEME_OPTIONS.DARK)} 
        data-testid="dark-button"
      >
        Set Dark
      </button>
      <button 
        onClick={() => setTheme(THEME_OPTIONS.LIGHT)} 
        data-testid="light-button"
      >
        Set Light
      </button>
      <button 
        onClick={() => setTheme(THEME_OPTIONS.SYSTEM)} 
        data-testid="system-button"
      >
        Set System
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document classes
    document.documentElement.className = '';
  });

  it('provides theme context to children', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toBeInTheDocument();
    expect(screen.getByTestId('effective-theme')).toBeInTheDocument();
  });

  it('defaults to system theme when no saved preference', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  it('allows setting theme to dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('dark-button'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('effective-theme')).toHaveTextContent('dark');
  });

  it('allows setting theme to light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('light-button'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('effective-theme')).toHaveTextContent('light');
  });

  it('toggles through themes correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');
    const currentTheme = screen.getByTestId('current-theme');

    // Start with system, toggle to light
    fireEvent.click(toggleButton);
    expect(currentTheme).toHaveTextContent('light');

    // Toggle to dark
    fireEvent.click(toggleButton);
    expect(currentTheme).toHaveTextContent('dark');

    // Toggle back to system
    fireEvent.click(toggleButton);
    expect(currentTheme).toHaveTextContent('system');
  });

  it('applies theme class to document element', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('dark-button'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByTestId('light-button'));
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('saves theme preference to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('dark-button'));
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(screen.getByTestId('light-button'));
    expect(localStorage.getItem('theme')).toBe('light');
  });
});