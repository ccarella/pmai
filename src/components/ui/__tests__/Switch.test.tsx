import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from '../Switch'

describe('Switch', () => {
  it('should render unchecked switch', () => {
    const handleChange = jest.fn()
    render(<Switch checked={false} onCheckedChange={handleChange} />)
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('aria-checked', 'false')
  })

  it('should render checked switch', () => {
    const handleChange = jest.fn()
    render(<Switch checked={true} onCheckedChange={handleChange} />)
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('aria-checked', 'true')
  })

  it('should call onCheckedChange when clicked', () => {
    const handleChange = jest.fn()
    render(<Switch checked={false} onCheckedChange={handleChange} />)
    
    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should toggle from checked to unchecked', () => {
    const handleChange = jest.fn()
    render(<Switch checked={true} onCheckedChange={handleChange} />)
    
    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)
    
    expect(handleChange).toHaveBeenCalledWith(false)
  })

  it('should be disabled when disabled prop is true', () => {
    const handleChange = jest.fn()
    render(<Switch checked={false} onCheckedChange={handleChange} disabled={true} />)
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()
    
    fireEvent.click(switchElement)
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('should apply custom id', () => {
    const handleChange = jest.fn()
    render(<Switch checked={false} onCheckedChange={handleChange} id="test-switch" />)
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('id', 'test-switch')
  })

  it('should apply custom className', () => {
    const handleChange = jest.fn()
    render(<Switch checked={false} onCheckedChange={handleChange} className="custom-class" />)
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('custom-class')
  })
})