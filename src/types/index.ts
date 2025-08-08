export interface User {
  id: string
  email: string
  username?: string
}

export interface UserProfile {
  id: string
  username: string
  created_at: string
}

export interface GameSession {
  id: string
  user_id: string
  character_name: string
  character_class: CharacterClass
  game_state: GameState
  created_at: string
  updated_at: string
}

export interface Scene {
  id: string
  session_id: string
  narrative: string
  choices: string[]
  player_choice: string | null
  created_at: string
}

export type CharacterClass = 
  | 'warrior' 
  | 'mage' 
  | 'rogue' 
  | 'cleric' 
  | 'ranger' 
  | 'paladin'

export interface GameState {
  level: number
  health: number
  maxHealth: number
  experience: number
  previousExperience?: number
  pendingLevelUp?: boolean
  levelsGained?: number
  currentScene: number
  inventory: string[]
  stats: {
    strength: number
    dexterity: number
    intelligence: number
    wisdom: number
    constitution: number
    charisma: number
  }
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
}

export interface GameStore {
  currentSession: GameSession | null
  scenes: Scene[]
  loading: boolean
  loadLatestSession: () => Promise<void>
  createSession: (characterName: string, characterClass: CharacterClass) => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  saveProgress: () => Promise<void>
  makeChoice: (choice: string) => Promise<void>
  updateStats: (newStats: GameState['stats']) => Promise<void>
  clearPreviousExperience: () => Promise<void>
  clearPendingLevelUp: () => Promise<void>
}