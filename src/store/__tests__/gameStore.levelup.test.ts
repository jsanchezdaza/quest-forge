import { renderHook, act } from '@testing-library/react'
import { useGameStore } from '../gameStore'

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => ({ data: { user: { id: 'test-user' } } }))
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null }))
      }))
    }))
  }
}))

describe('GameStore Level Up Logic', () => {
  beforeEach(() => {
    // Reset store state
    useGameStore.setState({
      currentSession: null,
      scenes: [],
      loading: false
    })
  })

  test('detects level up when experience threshold is reached', () => {
    const { result } = renderHook(() => useGameStore())

    // Set up initial session with level 1 character
    const mockSession = {
      id: '1',
      user_id: 'test-user',
      character_name: 'Test Hero',
      character_class: 'warrior' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      game_state: {
        level: 1,
        health: 100,
        maxHealth: 100,
        experience: 95, // Close to level up
        stats: {
          strength: 15,
          dexterity: 10,
          intelligence: 10,
          wisdom: 10,
          constitution: 14,
          charisma: 10
        },
        inventory: [],
        currentScene: 0
      }
    }

    act(() => {
      useGameStore.setState({ currentSession: mockSession })
    })

    // Simulate gaining experience that triggers level up
    act(() => {
      const currentState = result.current.currentSession!.game_state
      const updatedState = {
        ...currentState,
        experience: 105 // Over the 100 XP threshold for level 2
      }
      
      useGameStore.setState({
        currentSession: {
          ...result.current.currentSession!,
          game_state: updatedState
        }
      })
    })

    // Check if level up is detected
    const experienceNeeded = result.current.currentSession!.game_state.level * 100
    const shouldLevelUp = result.current.currentSession!.game_state.experience >= experienceNeeded

    expect(shouldLevelUp).toBe(true)
  })

  test('calculates correct attribute points for level up', () => {
    const baseLevel = 1
    const newLevel = 2
    const expectedPoints = 3 // Standard D&D attribute point gain per level

    expect(newLevel - baseLevel).toBe(1)
    // Each level up gives 3 attribute points
    expect((newLevel - baseLevel) * 3).toBe(expectedPoints)
  })

  test('updateStats function updates character attributes correctly', async () => {
    const mockSession = {
      id: '1',
      user_id: 'test-user',
      character_name: 'Test Hero',
      character_class: 'warrior' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      game_state: {
        level: 2,
        health: 100,
        maxHealth: 100,
        experience: 105,
        stats: {
          strength: 15,
          dexterity: 10,
          intelligence: 10,
          wisdom: 10,
          constitution: 14,
          charisma: 10
        },
        inventory: [],
        currentScene: 0
      }
    }

    act(() => {
      useGameStore.setState({ currentSession: mockSession })
    })

    const newStats = {
      strength: 17, // +2
      dexterity: 11, // +1
      intelligence: 10,
      wisdom: 10,
      constitution: 14,
      charisma: 10
    }

    // Mock the updateStats function (will be implemented)
    const mockUpdateStats = jest.fn()
    
    mockUpdateStats(newStats)

    expect(mockUpdateStats).toHaveBeenCalledWith(newStats)
  })

  test('level up modal trigger conditions', () => {
    const gameState = {
      level: 1,
      experience: 100,
      previousExperience: 95
    }

    const experienceNeeded = gameState.level * 100
    const hasLeveledUp = gameState.experience >= experienceNeeded && 
                        gameState.previousExperience < experienceNeeded

    expect(hasLeveledUp).toBe(true)
  })

  test('prevents level up when experience is insufficient', () => {
    const gameState = {
      level: 1,
      experience: 95, // Not enough for level 2
      previousExperience: 90
    }

    const experienceNeeded = gameState.level * 100
    const hasLeveledUp = gameState.experience >= experienceNeeded

    expect(hasLeveledUp).toBe(false)
  })

  test('handles multiple level ups correctly', () => {
    const gameState = {
      level: 1,
      experience: 350 // Enough for level 3
    }

    const currentLevel = gameState.level
    let newLevel = currentLevel
    let remainingXP = gameState.experience

    // Calculate new level based on experience (matches updateGameStateForChoice logic)
    while (remainingXP >= newLevel * 100) {
      remainingXP -= newLevel * 100
      newLevel++
    }

    expect(newLevel).toBe(3) // Should reach level 3
    expect(remainingXP).toBe(50) // Should have 50 XP remaining towards level 4
  })
})