import { create } from 'zustand'
import type { ToastType } from '../components/ui/Toast'
import { NOTIFICATION_LIMITS } from '../constants/notifications'

interface Notification {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    set((state) => {
      const newNotifications = [
        ...state.notifications,
        { ...notification, id }
      ]
      
      // Limit the number of notifications to prevent spam
      if (newNotifications.length > NOTIFICATION_LIMITS.MAX_NOTIFICATIONS) {
        return {
          notifications: newNotifications.slice(-NOTIFICATION_LIMITS.MAX_NOTIFICATIONS)
        }
      }
      
      return { notifications: newNotifications }
    })
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  
  clearAll: () => {
    set({ notifications: [] })
  }
}))

// Helper functions for common notification types
export const useNotifications = () => {
  const { addNotification } = useNotificationStore()
  
  return {
    success: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
      
    error: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message }),
      
    warning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
      
    info: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message })
  }
}