import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('renders spinner variant by default', () => {
    render(<LoadingState message="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dots variant', () => {
    render(<LoadingState variant="dots" />);
    
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('renders skeleton variant', () => {
    render(<LoadingState variant="skeleton" />);
    
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders progress variant with percentage', () => {
    render(<LoadingState variant="progress" progress={75} message="Uploading..." />);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles different sizes', () => {
    const { rerender } = render(<LoadingState size="sm" />);
    expect(document.querySelector('.h-4')).toBeInTheDocument();
    
    rerender(<LoadingState size="lg" />);
    expect(document.querySelector('.h-8')).toBeInTheDocument();
  });
});