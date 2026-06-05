import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { tokenStorage } from '../auth/tokenStorage';
import { http } from '../api/client';

const HUB_URL = 'http://localhost:5138/notificationHub';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchedRef = useRef(false);

  const markAsRead = async (id) => {
    try {
      await http.patch(`/notification/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silence
    }
  };

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      http.get('/notification').then(data => {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      }).catch(() => {});
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => tokenStorage.getAccessToken(),
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (notification) => {
      const currentUserId = tokenStorage.getUser()?.userId;
      if (notification.userId === currentUserId) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    connection.start().catch(err => console.error('SignalR error:', err));

    return () => { connection.stop(); };
  }, []);

  return { notifications, unreadCount, markAsRead };
}