# Internationalization (i18n) System

This document describes the comprehensive internationalization system implemented in the Invoice Validation System, supporting multiple languages with proper formatting and localization.

## Features

- ✅ **Multi-language Support**: English and Thai with easy extensibility
- ✅ **Language Switcher Component**: Dropdown with flag icons and native names
- ✅ **Translation System**: Nested JSON structure with parameter interpolation
- ✅ **Local Storage**: Persistent language preference storage
- ✅ **Browser Detection**: Automatic language detection from browser settings
- ✅ **Date & Time Formatting**: Locale-aware date, time, and relative time formatting
- ✅ **Number Formatting**: Currency, percentages, and number formatting per locale
- ✅ **React Context**: Centralized language state management
- ✅ **Custom Hooks**: Easy-to-use formatting utilities
- ✅ **Fallback System**: Graceful fallback to English for missing translations

## File Structure

```
src/
├── locales/
│   ├── en.json                 # English translations
│   └── th.json                 # Thai translations
├── contexts/
│   └── LanguageContext.jsx     # Language context provider
├── components/ui/
│   └── LanguageSwitcher.jsx    # Language switcher component
├── hooks/
│   └── useFormatters.js        # Formatting utilities hook
├── utils/
│   └── formatters.js           # Core formatting functions
└── components/examples/
    └── InternationalizationDemo.jsx  # Demo component
```

## Quick Start

### 1. Language Context Setup

The `LanguageProvider` is already integrated in `src/main.jsx`:

```jsx
import { LanguageProvider } from './contexts/LanguageContext.jsx';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  </React.StrictMode>
);
```

### 2. Using Translations

```jsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('invoice.title')}</h1>
      <p>{t('common.loading')}</p>
      {/* With parameters */}
      <p>{t('offline.pendingSync', { count: 5 })}</p>
    </div>
  );
}
```

### 3. Using Formatters

```jsx
import { useFormatters } from '../hooks/useFormatters';

function MyComponent() {
  const { formatPrice, formatDate, formatRelativeTime } = useFormatters();
  
  const amount = 1234.56;
  const date = new Date();
  
  return (
    <div>
      <p>Price: {formatPrice(amount)}</p>
      <p>Date: {formatDate(date)}</p>
      <p>Time: {formatRelativeTime(date)}</p>
    </div>
  );
}
```

### 4. Language Switcher

```jsx
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher 
        variant="outline" 
        showFlag={true} 
        showText={true} 
      />
    </header>
  );
}
```

## Translation Structure

### JSON Format

Translations are organized in nested objects for better organization:

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "invoices": "Invoices"
  },
  "invoice": {
    "title": "Invoice Validation System",
    "number": "Invoice Number",
    "amount": "Amount"
  }
}
```

### Parameter Interpolation

Use `{{paramName}}` syntax for dynamic values:

```json
{
  "offline": {
    "pendingSync": "{{count}} operations pending sync"
  }
}
```

Usage:
```jsx
t('offline.pendingSync', { count: 5 })
// Result: "5 operations pending sync"
```

## Supported Languages

### Current Languages

| Code | Language | Native Name | Flag | Currency | Locale |
|------|----------|-------------|------|----------|--------|
| `en` | English  | English     | 🇺🇸   | USD      | en-US  |
| `th` | Thai     | ไทย         | 🇹🇭   | THB      | th-TH  |

### Adding New Languages

1. **Create translation file**: `src/locales/[code].json`
2. **Update language config** in `src/contexts/LanguageContext.jsx`:

```jsx
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', rtl: false },
  // Add new language
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false }
};

const translations = {
  en: enTranslations,
  th: thTranslations,
  fr: frTranslations // Import and add
};
```

3. **Update formatters** in `src/utils/formatters.js`:

```jsx
const LOCALE_MAPPINGS = {
  en: 'en-US',
  th: 'th-TH',
  fr: 'fr-FR' // Add locale mapping
};

const CURRENCY_MAPPINGS = {
  en: 'USD',
  th: 'THB',
  fr: 'EUR' // Add currency mapping
};
```

## Formatting Functions

### Date & Time Formatting

```jsx
const { formatDate, formatTime, formatDateTime, formatRelativeTime } = useFormatters();

// Basic formatting
formatDate(new Date())           // "January 1, 2025" (en) / "1 มกราคม 2025" (th)
formatTime(new Date())           // "2:30 PM" (en) / "14:30" (th)
formatDateTime(new Date())       // "Jan 1, 2025, 2:30 PM"

// Relative time
formatRelativeTime(pastDate)     // "2 days ago" (en) / "2 วันที่แล้ว" (th)

