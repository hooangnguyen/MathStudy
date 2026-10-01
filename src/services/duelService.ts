import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    runTransaction,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { postApi, ApiError } from './apiClient';
import { randomCode } from '../utils/utils';

export const RANKS = {
    bronze: { name: 'Đồng', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-700' },
    silver: { name: 'Bạc', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-400' },
    gold: { name: 'Vàng', color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-400' },
    platinum: { name: 'Bạch Kim', color: 'text-teal-500', bg: 'bg-teal-100', border: 'border-teal-400' },
    diamond: { name: 'Kim Cương', color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-400' },
    challenger: { name: 'Thách Đấu', color: 'text-rose-500', bg: 'bg-rose-100', border: 'border-rose-400' },
};

export interface DuelRoom {
    id: string;
    code: string;
    hostId: string;
    hostName: string;
    guestId?: string;
    guestName?: string;
    status: 'waiting' | 'playing' | 'finished';
    gameMode: 'time' | 'questions';
    timeLimit: number; // seconds
    maxPlayers: number;
    currentPlayers: string[]; // array of user IDs
    playerNames: { [uid: string]: string };
    participantProgress?: {
        [uid: string]: {
            score: number;
            progress: number;
            finished: boolean;
        }
    };
    roomQuestions?: string; // JSON string of questions for 1v1 room
    lastSeen?: { [uid: string]: any }; // tín hiệu còn kết nối của từng người (serverTimestamp)
    createdAt: any;
    startedAt?: any;
    finishedAt?: any;
    winnerId?: string;
}

export interface DuelMatch {
    id: string;
    roomId: string;
    player1Id: string;
    player1Name: string;
    player2Id: string;
    player2Name: string;
    player1Score: number;
    player2Score: number;
    winnerId?: string | null;
    isDraw: boolean;
    lpChange?: number; // LP change for ranked (góc nhìn player1)
    lpChanges?: { [uid: string]: number }; // LP thay đổi của từng người chơi
    gameMode: 'quick' | 'room' | 'ranked';
    createdAt: any;
}

export interface UserRank {
    uid: string;
    username: string;
    lp: number;
    rankTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'challenger';
    wins: number;
    losses: number;
    draws: number;
    streak: number; // current winning streak
    maxStreak: number;
    grade?: number; // student grade for class leaderboard
    avatar?: string;
}

// Generate random 6-character room code (alphanumeric)
const generateRoomCode = (): string => randomCode(6);

// Generate random 6-digit numeric room code (for quiz)
export const generateNumericRoomCode = (): string => randomCode(6, '0123456789');

/** Mã chưa được phòng nào còn hoạt động sử dụng (mã số chỉ có 900 nghìn khả năng nên dễ trùng). */
export const getUnusedRoomCode = async (generate: () => string): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = generate();
        const snapshot = await getDocs(query(collection(db, 'duelRooms'), where('code', '==', code)));
        if (snapshot.docs.every(d => d.data().status === 'finished')) return code;
    }
    return generate();
};

// Luật LP dùng chung với server (server là nơi tính chính thức)
export { getRankTier, calculateLPChange } from '../../shared/rank';

// Create a new duel room
export const createDuelRoom = async (
    hostId: string,
    hostName: string,
    gameMode: 'time' | 'questions' = 'time',
    timeLimit: number = 60,
    maxPlayers: number = 2,
    customCode?: string
): Promise<DuelRoom> => {
    const roomRef = doc(collection(db, 'duelRooms'));
    const roomId = roomRef.id;
    const roomCode = customCode ?? await getUnusedRoomCode(generateRoomCode);

    const room: DuelRoom = {
        id: roomId,
        code: roomCode,
        hostId,
        hostName,
        status: 'waiting',
        gameMode,
        timeLimit,
        maxPlayers,
        currentPlayers: [hostId],
        playerNames: { [hostId]: hostName },
        participantProgress: {},
        lastSeen: { [hostId]: serverTimestamp() },
        createdAt: serverTimestamp()
    };

    await setDoc(roomRef, room);
    return room;
};

/**
 * Vào phòng bằng mã (chữ-số cho phòng 1v1, 6 chữ số cho phòng Quiz lớp).
 * - Đã ở trong phòng (vd. tải lại trang) → vào lại phòng đó, kể cả khi đang chơi.
 * - Dùng arrayUnion + field path nên nhiều người vào cùng lúc không ghi đè lẫn nhau;
 *   rules chặn vượt số người tối đa và chặn vào phòng đã bắt đầu.
 * Ném Error với thông báo tiếng Việt khi không vào được.
 */
export const joinDuelRoom = async (roomCode: string, userId: string, userName: string): Promise<DuelRoom> => {
    const roomsRef = collection(db, 'duelRooms');
    const codeToMatch = /^\d+$/.test(roomCode.trim()) ? roomCode.trim() : roomCode.trim().toUpperCase();
    const snapshot = await getDocs(query(roomsRef, where('code', '==', codeToMatch)));

    const rooms = snapshot.docs.map(d => d.data() as DuelRoom).filter(r => r.status !== 'finished');
    const mine = rooms.find(r => r.currentPlayers.includes(userId));
    if (mine) return mine;

    const room = rooms.find(r => r.status === 'waiting');
    if (!room) {
        throw new Error(rooms.length > 0
            ? 'Phòng đã bắt đầu chơi, không thể vào nữa.'
            : 'Không tìm thấy phòng với mã này.');
    }
    if (room.currentPlayers.length >= room.maxPlayers) {
        throw new Error('Phòng đã đủ người.');
    }

    try {
        await updateDoc(doc(db, 'duelRooms', room.id), {
            currentPlayers: arrayUnion(userId),
            [`playerNames.${userId}`]: userName,
            [`lastSeen.${userId}`]: serverTimestamp(),
            ...(room.maxPlayers === 2 && { guestId: userId, guestName: userName })
        });
    } catch (error: any) {
        // Rules từ chối khi phòng vừa đủ người / vừa bắt đầu trong lúc mình đang vào
        if (error?.code === 'permission-denied') {
            throw new Error('Phòng vừa đủ người hoặc đã bắt đầu. Vui lòng thử phòng khác.');
        }
        throw error;
    }

    const joined = await getDoc(doc(db, 'duelRooms', room.id));
    return joined.data() as DuelRoom;
};

/** Báo mình vẫn còn kết nối trong phòng (gọi định kỳ khi đang ở màn hình phòng). */
export const heartbeatRoom = async (roomId: string, userId: string): Promise<void> => {
    await updateDoc(doc(db, 'duelRooms', roomId), { [`lastSeen.${userId}`]: serverTimestamp() });
};

/** Chủ phòng loại những người đã mất kết nối khỏi phòng chờ. */
export const removePlayersFromRoom = async (roomId: string, userIds: string[]): Promise<void> => {
    if (userIds.length === 0) return;
    await updateDoc(doc(db, 'duelRooms', roomId), { currentPlayers: arrayRemove(...userIds) });
};

/** Đọc phòng theo id (dùng khi khôi phục sau khi tải lại trang). */
export const getDuelRoom = async (roomId: string): Promise<DuelRoom | null> => {
    const snap = await getDoc(doc(db, 'duelRooms', roomId));
    return snap.exists() ? (snap.data() as DuelRoom) : null;
};

/** Đọc trận đấu nhanh theo id (dùng khi khôi phục sau khi tải lại trang). */
export const getActiveDuel = async (duelId: string): Promise<any | null> => {
    const snap = await getDoc(doc(db, 'activeDuels', duelId));
    return snap.exists() ? snap.data() : null;
};

// Start a duel (host starts the game). Optional questions for 1v1 room mode.
export const startDuel = async (roomId: string, questions?: any[]): Promise<void> => {
    const updates: Record<string, any> = {
        status: 'playing',
        startedAt: serverTimestamp()
    };
    if (questions && questions.length > 0) {
        updates.roomQuestions = JSON.stringify(questions);
    }
    await updateDoc(doc(db, 'duelRooms', roomId), updates);
};

// Update room status to finished
export const finishDuel = async (
    roomId: string,
    winnerId: string | undefined,
    isDraw: boolean
): Promise<void> => {
    await updateDoc(doc(db, 'duelRooms', roomId), {
        status: 'finished',
        finishedAt: serverTimestamp(),
        winnerId
    });
};

// Get user rank
export const getUserRank = async (userId: string): Promise<UserRank | null> => {
    const rankDoc = await getDoc(doc(db, 'userRanks', userId));
    if (rankDoc.exists()) {
        return rankDoc.data() as UserRank;
    }
    return null;
};

// Get top world rankings by LP
export const getTopRankings = async (count: number = 50): Promise<UserRank[]> => {
    const q = query(
        collection(db, 'userRanks'),
        orderBy('lp', 'desc'),
        limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserRank);
};

// Get top rankings for a specific grade (class leaderboard)
export const getClassRankings = async (grade: number, count: number = 50): Promise<UserRank[]> => {
    try {
        // Fetch all and filter locally to avoid composite index
        const q = query(
            collection(db, 'userRanks'),
            orderBy('lp', 'desc'),
            limit(200)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => doc.data() as UserRank)
            .filter(r => r.grade === grade)
            .slice(0, count);
    } catch (error) {
        console.error('Error fetching class rankings:', error);
        return [];
    }
};

// Subscribe to room updates
export const subscribeToRoom = (
    roomId: string,
    callback: (room: DuelRoom | null) => void
) => {
    return onSnapshot(doc(db, 'duelRooms', roomId), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as DuelRoom);
        } else {
            callback(null);
        }
    });
};

