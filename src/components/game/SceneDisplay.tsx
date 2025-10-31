import { Button, Card, LoadingSpinner } from '../ui'
import { useGameStore } from '../../store/gameStore'
import type { Scene } from '../../types'

interface SceneDisplayProps {
  scene: Scene
  onChoice: (choice: string) => void
  loading: boolean
}

export default function SceneDisplay({ scene, onChoice, loading }: SceneDisplayProps) {
  const { isGenerating, streamingNarrative } = useGameStore()

  return (
    <Card variant="game">
      <div className="prose prose-invert max-w-none">
        <div className="bg-background-darker rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-medieval-gold/20 h-48 sm:h-64 overflow-y-auto">
          {isGenerating ? (
            <>
              {streamingNarrative ? (
                <p className="text-gray-100 text-base sm:text-lg leading-loose whitespace-pre-line font-medieval-narrative">
                  {streamingNarrative}
                  <span className="inline-block w-2 h-5 bg-medieval-gold ml-1 animate-pulse"></span>
                </p>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-gray-400 mt-4 font-medieval-narrative text-sm sm:text-base">
                      AI is crafting your story...
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-100 text-base sm:text-lg leading-loose whitespace-pre-line font-medieval-narrative">
              {scene.narrative}
            </p>
          )}
        </div>

        {scene.choices.length > 0 && !scene.player_choice && (
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-fantasy-classic font-semibold text-base sm:text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg mb-3 sm:mb-4">
              What do you choose?
            </h3>
            {scene.choices.map((choice, index) => (
              <Button
                key={index}
                variant="secondary"
                onClick={() => onChoice(choice)}
                disabled={loading}
                className="w-full text-left justify-start p-3 sm:p-4 h-auto min-h-[44px] font-medieval-options font-normal text-base sm:text-lg uppercase tracking-wide"
              >
                <span className="text-medieval-gold mr-2 font-fantasy-classic font-semibold">
                  {index + 1}.
                </span>
                <span>
                  {choice}
                </span>
              </Button>
            ))}
          </div>
        )}

        {scene.player_choice && (
          <div className="bg-medieval-gold/10 border border-medieval-gold/30 rounded-lg p-3 sm:p-4">
            <p className="text-medieval-gold font-medieval-options text-base sm:text-lg">
              <span className="font-fantasy-classic font-semibold">Your choice:</span>
              <span className="uppercase"> {scene.player_choice}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}