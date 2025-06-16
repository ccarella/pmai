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

  it('renders the settings gear icon link', () => {
    render(<Header />);
    const settingsLink = screen.getByTitle('Settings');
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('has proper styling classes', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed', 'top-0', 'z-50');
  });
});