import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppApi } from '../api/services';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  imageUrl: string;
  targetId: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

interface NotificationContextProps {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  notificationsEnabled: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const NOTIF_ENABLED_KEY = 'omh_notifications_enabled';

const formatTimeAgo = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Just now";
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (60 * 1000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Just now";
  }
};

const mapRawNotification = (n: any): NotificationItem => ({
  id: n.id,
  title: n.title || n.payload?.title || 'New Notification',
  subtitle: n.message || n.payload?.body || n.payload?.message || 'You have a new update.',
  time: formatTimeAgo(n.createdAt),
  imageUrl: n.payload?.iconUrl || 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=100',
  targetId: n.targetId || n.payload?.referenceId || '',
  isRead: n.isRead ?? false,
  type: n.type || 'GENERAL',
  createdAt: n.createdAt,
});

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const { isAuthenticated, userProfile } = useAuth();
  const subscriptionRef = useRef<any>(null);

  // Load notification preference from storage
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_ENABLED_KEY).then(val => {
      if (val !== null) setNotificationsEnabledState(val === 'true');
    });
  }, []);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await AppApi.getNotifications(1, 50);
      const rawNotifs = response.data || [];
      // Map using raw fields from API (which returns title/message from payload)
      const mapped = rawNotifs.map((n: any) => ({
        id: n.id,
        title: n.payload?.title || 'New Notification',
        subtitle: n.payload?.message || n.payload?.body || 'You have a new update.',
        time: formatTimeAgo(n.createdAt),
        imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=100',
        targetId: n.payload?.referenceId || '',
        isRead: n.isRead ?? false,
        type: n.type || 'GENERAL',
        createdAt: n.createdAt,
      }));
      setNotifications(mapped);
    } catch (e) {
      console.log('Notifications fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await AppApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.warn('markAsRead error:', e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await AppApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn('markAllAsRead error:', e);
    }
  }, []);

  const deleteNotificationsHandler = useCallback(async (ids: string[]) => {
    try {
      await AppApi.deleteNotifications(ids);
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    } catch (e) {
      console.warn('deleteNotifications error:', e);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Setup real-time subscription
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.id) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    // Subscribe to real-time notification changes
    subscriptionRef.current = AppApi.subscribeToNotifications(userProfile.id, (_payload: any) => {
      // Re-fetch on any change (insert/update/delete)
      fetchNotifications();
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isAuthenticated, userProfile?.id]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      notificationsEnabled,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotifications: deleteNotificationsHandler,
      setNotificationsEnabled,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
