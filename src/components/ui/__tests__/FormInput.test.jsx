import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormInput from '../FormInput';

describe('FormInput', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnBlur.mockClear();
  });

  it('renders input with label', () => {
    render(
      <FormInput
        name="email"
        label="Email Address"
        value=""
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('shows error state when touched and has error', () => {
    render(
      <FormInput
        name="email"
        label="Email"
        value="invalid-email"
        onChange={mockOnChange}
        error="Invalid email format"
        touched={true}
      />
    );
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-300');
  });

  it('shows success state when touched and valid', () => {
    render(
      <FormInput
        name="email"
        label="Email"
        value="test@example.com"
        onChange={mockOnChange}
        touched={true}
      />
    );
    
    expect(screen.getByText('Looks good!')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-green-300');
  });

  it('calls onChange when input value changes', () => {
    render(
      <FormInput
        name="email"
        value=""
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('email', 'test@example.com');
  });

  it('calls onBlur when input loses focus', () => {
    render(
      <FormInput
        name="email"
        value=""
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    
    expect(mockOnBlur).toHaveBeenCalledWith('email');
  });

  it('shows password toggle for password inputs', () => {
    render(
      <FormInput
        name="password"
        type="password"
        value="secret"
        onChange={mockOnChange}
        showPasswordToggle={true}
      />
    );
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  it('shows required indicator', () => {
    render(
      <FormInput
        name="email"
        label="Email"
        value=""
        onChange={mockOnChange}
        required={true}
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});