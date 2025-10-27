import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'md' 
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${maxWidthClasses[maxWidth]} animate-slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="bg-background-modal border border-medieval-gold/30 rounded-lg shadow-2xl">
          {title && (
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-medieval-gold/20">
              <h2 className="font-fantasy-epic font-bold text-lg sm:text-xl text-medieval-gold drop-shadow-lg">
                {title}
              </h2>
            </div>
          )}

          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}