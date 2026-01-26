'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type GenderFilter = 'ALL' | 'W' | 'M'

interface GenderFilterProps {
  value: GenderFilter
  onChange: (value: GenderFilter) => void
  className?: string
}

export function GenderFilter({ value, onChange, className }: GenderFilterProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={value === 'ALL' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('ALL')}
      >
        ALL
      </Button>
      <Button
        variant={value === 'W' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('W')}
      >
        W
      </Button>
      <Button
        variant={value === 'M' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('M')}
      >
        M
      </Button>
    </div>
  )
}
