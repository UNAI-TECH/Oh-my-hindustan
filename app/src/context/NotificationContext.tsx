import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppApi } from '../api/services';
import { NotificationResponse } from '../types';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  imageUrl: string;
  targetId: string;
  isRead: boolean;
}

interface NotificationContextProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
}

const formatTimeAgo = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Just now";
    
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / (60 * 1000));
    
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return "Just now";
  }
};

const toNotificationItem = (notif: NotificationResponse): NotificationItem => {
  const title = notif.payload?.title || "New Notification";
  const subtitle = notif.payload?.body || "You have a new update.";
  const imageUrl = notif.payload?.iconUrl || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=100";
  const targetId = notif.payload?.referenceId || "unknown";
  
  return {
    id: notif.id,
    title,
    subtitle,
    time: formatTimeAgo(notif.createdAt),
    imageUrl,
    targetId,
    isRead: notif.isRead
  };
};

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await AppApi.getNotifications();
      const rawNotifs = response.data || [];
      setNotifications(rawNotifs.map(toNotificationItem));
    } catch (e) {
      console.log('Skipping notifications fetch (Requires Login)', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ notifications, isLoading, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
