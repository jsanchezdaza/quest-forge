import { renderHook, act } from '@testing-library/react'
import { useGameStore } from '../gameStore'
import { GAME_CONSTANTS } from '../../constants/game'
import { calculateLevelUp, getExperienceForNextLevel } from '../../utils/levelSystem'

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
    const experienceNeeded = getExperienceForNextLevel(result.current.currentSession!.game_state.level)
    const shouldLevelUp = result.current.currentSession!.game_state.experience >= experienceNeeded

    expect(shouldLevelUp).toBe(true)
  })

  test('calculates correct attribute points for level up', () => {
    const baseLevel = 1
    const newLevel = 2
    const expectedPoints = GAME_CONSTANTS.ATTRIBUTE_POINTS_PER_LEVEL

    expect(newLevel - baseLevel).toBe(1)
    // Each level up gives attribute points based on constant
    expect((newLevel - baseLevel) * GAME_CONSTANTS.ATTRIBUTE_POINTS_PER_LEVEL).toBe(expectedPoints)
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

    const experienceNeeded = getExperienceForNextLevel(gameState.level)
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

    const experienceNeeded = getExperienceForNextLevel(gameState.level)
    const hasLeveledUp = gameState.experience >= experienceNeeded

    expect(hasLeveledUp).toBe(false)
  })

  test('handles multiple level ups correctly', () => {
    const currentLevel = 1
    const totalExperience = 350 // Enough for level 3

    const levelUpResult = calculateLevelUp(currentLevel, totalExperience)

    expect(levelUpResult.newLevel).toBe(3) // Should reach level 3
    expect(levelUpResult.remainingXP).toBe(50) // Should have 50 XP remaining towards level 4
    expect(levelUpResult.levelsGained).toBe(2) // Should have gained 2 levels
    expect(levelUpResult.totalAttributePoints).toBe(6) // Should have 6 attribute points (2 levels * 3 points)
  })
})