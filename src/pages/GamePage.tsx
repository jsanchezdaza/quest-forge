import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { useNotifications } from '../store/notificationStore'
import { Button, Card, LoadingSpinner, Modal, AppBackground } from '../components/ui'
import CreateCharacterModal from '../components/game/CreateCharacterModal'
import GameSession from '../components/game/GameSession'

export default function GamePage() {
  const { profile, signOut } = useAuthStore()
  const { currentSession, loading, loadLatestSession } = useGameStore()
  const notifications = useNotifications()
  const [showCreateCharacter, setShowCreateCharacter] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  useEffect(() => {
    const loadSession = async () => {
      try {
        await loadLatestSession()
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setInitialLoadDone(true)
      }
    }
    
    loadSession()
  }, [loadLatestSession])

  useEffect(() => {
    if (initialLoadDone && !currentSession && !loading) {
      setShowCreateCharacter(true)
    }
  }, [currentSession, loading, initialLoadDone])

  const handleSignOut = async () => {
    try {
      await signOut()
      notifications.info('Signed Out', 'Thanks for playing! Your progress has been saved.')
    } catch (error) {
      notifications.error('Sign Out Error', 'Failed to sign out. Please try again.')
    }
  }

  if (loading || !initialLoadDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your adventure..." />
      </div>
    )
  }

  return (
    <AppBackground variant="game">
      <header className="border-b border-medieval-gold/20 bg-background-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="dnd-title text-2xl sm:text-3xl lg:text-4xl text-medieval-gold leading-tight">
                QUEST FORGE
              </h1>
              {profile && (
                <span className="text-gray-300 font-pixel-body text-xs uppercase tracking-wide">
                  WELCOME, {profile.username.toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {currentSession && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateCharacter(true)}
                >
                  New Character
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentSession ? (
          <GameSession />
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <h2 className="text-lg sm:text-xl text-medieval-gold mb-4 leading-tight">
                START YOUR ADVENTURE
              </h2>
              <p className="text-gray-300 mb-6 font-pixel-body text-sm leading-relaxed uppercase tracking-wide">
                CREATE A CHARACTER TO BEGIN YOUR JOURNEY IN THE WORLD OF QUEST FORGE.
              </p>
              <Button onClick={() => setShowCreateCharacter(true)}>
                Create Character
              </Button>
            </Card>
          </div>
        )}
      </main>

      <Modal
        isOpen={showCreateCharacter}
        onClose={() => !currentSession ? undefined : setShowCreateCharacter(false)}
        title="Create Your Character"
        maxWidth="lg"
      >
        <CreateCharacterModal
          onClose={() => setShowCreateCharacter(false)}
        />
      </Modal>
    </AppBackground>
  )
}