// Leave/delete room
export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    const roomDoc = await getDoc(doc(db, 'duelRooms', roomId));
    if (!roomDoc.exists()) return;

    const room = roomDoc.data() as DuelRoom;

    // Chủ phòng rời → đóng phòng (người còn lại sẽ nhận thông báo phòng đã đóng)
    if (room.hostId === userId) {
        await deleteDoc(doc(db, 'duelRooms', roomId));
    } else {
        // Chỉ bỏ chính mình (thao tác nguyên tử, không ghi đè người khác).
        // Giữ lại tên để bảng kết quả quiz vẫn hiển thị đúng người đã làm bài.
        await updateDoc(doc(db, 'duelRooms', roomId), {
            currentPlayers: arrayRemove(userId)
        });
    }
};

export const getDuelHistory = async (userId: string, limitCount: number = 10): Promise<DuelMatch[]> => {
    // Simplified query to avoid index requirement
    const matches: DuelMatch[] = [];

    try {
        const q1 = query(
            collection(db, 'duelMatches'),
            where('player1Id', '==', userId),
            limit(limitCount * 2)
        );

        const snapshot1 = await getDocs(q1);
        snapshot1.forEach(doc => matches.push({ id: doc.id, ...doc.data() } as DuelMatch));

        const q2 = query(
            collection(db, 'duelMatches'),
            where('player2Id', '==', userId),
            limit(limitCount * 2)
        );

        const snapshot2 = await getDocs(q2);
        snapshot2.forEach(doc => matches.push({ id: doc.id, ...doc.data() } as DuelMatch));

        // Deduplicate and Sort locally
        const uniqueMatches = Array.from(new Map(matches.map(m => [m.id, m])).values());

        return uniqueMatches
            .sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || 0;
                const timeB = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || 0;
                return timeB - timeA;
            })
            .slice(0, limitCount);
    } catch (error) {
        console.error('Error getting history:', error);
        return [];
    }
};

