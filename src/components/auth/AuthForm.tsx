import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNotifications } from '../../store/notificationStore'
import { FormField, LoadingSpinner } from '../ui'
import { VALIDATION_RULES } from '../../constants/validation'
import { parseAuthError } from '../../utils/authErrors'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  
  const { signIn, signUp, loading } = useAuthStore()
  const notifications = useNotifications()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (mode === 'signup') {
        if (!username.trim()) {
          notifications.error('Username Required', 'Please enter a username to continue')
          return
        }
        await signUp(email, password, username)
        notifications.success(
          'Account Created Successfully', 
          'Welcome to Quest Forge! You can now start your adventure.'
        )
      } else {
        await signIn(email, password)
        notifications.success(
          'Welcome Back!', 
          'Successfully signed in. Prepare for adventure!'
        )
      }
    } catch (error) {
      const { title, message } = parseAuthError(error)
      notifications.error(title, message)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medieval text-medieval-gold mb-2">
            Quest Forge
          </h1>
          <p className="text-gray-400">
            {mode === 'signin' ? 'Welcome back, adventurer' : 'Begin your quest'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="email"
            type="email"
            value={email}
            onChange={setEmail}
            label="Email"
            placeholder="your.email@example.com"
            required={VALIDATION_RULES.EMAIL_REQUIRED}
          />

          {mode === 'signup' && (
            <FormField
              id="username"
              type="text"
              value={username}
              onChange={setUsername}
              label="Username"
              placeholder="Choose a username"
              required={VALIDATION_RULES.USERNAME_REQUIRED}
              minLength={VALIDATION_RULES.USERNAME_MIN_LENGTH}
            />
          )}

          <FormField
            id="password"
            type="password"
            value={password}
            onChange={setPassword}
            label="Password"
            placeholder="Your password"
            required={true}
            minLength={VALIDATION_RULES.PASSWORD_MIN_LENGTH}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </span>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-medieval-gold hover:text-medieval-darkgold transition-colors"
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'
            }
          </button>
        </div>
      </div>
    </div>
  )
}