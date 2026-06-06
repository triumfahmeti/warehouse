// Konsumator i hollë i RealtimeContext. Lidhja e vetme SignalR jeton te
// RealtimeProvider; këtu vetëm lexojmë gjendjen e notifikimeve që zilja
// (NotificationBell) të mbetet e pandryshuar.
import { useRealtime } from '../realtime/RealtimeContext';

export function useNotifications() {
  const { notifications, unreadCount, markAsRead } = useRealtime();
  return { notifications, unreadCount, markAsRead };
}
