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
    lastActive: any;
    createdAt: any;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
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
