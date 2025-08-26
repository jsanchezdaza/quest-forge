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
        <div className="bg-background-darker rounded-lg p-6 mb-6 border border-medieval-gold/20 h-64 overflow-y-auto">
          <p className="text-gray-100 leading-relaxed whitespace-pre-line font-fantasy-elegant">
            {scene.narrative}
          </p>
        </div>

        {scene.choices.length > 0 && !scene.player_choice && (
          <div className="space-y-3">
            <h3 className="font-fantasy-classic font-semibold text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg mb-4">
              What do you choose?
            </h3>
            {scene.choices.map((choice, index) => (
              <Button
                key={index}
                variant="secondary"
                onClick={() => onChoice(choice)}
                disabled={loading}
                className="w-full text-left justify-start p-4 h-auto font-fantasy-elegant font-normal text-base normal-case tracking-normal"
              >
                <span className="text-medieval-gold mr-2 font-fantasy-classic font-semibold">
                  {index + 1}.
                </span>
                <span className="font-fantasy-elegant">
                  {choice}
                </span>
              </Button>
            ))}
          </div>
        )}

        {scene.player_choice && (
          <div className="bg-medieval-gold/10 border border-medieval-gold/30 rounded-lg p-4">
            <p className="text-medieval-gold font-fantasy-elegant">
              <span className="font-fantasy-classic font-semibold">Your choice:</span> 
              <span className="font-fantasy-elegant"> {scene.player_choice}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}