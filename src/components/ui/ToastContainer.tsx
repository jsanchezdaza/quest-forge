import { useNotificationStore } from '../../store/notificationStore'
import Toast from './Toast'

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          {...notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  )
}