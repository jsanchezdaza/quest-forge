import { useGameStore } from '../../store/gameStore'
import { useLevelUp } from '../../hooks/useLevelUp'
import { Card } from '../ui'
import CharacterSheet from './CharacterSheet'
import SceneDisplay from './SceneDisplay'
import LevelUpModal from './LevelUpModal'
import { GAME_CONSTANTS } from '../../constants/game'

export default function GameSession() {
  const { currentSession, scenes, makeChoice, loading } = useGameStore()
  const { isOpen, newLevel, availablePoints, onClose } = useLevelUp()

  if (!currentSession) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">No active game session</p>
      </div>
    )
  }

  const currentScene = scenes[scenes.length - 1]

  const handleChoice = async (choice: string) => {
    try {
      await makeChoice(choice)
    } catch (error) {
      console.error('Error making choice:', error)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:grid md:grid-cols-4">
      {/* Character Sheet - Uses contents on mobile for order to work, block on desktop for grid */}
      <div className="contents md:block md:col-span-1">
        <CharacterSheet session={currentSession} />
      </div>

      {/* Main Game Area - Uses contents on mobile for order to work, block on desktop for grid */}
      <div className="contents md:block md:col-span-3 md:space-y-6">
        {/* Current Scene - Order 2 on mobile (after player data) */}
        {currentScene && (
          <div className="order-2 md:order-none">
            <SceneDisplay
              scene={currentScene}
              onChoice={handleChoice}
              loading={loading}
            />
          </div>
        )}

        {/* Scene History - Order 5 on mobile (last) */}
        {scenes.length > 1 && (
          <div className="order-5 md:order-none">
            <Card variant="game">
              <h3 className="font-fantasy-classic font-semibold text-base sm:text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg mb-3 sm:mb-4">
                Adventure Log
              </h3>
              <div className="space-y-3 sm:space-y-4 max-h-48 sm:max-h-64 overflow-y-auto">
                {scenes.slice(0, -1).reverse().map((scene) => (
                  <div key={scene.id} className="border-l-2 border-medieval-gold/30 pl-3 sm:pl-4">
                    <p className="text-gray-300 text-sm sm:text-base mb-2 font-medieval-narrative leading-loose">
                      {scene.narrative.length > GAME_CONSTANTS.MAX_NARRATIVE_PREVIEW_LENGTH
                        ? `${scene.narrative.substring(0, GAME_CONSTANTS.MAX_NARRATIVE_PREVIEW_LENGTH)}...`
                        : scene.narrative
                      }
                    </p>
                    {scene.player_choice && (
                      <p className="text-medieval-gold text-sm sm:text-base font-medieval-options uppercase">
                        ➤ {scene.player_choice}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <LevelUpModal
        isOpen={isOpen}
        onClose={onClose}
        newLevel={newLevel}
        availablePoints={availablePoints}
      />
    </div>
  )
}
