import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

export interface Lesson {
    id: string;
    grade: number;
    title: string;
    content: string;
    order: number;
}

export interface MatchHistory {
    id: string;
    player1Id: string;
    player2Id: string;
    winnerId: string;
    p1Score: number;
    p2Score: number;
    timestamp: any;
}

export const getCurriculum = async (grade: number): Promise<Lesson[]> => {
    try {
        const q = query(
            collection(db, 'curriculum'),
            where('grade', '==', grade),
            orderBy('order', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    } catch (error) {
        console.error('Error fetching curriculum:', error);
        return [];
    }
};

export const getMatchHistory = async (userId: string): Promise<MatchHistory[]> => {
    try {
        const q = query(
            collection(db, 'matches'),
            where('player1Id', '==', userId), // Simplified for now, real app needs OR query
            orderBy('timestamp', 'desc'),
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchHistory));
    } catch (error) {
        console.error('Error fetching match history:', error);
        return [];
    }
};

export const saveMatchResult = async (match: Omit<MatchHistory, 'id' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, 'matches'), {
            ...match,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving match result:', error);
    }
};

export interface AIConsultation {
    id?: string;
    userId: string;
    grade: string | number;
    prompt: string;
    imageUrl?: string | null;
    response: string;
    timestamp?: any;
}

export const saveAIConsultation = async (consultation: AIConsultation) => {
    try {
        await addDoc(collection(db, 'ai_consultations'), {
            ...consultation,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving AI consultation:', error);
    }
};

export const getAIConsultationsByUserId = async (userId: string): Promise<AIConsultation[]> => {
    try {
        const q = query(
            collection(db, 'ai_consultations'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const consultations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIConsultation));
        
        // Sắp xếp ở client thay vì dùng `orderBy` trên query để tránh lỗi requires composite index
        return consultations.sort((a, b) => {
            const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
            const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
            return timeA - timeB;
        });
    } catch (error) {
        console.error('Error fetching AI consultations:', error);
        return [];
    }
};