/** Có trận vừa được tạo với mình là player2 trong 60 giây gần đây không. */
const wasJustMatched = async (userId: string): Promise<boolean> => {
    const snapshot = await getDocs(query(collection(db, 'activeDuels'), where('player2Id', '==', userId)));
    const now = Date.now();
    return snapshot.docs.some(d => {
        const data = d.data();
        const createdAt = data.createdAt?.toMillis?.() ?? now;
        return data.status === 'playing' && now - createdAt < 60000;
    });
};

// Find available players for quick match
export const findOpponentForDuel = async (userId: string, userGrade?: number): Promise<{ opponentId: string; opponentName: string; opponentGrade?: number } | null> => {
    try {
        // Heartbeat: báo mình vẫn đang tìm trận (người quá 15 giây không cập nhật bị coi là "ma" và bị xoá).
        const myRef = doc(db, 'duelQueue', userId);
        try {
            await updateDoc(myRef, { updatedAt: serverTimestamp() });
        } catch (error: any) {
            if (error?.code !== 'not-found') throw error;
            // Không còn trong hàng chờ: hoặc vừa được người khác ghép (listener activeDuels sẽ
            // đưa vào trận), hoặc bị xoá vì tab ở nền quá lâu → vào lại hàng chờ.
            if (await wasJustMatched(userId)) return null;
            await setDoc(myRef, {
                userId,
                status: 'waiting',
                grade: userGrade || 5,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return null;
        }

        // Simplified query: only filter by status to avoid index requirement
        const q = query(
            collection(db, 'duelQueue'),
            where('status', '==', 'waiting'),
            limit(10) // Fetch a few and filter self locally
        );

        const snapshot = await getDocs(q);
        const now = Date.now();
        const validOpponents = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const lastActiveMs = data.updatedAt?.toMillis?.() || (data.updatedAt?.seconds * 1000) || data.createdAt?.toMillis?.() || (data.createdAt?.seconds * 1000) || now;
            
            // If the queue entry is older than 15 seconds, assume they disconnected/became a ghost
            if (now - lastActiveMs < 15000) {
                if (data.userId !== userId) {
                    validOpponents.push(data);
                }
            } else {
                // Remove ghost user
                deleteDoc(docSnap.ref).catch(() => {});
            }
        }

        if (validOpponents.length === 0) return null;

        // Try to claim an opponent using a transaction to prevent race conditions (duplicate matches)
        for (const opponent of validOpponents) {
            try {
                const claimed = await runTransaction(db, async (transaction) => {
                    const oppRef = doc(db, 'duelQueue', opponent.userId);
                    const myRef = doc(db, 'duelQueue', userId);
                    // Đọc cả hàng chờ của chính mình: nếu người khác vừa ghép mình (xoá doc
                    // của mình) thì transaction này xung đột và dừng, tránh một người bị
                    // ghép vào hai trận cùng lúc.
                    const [oppDoc, myDoc] = await Promise.all([transaction.get(oppRef), transaction.get(myRef)]);
                    if (!oppDoc.exists() || !myDoc.exists()) {
                        return false; // Đối thủ đã được người khác ghép, hoặc mình vừa được ghép
                    }

                    // Claim successful: remove both from queue
                    transaction.delete(oppRef);
                    transaction.delete(myRef);
                    return true;
                });

                if (claimed) {
                    return {
                        opponentId: opponent.userId,
                        opponentName: 'Đối thủ',
                        opponentGrade: opponent.grade
                    };
                }
            } catch (e) {
                console.error("Transaction failed during matchmaking", e);
            }
        }

        // All valid opponents were claimed by others before we could transactionally lock them
        return null;
    } catch (error) {
        console.error('Error finding opponent:', error);
        return null;
    }
};

// Create a new real-time duel match document
export const createRealDuel = async (
    player1Id: string,
    player1Name: string,
    player2Id: string,
    player2Name: string,
    gameMode: 'quick' | 'room' | 'ranked' = 'quick',
    questions?: any[]
): Promise<string> => {
    const duelRef = doc(collection(db, 'activeDuels'));
    const duelId = duelRef.id;

    await setDoc(duelRef, {
        id: duelId,
        player1Id,
        player1Name,
        player2Id,
        player2Name,
        player1Score: 0,
        player2Score: 0,
        player1Correct: 0,
        player2Correct: 0,
        player1Progress: 0,
        player2Progress: 0,
        player1TimeLeftAtFinish: null,
        player2TimeLeftAtFinish: null,
        status: 'playing',
        gameMode,
        questions: questions ? JSON.stringify(questions) : null,
        createdAt: serverTimestamp(),
        startedAt: serverTimestamp()
    });

    return duelId;
};

// Update real-time score + correct count + progress
export const updateDuelScore = async (
    duelId: string,
    userId: string,
    isPlayer1: boolean,
    score: number,
    progress: number,
    correct: number
): Promise<void> => {
    const duelRef = doc(db, 'activeDuels', duelId);
    if (isPlayer1) {
        await updateDoc(duelRef, {
            player1Score: score,
            player1Progress: progress,
            player1Correct: correct
        });
    } else {
        await updateDoc(duelRef, {
            player2Score: score,
            player2Progress: progress,
            player2Correct: correct
        });
    }
};

export const markDuelPlayerFinished = async (
    duelId: string,
    isPlayer1: boolean,
    timeLeftAtFinish: number
): Promise<void> => {
    const duelRef = doc(db, 'activeDuels', duelId);
    if (isPlayer1) {
        await updateDoc(duelRef, { player1TimeLeftAtFinish: timeLeftAtFinish });
    } else {
        await updateDoc(duelRef, { player2TimeLeftAtFinish: timeLeftAtFinish });
    }
};

export const updateRoomProgress = async (
    roomId: string,
    userId: string,
    score: number,
    progress: number,
    finished: boolean
): Promise<void> => {
    const roomRef = doc(db, 'duelRooms', roomId);
    await updateDoc(roomRef, {
        [`participantProgress.${userId}`]: {
            score,
            progress,
            finished,
        }
    });
};

// Subscribe to real-time duel updates
export const subscribeToDuel = (
    duelId: string,
    callback: (duel: any) => void
) => {
    return onSnapshot(doc(db, 'activeDuels', duelId), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        }
    });
};

