import { Backpack } from 'lucide-react'
import { Card, ProgressBar, StatsList } from '../ui'
import CharacterAvatar from './CharacterAvatar'
import type { GameSession } from '../../types'
import { getExperienceForNextLevel } from '../../utils/levelSystem'
import { useTranslation, type TranslationKey } from '../../i18n'

interface CharacterSheetProps {
  session: GameSession
}

export default function CharacterSheet({ session }: CharacterSheetProps) {
  const { character_name, character_class, game_state } = session
  const { level, health, maxHealth, experience, stats, inventory } = game_state
  const { t } = useTranslation()

  const experienceNeeded = getExperienceForNextLevel(level)

  return (
    <>
      {/* Player Data - Order 1 on mobile */}
      <Card variant="game" ornate className="order-1 md:order-none mb-4">
        <div className="flex items-center gap-4 mb-4">
          <CharacterAvatar characterClass={character_class} characterName={character_name} />
          <div>
            <h2 className="font-fantasy-epic font-black text-2xl text-medieval-gold drop-shadow-lg">
              {character_name}
            </h2>
            <p className="font-fantasy-elegant font-medium text-base text-gray-200 capitalize">
              {t('game.levelAndClass', { level, class: t(`class.${character_class}.name` as TranslationKey) })}
            </p>
          </div>
        </div>

        <ProgressBar
          label={t('game.health')}
          current={health}
          max={maxHealth}
          color="health"
          className="mb-4"
        />

        <ProgressBar
          label={t('game.experience')}
          current={experience}
          max={experienceNeeded}
          color="experience"
        />
      </Card>

      {/* Stats/Attributes - Order 3 on mobile (after narrative) */}
      <Card variant="game" ornate className="order-3 md:order-none mb-4">
        <StatsList stats={stats} />
      </Card>

      {/* Inventory - Order 4 on mobile */}
      <Card variant="game" ornate className="order-4 md:order-none">
        <h3 className="flex items-center gap-2 font-medieval-decorative font-semibold text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg mb-4">
          <Backpack className="w-5 h-5 shrink-0" aria-hidden="true" />
          {t('game.inventory')}
        </h3>
        {inventory.length > 0 ? (
          <div className="space-y-2">
            {inventory.map((item, index) => (
              <div
                key={index}
                className="text-gray-100 text-sm bg-background-darker rounded p-2 font-medieval-narrative font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic font-medieval-narrative">
            {t('game.emptyInventory')}
          </p>
        )}
      </Card>
    </>
  )
}
