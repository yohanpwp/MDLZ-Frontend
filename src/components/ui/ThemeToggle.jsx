import PropTypes from 'prop-types';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';
import { cn } from '../../utils/cn';

const ThemeToggle = ({ className, showLabel = false, variant = "ghost", size = "icon" }) => {
  const { theme, effectiveTheme, toggleTheme, THEME_OPTIONS } = useTheme();

  const getIcon = () => {
    if (theme === THEME_OPTIONS.SYSTEM) {
      return <Monitor className="h-4 w-4" />;
    }
    return effectiveTheme === THEME_OPTIONS.DARK 
      ? <Moon className="h-4 w-4" /> 
      : <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === THEME_OPTIONS.SYSTEM) {
      return `System (${effectiveTheme})`;
    }
    return theme === THEME_OPTIONS.DARK ? 'Dark' : 'Light';
  };

  const getAriaLabel = () => {
    const nextTheme = theme === THEME_OPTIONS.LIGHT 
      ? 'dark' 
      : theme === THEME_OPTIONS.DARK 
        ? 'system' 
        : 'light';
    return `Switch to ${nextTheme} theme`;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "transition-all duration-200 ease-in-out",
        "hover:scale-105 active:scale-95",
        showLabel && "gap-2",
        className
      )}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      <span className="transition-transform duration-300 ease-in-out">
        {getIcon()}
      </span>
      {showLabel && (
        <span className="text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </Button>
  );
};

ThemeToggle.propTypes = {
  className: PropTypes.string,
  showLabel: PropTypes.bool,
  variant: PropTypes.string,
  size: PropTypes.string,
};

export default ThemeToggle;