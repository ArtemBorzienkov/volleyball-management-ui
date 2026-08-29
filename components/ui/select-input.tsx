'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Plus } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface SelectInputOption {
  value: string
  label: string
  /** Secondary line under the label inside the menu — a rating, a hint, a status. */
  subtitle?: string
  disabled?: boolean
}

export interface SelectInputProps {
  options: SelectInputOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  /** Helper text under the field. Hidden while `error` is set — the error takes that line. */
  info?: string
  disabled?: boolean
  required?: boolean
  name?: string
  className?: string
  triggerClassName?: string
  size?: 'sm' | 'default'
  /** Extra entry pinned to the bottom of the menu, e.g. "＋ Create new player". */
  addNewOption?: { label: string; onClick: () => void }
}

const ADD_NEW_INDEX = -2

/**
 * Single-select combobox: the field itself is a text input, and typing narrows the dropdown.
 *
 * The API mirrors `select-field` in the reusables monorepo (options with label/subtitle/disabled,
 * label, error, info, addNewOption) so the two read the same. The implementation is a Radix Popover
 * anchored on the input rather than react-select — this app has neither react-select nor the
 * FontAwesome Pro icons that package depends on.
 */
export function SelectInput({
  options,
  value,
  onChange,
  label,
  placeholder,
  error,
  info,
  disabled,
  required,
  name,
  className,
  triggerClassName,
  size = 'default',
  addNewOption,
}: SelectInputProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)
  const normalisedQuery = query.trim().toLowerCase()
  const visibleOptions = normalisedQuery
    ? options.filter((option) =>
        `${option.label} ${option.subtitle ?? ''}`.toLowerCase().includes(normalisedQuery),
      )
    : options

  // The field shows what you typed while the menu is open, and the chosen label the rest of the
  // time — so the selection is never hidden behind a stale search string.
  const displayValue = isOpen ? query : selectedOption?.label ?? ''

  const open = () => {
    if (disabled) return
    setQuery('')
    setActiveIndex(0)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setQuery('')
  }

  const commit = (index: number) => {
    if (index === ADD_NEW_INDEX) {
      addNewOption?.onClick()
      close()
      return
    }
    const option = visibleOptions[index]
    if (!option || option.disabled) return
    onChange(option.value)
    close()
  }

  const selectableIndexes = [
    ...visibleOptions.map((option, index) => (option.disabled ? null : index)).filter((i): i is number => i !== null),
    ...(addNewOption ? [ADD_NEW_INDEX] : []),
  ]

  const moveActive = (step: number) => {
    if (!selectableIndexes.length) return
    const current = selectableIndexes.indexOf(activeIndex)
    const next = current === -1 ? 0 : (current + step + selectableIndexes.length) % selectableIndexes.length
    setActiveIndex(selectableIndexes[next])
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        open()
        return
      }
      moveActive(event.key === 'ArrowDown' ? 1 : -1)
      return
    }
    if (event.key === 'Enter' && isOpen) {
      event.preventDefault()
      commit(activeIndex)
      return
    }
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      close()
    }
  }

  const optionId = (index: number) => `${name ?? 'select'}-option-${index}`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium" htmlFor={name} suppressHydrationWarning>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
        <PopoverAnchor asChild>
          <div className="relative">
            <input
              ref={inputRef}
              id={name}
              name={name}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={isOpen ? `${name ?? 'select'}-listbox` : undefined}
              aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="off"
              disabled={disabled}
              placeholder={selectedOption && !isOpen ? undefined : placeholder}
              value={displayValue}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
                if (!isOpen) setIsOpen(true)
              }}
              // mousedown, not click/focus: selecting an option closes the menu on ITS mousedown, and
              // the trailing click would then land on this input and reopen what the user just closed.
              onMouseDown={() => {
                if (!isOpen) open()
              }}
              onKeyDown={handleKeyDown}
              className={cn(
                'border-input aria-invalid:border-destructive dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 pr-8 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                size === 'sm' ? 'h-8' : 'h-9',
                triggerClassName,
              )}
            />
            <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-1"
          // Focus stays in the input so typing keeps filtering; the list is driven by
          // aria-activedescendant rather than by moving focus into it.
          onOpenAutoFocus={(event) => event.preventDefault()}
          // The input is the anchor, not the trigger, so it sits OUTSIDE this dismissable layer:
          // the very pointerdown that opened the menu would otherwise be read as a click-away and
          // shut it again. Same for the focus the input keeps holding.
          onPointerDownOutside={(event) => {
            if (inputRef.current?.contains(event.target as Node)) event.preventDefault()
          }}
          onFocusOutside={(event) => {
            if (inputRef.current?.contains(event.target as Node)) event.preventDefault()
          }}
        >
          <div
            ref={listRef}
            id={`${name ?? 'select'}-listbox`}
            role="listbox"
            className="max-h-60 overflow-y-auto"
          >
            {!visibleOptions.length && !addNewOption && (
              <p className="text-muted-foreground px-2 py-1.5 text-sm" suppressHydrationWarning>
                {t('common.noMatches')}
              </p>
            )}

            {visibleOptions.map((option, index) => (
              <div
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  // Mouse-down, not click: a click would first blur the input and close the popover.
                  event.preventDefault()
                  commit(index)
                }}
                className={cn(
                  'flex cursor-pointer flex-col rounded-sm px-2 py-1.5 text-sm',
                  index === activeIndex && 'bg-accent text-accent-foreground',
                  option.disabled && 'pointer-events-none opacity-50',
                )}
              >
                <span>{option.label}</span>
                {option.subtitle && <span className="text-muted-foreground text-xs">{option.subtitle}</span>}
              </div>
            ))}

            {addNewOption && (
              <div
                id={optionId(ADD_NEW_INDEX)}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActiveIndex(ADD_NEW_INDEX)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  commit(ADD_NEW_INDEX)
                }}
                className={cn(
                  'text-primary flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium',
                  activeIndex === ADD_NEW_INDEX && 'bg-accent text-accent-foreground',
                )}
              >
                <Plus className="size-4" />
                {addNewOption.label}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : info ? (
        <p className="text-muted-foreground text-xs" suppressHydrationWarning>
          {info}
        </p>
      ) : null}
    </div>
  )
}
