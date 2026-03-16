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
    language?: string;
    fontSize?: string;
    eyeProtection?: boolean;
}

export interface UserProfile {
    uid: string;
    name: string;
    role: 'student' | 'teacher';
    grade?: number;
    gender?: 'male' | 'female' | 'other';
    avatar?: string;
    onboarded: boolean;
    streak: number;
    points: number;
    completedLessons?: number[];
    totalCompletedAssignments?: number;
    achievements?: Achievement[];
    school?: string;
    subject?: string;
    enrolledClasses?: string[];
    preferences?: UserPreferences;
    isOnline?: boolean;
    blockedUsers?: string[];
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
        // Get all users and sort in memory (no index needed)
        const q = query(usersRef);

        const querySnapshot = await getDocs(q);

        // Get all users, filter by role, then sort by points in memory
        const students = querySnapshot.docs
            .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
            .filter(user => user.role === 'student')
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, limitCount);

        return students;
    } catch (error) {
        console.error('Error fetching top users:', error);
        return [];
    }
};

export const updateProgress = async (uid: string, lessonId: number, score: number) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        let completedLessons: number[] = [];
        let points = 0;

        if (userDoc.exists()) {
            const data = userDoc.data();
            completedLessons = data.completedLessons || [];
            points = data.points || 0;
        }

        if (!completedLessons.includes(lessonId)) {
            completedLessons.push(lessonId);
            points += (score * 10);

            await setDoc(userRef, {
                completedLessons,
                points,
                lastActive: serverTimestamp()
            }, { merge: true });

            return { completedLessons, points };
        }
        return null;
    } catch (error) {
        console.error('Error updating progress:', error);
        throw error;
    }
};

/**
 * Cập nhật trạng thái online của user
 */
export const setUserOnline = async (uid: string, isOnline: boolean) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // User document doesn't exist yet (new user), skip updating
            console.log('User document not found, skipping online status update');
            return;
        }

        await updateDoc(userRef, {
            isOnline,
            lastActive: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating online status:', error);
    }
};

/**
 * Lấy danh sách online status của nhiều users
 */
export const getOnlineStatus = async (uids: string[]): Promise<{ [uid: string]: boolean }> => {
    if (!uids || uids.length === 0) return {};
    try {
        const promises = uids.map(uid => getDoc(doc(db, 'users', uid)));
        const userDocs = await Promise.all(promises);
        const status: { [uid: string]: boolean } = {};
        userDocs.forEach((userDoc, index) => {
            if (userDoc.exists()) {
                status[uids[index]] = userDoc.data().isOnline || false;
            }
        });
        return status;
    } catch (error) {
        console.error('Error fetching online status:', error);
        return {};
    }
};

/**
 * Chặn người dùng
 */
export const blockUser = async (currentUserId: string, blockedUserId: string) => {
    try {
        const userRef = doc(db, 'users', currentUserId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            const blockedUsers = data.blockedUsers || [];
            if (!blockedUsers.includes(blockedUserId)) {
                blockedUsers.push(blockedUserId);
                await updateDoc(userRef, { blockedUsers });
            }
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        throw error;
    }
};

/**
 * Bỏ chặn người dùng
 */
export const unblockUser = async (currentUserId: string, blockedUserId: string) => {
    try {
        const userRef = doc(db, 'users', currentUserId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            const blockedUsers = (data.blockedUsers || []).filter((id: string) => id !== blockedUserId);
            await updateDoc(userRef, { blockedUsers });
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
};

/**
 * Kiểm tra người dùng bị chặn
 */
export const isUserBlocked = async (currentUserId: string, otherUserId: string): Promise<boolean> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return (data.blockedUsers || []).includes(otherUserId);
        }
        return false;
    } catch (error) {
        console.error('Error checking blocked user:', error);
        return false;
    }
};
