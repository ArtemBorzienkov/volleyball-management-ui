import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Player } from '@/lib/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/components/ongoing/new-player-inline', () => ({
  NewPlayerInlineForm: () => <div data-testid="new-player-form" />,
}))

import { SoloPlayerDraftEditor } from './solo-player-draft-editor'

const player = (id: string, name: string) => ({ id, name, active: true } as Player)
const players = [player('p1', 'Ann'), player('p2', 'Bob'), player('p3', 'Cid')]

const addButton = () => screen.getByRole('button', { name: /ongoing\.create\.addSoloPlayer/ })

describe('SoloPlayerDraftEditor', () => {
  it('starts with no rows and only an add control', () => {
    render(<SoloPlayerDraftEditor playerIds={[]} players={players} onChange={vi.fn()} />)

    expect(addButton()).toBeInTheDocument()
    expect(document.querySelectorAll('input[id^="solo-"]')).toHaveLength(0)
  })

  it('appends an empty row when adding', () => {
    const onChange = vi.fn()
    render(<SoloPlayerDraftEditor playerIds={['p1']} players={players} onChange={onChange} />)

    fireEvent.click(addButton())

    expect(onChange).toHaveBeenCalledWith(['p1', ''])
  })

  it('renders one select per row, in order', () => {
    render(<SoloPlayerDraftEditor playerIds={['p1', 'p2']} players={players} onChange={vi.fn()} />)

    expect((document.querySelector('#solo-0') as HTMLInputElement).value).toBe('Ann')
    expect((document.querySelector('#solo-1') as HTMLInputElement).value).toBe('Bob')
  })

  it('writes a pick into the row it was made in, not another', async () => {
    // The rows share a component, so an index mix-up would silently overwrite a different entrant.
    const onChange = vi.fn()
    render(<SoloPlayerDraftEditor playerIds={['', '']} players={players} onChange={onChange} />)

    fireEvent.mouseDown(document.querySelector('#solo-1') as HTMLElement)
    const option = await screen.findByText('Cid')
    fireEvent.mouseDown(option)

    expect(onChange).toHaveBeenCalledWith(['', 'p3'])
  })

  it('writes into the first row when the pick is made there', async () => {
    const onChange = vi.fn()
    render(<SoloPlayerDraftEditor playerIds={['', '']} players={players} onChange={onChange} />)

    fireEvent.mouseDown(document.querySelector('#solo-0') as HTMLElement)
    const option = await screen.findByText('Ann')
    fireEvent.mouseDown(option)

    expect(onChange).toHaveBeenCalledWith(['p1', ''])
  })

  it('removes the row that was dismissed, leaving the others', () => {
    const onChange = vi.fn()
    render(<SoloPlayerDraftEditor playerIds={['p1', 'p2', 'p3']} players={players} onChange={onChange} />)

    const removes = screen.getAllByRole('button', { name: /ongoing\.create\.removeSoloPlayer/ })
    fireEvent.click(removes[1])

    expect(onChange).toHaveBeenCalledWith(['p1', 'p3'])
  })

  it('does not offer a player already picked in another row', async () => {
    render(<SoloPlayerDraftEditor playerIds={['p1', '']} players={players} onChange={vi.fn()} />)

    fireEvent.mouseDown(document.querySelector('#solo-1') as HTMLElement)

    expect(await screen.findByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Ann')).not.toBeInTheDocument()
  })

  it('does not offer a player already committed to a team', async () => {
    render(
      <SoloPlayerDraftEditor
        playerIds={['']}
        players={players}
        unavailablePlayerIds={['p2']}
        onChange={vi.fn()}
      />,
    )

    fireEvent.mouseDown(document.querySelector('#solo-0') as HTMLElement)

    expect(await screen.findByText('Ann')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
  })

  it('still offers the row’s own current pick, so it can be re-selected', async () => {
    render(<SoloPlayerDraftEditor playerIds={['p1']} players={players} onChange={vi.fn()} />)

    fireEvent.mouseDown(document.querySelector('#solo-0') as HTMLElement)

    expect(await screen.findByText('Ann')).toBeInTheDocument()
  })

  it('opens the inline create-player form for one row at a time', () => {
    render(<SoloPlayerDraftEditor playerIds={['', '']} players={players} onChange={vi.fn()} />)

    const plus = screen.getAllByRole('button', { name: /calendar\.addNewPlayer/ })
    fireEvent.click(plus[0])

    expect(screen.getByTestId('new-player-form')).toBeInTheDocument()
    expect(plus[1]).toBeDisabled()
  })
})
