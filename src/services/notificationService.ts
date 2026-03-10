import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    onSnapshot,
    query,
    where,
    orderBy,
    writeBatch,
    limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
    id: string;
    userId: string;
    type: 'duel' | 'system' | 'achievement' | 'ai' | 'submission' | 'student_join' | 'assignment';
    title: string;
    message: string;
    metadata?: Record<string, any>;
    read: boolean;
    createdAt: any;
}

export const sendNotification = async (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    metadata?: Record<string, any>
) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const newNotifRef = doc(notificationsRef);

        const notification: Notification = {
            id: newNotifRef.id,
            userId,
            type,
            title,
            message,
            metadata,
            read: false,
            createdAt: serverTimestamp()
        };

        await setDoc(newNotifRef, notification);
        return newNotifRef.id;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = [];
        snapshot.forEach((doc) => {
            notifications.push(doc.data() as Notification);
        });
        callback(notifications);
    }, (error) => {
        console.error("Error subscribing to notifications:", error);
    });
};

export const markAsRead = async (notificationId: string) => {
    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await setDoc(notifRef, { read: true }, { merge: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const markAllAsRead = async (userId: string, notificationIds: string[]) => {
    try {
        const batch = writeBatch(db);
        notificationIds.forEach(id => {
            const notifRef = doc(db, 'notifications', id);
            batch.update(notifRef, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};
