import { GAME_CONSTANTS } from '../constants/game'
import type { GameState } from '../types'

export interface LevelUpResult {
  newLevel: number
  remainingXP: number
  levelsGained: number
  totalAttributePoints: number
  totalHealthGained: number
}

/**
 * Calculate level progression from experience points
 */
export function calculateLevelUp(currentLevel: number, totalExperience: number): LevelUpResult {
  let newLevel = currentLevel
  let remainingXP = totalExperience
  
  // Calculate new level based on remaining experience
  while (remainingXP >= newLevel * GAME_CONSTANTS.EXPERIENCE_PER_LEVEL) {
    remainingXP -= newLevel * GAME_CONSTANTS.EXPERIENCE_PER_LEVEL
    newLevel++
  }
  
  const levelsGained = newLevel - currentLevel
  
  return {
    newLevel,
    remainingXP,
    levelsGained,
    totalAttributePoints: levelsGained * GAME_CONSTANTS.ATTRIBUTE_POINTS_PER_LEVEL,
    totalHealthGained: levelsGained * GAME_CONSTANTS.HEALTH_GAIN_PER_LEVEL
  }
}

/**
 * Calculate experience needed for next level
 */
export function getExperienceForNextLevel(currentLevel: number): number {
  return currentLevel * GAME_CONSTANTS.EXPERIENCE_PER_LEVEL
}

/**
 * Generate random experience gain
 */
export function generateExperienceGain(): number {
  const { EXPERIENCE_GAIN_MIN, EXPERIENCE_GAIN_MAX } = GAME_CONSTANTS
  return Math.floor(Math.random() * (EXPERIENCE_GAIN_MAX - EXPERIENCE_GAIN_MIN)) + EXPERIENCE_GAIN_MIN
}

/**
 * Update game state with level progression
 */
export function updateGameStateWithLevelUp(currentState: GameState, experienceGain: number): GameState {
  const newTotalExperience = currentState.experience + experienceGain
  const previousExperience = currentState.experience
  
  const levelUpResult = calculateLevelUp(currentState.level, newTotalExperience)
  
  return {
    ...currentState,
    level: levelUpResult.newLevel,
    experience: levelUpResult.remainingXP,
    previousExperience,
    pendingLevelUp: levelUpResult.levelsGained > 0,
    levelsGained: levelUpResult.levelsGained,
    currentScene: currentState.currentScene + 1,
    // Update health if leveled up
    ...(levelUpResult.levelsGained > 0 && {
      maxHealth: currentState.maxHealth + levelUpResult.totalHealthGained,
      health: currentState.health + levelUpResult.totalHealthGained,
    })
  }
}