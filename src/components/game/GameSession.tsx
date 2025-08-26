import { useGameStore } from '../../store/gameStore'
import { useLevelUp } from '../../hooks/useLevelUp'
import { Card } from '../ui'
import CharacterSheet from './CharacterSheet'
import SceneDisplay from './SceneDisplay'
import LevelUpModal from './LevelUpModal'

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Character Sheet - Left Sidebar */}
      <div className="lg:col-span-1">
        <CharacterSheet session={currentSession} />
      </div>

      {/* Main Game Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Current Scene */}
        {currentScene && (
          <SceneDisplay
            scene={currentScene}
            onChoice={handleChoice}
            loading={loading}
          />
        )}

        {/* Scene History */}
        {scenes.length > 1 && (
          <Card variant="game">
            <h3 className="font-fantasy-classic font-semibold text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg mb-4">
              Adventure Log
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {scenes.slice(0, -1).reverse().map((scene) => (
                <div key={scene.id} className="border-l-2 border-medieval-gold/30 pl-4">
                  <p className="text-gray-300 text-base mb-2 font-medieval-narrative">
                    {scene.narrative.length > 150 
                      ? `${scene.narrative.substring(0, 150)}...`
                      : scene.narrative
                    }
                  </p>
                  {scene.player_choice && (
                    <p className="text-medieval-gold text-base font-medieval-options uppercase">
                      ➤ {scene.player_choice}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
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