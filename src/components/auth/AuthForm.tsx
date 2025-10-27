import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNotifications } from '../../store/notificationStore'
import { FormField, Button } from '../ui'
import { VALIDATION_RULES } from '../../constants/validation'
import { AUTH_MESSAGES } from '../../constants/auth'
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
          AUTH_MESSAGES.SIGNUP_SUCCESS.title, 
          AUTH_MESSAGES.SIGNUP_SUCCESS.message
        )
      } else {
        await signIn(email, password)
        notifications.success(
          AUTH_MESSAGES.SIGNIN_SUCCESS.title, 
          AUTH_MESSAGES.SIGNIN_SUCCESS.message
        )
      }
    } catch (error) {
      const { title, message } = parseAuthError(error)
      notifications.error(title, message)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="relative border-2 border-medieval-gold/40 rounded-xl bg-white/10 backdrop-blur-sm shadow-2xl shadow-black/50 p-4 sm:p-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="dnd-title text-3xl sm:text-4xl md:text-5xl mb-6 sm:mb-8 leading-tight">
            QUEST FORGE
          </h1>
          <p className="font-pixel-body text-xs sm:text-sm text-gray-400 uppercase tracking-wide">
            {mode === 'signin' ? AUTH_MESSAGES.WELCOME_MESSAGES.RETURNING_USER : AUTH_MESSAGES.WELCOME_MESSAGES.NEW_USER}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full"
          >
            {mode === 'signin' ? AUTH_MESSAGES.SIGNIN_BUTTON : AUTH_MESSAGES.SIGNUP_BUTTON}
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-medieval-gold hover:text-medieval-darkgold transition-colors font-pixel-body text-xs uppercase tracking-wide min-h-[44px] py-2"
          >
            {mode === 'signin'
              ? AUTH_MESSAGES.TOGGLE_MESSAGES.TO_SIGNUP
              : AUTH_MESSAGES.TOGGLE_MESSAGES.TO_SIGNIN
            }
          </button>
        </div>
      </div>
    </div>
  )
}