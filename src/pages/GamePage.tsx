import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { Button, Card, LoadingSpinner, Modal } from '../components/ui'
import CreateCharacterModal from '../components/game/CreateCharacterModal'
import GameSession from '../components/game/GameSession'

export default function GamePage() {
  const { profile, signOut } = useAuthStore()
  const { currentSession, loading } = useGameStore()
  const [showCreateCharacter, setShowCreateCharacter] = useState(false)

  useEffect(() => {
    // Auto-show character creation if no session exists
    if (!currentSession && !loading) {
      setShowCreateCharacter(true)
    }
  }, [currentSession, loading])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your adventure..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-darker via-background-dark to-background-card">
      {/* Header */}
      <header className="border-b border-medieval-gold/20 bg-background-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-medieval text-medieval-gold">
                Quest Forge
              </h1>
              {profile && (
                <span className="text-gray-300">
                  Welcome, {profile.username}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentSession ? (
          <GameSession />
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <h2 className="text-xl font-medieval text-medieval-gold mb-4">
                Start Your Adventure
              </h2>
              <p className="text-gray-300 mb-6">
                Create a character to begin your journey in the world of Quest Forge.
              </p>
              <Button onClick={() => setShowCreateCharacter(true)}>
                Create Character
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Create Character Modal */}
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
    </div>
  )
}