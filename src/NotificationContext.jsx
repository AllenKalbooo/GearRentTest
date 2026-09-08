import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const NOTIFICATIONS_KEY = 'gearRentNotifications';
export const ADMIN_NOTIFICATION_RECIPIENT = '__admin__';

function readNotifications() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(readNotifications);

  useEffect(() => {
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((message, type = 'info', recipientEmail = null) => {
    const targetEmail = recipientEmail?.trim().toLowerCase() || user?.email?.trim().toLowerCase() || null;
    setNotifications((current) => [{
      id: `notification-${Date.now()}-${Math.random()}`,
      message,
      type,
      recipientEmail: targetEmail,
      createdAt: Date.now(),
      read: false,
    }, ...current].slice(0, 30));
  }, [user]);

  const addAdminNotification = useCallback((message, type = 'info') => {
    addNotification(message, type, ADMIN_NOTIFICATION_RECIPIENT);
  }, [addNotification]);

  const markAllRead = useCallback(() => {
    const currentEmail = user?.email?.trim().toLowerCase();
    setNotifications((current) => current.map((notification) => (
      !notification.recipientEmail || notification.recipientEmail === currentEmail
        ? { ...notification, read: true }
        : notification
    )));
  }, [user]);

  const clearAllNotifications = useCallback(() => {
    const currentEmail = user?.email?.trim().toLowerCase();
    setNotifications((current) => current.filter((notification) => (
      notification.recipientEmail && notification.recipientEmail !== currentEmail
    )));
  }, [user]);

  const markAdminNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => (
      notification.recipientEmail === ADMIN_NOTIFICATION_RECIPIENT
        ? { ...notification, read: true }
        : notification
    )));
  }, []);

  const clearAdminNotifications = useCallback(() => {
    setNotifications((current) => current.filter((notification) => (
      notification.recipientEmail !== ADMIN_NOTIFICATION_RECIPIENT
    )));
  }, []);

  const visibleNotifications = notifications.filter((notification) => (
    (!notification.recipientEmail || notification.recipientEmail === user?.email?.trim().toLowerCase())
    && notification.recipientEmail !== ADMIN_NOTIFICATION_RECIPIENT
  ));
  const adminNotifications = notifications.filter((notification) => (
    notification.recipientEmail === ADMIN_NOTIFICATION_RECIPIENT
  ));

  const value = useMemo(() => ({
    notifications: visibleNotifications,
    unreadCount: visibleNotifications.filter((notification) => !notification.read).length,
    addNotification,
    addAdminNotification,
    markAllRead,
    clearAllNotifications,
    adminNotifications,
    adminUnreadCount: adminNotifications.filter((notification) => !notification.read).length,
    markAdminNotificationsRead,
    clearAdminNotifications,
  }), [visibleNotifications, addNotification, addAdminNotification, markAllRead, clearAllNotifications, adminNotifications, markAdminNotificationsRead, clearAdminNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
