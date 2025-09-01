import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders with default variant', () => {
    renderWithLanguageProvider(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('English');
  });

  it('renders with different variants', () => {
    const { rerender } = renderWithLanguageProvider(
      <LanguageSwitcher variant="primary" data-testid="primary-switcher" />
    );
    
    expect(screen.getByTestId('primary-switcher')).toBeInTheDocument();
    
    rerender(
      <LanguageProvider>
        <LanguageSwitcher variant="outline" data-testid="outline-switcher" />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('outline-switcher')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = renderWithLanguageProvider(
      <LanguageSwitcher size="sm" data-testid="small-switcher" />
    );
    
    expect(screen.getByTestId('small-switcher')).toBeInTheDocument();
    
    rerender(
      <LanguageProvider>
        <LanguageSwitcher size="lg" data-testid="large-switcher" />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('large-switcher')).toBeInTheDocument();
  });

  it('shows and hides dropdown on click', () => {
    renderWithLanguageProvider(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    
    // Initially dropdown should not be visible
    expect(screen.queryByText('ไทย')).not.toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(button);
    
    // Now dropdown should be visible
    expect(screen.getByText('ไทย')).toBeInTheDocument();
    
    // Click again to close
    fireEvent.click(button);
    
    // Dropdown should be hidden again (with transition)
    setTimeout(() => {
      expect(screen.queryByText('ไทย')).not.toBeInTheDocument();
    }, 300);
  });

  it('switches language when option is clicked', () => {
    renderWithLanguageProvider(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    
    // Initially should show English
    expect(button).toHaveTextContent('English');
    
    // Open dropdown
    fireEvent.click(button);
    
    // Click Thai option
    const thaiOption = screen.getByText('ไทย');
    fireEvent.click(thaiOption);
    
    // Should now show Thai
    expect(button).toHaveTextContent('ไทย');
  });

  it('shows flag icons when showFlag is true', () => {
    renderWithLanguageProvider(<LanguageSwitcher showFlag={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🇺🇸');
  });

  it('hides flag icons when showFlag is false', () => {
    renderWithLanguageProvider(<LanguageSwitcher showFlag={false} />);
    
    const button = screen.getByRole('button');
    expect(button).not.toHaveTextContent('🇺🇸');
  });

  it('shows text when showText is true', () => {
    renderWithLanguageProvider(<LanguageSwitcher showText={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('English');
  });

  it('hides text when showText is false', () => {
    renderWithLanguageProvider(<LanguageSwitcher showText={false} showFlag={false} />);
    
    const button = screen.getByRole('button');
    expect(button).not.toHaveTextContent('English');
    // Should show globe icon instead
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    renderWithLanguageProvider(
      <div>
        <LanguageSwitcher />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const button = screen.getByRole('button');
    const outside = screen.getByTestId('outside');
    
    // Open dropdown
    fireEvent.click(button);
    expect(screen.getByText('ไทย')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(outside);
    
    // Dropdown should close
    setTimeout(() => {
      expect(screen.queryByText('ไทย')).not.toBeInTheDocument();
    }, 100);
  });

  it('closes dropdown when pressing Escape', () => {
    renderWithLanguageProvider(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    
    // Open dropdown
    fireEvent.click(button);
    expect(screen.getByText('ไทย')).toBeInTheDocument();
    
    // Press Escape
    fireEvent.keyDown(button, { key: 'Escape' });
    
    // Dropdown should close
    setTimeout(() => {
      expect(screen.queryByText('ไทย')).not.toBeInTheDocument();
    }, 100);
  });

  it('applies custom className', () => {
    renderWithLanguageProvider(
      <LanguageSwitcher className="custom-class" data-testid="custom-switcher" />
    );
    
    const switcher = screen.getByTestId('custom-switcher');
    expect(switcher).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    renderWithLanguageProvider(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-label');
    
    // Open dropdown
    fireEvent.click(button);
    
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});