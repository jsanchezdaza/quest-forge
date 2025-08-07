import { useEffect } from 'react'
import { NOTIFICATION_DURATION } from '../../constants/notifications'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export default function Toast({ 
  id, 
  type, 
  title, 
  message, 
  duration = NOTIFICATION_DURATION.DEFAULT, 
  onClose 
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const typeStyles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  }

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`
      relative p-4 rounded-lg border backdrop-blur-sm
      animate-in slide-in-from-right-full duration-300
      ${typeStyles[type]}
    `}>
      <button
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 transition-colors"
      >
        ×
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <span className="text-lg font-semibold mt-0.5">
          {iconMap[type]}
        </span>
        <div>
          <h4 className="font-semibold text-gray-100 mb-1">
            {title}
          </h4>
          {message && (
            <p className="text-sm opacity-90">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}