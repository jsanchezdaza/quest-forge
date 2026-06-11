import { ChevronRight, Crosshair } from 'lucide-react'
import { Card, LoadingSpinner, SectionDivider } from '../ui'
import { useGameStore } from '../../store/gameStore'
import { useTranslation } from '../../i18n'
import type { Scene } from '../../types'

interface SceneDisplayProps {
  scene: Scene
  onChoice: (choice: string) => void
  loading: boolean
}

export default function SceneDisplay({ scene, onChoice, loading }: SceneDisplayProps) {
  const { isGenerating, streamingNarrative } = useGameStore()
  const { t } = useTranslation()

  return (
    <Card variant="game" ornate>
      <div className="prose prose-invert max-w-none">
        <div className="mb-3 sm:mb-4">
          <h2 className="font-fantasy-epic font-black text-xl sm:text-2xl text-medieval-gold drop-shadow-lg uppercase tracking-wide">
            {t('game.yourAdventure')}
          </h2>
          <SectionDivider className="mt-1" />
        </div>
        <div className="bg-background-darker rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-medieval-gold/20 h-80 sm:h-96 overflow-y-auto">
          {isGenerating ? (
            <>
              {streamingNarrative ? (
                <p className="text-gray-100 text-lg sm:text-xl leading-loose whitespace-pre-line font-medieval-narrative">
                  {streamingNarrative}
                  <span className="inline-block w-2 h-5 bg-medieval-gold ml-1 animate-pulse"></span>
                </p>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-gray-400 mt-4 font-medieval-narrative text-sm sm:text-base">
                      {t('game.aiCrafting')}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-100 text-lg sm:text-xl leading-loose whitespace-pre-line font-medieval-narrative">
              {scene.narrative}
            </p>
          )}
        </div>

        {scene.choices.length > 0 && !scene.player_choice && (
          <div className="space-y-3">
            <div>
              <h3 className="flex items-center gap-2 font-fantasy-classic font-semibold text-sm sm:text-base text-medieval-gold uppercase tracking-wider drop-shadow-lg">
                <Crosshair className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
                {t('game.yourOptions')}
              </h3>
              <SectionDivider className="mt-1" />
            </div>
            <div className="space-y-2">
              {scene.choices.map((choice, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onChoice(choice)}
                  disabled={loading}
                  className="group w-full flex items-center gap-3 p-2 sm:p-3 min-h-[44px] rounded-lg bg-background-card hover:bg-background-modal border border-medieval-gold/30 hover:border-medieval-gold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center w-7 h-7 shrink-0 rounded border border-medieval-gold/50 text-medieval-gold font-fantasy-classic font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-left text-gray-100 font-medieval-options font-normal text-xs sm:text-sm uppercase tracking-wide">
                    {choice}
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-medieval-gold/60 group-hover:text-medieval-gold transition-colors" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}

        {scene.player_choice && (
          <div className="bg-medieval-gold/10 border border-medieval-gold/30 rounded-lg p-3 sm:p-4">
            <p className="text-medieval-gold font-medieval-options text-base sm:text-lg">
              <span className="font-fantasy-classic font-semibold">{t('game.yourChoice')}</span>
              <span className="uppercase"> {scene.player_choice}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}