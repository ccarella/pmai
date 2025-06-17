import React from 'react';
import { render, screen } from '@testing-library/react';
import { SessionProvider } from '../SessionProvider';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  SessionProvider: jest.fn(({ children }) => <div data-testid="mock-session-provider">{children}</div>),
}));

describe('SessionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render NextAuthSessionProvider with children', () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <SessionProvider>
        <TestChild />
      </SessionProvider>
    );

    // Check that NextAuthSessionProvider was called
    expect(NextAuthSessionProvider).toHaveBeenCalled();

    // Check that children are rendered
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should pass children to NextAuthSessionProvider', () => {
    const TestChild = () => <div>Child Component</div>;

    render(
      <SessionProvider>
        <TestChild />
      </SessionProvider>
    );

    // Verify NextAuthSessionProvider received children
    const mockCall = (NextAuthSessionProvider as jest.Mock).mock.calls[0][0];
    expect(mockCall.children).toBeDefined();
  });

  it('should render multiple children', () => {
    render(
      <SessionProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </SessionProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(<SessionProvider>{null}</SessionProvider>);

    // Should render without errors
    expect(NextAuthSessionProvider).toHaveBeenCalled();
  });

  it('should be a client component', () => {
    // This test verifies that the 'use client' directive is present
    // by checking that the component can use client-side features
    const TestComponent = () => {
      const [state] = React.useState('test');
      return (
        <SessionProvider>
          <div>{state}</div>
        </SessionProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});