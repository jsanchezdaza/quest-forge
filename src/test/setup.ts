import '@testing-library/jest-dom'

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}))

// Mock OpenRouter
jest.mock('../lib/openrouter', () => ({
  generateSceneNarrativeWithAI: jest.fn(),
  generatePlayerChoicesWithAI: jest.fn(),
  generateBackstoryWithAI: jest.fn(),
  isOpenRouterConfigured: jest.fn(() => false),
}))

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-key'
process.env.VITE_OPENROUTER_API_KEY = ''
process.env.VITE_OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3.1:free'
process.env.VITE_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_OPENROUTER_API_KEY: '',
        VITE_OPENROUTER_MODEL: 'deepseek/deepseek-chat-v3.1:free',
        VITE_OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      },
    },
  },
  writable: true,
})