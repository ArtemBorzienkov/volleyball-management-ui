import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OngoingSoloPlayer, OngoingTeam } from '@/lib/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

import { OngoingEntrantsList } from './ongoing-entrants-list'

const team = (id: string, a: string, b: string, rating: number, registeredAt?: string) =>
  ({ id, player1: { id: a, name: a }, player2: { id: b, name: b }, rating, groupIndex: null, registeredAt }) as OngoingTeam

const solo = (id: string, name: string, rating: number, isAnonymous = false, registeredAt?: string) =>
  ({ id, player: { id: `p-${name}`, name, isAnonymous }, rating, registeredAt }) as OngoingSoloPlayer

describe('OngoingEntrantsList', () => {
  it('lists pairs strongest first', () => {
    render(
      <OngoingEntrantsList
        teams={[team('t1', 'Ann', 'Bob', 1800), team('t2', 'Cid', 'Dee', 2200)]}
        soloPlayers={[]}
        scheme="roundRobin"
      />,
    )

    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items[0]).toContain('Cid & Dee')
    expect(items[1]).toContain('Ann & Bob')
    expect(items[0]).toContain('2200')
  })

  it('lists partnerless entrants strongest first', () => {
    render(
      <OngoingEntrantsList teams={[]} soloPlayers={[solo('s1', 'Low', 900), solo('s2', 'High', 1500)]} scheme="roundRobin" />,
    )

    const text = document.body.textContent ?? ''
    expect(text.indexOf('High')).toBeLessThan(text.indexOf('Low'))
  })

  it('calls the pool "participants" for a rotation tournament', () => {
    render(<OngoingEntrantsList teams={[]} soloPlayers={[solo('s1', 'Ann', 1000)]} scheme="fullRotation" />)

    expect(screen.getByText('calendar.participants')).toBeInTheDocument()
    expect(screen.queryByText('calendar.soloPool')).not.toBeInTheDocument()
  })

  it('keeps the "without a partner" wording for pairs-based schemes', () => {
    render(<OngoingEntrantsList teams={[]} soloPlayers={[solo('s1', 'Ann', 1000)]} scheme="roundRobin" />)

    expect(screen.getByText('calendar.soloPool')).toBeInTheDocument()
  })

  it('shows both sections when a tournament has pairs and a pool', () => {
    render(
      <OngoingEntrantsList
        teams={[team('t1', 'Ann', 'Bob', 1800)]}
        soloPlayers={[solo('s1', 'Cid', 1000)]}
        scheme="roundRobin"
      />,
    )

    expect(screen.getByText('calendar.teams')).toBeInTheDocument()
    expect(screen.getByText('calendar.soloPool')).toBeInTheDocument()
  })

  it('masks an entrant who opted out of being named', () => {
    render(
      <OngoingEntrantsList teams={[]} soloPlayers={[solo('s1', 'Artem Borzienkov', 1000, true)]} scheme="roundRobin" />,
    )

    expect(screen.getByText(/Ar\*\*\* Bo\*\*\*/)).toBeInTheDocument()
    expect(screen.queryByText(/Borzienkov/)).not.toBeInTheDocument()
  })

  it('renders the empty text when given one and nobody has entered', () => {
    render(<OngoingEntrantsList teams={[]} soloPlayers={[]} scheme="roundRobin" emptyText="nobody yet" />)

    expect(screen.getByText('nobody yet')).toBeInTheDocument()
  })

  it('renders nothing at all when empty and given no empty text — the calendar card stays compact', () => {
    const { container } = render(<OngoingEntrantsList teams={[]} soloPlayers={[]} scheme="roundRobin" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('omits the pairs section entirely when there are none', () => {
    render(<OngoingEntrantsList teams={[]} soloPlayers={[solo('s1', 'Ann', 1000)]} scheme="roundRobin" />)

    expect(screen.queryByText('calendar.teams')).not.toBeInTheDocument()
  })
})

describe('OngoingEntrantsList — when each entry was made', () => {
  // A real instant, shown in the viewer's own timezone — so the assertions check the time is present
  // rather than pinning a formatting that depends on where the test runs.
  const at = '2026-09-01T18:30:00.000Z'

  it('shows when a pair entered', () => {
    render(
      <OngoingEntrantsList teams={[team('t1', 'Ann', 'Bob', 1800, at)]} soloPlayers={[]} scheme="roundRobin" />,
    )

    expect(screen.getByRole('listitem').textContent).toMatch(/\d{1,2}:\d{2}/)
    expect(screen.getByRole('listitem').textContent).toContain('Sep')
  })

  it('shows when a partnerless player entered', () => {
    render(<OngoingEntrantsList teams={[]} soloPlayers={[solo('s1', 'Cid', 1000, false, at)]} scheme="roundRobin" />)

    expect(document.body.textContent).toMatch(/Sep.*\d{1,2}:\d{2}/)
  })

  it('renders nothing extra when the payload carries no timestamp', () => {
    render(<OngoingEntrantsList teams={[team('t1', 'Ann', 'Bob', 1800)]} soloPlayers={[]} scheme="roundRobin" />)

    expect(screen.getByRole('listitem').textContent).not.toMatch(/\d{1,2}:\d{2}/)
  })

  it('ignores an unparseable timestamp rather than printing "Invalid Date"', () => {
    render(
      <OngoingEntrantsList teams={[team('t1', 'Ann', 'Bob', 1800, 'not-a-date')]} soloPlayers={[]} scheme="roundRobin" />,
    )

    expect(screen.getByRole('listitem').textContent).not.toMatch(/Invalid/)
  })
})
