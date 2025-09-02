import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';

const LanguageSwitcher = ({ 
  variant = 'default', 
  size = 'md', 
  showFlag = true, 
  showText = true,
  className 
}) => {
  const { currentLanguage, languages, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle language selection
  const handleLanguageSelect = (languageCode) => {
    setLanguage(languageCode);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const currentLang = languages[currentLanguage];

  // Variant styles - using theme-aware colors
  const variants = {
    default: 'bg-background border border-border hover:bg-accent text-foreground shadow-sm',
    outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground text-foreground',
    ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground text-foreground',
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-sm',
    header: 'bg-slate-700/50 border border-slate-600 hover:bg-slate-600 text-white backdrop-blur-sm'
  };

  // Size styles
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const buttonClasses = cn(
    'inline-flex items-center justify-between rounded-md font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none',
    variants[variant],
    sizes[size],
    className
  );

  const dropdownClasses = cn(
    'absolute right-0 mt-1 w-48 rounded-md shadow-lg z-50 py-1',
    'transform transition-all duration-200 ease-out',
    // Different dropdown styles based on variant
    variant === 'header' 
      ? 'bg-slate-800 border border-slate-600' 
      : 'bg-popover border border-border',
    isOpen 
      ? 'opacity-100 scale-100 translate-y-0' 
      : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className={buttonClasses}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('language.selectLanguage')}
      >
        <div className="flex items-center space-x-2">
          {showFlag && (
            <span className="text-lg" role="img" aria-label={currentLang.name}>
              {currentLang.flag}
            </span>
          )}
          {!showFlag && !showText && (
            <Globe className="w-4 h-4" />
          )}
          {showText && (
            <span className="font-medium">
              {currentLang.nativeName}
            </span>
          )}
        </div>
        <ChevronDown 
          className={cn(
            'w-4 h-4 ml-2 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      <div className={dropdownClasses}>
        {Object.values(languages).map((language) => (
          <button
            key={language.code}
            className={cn(
              'w-full px-4 py-2 text-left text-sm focus:outline-none transition-colors flex items-center space-x-3',
              // Different item styles based on variant
              variant === 'header' 
                ? cn(
                    'text-white hover:bg-slate-700 focus:bg-slate-700',
                    currentLanguage === language.code && 'bg-slate-700 font-medium'
                  )
                : cn(
                    'text-popover-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    currentLanguage === language.code && 'bg-accent text-accent-foreground font-medium'
                  )
            )}
            onClick={() => handleLanguageSelect(language.code)}
            role="menuitem"
          >
            <span className="text-lg" role="img" aria-label={language.name}>
              {language.flag}
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              {language.name !== language.nativeName && (
                <span className={cn(
                  "text-xs",
                  variant === 'header' ? 'text-slate-300' : 'text-muted-foreground'
                )}>
                  {language.name}
                </span>
              )}
            </div>
            {currentLanguage === language.code && (
              <span className={cn(
                "ml-auto",
                variant === 'header' ? 'text-blue-400' : 'text-primary'
              )}>
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

LanguageSwitcher.propTypes = {
  variant: PropTypes.oneOf(['default', 'outline', 'ghost', 'primary', 'header']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showFlag: PropTypes.bool,
  showText: PropTypes.bool,
  className: PropTypes.string
};

export default LanguageSwitcher;