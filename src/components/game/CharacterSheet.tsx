import { Card, ProgressBar, StatsList } from '../ui'
import type { GameSession } from '../../types'

interface CharacterSheetProps {
  session: GameSession
}

export default function CharacterSheet({ session }: CharacterSheetProps) {
  const { character_name, character_class, game_state } = session
  const { level, health, maxHealth, experience, stats, inventory } = game_state

  const experienceNeeded = level * 100

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-center mb-4">
          <h2 className="text-xl font-medieval text-medieval-gold">
            {character_name}
          </h2>
          <p className="text-gray-400 capitalize">
            Level {level} {character_class}
          </p>
        </div>

        <ProgressBar
          label="Health"
          current={health}
          max={maxHealth}
          color="health"
          className="mb-4"
        />

        <ProgressBar
          label="Experience"
          current={experience}
          max={experienceNeeded}
          color="experience"
        />
      </Card>

      <Card>
        <StatsList stats={stats} />
      </Card>

      <Card>
        <h3 className="text-lg font-medieval text-medieval-gold mb-4">
          Inventory
        </h3>
        {inventory.length > 0 ? (
          <div className="space-y-2">
            {inventory.map((item, index) => (
              <div
                key={index}
                className="text-gray-300 text-sm bg-background-darker rounded p-2"
              >
                {item}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Your inventory is empty
          </p>
        )}
      </Card>
    </div>
  )
}