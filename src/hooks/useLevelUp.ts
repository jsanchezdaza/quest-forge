import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

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

    const { level, pendingLevelUp } = currentSession.game_state
    
    // Only show level up modal if pendingLevelUp flag is set
    if (pendingLevelUp) {
      const pointsGained = 3 // 3 attribute points per level (assuming 1 level gained)
      
      setLevelUpData({
        isOpen: true,
        newLevel: level,
        availablePoints: pointsGained
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