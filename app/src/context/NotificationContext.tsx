import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppApi } from '../api/services';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { NavigationService } from '../utils/navigation';

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
    // Normalize: if the timestamp has no timezone info (no Z or +/-), treat it as UTC
    let normalized = isoString;
    if (normalized && !normalized.endsWith('Z') && !normalized.match(/[+-]\d{2}:\d{2}$/)) {
      normalized += 'Z';
    }
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "Just now";
    const diff = Date.now() - date.getTime();
    if (diff < 0) return "Just now";
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

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  
  const { isAuthenticated, userProfile } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await AppApi.getNotifications(1, 100);
      const rawNotifs = response.data || [];
      
      const mapped = rawNotifs.map((n: any) => ({
        id: n.id,
        title: n.title || 'Notification',
        subtitle: n.message || 'You have an update.',
        time: formatTimeAgo(n.createdAt),
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(n.title?.split(' ')[0] || 'U')}&background=E53935&color=fff`,
        targetId: n.targetId || '',
        isRead: n.isRead ?? false,
        type: n.type || 'GENERAL',
        createdAt: n.createdAt,
      }));

      const usernames = Array.from(new Set(mapped.map(m => m.title.split(' ')[0]).filter(Boolean)));
      if (usernames.length > 0) {
        const { data: userData } = await supabase
          .from('User')
          .select('username, avatarUrl')
          .in('username', usernames);
        
        if (userData) {
          const avatarMap: Record<string, string> = {};
          userData.forEach(u => { if (u.avatarUrl) avatarMap[u.username] = u.avatarUrl; });
          
          mapped.forEach(m => {
            const name = m.title.split(' ')[0];
            if (avatarMap[name]) m.imageUrl = avatarMap[name];
          });
        }
      }

      setNotifications(mapped);
    } catch (e) {
      console.log('Notifications fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const token = (await Notifications.getDevicePushTokenAsync()).data;
      console.log('Native Push Token:', token);
      return token;
    } catch (e) {
      console.error('Error getting push token:', e);
      return null;
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_ENABLED_KEY).then(val => {
      const enabledByCache = val !== null ? val === 'true' : true;
      setNotificationsEnabledState(enabledByCache);
      
      if (enabledByCache && isAuthenticated) {
        registerForPushNotificationsAsync().then(token => {
          if (token) AppApi.registerDevice(token, Device.modelName || 'Mobile Device', Platform.OS);
        });
      }
    });

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      console.log('[NOTIFY] Handling notification response:', response);
      // Always navigate to the general Notifications page as specifically requested
      NavigationService.navigate('Notifications');
    };

    // Check for initial notification (cold start)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      fetchNotifications();
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [isAuthenticated, fetchNotifications]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
    
    if (enabled && isAuthenticated) {
      const token = await registerForPushNotificationsAsync();
      if (token) await AppApi.registerDevice(token, Device.modelName || 'Mobile Device', Platform.OS);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && userProfile?.id) {
      fetchNotifications();
      const subscription = AppApi.subscribeToNotifications(userProfile.id, () => {
        fetchNotifications();
      });
      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, userProfile?.id, fetchNotifications]);

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