/**
 * Kết thúc trận đấu nhanh: server tính kết quả, cập nhật LP cho cả hai người chơi
 * và lưu lịch sử. Gọi lại nhiều lần vẫn an toàn (trả về kết quả đã lưu).
 * Server trả 409 nếu trận chưa hết giờ (đồng hồ lệch nhẹ) → thử lại vài lần.
 */
export const finishQuickDuel = async (
    duelId: string,
    surrender = false
): Promise<{ outcome: 'win' | 'lose' | 'draw'; lpChange: number; myScore: number; opponentScore: number }> => {
    for (let attempt = 0; ; attempt++) {
        try {
            return await postApi(`/api/duels/${duelId}/finish`, { surrender });
        } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 409 || attempt >= 4) throw error;
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
};

// Join duel queue
export const joinDuelQueue = async (userId: string, grade?: number): Promise<void> => {
    await setDoc(doc(collection(db, 'duelQueue'), userId), {
        userId,
        status: 'waiting',
        grade: grade || 5,
        createdAt: serverTimestamp()
    });
};

// Leave duel queue
export const leaveDuelQueue = async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, 'duelQueue', userId));
};

// Check for opponent in queue (real-time)
export const subscribeToDuelQueue = (callback: (opponents: { userId: string; grade?: number }[]) => void) => {
    return onSnapshot(
        query(collection(db, 'duelQueue'), where('status', '==', 'waiting')),
        (snapshot) => {
            const opponents: { userId: string; grade?: number }[] = [];
            snapshot.forEach(doc => {
                opponents.push(doc.data() as any);
            });
            callback(opponents);
        }
    );
};
