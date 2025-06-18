export const mockLocation = () => {
  // Store original location
  const originalLocation = window.location;

  // Remove the existing location property
  delete (window as any).location;

  // Define a new location with mocked properties
  window.location = {
    ...originalLocation,
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  } as any;

  return window.location;
};