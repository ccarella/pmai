// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock PointerEvent for Framer Motion
global.PointerEvent = class PointerEvent extends MouseEvent {
  constructor(type, props) {
    super(type, props)
    this.pointerId = props?.pointerId || 0
    this.width = props?.width || 1
    this.height = props?.height || 1
    this.pressure = props?.pressure || 0
    this.tangentialPressure = props?.tangentialPressure || 0
    this.tiltX = props?.tiltX || 0
    this.tiltY = props?.tiltY || 0
    this.twist = props?.twist || 0
    this.pointerType = props?.pointerType || 'mouse'
    this.isPrimary = props?.isPrimary || false
  }
}

// Mock animation utils
jest.mock('@/lib/animations/utils', () => ({
  getRippleOrigin: jest.fn(() => ({ x: 50, y: 50 }))
}))