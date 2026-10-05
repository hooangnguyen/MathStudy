import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

/** Lưu và đọc lịch sử hỏi gia sư AI của học sinh (collection ai_consultations). */
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
