import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { GameStore, GameSession, CharacterClass, GameState } from '../types'

export const useGameStore = create<GameStore>((set, get) => ({
  currentSession: null,
  scenes: [],
  loading: false,

  createSession: async (characterName: string, characterClass: CharacterClass) => {
    set({ loading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const defaultGameState: GameState = {
        level: 1,
        health: 100,
        maxHealth: 100,
        experience: 0,
        currentScene: 0,
        inventory: [],
        stats: {
          strength: characterClass === 'warrior' ? 15 : characterClass === 'paladin' ? 14 : 10,
          dexterity: characterClass === 'rogue' ? 15 : characterClass === 'ranger' ? 14 : 10,
          intelligence: characterClass === 'mage' ? 15 : 10,
          wisdom: characterClass === 'cleric' ? 15 : characterClass === 'ranger' ? 13 : 10,
          constitution: characterClass === 'warrior' ? 14 : characterClass === 'paladin' ? 13 : 10,
          charisma: characterClass === 'paladin' ? 15 : 10,
        }
      }

      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          user_id: user.id,
          character_name: characterName,
          character_class: characterClass,
          game_state: defaultGameState,
        })
        .select()
        .single()

      if (error) throw error

      // Create initial scene
      const initialNarrative = generateInitialNarrative(characterName, characterClass)
      const initialChoices = [
        'Explore the mysterious forest path',
        'Visit the local tavern for information',
        'Head to the town market to gather supplies',
      ]

      const { data: sceneData, error: sceneError } = await supabase
        .from('scenes')
        .insert({
          session_id: data.id,
          narrative: initialNarrative,
          choices: initialChoices,
        })
        .select()
        .single()

      if (sceneError) throw sceneError

      set({
        currentSession: data,
        scenes: [sceneData],
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  loadSession: async (sessionId: string) => {
    set({ loading: true })
    
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (scenesError) throw scenesError

      set({
        currentSession: sessionData,
        scenes: scenesData,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  saveProgress: async () => {
    const { currentSession } = get()
    if (!currentSession) throw new Error('No active session')

    set({ loading: true })

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          game_state: currentSession.game_state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSession.id)

      if (error) throw error
      set({ loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  makeChoice: async (choice: string) => {
    const { currentSession, scenes } = get()
    if (!currentSession) throw new Error('No active session')

    set({ loading: true })

    try {
      const currentScene = scenes[scenes.length - 1]
      
      // Update current scene with player choice
      const { error: updateError } = await supabase
        .from('scenes')
        .update({ player_choice: choice })
        .eq('id', currentScene.id)

      if (updateError) throw updateError

      // Generate next scene based on choice
      const nextNarrative = generateNextNarrative(choice, currentSession)
      const nextChoices = generateNextChoices(choice)

      // Create new scene
      const { data: newScene, error: sceneError } = await supabase
        .from('scenes')
        .insert({
          session_id: currentSession.id,
          narrative: nextNarrative,
          choices: nextChoices,
        })
        .select()
        .single()

      if (sceneError) throw sceneError

      // Update game state
      const updatedGameState = updateGameState(currentSession.game_state, choice)
      const updatedSession = {
        ...currentSession,
        game_state: updatedGameState,
      }

      // Save updated session
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({
          game_state: updatedGameState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSession.id)

      if (sessionError) throw sessionError

      set({
        currentSession: updatedSession,
        scenes: [...scenes.map(s => 
          s.id === currentScene.id ? { ...s, player_choice: choice } : s
        ), newScene],
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },
}))

// Helper functions for game logic
function generateInitialNarrative(characterName: string, characterClass: CharacterClass): string {
  const classDescriptions = {
    warrior: 'a mighty warrior with sword and shield',
    mage: 'a wise mage wielding arcane powers',
    rogue: 'a cunning rogue skilled in stealth and daggers',
    cleric: 'a devoted cleric blessed with divine magic',
    ranger: 'a skilled ranger, one with nature',
    paladin: 'a righteous paladin, champion of justice'
  }

  return `Welcome, ${characterName}! You are ${classDescriptions[characterClass]}, standing at the edge of the small village of Millhaven. Dark clouds gather on the horizon, and rumors speak of strange happenings in the nearby forest. The villagers look to you with hope in their eyes, for they know that an adventure of great importance is about to begin.

What path will you choose to start your quest?`
}

function generateNextNarrative(choice: string, session: GameSession): string {
  if (choice.includes('forest')) {
    return `You venture into the mysterious forest, where ancient trees whisper secrets of old. Suddenly, you hear a rustling in the bushes ahead. Your ${session.character_class} instincts tell you that danger may be lurking nearby...`
  } else if (choice.includes('tavern')) {
    return `You push open the heavy wooden door of "The Prancing Pony" tavern. The warm glow of the fireplace welcomes you, and you notice several interesting characters: a hooded figure in the corner, a merchant counting coins, and the talkative bartender...`
  } else if (choice.includes('market')) {
    return `The bustling town market is filled with vendors selling their wares. You notice a peculiar merchant selling what appears to be magical items, while another vendor whispers about rare herbs found only in the haunted forest...`
  }
  
  return 'Your choice leads you to a new adventure...'
}

function generateNextChoices(choice: string): string[] {
  if (choice.includes('forest')) {
    return [
      'Draw your weapon and investigate the sound',
      'Try to sneak past quietly',
      'Call out to see who or what is there'
    ]
  } else if (choice.includes('tavern')) {
    return [
      'Approach the hooded figure',
      'Talk to the merchant about local news',
      'Ask the bartender about recent strange events'
    ]
  } else if (choice.includes('market')) {
    return [
      'Examine the magical items for sale',
      'Ask about the herbs from the haunted forest',
      'Look for basic adventuring supplies'
    ]
  }
  
  return ['Continue your adventure', 'Rest and plan your next move', 'Seek guidance from locals']
}

function updateGameState(currentState: GameState, _choice: string): GameState {
  const newState = { ...currentState }
  
  // Award experience for making choices
  newState.experience += 10
  
  // Level up if enough experience
  if (newState.experience >= newState.level * 100) {
    newState.level += 1
    newState.maxHealth += 20
    newState.health = newState.maxHealth
    newState.experience = 0
  }
  
  newState.currentScene += 1
  
  return newState
}