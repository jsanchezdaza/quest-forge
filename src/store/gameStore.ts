import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { 
  generateInitialNarrative,
  getInitialChoices,
  generateNarrative,
  generateChoices,
  updateGameStateForChoice
} from '../lib/narrative'
import type { GameStore, CharacterClass, GameState } from '../types'

const createInitialGameState = (characterClass: CharacterClass): GameState => ({
  level: 1,
  health: 100,
  maxHealth: 100,
  experience: 0,
  currentScene: 0,
  inventory: [],
  stats: {
    strength: ['warrior', 'paladin'].includes(characterClass) ? 15 : 10,
    dexterity: ['rogue', 'ranger'].includes(characterClass) ? 15 : 10,
    intelligence: characterClass === 'mage' ? 15 : 10,
    wisdom: ['cleric', 'ranger'].includes(characterClass) ? 15 : 10,
    constitution: ['warrior', 'paladin'].includes(characterClass) ? 14 : 10,
    charisma: characterClass === 'paladin' ? 15 : 10,
  }
})

export const useGameStore = create<GameStore>((set, get) => ({
  currentSession: null,
  scenes: [],
  loading: false,

  loadLatestSession: async () => {
    set({ loading: true })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ loading: false })
      return
    }

    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !session) {
      set({ loading: false })
      return
    }

    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    if (scenesError) {
      set({ loading: false })
      throw scenesError
    }

    set({
      currentSession: session,
      scenes: scenes || [],
      loading: false,
    })
  },

  createSession: async (characterName: string, characterClass: CharacterClass) => {
    set({ loading: true })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')

    const gameState = createInitialGameState(characterClass)

    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        character_name: characterName,
        character_class: characterClass,
        game_state: gameState,
      })
      .select()
      .single()

    if (sessionError) {
      set({ loading: false })
      throw sessionError
    }

    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .insert({
        session_id: session.id,
        narrative: generateInitialNarrative(characterName, characterClass),
        choices: getInitialChoices(),
      })
      .select()
      .single()

    if (sceneError) {
      set({ loading: false })
      throw sceneError
    }

    set({
      currentSession: session,
      scenes: [scene],
      loading: false,
    })
  },

  loadSession: async (sessionId: string) => {
    set({ loading: true })
    
    const [sessionResult, scenesResult] = await Promise.all([
      supabase.from('game_sessions').select('*').eq('id', sessionId).single(),
      supabase.from('scenes').select('*').eq('session_id', sessionId).order('created_at', { ascending: true })
    ])

    if (sessionResult.error) {
      set({ loading: false })
      throw sessionResult.error
    }

    if (scenesResult.error) {
      set({ loading: false })
      throw scenesResult.error
    }

    set({
      currentSession: sessionResult.data,
      scenes: scenesResult.data,
      loading: false,
    })
  },

  saveProgress: async () => {
    const { currentSession } = get()
    if (!currentSession) throw new Error('No active session')

    set({ loading: true })

    const { error } = await supabase
      .from('game_sessions')
      .update({
        game_state: currentSession.game_state,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSession.id)

    if (error) {
      set({ loading: false })
      throw error
    }

    set({ loading: false })
  },

  makeChoice: async (choice: string) => {
    const { currentSession, scenes } = get()
    if (!currentSession) throw new Error('No active session')

    set({ loading: true })

    const currentScene = scenes[scenes.length - 1]
    
    const [updateResult, newSceneResult] = await Promise.all([
      supabase.from('scenes').update({ player_choice: choice }).eq('id', currentScene.id),
      supabase.from('scenes').insert({
        session_id: currentSession.id,
        narrative: generateNarrative(choice, currentSession),
        choices: generateChoices(choice),
      }).select().single()
    ])

    if (updateResult.error) {
      set({ loading: false })
      throw updateResult.error
    }

    if (newSceneResult.error) {
      set({ loading: false })
      throw newSceneResult.error
    }

    const updatedGameState = updateGameStateForChoice(currentSession.game_state)
    const updatedSession = { ...currentSession, game_state: updatedGameState }

    const { error: sessionError } = await supabase
      .from('game_sessions')
      .update({
        game_state: updatedGameState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSession.id)

    if (sessionError) {
      set({ loading: false })
      throw sessionError
    }

    set({
      currentSession: updatedSession,
      scenes: [
        ...scenes.map(s => 
          s.id === currentScene.id ? { ...s, player_choice: choice } : s
        ),
        newSceneResult.data
      ],
      loading: false,
    })
  },
}))