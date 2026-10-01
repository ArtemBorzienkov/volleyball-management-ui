import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import type { CourtDraft } from '@/lib/ongoing-courts'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key),
  }),
}))

import { CourtListEditor } from './court-list-editor'

const draft = (label: string, fromRound = '1', toRound = '') => ({ label, fromRound, toRound })

// Holds the list the way the forms do, and exposes the latest value to the test.
function Harness({ initial, locked = false, onValue }: { initial: CourtDraft[]; locked?: boolean; onValue?: (courts: CourtDraft[]) => void }) {
  const [courts, setCourts] = useState(initial)
  return (
    <CourtListEditor
      courts={courts}
      isStructureLocked={locked}
      onChange={(next) => {
        setCourts(next)
        onValue?.(next)
      }}
    />
  )
}

const labelInput = (position: number) =>
  screen.getByLabelText(`ongoing.courts.labelFor {"position":${position}}`) as HTMLInputElement
const button = (key: string, position?: number) =>
  screen.getByLabelText(position === undefined ? key : `${key} {"position":${position}}`) as HTMLButtonElement

describe('CourtListEditor', () => {
  it('shows one row per court, in order', () => {
    render(<Harness initial={[draft('5'), draft('7'), draft('9', '1', '4')]} />)

    expect([1, 2, 3].map((position) => labelInput(position).value)).toEqual(['5', '7', '9'])
    expect((screen.getByLabelText('ongoing.courts.toRoundFor {"position":3}') as HTMLInputElement).value).toBe('4')
  })

  it('adds a court open all day with the next free number', () => {
    const onValue = vi.fn()
    render(<Harness initial={[draft('1'), draft('2')]} onValue={onValue} />)

    fireEvent.click(screen.getByText('ongoing.courts.add'))

    expect(onValue).toHaveBeenLastCalledWith([draft('1'), draft('2'), draft('3')])
  })

  it('renames a court', () => {
    const onValue = vi.fn()
    render(<Harness initial={[draft('1')]} onValue={onValue} />)

    fireEvent.change(labelInput(1), { target: { value: 'Центр' } })

    expect(onValue).toHaveBeenLastCalledWith([draft('Центр')])
  })

  it('sets a court’s last round', () => {
    const onValue = vi.fn()
    render(<Harness initial={[draft('1'), draft('2')]} onValue={onValue} />)

    fireEvent.change(screen.getByLabelText('ongoing.courts.toRoundFor {"position":2}'), { target: { value: '4' } })

    expect(onValue).toHaveBeenLastCalledWith([draft('1'), draft('2', '1', '4')])
  })

  // List order is fill order, so moving a court is how the organiser picks the main court.
  it('moves a court up and down', () => {
    const onValue = vi.fn()
    render(<Harness initial={[draft('5'), draft('7'), draft('9')]} onValue={onValue} />)

    fireEvent.click(button('ongoing.courts.moveUp', 3))
    expect(onValue).toHaveBeenLastCalledWith([draft('5'), draft('9'), draft('7')])

    fireEvent.click(button('ongoing.courts.moveDown', 1))
    expect(onValue).toHaveBeenLastCalledWith([draft('9'), draft('5'), draft('7')])
  })

  it('cannot move the first court up or the last one down', () => {
    render(<Harness initial={[draft('5'), draft('7')]} />)

    expect(button('ongoing.courts.moveUp', 1)).toBeDisabled()
    expect(button('ongoing.courts.moveDown', 2)).toBeDisabled()
  })

  it('removes a court, but never the last one', () => {
    const onValue = vi.fn()
    render(<Harness initial={[draft('5'), draft('7')]} onValue={onValue} />)

    fireEvent.click(button('ongoing.courts.remove', 1))

    expect(onValue).toHaveBeenLastCalledWith([draft('7')])
    expect(button('ongoing.courts.remove', 1)).toBeDisabled()
  })

  it('says what is wrong with the list', () => {
    render(<Harness initial={[draft('A'), draft('a')]} />)

    expect(screen.getByText(/ongoing\.courts\.errorDuplicate/)).toBeInTheDocument()
  })

  // After the first result only renames are safe.
  describe('with the structure locked', () => {
    it('keeps the names editable', () => {
      render(<Harness initial={[draft('5'), draft('7')]} locked />)

      expect(labelInput(1)).not.toBeDisabled()
    })

    it('locks rounds, order, adding and removing, and says why', () => {
      render(<Harness initial={[draft('5'), draft('7')]} locked />)

      expect(screen.getByLabelText('ongoing.courts.fromRoundFor {"position":1}')).toBeDisabled()
      expect(screen.getByLabelText('ongoing.courts.toRoundFor {"position":1}')).toBeDisabled()
      expect(button('ongoing.courts.moveDown', 1)).toBeDisabled()
      expect(button('ongoing.courts.remove', 1)).toBeDisabled()
      expect(screen.getByText('ongoing.courts.add').closest('button')).toBeDisabled()
      expect(screen.getByText('ongoing.courts.lockedHint')).toBeInTheDocument()
    })
  })
})
