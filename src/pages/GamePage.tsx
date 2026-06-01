import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { useNotifications } from '../store/notificationStore'
import { Button, Card, LoadingSpinner, Modal, AppBackground, Footer } from '../components/ui'
import CreateCharacterModal from '../components/game/CreateCharacterModal'
import GameSession from '../components/game/GameSession'
import { useTranslation } from '../i18n'

export default function GamePage() {
  const { profile, signOut } = useAuthStore()
  const { currentSession, loading, loadLatestSession } = useGameStore()
  const notifications = useNotifications()
  const { t } = useTranslation()
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
      notifications.info(t('game.signedOutTitle'), t('game.signedOutMessage'))
    } catch (error) {
      notifications.error(t('game.signOutErrorTitle'), t('game.signOutErrorMessage'))
    }
  }

  if (loading || !initialLoadDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('game.loadingAdventure')} showAvatar={true} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppBackground variant="game" className="flex-1">
        <header className="border-b border-medieval-gold/20 bg-background-card/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <h1 className="dnd-title text-xl sm:text-2xl md:text-3xl text-medieval-gold leading-tight">
                  {t('app.title')}
                </h1>
                {profile && (
                  <span className="text-gray-300 font-pixel-body text-xs sm:text-sm uppercase tracking-wide">
                    {t('game.welcome', { username: profile.username.toUpperCase() })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {currentSession && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCreateCharacter(true)}
                    className="flex-1 sm:flex-none min-h-[44px]"
                  >
                    <span className="hidden sm:inline">{t('game.newCharacter')}</span>
                    <span className="sm:hidden">{t('game.newCharacterShort')}</span>
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  {t('auth.signOut')}
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
              <Card variant="game" className="max-w-md mx-auto">
                <h2 className="text-lg sm:text-xl text-medieval-gold mb-4 leading-tight">
                  {t('game.startAdventure')}
                </h2>
                <p className="text-gray-300 mb-6 font-pixel-body text-sm leading-relaxed uppercase tracking-wide">
                  {t('game.createCharacterPrompt')}
                </p>
                <Button onClick={() => setShowCreateCharacter(true)}>
                  {t('game.createCharacter')}
                </Button>
              </Card>
            </div>
          )}
        </main>

        <Modal
          isOpen={showCreateCharacter}
          onClose={() => !currentSession ? undefined : setShowCreateCharacter(false)}
          title={t('game.createCharacterTitle')}
          maxWidth="lg"
        >
          <CreateCharacterModal
            onClose={() => setShowCreateCharacter(false)}
          />
        </Modal>
      </AppBackground>
      <Footer />
    </div>
  )
}