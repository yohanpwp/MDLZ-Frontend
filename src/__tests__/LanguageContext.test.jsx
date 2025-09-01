import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

// Test component that uses the language context
const TestComponent = () => {
  const { t, currentLanguage, setLanguage, languages } = useLanguage();
  
  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="translated-text">{t('common.loading')}</div>
      <div data-testid="invoice-title">{t('invoice.title')}</div>
      <button 
        onClick={() => setLanguage('th')} 
        data-testid="switch-to-thai"
      >
        Switch to Thai
      </button>
      <button 
        onClick={() => setLanguage('en')} 
        data-testid="switch-to-english"
      >
        Switch to English
      </button>
      <div data-testid="available-languages">
        {Object.keys(languages).join(', ')}
      </div>
    </div>
  );
};

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('LanguageContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('provides default language (English)', () => {
    renderWithLanguageProvider(<TestComponent />);
    
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('invoice-title')).toHaveTextContent('Invoice Validation System');
  });

  it('switches language to Thai', async () => {
    renderWithLanguageProvider(<TestComponent />);
    
    // Initially English
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Loading...');
    
    // Switch to Thai
    fireEvent.click(screen.getByTestId('switch-to-thai'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('th');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('กำลังโหลด...');
      expect(screen.getByTestId('invoice-title')).toHaveTextContent('ระบบตรวจสอบใบแจ้งหนี้');
    });
  });

  it('switches back to English from Thai', async () => {
    renderWithLanguageProvider(<TestComponent />);
    
    // Switch to Thai first
    fireEvent.click(screen.getByTestId('switch-to-thai'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('th');
    });
    
    // Switch back to English
    fireEvent.click(screen.getByTestId('switch-to-english'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Loading...');
      expect(screen.getByTestId('invoice-title')).toHaveTextContent('Invoice Validation System');
    });
  });

  it('provides available languages', () => {
    renderWithLanguageProvider(<TestComponent />);
    
    expect(screen.getByTestId('available-languages')).toHaveTextContent('en, th');
  });

  it('handles missing translation keys gracefully', () => {
    const TestMissingKey = () => {
      const { t } = useLanguage();
      return <div data-testid="missing-key">{t('nonexistent.key')}</div>;
    };

    renderWithLanguageProvider(<TestMissingKey />);
    
    // Should return the key itself as fallback
    expect(screen.getByTestId('missing-key')).toHaveTextContent('nonexistent.key');
  });

  it('handles parameter interpolation', () => {
    const TestInterpolation = () => {
      const { t } = useLanguage();
      return (
        <div data-testid="interpolated-text">
          {t('offline.pendingSync', { count: 5 })}
        </div>
      );
    };

    renderWithLanguageProvider(<TestInterpolation />);
    
    expect(screen.getByTestId('interpolated-text')).toHaveTextContent('5 operations pending sync');
  });

  it('persists language preference in localStorage', async () => {
    renderWithLanguageProvider(<TestComponent />);
    
    // Switch to Thai
    fireEvent.click(screen.getByTestId('switch-to-thai'));
    
    await waitFor(() => {
      expect(localStorage.getItem('preferred-language')).toBe('th');
    });
    
    // Switch to English
    fireEvent.click(screen.getByTestId('switch-to-english'));
    
    await waitFor(() => {
      expect(localStorage.getItem('preferred-language')).toBe('en');
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    const TestWithoutProvider = () => {
      const { t } = useLanguage();
      return <div>{t('common.loading')}</div>;
    };

    expect(() => {
      render(<TestWithoutProvider />);
    }).toThrow('useLanguage must be used within a LanguageProvider');
    
    console.error = originalError;
  });
});

describe('Translation parameter interpolation', () => {
  it('handles multiple parameters', () => {
    const TestMultipleParams = () => {
      const { t } = useLanguage();
      // We'll need to add this to our translation files for the test
      return (
        <div data-testid="multiple-params">
          {t('offline.pendingSync', { count: 3 })}
        </div>
      );
    };

    renderWithLanguageProvider(<TestMultipleParams />);
    
    expect(screen.getByTestId('multiple-params')).toHaveTextContent('3 operations pending sync');
  });

  it('handles missing parameters gracefully', () => {
    const TestMissingParams = () => {
      const { t } = useLanguage();
      return (
        <div data-testid="missing-params">
          {t('offline.pendingSync')} {/* No count parameter provided */}
        </div>
      );
    };

    renderWithLanguageProvider(<TestMissingParams />);
    
    // Should keep the placeholder when parameter is missing
    expect(screen.getByTestId('missing-params')).toHaveTextContent('{{count}} operations pending sync');
  });
});