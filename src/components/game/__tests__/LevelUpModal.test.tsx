import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LevelUpModal from '../LevelUpModal'
import * as gameStore from '../../../store/gameStore'
import type { GameStore } from '../../../types'

// Mock the game store
jest.mock('../../../store/gameStore')
const mockUseGameStore = gameStore.useGameStore as jest.MockedFunction<typeof gameStore.useGameStore>

describe('LevelUpModal Component', () => {
  const mockUpdateStats = jest.fn()
  const mockOnClose = jest.fn()

  const defaultGameState: Partial<GameStore> = {
    currentSession: {
      id: '1',
      user_id: 'test-user',
      character_name: 'Test Hero',
      character_class: 'warrior',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      game_state: {
        level: 2,
        health: 100,
        maxHealth: 100,
        experience: 0,
        currentScene: 0,
        inventory: [],
        stats: {
          strength: 15,
          dexterity: 10,
          intelligence: 10,
          wisdom: 10,
          constitution: 14,
          charisma: 10
        }
      }
    },
    updateStats: mockUpdateStats,
    loading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGameStore.mockReturnValue(defaultGameState as GameStore)
  })

  test('renders level up modal when character levels up', () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={3}
      />
    )

    expect(screen.getByText('Level Up!')).toBeInTheDocument()
    expect(screen.getByText('Congratulations! You have reached level 2')).toBeInTheDocument()
    expect(screen.getByText('You have 3 attribute points to distribute')).toBeInTheDocument()
  })

  test('displays all character attributes with increment buttons', () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={3}
      />
    )

    expect(screen.getByText('Strength')).toBeInTheDocument()
    expect(screen.getByText('Dexterity')).toBeInTheDocument()
    expect(screen.getByText('Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Wisdom')).toBeInTheDocument()
    expect(screen.getByText('Constitution')).toBeInTheDocument()
    expect(screen.getByText('Charisma')).toBeInTheDocument()

    // Check that all stats have + buttons
    const incrementButtons = screen.getAllByText('+')
    expect(incrementButtons).toHaveLength(6)
  })

  test('allows incrementing attributes when points are available', async () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={3}
      />
    )

    const strengthIncrement = screen.getAllByText('+')[0]
    fireEvent.click(strengthIncrement)

    await waitFor(() => {
      expect(screen.getByText('You have 2 attribute points to distribute')).toBeInTheDocument()
    })
  })

  test('prevents incrementing when no points available', () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={0}
      />
    )

    const incrementButtons = screen.getAllByText('+')
    incrementButtons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  test('shows confirm button only when all points are spent', () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={0}
      />
    )

    expect(screen.getByText('Confirm Changes')).toBeInTheDocument()
    expect(screen.getByText('Confirm Changes')).not.toBeDisabled()
  })

  test('disables confirm button when points remain', () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={3}
      />
    )

    const confirmButton = screen.getByText('Confirm Changes')
    expect(confirmButton).toBeDisabled()
  })

  test('calls updateStats and onClose when confirming changes', async () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={0}
      />
    )

    const confirmButton = screen.getByText('Confirm Changes')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockUpdateStats).toHaveBeenCalledWith(expect.objectContaining({
        strength: expect.any(Number),
        dexterity: expect.any(Number),
        intelligence: expect.any(Number),
        wisdom: expect.any(Number),
        constitution: expect.any(Number),
        charisma: expect.any(Number)
      }))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  test('does not render when isOpen is false', () => {
    render(
      <LevelUpModal 
        isOpen={false}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={3}
      />
    )

    expect(screen.queryByText('Level Up!')).not.toBeInTheDocument()
  })

  test('prevents closing modal when points remain unspent', () => {
    render(
      <LevelUpModal 
        isOpen={true}
        onClose={mockOnClose}
        newLevel={2}
        availablePoints={3}
      />
    )

    // Try to close modal (if there's a close button)
    const modal = screen.getByRole('dialog', { hidden: true })
    fireEvent.keyDown(modal, { key: 'Escape' })

    expect(mockOnClose).not.toHaveBeenCalled()
  })
})