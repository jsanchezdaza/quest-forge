import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { GAME_CONSTANTS } from '../constants/game'

export const useLevelUp = () => {
  const { currentSession, clearPendingLevelUp } = useGameStore()
  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean
    newLevel: number
    availablePoints: number
  }>({
    isOpen: false,
    newLevel: 0,
    availablePoints: 0
  })
  useEffect(() => {
    if (!currentSession) return

    const { level, pendingLevelUp, levelsGained = 1 } = currentSession.game_state
    
    // Only show level up modal if pendingLevelUp flag is set
    if (pendingLevelUp) {
      const totalAttributePoints = levelsGained * GAME_CONSTANTS.ATTRIBUTE_POINTS_PER_LEVEL
      
      setLevelUpData({
        isOpen: true,
        newLevel: level,
        availablePoints: totalAttributePoints
      })
    }
  }, [currentSession?.game_state.pendingLevelUp])

  const closeLevelUpModal = () => {
    setLevelUpData(prev => ({ ...prev, isOpen: false }))
    // Clear pendingLevelUp flag when modal is closed
    clearPendingLevelUp()
  }

  return {
    ...levelUpData,
    onClose: closeLevelUpModal
  }
}