"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export interface FilterState {
  state: string
  sort: string
  direction: string
}

interface IssueFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: Partial<FilterState>) => void
}

const statusOptions = [
  { value: 'open' as const, label: 'Open', color: 'bg-green-500' },
  { value: 'all' as const, label: 'All', color: 'bg-gray-500' },
  { value: 'closed' as const, label: 'Closed', color: 'bg-purple-500' },
]

const sortOptions = [
  { value: 'created-desc', label: 'Newest' },
  { value: 'created-asc', label: 'Oldest' },
  { value: 'updated-desc', label: 'Recently Updated' },
  { value: 'comments-desc', label: 'Most Commented' },
]

export function IssueFilters({ filters, onFiltersChange }: IssueFiltersProps) {
  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const currentStatus = statusOptions.find(option => option.value === filters.state)
  const currentSort = sortOptions.find(option => option.value === `${filters.sort}-${filters.direction}`)

  const handleStatusChange = (state: string) => {
    onFiltersChange({ state })
    setStatusSheetOpen(false)
  }

  const handleSortChange = (sortValue: string) => {
    const [sort, direction] = sortValue.split('-')
    onFiltersChange({ sort, direction })
    setSortSheetOpen(false)
  }

  return (
    <div className="flex px-4 py-2" style={{ gap: '4px' }}>
      {/* Status Filter Chip */}
      <Sheet open={statusSheetOpen} onOpenChange={setStatusSheetOpen}>
        <SheetTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border border-[#E1E1E1] bg-white px-4 text-sm text-[#4A4A4A] transition-all hover:border-[#B593F7] hover:bg-[#B593F7]/10 focus:border-[#B593F7] focus:outline-none active:bg-[#B593F7]/10"
            style={{ height: '40px', minHeight: '40px' }}
          >
            <span 
              className={`h-2 w-2 rounded-full flex-shrink-0 ${currentStatus?.color || 'bg-gray-500'}`} 
            />
            <span className="whitespace-nowrap">{currentStatus?.label || 'All'}</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Filter by Status</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <span className={`h-3 w-3 rounded-full ${option.color}`} />
                <span className="font-medium">{option.label}</span>
                {filters.state === option.value && (
                  <span className="ml-auto text-[#B593F7]">✓</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sort Filter Chip */}
      <Sheet open={sortSheetOpen} onOpenChange={setSortSheetOpen}>
        <SheetTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border border-[#E1E1E1] bg-white px-4 text-sm text-[#4A4A4A] transition-all hover:border-[#B593F7] hover:bg-[#B593F7]/10 focus:border-[#B593F7] focus:outline-none active:bg-[#B593F7]/10"
            style={{ height: '40px', minHeight: '40px' }}
          >
            <ChevronDown size={14} className="flex-shrink-0" />
            <span className="whitespace-nowrap">{currentSort?.label || 'Newest'}</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Sort by</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <span className="font-medium">{option.label}</span>
                {`${filters.sort}-${filters.direction}` === option.value && (
                  <span className="text-[#B593F7]">✓</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}