import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export const useLevelUp = () => {
  const { currentSession } = useGameStore()
  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean
    newLevel: number
    availablePoints: number
  }>({
    isOpen: false,
    newLevel: 0,
    availablePoints: 0
  })
  const [processedLevelUp, setProcessedLevelUp] = useState<number | null>(null)

  useEffect(() => {
    if (!currentSession) return

    const { level, previousExperience } = currentSession.game_state
    
    // Only show level up modal if we have previousExperience, level increased, and not processed yet
    const hasLeveledUp = previousExperience !== undefined && 
                        level > Math.floor(previousExperience / 100) + 1 &&
                        processedLevelUp !== level

    if (hasLeveledUp) {
      const previousLevel = Math.floor(previousExperience / 100) + 1
      const levelsGained = level - previousLevel
      const pointsGained = levelsGained * 3 // 3 attribute points per level
      
      setLevelUpData({
        isOpen: true,
        newLevel: level,
        availablePoints: pointsGained
      })
      setProcessedLevelUp(level)
    }
  }, [currentSession?.game_state.level, currentSession?.game_state.previousExperience])

  const closeLevelUpModal = () => {
    setLevelUpData(prev => ({ ...prev, isOpen: false }))
  }

  return {
    ...levelUpData,
    onClose: closeLevelUpModal
  }
}