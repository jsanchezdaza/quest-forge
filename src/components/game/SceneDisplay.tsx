import { Button, Card } from '../ui'
import type { Scene } from '../../types'

interface SceneDisplayProps {
  scene: Scene
  onChoice: (choice: string) => void
  loading: boolean
}

export default function SceneDisplay({ scene, onChoice, loading }: SceneDisplayProps) {
  return (
    <Card>
      <div className="prose prose-invert max-w-none">
        <div className="bg-background-darker rounded-lg p-6 mb-6 border border-medieval-gold/20 h-64 overflow-y-auto">
          <p className="text-gray-100 leading-relaxed whitespace-pre-line">
            {scene.narrative}
          </p>
        </div>

        {scene.choices.length > 0 && !scene.player_choice && (
          <div className="space-y-3">
            <h3 className="text-lg font-medieval text-medieval-gold mb-4">
              What do you choose?
            </h3>
            {scene.choices.map((choice, index) => (
              <Button
                key={index}
                variant="secondary"
                onClick={() => onChoice(choice)}
                disabled={loading}
                className="w-full text-left justify-start p-4 h-auto"
              >
                <span className="text-medieval-gold mr-2">
                  {index + 1}.
                </span>
                {choice}
              </Button>
            ))}
          </div>
        )}

        {scene.player_choice && (
          <div className="bg-medieval-gold/10 border border-medieval-gold/30 rounded-lg p-4">
            <p className="text-medieval-gold">
              <span className="font-semibold">Your choice:</span> {scene.player_choice}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}