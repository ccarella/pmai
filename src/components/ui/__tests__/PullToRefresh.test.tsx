import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PullToRefresh } from '../PullToRefresh';

describe('PullToRefresh', () => {
  const defaultProps = {
    isRefreshing: false,
    pullDistance: 0,
    isPulling: false,
    threshold: 80,
    children: <div>Test Content</div>,
  };

  it('should render children correctly', () => {
    render(<PullToRefresh {...defaultProps} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show pull indicator when pulling', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isPulling={true} pullDistance={40} />
    );

    const indicator = container.querySelector('.w-12.h-12');
    expect(indicator).toBeInTheDocument();
    expect(indicator?.parentElement).toHaveStyle({ opacity: '0.5' }); // 40/80 = 0.5
  });

  it('should hide pull indicator when not pulling', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isPulling={false} pullDistance={0} />
    );

    const indicator = container.querySelector('.w-12.h-12');
    expect(indicator?.parentElement).toHaveStyle({ opacity: '0' });
  });

  it('should show refresh message when refreshing', () => {
    render(<PullToRefresh {...defaultProps} isRefreshing={true} />);
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('should translate content when pulling', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isPulling={true} pullDistance={50} />
    );

    const content = container.querySelectorAll('div[style*="transform"]')[1]; // Get content div, not indicator
    expect(content).toHaveStyle({ transform: 'translateY(50px)' });
  });

  it('should not translate content when refreshing', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isPulling={true} isRefreshing={true} pullDistance={50} />
    );

    const content = container.querySelectorAll('div[style*="transform"]')[1]; // Get content div, not indicator
    expect(content).toHaveStyle({ transform: 'translateY(0)' });
  });

  it('should animate spinner when refreshing', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isRefreshing={true} />
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should pulse indicator background when refreshing', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isRefreshing={true} />
    );

    const indicatorBg = container.querySelector('.animate-pulse');
    expect(indicatorBg).toBeInTheDocument();
  });

  it('should calculate correct rotation based on pull percentage', () => {
    const { container, rerender } = render(
      <PullToRefresh {...defaultProps} isPulling={true} pullDistance={40} />
    );

    let spinner = container.querySelector('svg');
    expect(spinner).toHaveStyle({ transform: 'rotate(90deg) scale(0.75)' }); // 40/80 = 0.5, rotation = 90deg, scale = 0.75

    rerender(
      <PullToRefresh {...defaultProps} isPulling={true} pullDistance={80} />
    );

    spinner = container.querySelector('svg');
    expect(spinner).toHaveStyle({ transform: 'rotate(180deg) scale(1)' }); // 80/80 = 1, rotation = 180deg, scale = 1
  });

  it('should cap pull percentage at 100%', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isPulling={true} pullDistance={120} />
    );

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveStyle({ transform: 'rotate(180deg) scale(1)' }); // Capped at max values
  });

  it('should use custom threshold', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isPulling={true} pullDistance={50} threshold={100} />
    );

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveStyle({ transform: 'rotate(90deg) scale(0.75)' }); // 50/100 = 0.5
  });

  it('should show indicator during refresh even without pulling', () => {
    const { container } = render(
      <PullToRefresh {...defaultProps} isRefreshing={true} isPulling={false} pullDistance={80} />
    );

    const indicator = container.querySelector('.w-12.h-12');
    const opacity = indicator?.parentElement?.style.opacity;
    expect(opacity).toBeDefined();
    expect(parseFloat(opacity || '0')).toBeGreaterThan(0);
  });
});