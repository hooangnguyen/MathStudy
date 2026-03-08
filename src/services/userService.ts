import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';

export interface Achievement {
    id: string;
    title: string;
    icon: string;
    level: number;
    label: string;
    unlockedAt?: any;
}

export interface UserPreferences {
    darkMode: boolean;
    soundEffects: boolean;
    notifications: boolean;
}

export interface UserProfile {
    uid: string;
    name: string;
    role: 'student' | 'teacher';
    grade?: number;
    avatar?: string;
    onboarded: boolean;
    streak: number;
    points: number;
    achievements?: Achievement[];
    school?: string;
    subject?: string;
    enrolledClasses?: string[];
    preferences?: UserPreferences;
    lastActive: any;
    createdAt: any;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const getUsersByIds = async (uids: string[]): Promise<UserProfile[]> => {
    if (!uids || uids.length === 0) return [];
    try {
        const promises = uids.map(uid => getDoc(doc(db, 'users', uid)));
        const userDocs = await Promise.all(promises);
        return userDocs
            .filter(doc => doc.exists())
            .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
        console.error('Error fetching multiple users:', error);
        return [];
    }
};

export const saveUserProfile = async (uid: string, profile: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, 'users', uid);
        const existingProfile = await getUserProfile(uid);

        if (!existingProfile) {
            // New user registration
            await setDoc(userRef, {
                ...profile,
                uid,
                streak: 0,
                points: 0,
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
            });
        } else {
            // Update existing profile
            await updateDoc(userRef, {
                ...profile,
                lastActive: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error saving user profile:', error);
        throw error;
    }
};

export const getAchievements = async (uid: string): Promise<Achievement[]> => {
    try {
        const achievementsRef = collection(db, 'users', uid, 'achievements');
        const q = query(achievementsRef, orderBy('unlockedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Achievement));
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return [];
    }
};

export const awardAchievement = async (uid: string, achievement: Omit<Achievement, 'unlockedAt'>) => {
    try {
        const achRef = doc(db, 'users', uid, 'achievements', achievement.id);
        await setDoc(achRef, {
            ...achievement,
            unlockedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error awarding achievement:', error);
        throw error;
    }
};

export const getTopUsers = async (limitCount: number = 50, type: 'solo' | 'multiplayer' = 'solo'): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, 'users');
        // Both types will just sort by points for now as duelWins doesn't exist yet,
        // but this allows easy expansion later.
        const q = query(
            usersRef,
            orderBy('points', 'desc'),
            orderBy('lastActive', 'desc'), // Tie-breaker
        );

        // Note: In a real prod app with millions of users, we'd need better pagination
        // or a dedicated leaderboard collection updated via cloud functions.
        const querySnapshot = await getDocs(q);

        // Filter in memory for role student since compound index role+points is needed otherwise
        const students = querySnapshot.docs
            .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
            .filter(user => user.role === 'student')
            .slice(0, limitCount);

        return students;
    } catch (error) {
        console.error('Error fetching top users:', error);
        return [];
    }
};
