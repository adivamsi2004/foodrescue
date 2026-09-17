import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { AppNotification } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (userId: string, title: string, message: string, type: AppNotification['type'], relatedDonationId?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedNotifications: AppNotification[] = [];
      let unread = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedNotifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          relatedDonationId: data.relatedDonationId,
          isRead: data.isRead,
          createdAt: data.createdAt
        });
        if (!data.isRead) {
          unread++;
        }
      });
      setNotifications(loadedNotifications);
      setUnreadCount(unread);
      setLoading(false);
    }, (error) => {
      console.error("Error loading notifications:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const markAsRead = async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { isRead: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        if (!notif.isRead && notif.id) {
          const docRef = doc(db, 'notifications', notif.id);
          batch.update(docRef, { isRead: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const sendNotification = async (
    userId: string, 
    title: string, 
    message: string, 
    type: AppNotification['type'], 
    relatedDonationId?: string
  ) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        relatedDonationId: relatedDonationId || null,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      sendNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
