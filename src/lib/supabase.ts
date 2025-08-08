import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase config:', { 
  url: supabaseUrl ? '✅ Present' : '❌ Missing', 
  key: supabaseAnonKey ? '✅ Present' : '❌ Missing' 
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables - app will use offline mode')
  // Don't throw error, let the app handle it gracefully
}

console.log('🚀 Creating Supabase client...')
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)
console.log('✅ Supabase client created')

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          character_name: string
          character_class: string
          game_state: {
          level: number
          health: number
          maxHealth: number
          experience: number
          currentScene: number
          inventory: string[]
          stats: Record<string, number>
        }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_name: string
          character_class: string
          game_state?: {
            level?: number
            health?: number
            maxHealth?: number
            experience?: number
            currentScene?: number
            inventory?: string[]
            stats?: Record<string, number>
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          character_name?: string
          character_class?: string
          game_state?: {
            level?: number
            health?: number
            maxHealth?: number
            experience?: number
            currentScene?: number
            inventory?: string[]
            stats?: Record<string, number>
          }
          updated_at?: string
        }
      }
      scenes: {
        Row: {
          id: string
          session_id: string
          narrative: string
          choices: string[]
          player_choice: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          narrative: string
          choices: string[]
          player_choice?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          narrative?: string
          choices?: string[]
          player_choice?: string | null
        }
      }
    }
  }
}