import { Button, Card } from '../ui'
import type { Scene } from '../../types'

interface SceneDisplayProps {
  scene: Scene
  onChoice: (choice: string) => void
  loading: boolean
}

export default function SceneDisplay({ scene, onChoice, loading }: SceneDisplayProps) {
  return (
    <Card variant="game">
      <div className="prose prose-invert max-w-none">
        <div className="bg-background-darker rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-medieval-gold/20 h-48 sm:h-64 overflow-y-auto">
          <p className="text-gray-100 text-base sm:text-lg leading-relaxed whitespace-pre-line font-medieval-narrative">
            {scene.narrative}
          </p>
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