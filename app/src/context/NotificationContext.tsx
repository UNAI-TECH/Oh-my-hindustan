import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
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
  pushToken: string | null;
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

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  const { isAuthenticated, userProfile } = useAuth();
  
  // Safe environment check for SDK 53+
  const isExpoGo = Constants.executionEnvironment === 'storeClient';

  // 1. Initial Load of Preferences
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_ENABLED_KEY).then(val => {
      if (val !== null) setNotificationsEnabledState(val === 'true');
    });
  }, []);

  // 2. Register for Push Notifications
  async function registerForPushNotificationsAsync() {
    if (isExpoGo) {
       console.log('[NOTIF] Skipping push registration in Expo Go.');
       return null;
    }
    
    try {
      let token;
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return null;
        
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token ?? null;
    } catch (e) {
      console.warn('[NOTIF] Registration error:', e);
      return null;
    }
  }

  // 3. Setup Notification Listeners & Handler (CONDITIONAL FOR EXPO GO)
  useEffect(() => {
    if (isExpoGo) return;

    // Set handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Foreground listener
    const notifSub = Notifications.addNotificationReceivedListener(notification => {
      fetchNotifications();
    });

    // Response (Tap) listener
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const postId = data?.postId;
      if (postId) {
        NavigationService.navigate('ArticleDetail', { id: postId });
      } else {
        NavigationService.navigate('Notifications');
      }
    });

    return () => {
      notifSub.remove();
      responseSub.remove();
    };
  }, [isExpoGo]);

  // 4. Token Sync
  useEffect(() => {
    if (isAuthenticated && userProfile?.id && !isExpoGo) {
      const syncToken = async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setPushToken(token);
            await AppApi.registerDevice(token, Device.deviceName || 'Mobile Device', Platform.OS);
          }
          await AppApi.updateNotificationSettings(notificationsEnabled);
        } catch (e) {
          console.warn('[NOTIF] Token sync error:', e);
        }
      };
      syncToken();
    } else if (!isAuthenticated && pushToken && !isExpoGo) {
      const cleanup = async () => {
        try {
          await AppApi.unregisterDevice(pushToken);
          setPushToken(null);
        } catch (e) {
          console.warn('[NOTIF] Unregistration failed:', e);
        }
      };
      cleanup();
    }
  }, [isAuthenticated, userProfile?.id, notificationsEnabled, isExpoGo]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
    
    if (isAuthenticated && !isExpoGo) {
      try {
        await AppApi.updateNotificationSettings(enabled);
        if (enabled) {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setPushToken(token);
            await AppApi.registerDevice(token, Device.deviceName || 'Mobile Device', Platform.OS);
          }
        }
      } catch (e) {
        console.warn('[NOTIF] Settings sync failed:', e);
      }
    }
  }, [isAuthenticated, isExpoGo]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await AppApi.getNotifications(1, 100);
      const rawNotifs = response.data || [];
      
      // Initial mapping with fallback avatars
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

      // Enhanced mapping: Fetch real avatars from User table
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

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      notificationsEnabled,
      pushToken,
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
