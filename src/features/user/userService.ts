import { db } from '../../lib/firebase';
import { postApi } from '../../lib/apiClient';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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
        // Chỉ đọc nhóm điểm cao nhất thay vì toàn bộ collection users.
        // Lấy dư (x2) vì giáo viên cũng nằm trong collection và bị lọc ở dưới;
        // orderBy một field dùng index mặc định nên không cần tạo composite index.
        const q = query(usersRef, orderBy('points', 'desc'), limit(limitCount * 2));

        const querySnapshot = await getDocs(q);

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

/**
 * Hoàn thành bài học: server chấm lại câu trả lời và cộng điểm (mỗi bài một lần).
 */
export const completeLesson = async (
    lessonId: number,
    topic: string,
    answers: { questionId: number; answer: string }[]
): Promise<{ score: number | null; pointsAwarded: number; alreadyCompleted: boolean }> => {
    return postApi('/api/lessons/complete', { lessonId, topic, answers });
};

/**
 * Cập nhật trạng thái online của user
 */
export const setUserOnline = async (uid: string, isOnline: boolean) => {
    try {
        // Gọi update trực tiếp (không đọc trước) để tiết kiệm 1 lượt đọc mỗi lần heartbeat.
        // updateDoc tự báo lỗi not-found nếu user chưa có document (user mới) → bỏ qua.
        await updateDoc(doc(db, 'users', uid), {
            isOnline,
            lastActive: serverTimestamp()
        });
    } catch (error: any) {
        if (error?.code === 'not-found') return;
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
        const now = Date.now();
        userDocs.forEach((userDoc, index) => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                const lastActiveMs = data.lastActive?.toMillis?.() || 0;
                // Consider online if flag is true AND pinged within the last 4 minutes
                const isOnlineAndRecent = data.isOnline && (now - lastActiveMs < 4 * 60 * 1000);
                status[uids[index]] = isOnlineAndRecent || false;
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
