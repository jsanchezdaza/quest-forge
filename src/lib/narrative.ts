import type { CharacterClass, GameSession, GameState } from '../types'
import { generateExperienceGain, updateGameStateWithLevelUp } from '../utils/levelSystem'
import { translate, type TranslationKey } from '../i18n'

/**
 * Static narrative generation functions (fallback when AI is unavailable).
 * Text lives in the i18n dictionaries; these helpers resolve it for the
 * current language. When OpenRouter is configured the game uses AI instead.
 */

const classDescription = (characterClass: CharacterClass): string =>
  translate(`narrative.desc.${characterClass}` as TranslationKey)

const className = (characterClass: CharacterClass): string =>
  translate(`class.${characterClass}.name` as TranslationKey).toLowerCase()

const matchesKeyword = (choice: string, keyword: TranslationKey): boolean =>
  choice.toLowerCase().includes(translate(keyword).toLowerCase())

export function generateInitialNarrative(characterName: string, characterClass: CharacterClass): string {
  return translate('narrative.initial', {
    name: characterName,
    desc: classDescription(characterClass),
  })
}

export function getInitialChoices(): string[] {
  return [
    translate('narrative.initialChoice.1'),
    translate('narrative.initialChoice.2'),
    translate('narrative.initialChoice.3'),
  ]
}

export function generateNarrative(choice: string, session: GameSession): string {
  if (matchesKeyword(choice, 'narrative.keyword.forest')) {
    return translate('narrative.scene.forest', { characterClass: className(session.character_class) })
  }
  if (matchesKeyword(choice, 'narrative.keyword.tavern')) {
    return translate('narrative.scene.tavern')
  }
  if (matchesKeyword(choice, 'narrative.keyword.market')) {
    return translate('narrative.scene.market')
  }

  return translate('narrative.scene.default')
}

export function generateChoices(choice: string): string[] {
  if (matchesKeyword(choice, 'narrative.keyword.forest')) {
    return [
      translate('narrative.choices.forest.1'),
      translate('narrative.choices.forest.2'),
      translate('narrative.choices.forest.3'),
    ]
  }
  if (matchesKeyword(choice, 'narrative.keyword.tavern')) {
    return [
      translate('narrative.choices.tavern.1'),
      translate('narrative.choices.tavern.2'),
      translate('narrative.choices.tavern.3'),
    ]
  }
  if (matchesKeyword(choice, 'narrative.keyword.market')) {
    return [
      translate('narrative.choices.market.1'),
      translate('narrative.choices.market.2'),
      translate('narrative.choices.market.3'),
    ]
  }

  return [
    translate('narrative.choices.default.1'),
    translate('narrative.choices.default.2'),
    translate('narrative.choices.default.3'),
  ]
}

export function updateGameStateForChoice(currentState: GameState): GameState {
  const experienceGain = generateExperienceGain()
  return updateGameStateWithLevelUp(currentState, experienceGain)
}