// Custom options
formatDate(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
```

### Number & Currency Formatting

```jsx
const { formatNumber, formatPrice, formatPercentage } = useFormatters();

formatNumber(1234567)            // "1,234,567" (en) / "1,234,567" (th)
formatPrice(1234.56)             // "$1,234.56" (en) / "฿1,234.56" (th)
formatPercentage(0.1234)         // "12.34%" (en) / "12.34%" (th)

// Custom currency
formatPrice(1000, 'EUR')         // "€1,000.00"
```

### File Size Formatting

```jsx
const { formatFileSize } = useFormatters();

formatFileSize(1024)             // "1 KB"
formatFileSize(1024 * 1024 * 15) // "15 MB"
```

## Language Switcher Component

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'default'` | Button style: `'default'`, `'outline'`, `'ghost'`, `'primary'` |
| `size` | `string` | `'md'` | Button size: `'sm'`, `'md'`, `'lg'` |
| `showFlag` | `boolean` | `true` | Show flag emoji |
| `showText` | `boolean` | `true` | Show language name |
| `className` | `string` | - | Additional CSS classes |

### Examples

```jsx
// Default switcher
<LanguageSwitcher />

// Compact version (icon only)
<LanguageSwitcher showText={false} />

// Primary button style
<LanguageSwitcher variant="primary" size="lg" />

// Custom styling
<LanguageSwitcher 
  variant="outline" 
  className="border-blue-500 text-blue-600" 
/>
```

## Language Context API

### useLanguage Hook

```jsx
const {
  currentLanguage,    // Current language code ('en', 'th')
  isLoading,         // Loading state during language change
  languages,         // Available languages object
  setLanguage,       // Function to change language
  t,                 // Translation function
  getCurrentLanguage, // Get current language info
  isRTL              // Check if current language is RTL
} = useLanguage();
```

### Methods

```jsx
// Change language
setLanguage('th');

// Get language info
const langInfo = getCurrentLanguage();
// Returns: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false }

// Check RTL
const isRightToLeft = isRTL(); // false for en/th
```

## Browser Integration

### Language Detection

The system automatically detects the user's preferred language from:
1. Stored preference in localStorage
2. Browser language (`navigator.language`)
3. Falls back to English

### Local Storage

Language preference is automatically saved to localStorage with key `'preferred-language'`.

### Document Language

The system automatically sets the HTML document language attribute:
```html
<html lang="en">  <!-- or lang="th" -->
```

## Best Practices

### 1. Translation Keys

Use descriptive, hierarchical keys:
```jsx
// Good
t('invoice.validation.success')
t('customer.form.email.placeholder')

// Avoid
t('msg1')
t('text')
```

### 2. Parameter Naming

Use clear parameter names:
```json
{
  "welcome": "Welcome back, {{userName}}!",
  "itemCount": "You have {{count}} items in your cart"
}
```

### 3. Pluralization

Handle plurals appropriately:
```json
{
  "en": {
    "itemCount": "{{count}} item{{count === 1 ? '' : 's'}}"
  },
  "th": {
    "itemCount": "{{count}} รายการ"
  }
}
```

### 4. Date Formatting

Use appropriate date formats for each locale:
```jsx
// For forms - always use ISO format
<input type="date" value={formatDateForInput(date)} />

// For display - use localized format
<span>{formatDate(date)}</span>
```

### 5. Number Input

Be careful with number inputs in different locales:
```jsx
// Parse user input considering locale
const parseNumber = (input) => {
  return parseFloat(input.replace(/[^\d.-]/g, ''));
};
```

## Testing

### Language Switching

Test language switching functionality:
```jsx
// In your tests
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';

test('language switching works', () => {
  render(
    <LanguageProvider>
      <MyComponent />
    </LanguageProvider>
  );
  
  // Test English content
  expect(screen.getByText('Invoice Validation System')).toBeInTheDocument();
  
  // Switch to Thai
  fireEvent.click(screen.getByRole('button', { name: /select language/i }));
  fireEvent.click(screen.getByText('ไทย'));
  
  // Test Thai content
  expect(screen.getByText('ระบบตรวจสอบใบแจ้งหนี้')).toBeInTheDocument();
});
```

### Formatting

Test formatting functions:
```jsx
import { formatDate, formatCurrency } from '../utils/formatters';

test('date formatting works for different locales', () => {
  const date = new Date('2025-01-01');
  
  expect(formatDate(date, 'en')).toBe('January 1, 2025');
  expect(formatDate(date, 'th')).toBe('1 มกราคม 2025');
});

test('currency formatting works', () => {
  expect(formatCurrency(1234.56, 'en')).toBe('$1,234.56');
  expect(formatCurrency(1234.56, 'th')).toBe('฿1,234.56');
});
```

## Performance Considerations

### 1. Translation Loading

Translations are imported statically and bundled with the app. For larger applications, consider:
- Dynamic imports for translation files
- Lazy loading of language packs
- Translation file splitting by feature

### 2. Formatting Performance

Formatting functions use `Intl` APIs which are performant but can be cached:
```jsx
// Cache formatters for repeated use
const dateFormatter = useMemo(() => 
  new Intl.DateTimeFormat(locale, options), [locale, options]
);
```

### 3. Re-renders

The language context uses React's context, which can cause re-renders. Consider:
- Memoizing components that don't need frequent updates
- Using `React.memo` for expensive components
- Splitting context if needed

## Troubleshooting

### Common Issues

1. **Missing translations**: Check browser console for warnings about missing keys
2. **Formatting errors**: Ensure locale codes are correct in `formatters.js`
3. **Storage errors**: Handle localStorage failures gracefully (already implemented)
4. **Bundle size**: Monitor translation file sizes as they grow

### Debug Mode

Enable debug logging by adding to your component:
```jsx
useEffect(() => {
  console.log('Current language:', currentLanguage);
  console.log('Available languages:', languages);
}, [currentLanguage, languages]);
```

## Future Enhancements

### Planned Features

- [ ] **RTL Support**: Right-to-left language support (Arabic, Hebrew)
- [ ] **Pluralization Rules**: Advanced plural form handling
- [ ] **Translation Management**: Integration with translation services
- [ ] **Lazy Loading**: Dynamic translation loading
- [ ] **Namespace Support**: Feature-based translation organization
- [ ] **Translation Validation**: Build-time translation completeness checks

### Integration Ideas

- **CMS Integration**: Load translations from headless CMS
- **Translation Services**: Integrate with services like Crowdin, Lokalise
- **A/B Testing**: Test different translations
- **Analytics**: Track language usage and preferences

## Conclusion

This internationalization system provides a solid foundation for multi-language support with proper formatting and localization. It's designed to be extensible, performant, and developer-friendly while following React best practices.

For questions or contributions, please refer to the project documentation or create an issue in the repository.