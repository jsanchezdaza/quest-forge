import type { CharacterClass, GameSession, GameState } from '../types'

const CHARACTER_DESCRIPTIONS = {
  warrior: 'a mighty warrior with sword and shield',
  mage: 'a wise mage wielding arcane powers',
  rogue: 'a cunning rogue skilled in stealth and daggers',
  cleric: 'a devoted cleric blessed with divine magic',
  ranger: 'a skilled ranger, one with nature',
  paladin: 'a righteous paladin, champion of justice'
} as const

const INITIAL_CHOICES = [
  'Explore the mysterious forest path',
  'Visit the local tavern for information',
  'Head to the town market to gather supplies',
]

const SCENE_NARRATIVES = {
  forest: (characterClass: string) => 
    `You venture into the mysterious forest, where ancient trees whisper secrets of old. Suddenly, you hear a rustling in the bushes ahead. Your ${characterClass} instincts tell you that danger may be lurking nearby...`,
  
  tavern: () => 
    `You push open the heavy wooden door of "The Prancing Pony" tavern. The warm glow of the fireplace welcomes you, and you notice several interesting characters: a hooded figure in the corner, a merchant counting coins, and the talkative bartender...`,
  
  market: () => 
    `The bustling town market is filled with vendors selling their wares. You notice a peculiar merchant selling what appears to be magical items, while another vendor whispers about rare herbs found only in the haunted forest...`
}

const SCENE_CHOICES = {
  forest: [
    'Draw your weapon and investigate the sound',
    'Try to sneak past quietly',
    'Call out to see who or what is there'
  ],
  tavern: [
    'Approach the hooded figure',
    'Talk to the merchant about local news',
    'Ask the bartender about recent strange events'
  ],
  market: [
    'Examine the magical items for sale',
    'Ask about the herbs from the haunted forest',
    'Look for basic adventuring supplies'
  ],
  default: [
    'Continue your adventure',
    'Rest and plan your next move',
    'Seek guidance from locals'
  ]
}

export function generateInitialNarrative(characterName: string, characterClass: CharacterClass): string {
  return `Welcome, ${characterName}! You are ${CHARACTER_DESCRIPTIONS[characterClass]}, standing at the edge of the small village of Millhaven. Dark clouds gather on the horizon, and rumors speak of strange happenings in the nearby forest. The villagers look to you with hope in their eyes, for they know that an adventure of great importance is about to begin.

What path will you choose to start your quest?`
}

export function getInitialChoices(): string[] {
  return INITIAL_CHOICES
}

export function generateNarrative(choice: string, session: GameSession): string {
  if (choice.includes('forest')) {
    return SCENE_NARRATIVES.forest(session.character_class)
  }
  if (choice.includes('tavern')) {
    return SCENE_NARRATIVES.tavern()
  }
  if (choice.includes('market')) {
    return SCENE_NARRATIVES.market()
  }
  
  return 'Your choice leads you to a new adventure...'
}

export function generateChoices(choice: string): string[] {
  if (choice.includes('forest')) return SCENE_CHOICES.forest
  if (choice.includes('tavern')) return SCENE_CHOICES.tavern
  if (choice.includes('market')) return SCENE_CHOICES.market
  
  return SCENE_CHOICES.default
}

export function updateGameStateForChoice(currentState: GameState): GameState {
  const experienceGain = Math.floor(Math.random() * 20) + 5
  const newExperience = currentState.experience + experienceGain
  
  // Store previous experience to detect level ups
  const previousExperience = currentState.experience
  
  // Check for level up
  let newLevel = currentState.level
  let remainingXP = newExperience
  
  while (remainingXP >= newLevel * 100) {
    remainingXP -= newLevel * 100
    newLevel++
  }
  
  return {
    ...currentState,
    level: newLevel,
    experience: remainingXP,
    previousExperience,
    currentScene: currentState.currentScene + 1,
    // Increase health on level up
    ...(newLevel > currentState.level && {
      maxHealth: currentState.maxHealth + ((newLevel - currentState.level) * 20),
      health: currentState.health + ((newLevel - currentState.level) * 20),
    })
  }
}