import { useNotifications } from '../contexts/NotificationContext';

export default function Notifications() {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600 text-white';
      case 'error':
        return 'bg-red-500 border-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600 text-white';
      case 'info':
        return 'bg-blue-500 border-blue-600 text-white';
      default:
        return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
            ${getNotificationStyles(notification.type)}
            transition-all duration-300 transform animate-in slide-in-from-right
          `}
        >
          <span className="flex-shrink-0 text-lg">
            {getIcon(notification.type)}
          </span>
          <span className="flex-1 text-sm font-medium">
            {notification.message}
          </span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 ml-2 hover:opacity-75 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}