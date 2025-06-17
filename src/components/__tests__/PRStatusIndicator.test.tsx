import React from 'react';
import { render, screen } from '@testing-library/react';
import { PRStatusIndicator } from '../PRStatusIndicator';
import '@testing-library/jest-dom';

describe('PRStatusIndicator', () => {
  it('renders success status correctly', () => {
    render(<PRStatusIndicator status="success" />);
    
    const indicator = screen.getByLabelText('All tests passed');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('title', 'All tests passed');
    expect(indicator).toHaveClass('flex', 'items-center', 'gap-1.5');
    
    const icon = indicator.querySelector('svg');
    expect(icon).toBeInTheDocument();
    
    const iconContainer = indicator.querySelector('div');
    expect(iconContainer).toHaveClass('text-green-500', 'bg-green-500/20');
  });

  it('renders failure status correctly', () => {
    render(<PRStatusIndicator status="failure" />);
    
    const indicator = screen.getByLabelText('Tests failed');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('title', 'Tests failed');
    
    const iconContainer = indicator.querySelector('div');
    expect(iconContainer).toHaveClass('text-red-500', 'bg-red-500/20');
  });

  it('renders pending status correctly', () => {
    render(<PRStatusIndicator status="pending" />);
    
    const indicator = screen.getByLabelText('Tests running');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('title', 'Tests running');
    
    const iconContainer = indicator.querySelector('div');
    expect(iconContainer).toHaveClass('text-orange-500', 'bg-orange-500/20');
  });

  it('renders unknown status correctly', () => {
    render(<PRStatusIndicator status="unknown" />);
    
    const indicator = screen.getByLabelText('No test status available');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('title', 'No test status available');
    
    const iconContainer = indicator.querySelector('div');
    expect(iconContainer).toHaveClass('text-muted-foreground', 'bg-muted-foreground/20');
  });

  it('applies custom className', () => {
    render(<PRStatusIndicator status="success" className="custom-class" />);
    
    const indicator = screen.getByLabelText('All tests passed');
    expect(indicator).toHaveClass('custom-class');
  });

  it('includes screen reader text', () => {
    render(<PRStatusIndicator status="success" />);
    
    const srText = screen.getByText('All tests passed');
    expect(srText).toHaveClass('sr-only');
  });
});