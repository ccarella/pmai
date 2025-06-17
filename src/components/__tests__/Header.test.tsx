import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  it('renders the PMAI logo as a link to home', () => {
    render(<Header />);
    const logoLink = screen.getByText('PMAI');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('does not render the settings gear icon link', () => {
    render(<Header />);
    const settingsLink = screen.queryByTitle('Settings');
    expect(settingsLink).not.toBeInTheDocument();
  });

  it('renders settings tab in navigation', () => {
    render(<Header />);
    const settingsTab = screen.getByRole('link', { name: 'Settings' });
    expect(settingsTab).toBeInTheDocument();
    expect(settingsTab).toHaveAttribute('href', '/settings');
  });

  it('has proper styling classes', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed', 'top-0', 'z-50');
  });
});