import { Card } from '../ui'
import type { GameSession } from '../../types'

interface CharacterSheetProps {
  session: GameSession
}

export default function CharacterSheet({ session }: CharacterSheetProps) {
  const { character_name, character_class, game_state } = session
  const { level, health, maxHealth, experience, stats } = game_state

  const healthPercentage = (health / maxHealth) * 100
  const experienceNeeded = level * 100

  return (
    <div className="space-y-4">
      {/* Character Info */}
      <Card>
        <div className="text-center mb-4">
          <h2 className="text-xl font-medieval text-medieval-gold">
            {character_name}
          </h2>
          <p className="text-gray-400 capitalize">
            Level {level} {character_class}
          </p>
        </div>

        {/* Health Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Health</span>
            <span>{health}/{maxHealth}</span>
          </div>
          <div className="w-full bg-background-darker rounded-full h-3">
            <div
              className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>

        {/* Experience Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Experience</span>
            <span>{experience}/{experienceNeeded}</span>
          </div>
          <div className="w-full bg-background-darker rounded-full h-2">
            <div
              className="bg-gradient-to-r from-medieval-gold to-medieval-darkgold h-2 rounded-full transition-all duration-300"
              style={{ width: `${(experience / experienceNeeded) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card>
        <h3 className="text-lg font-medieval text-medieval-gold mb-4">
          Attributes
        </h3>
        <div className="space-y-3">
          {Object.entries(stats).map(([stat, value]) => (
            <div key={stat} className="flex justify-between">
              <span className="text-gray-300 capitalize">
                {stat}
              </span>
              <span className="text-medieval-gold font-semibold">
                {value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Inventory */}
      <Card>
        <h3 className="text-lg font-medieval text-medieval-gold mb-4">
          Inventory
        </h3>
        {game_state.inventory.length > 0 ? (
          <div className="space-y-2">
            {game_state.inventory.map((item, index) => (
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