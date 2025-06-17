'use client'

import React from 'react'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
}

export function Switch({ 
  checked, 
  onCheckedChange, 
  disabled = false,
  id,
  className = ''
}: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        ${checked ? 'bg-accent' : 'bg-input-bg border border-border'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-6 bg-white' : 'translate-x-1 bg-muted'}
        `}
      />
    </button>
  )
}