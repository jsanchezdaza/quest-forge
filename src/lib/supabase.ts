import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase config:', { 
  url: supabaseUrl ? 'SET' : 'MISSING', 
  key: supabaseAnonKey ? 'SET' : 'MISSING' 
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

console.log('✅ Creating Supabase client...')
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
          game_state: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_name: string
          character_class: string
          game_state?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          character_name?: string
          character_class?: string
          game_state?: any
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