import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children content', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-card-bg', 'rounded-lg', 'shadow-sm', 'p-6');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">Content</Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
    // Should still have default classes
    expect(card).toHaveClass('bg-card-bg', 'rounded-lg');
  });

  it('renders with title when provided', () => {
    render(
      <Card title="Card Title">
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Title').tagName).toBe('H3');
  });

  it('renders with subtitle when provided', () => {
    render(
      <Card title="Card Title" subtitle="Card subtitle">
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    const { container, rerender } = render(
      <Card variant="bordered">Content</Card>
    );
    let card = container.firstChild;
    expect(card).toHaveClass('border-2', 'border-accent/30');

    rerender(<Card variant="elevated">Content</Card>);
    card = container.firstChild;
    expect(card).toHaveClass('shadow-lg', 'shadow-accent/10');

    rerender(<Card variant="flat">Content</Card>);
    card = container.firstChild;
    expect(card).toHaveClass('border', 'border-border/50');
  });

  it('renders with header actions when provided', () => {
    const { container } = render(
      <Card 
        title="Card Title"
        headerAction={<button>Action</button>}
      >
        Content
      </Card>
    );
    
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('applies padding size correctly', () => {
    const { container, rerender } = render(
      <Card padding="sm">Content</Card>
    );
    let card = container.firstChild;
    expect(card).toHaveClass('p-4');

    rerender(<Card padding="md">Content</Card>);
    card = container.firstChild;
    expect(card).toHaveClass('p-6');

    rerender(<Card padding="lg">Content</Card>);
    card = container.firstChild;
    expect(card).toHaveClass('p-8');

    rerender(<Card padding="none">Content</Card>);
    card = container.firstChild;
    expect(card).not.toHaveClass('p-4', 'p-6', 'p-8');
  });

  it('handles click events when onClick is provided', () => {
    const handleClick = jest.fn();
    render(
      <Card onClick={handleClick}>
        Clickable card
      </Card>
    );
    
    const card = screen.getByText('Clickable card').parentElement;
    expect(card).toHaveClass('cursor-pointer', 'hover:shadow-lg');
    
    card?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Card footer={<div>Footer content</div>}>
        Main content
      </Card>
    );
    
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});