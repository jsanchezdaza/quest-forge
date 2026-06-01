import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { Modal, Button } from '../ui'
import { useTranslation, type TranslationKey } from '../../i18n'

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  newLevel: number
  availablePoints: number
}

export default function LevelUpModal({ 
  isOpen, 
  onClose, 
  newLevel, 
  availablePoints: initialPoints 
}: LevelUpModalProps) {
  const { currentSession, updateStats } = useGameStore()
  const { t } = useTranslation()
  const [pointsRemaining, setPointsRemaining] = useState(initialPoints)
  const [statChanges, setStatChanges] = useState<Record<string, number>>({})

  useEffect(() => {
    setPointsRemaining(initialPoints)
    setStatChanges({})
  }, [initialPoints, isOpen])

  if (!currentSession) return null

  const currentStats = currentSession.game_state.stats
  
  const handleStatIncrease = (statName: string) => {
    if (pointsRemaining <= 0) return
    
    setPointsRemaining(prev => prev - 1)
    setStatChanges(prev => ({
      ...prev,
      [statName]: (prev[statName] || 0) + 1
    }))
  }

  const handleConfirm = async () => {
    const newStats = { ...currentStats }
    Object.entries(statChanges).forEach(([stat, increase]) => {
      newStats[stat as keyof typeof newStats] += increase
    })

    try {
      await updateStats(newStats)
      onClose()
    } catch (error) {
      console.error('Error updating stats:', error)
    }
  }

  const handleClose = () => {
    // Prevent closing if points remain unspent
    if (pointsRemaining > 0) return
    onClose()
  }

  const statKeys = ['strength', 'dexterity', 'intelligence', 'wisdom', 'constitution', 'charisma']

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('game.levelUpTitle')}
      maxWidth="md"
    >
      <div role="dialog" className="space-y-6">
        <div className="text-center">
          <h2 className="font-fantasy-epic font-bold text-2xl text-medieval-gold drop-shadow-lg mb-2">
            {t('game.levelUpCongrats', { level: newLevel })}
          </h2>
          <p className="text-gray-300 font-pixel-body text-sm">
            {t('game.pointsToDistribute', { points: pointsRemaining })}
          </p>
        </div>

        <div className="space-y-4">
          {statKeys.map((key) => {
            const currentValue = currentStats[key as keyof typeof currentStats]
            const increase = statChanges[key] || 0
            const newValue = currentValue + increase

            return (
              <div key={key} className="flex items-center justify-between p-3 bg-background-darker rounded-lg border border-medieval-gold/20">
                <div className="flex items-center gap-3">
                  <span className="text-gray-100 font-pixel-body text-sm font-medium uppercase">
                    {t(`stat.${key}` as TranslationKey)}
                  </span>
                  <span className="text-gray-400 font-pixel-body text-xs">
                    {currentValue} → {newValue}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {increase > 0 && (
                    <span className="text-medieval-gold font-pixel-body text-xs">
                      +{increase}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatIncrease(key)}
                    disabled={pointsRemaining <= 0}
                    className="px-3 py-1 min-w-0"
                  >
                    +
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center pt-4">
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={pointsRemaining > 0}
            className="px-8"
          >
            {t('ui.confirmChanges')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}