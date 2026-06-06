// ============ REALTIME CONTEXT ============
// Një lidhje e VETME SignalR për tërë aplikacionin. Mban dy kanale mbi të
// njëjtën lidhje:
//   - "ReceiveNotification" → njoftimet e përdoruesit (zilja e notifikimeve)
//   - "ResourceChanged"     → sinjal i lehtë "ky resurs ndryshoi" (p.sh. "products"),
//                             ku faqet rifreskojnë vetë listat e tyre.
//
// Përfitimi: një socket i vetëm në vend që çdo hook/faqe të hapë lidhjen e vet.

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { tokenStorage } from '../auth/tokenStorage';
import { useAuth } from '../auth/AuthContext';
import { http } from '../api/client';

// E nxjerrim URL-në e hub-it nga API_BASE (heqim '/api' fundor) që të mos
// kemi adresë të hardkoduar — përshtatet vetvetiu me mjedisin (dev/prod).
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5138/api';
const HUB_URL = API_BASE.replace(/\/api\/?$/, '') + '/notificationHub';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // resource (string) -> Set<callback>. Ref që të mos rikrijohet lidhja kur
  // ndryshojnë abonentët.
  const subscribersRef = useRef(new Map());

  const markAsRead = useCallback(async (id) => {
    try {
      await http.patch(`/notification/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silence
    }
  }, []);

  // Abonohu për ndryshimet e një resursi. Kthen funksion çabonimi.
  const subscribe = useCallback((resource, cb) => {
    const map = subscribersRef.current;
    if (!map.has(resource)) map.set(resource, new Set());
    map.get(resource).add(cb);
    return () => {
      const set = map.get(resource);
      if (!set) return;
      set.delete(cb);
      if (set.size === 0) map.delete(resource);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    // Ngarkim fillestar i notifikimeve (njësoj si më parë).
    http.get('/notification').then(data => {
      if (cancelled) return;
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    }).catch(() => {});

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => tokenStorage.getAccessToken() })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (notification) => {
      const currentUserId = tokenStorage.getUser()?.userId;
      if (notification.userId === currentUserId) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    connection.on('ResourceChanged', (resource) => {
      const set = subscribersRef.current.get(resource);
      if (!set) return;
      set.forEach(cb => {
        try { cb(resource); } catch { /* mos lejo një abonent të prishë të tjerët */ }
      });
    });

    connection.start().catch(err => console.error('SignalR error:', err));

    return () => {
      cancelled = true;
      connection.stop();
    };
  }, [isAuthenticated]);

  const value = { notifications, unreadCount, markAsRead, subscribe };
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
