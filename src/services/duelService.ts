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
    increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
    winnerId?: string;
    isDraw: boolean;
    lpChange?: number; // LP change for ranked
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

// Generate random 6-character room code
const generateRoomCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get rank tier based on LP
export const getRankTier = (lp: number): UserRank['rankTier'] => {
    if (lp >= 1000) return 'challenger';
    if (lp >= 750) return 'diamond';
    if (lp >= 500) return 'platinum';
    if (lp >= 250) return 'gold';
    if (lp >= 100) return 'silver';
    return 'bronze';
};

// Calculate LP gain/loss based on rank difference
export const calculateLPChange = (winnerLP: number, loserLP: number, isDraw: boolean): number => {
    if (isDraw) return 5; // Small LP for draw

    // Base LP gain
    let lpChange = 20;

    // Bonus for beating higher ranked player
    const lpDiff = winnerLP - loserLP;
    if (lpDiff < -200) {
        lpChange += 15; // Underdog bonus
    } else if (lpDiff > 200) {
        lpChange -= 10; // Less points for beating lower ranked
    }

    // Cap at reasonable values
    return Math.max(5, Math.min(35, lpChange));
};

// Create a new duel room
export const createDuelRoom = async (
    hostId: string,
    hostName: string,
    gameMode: 'time' | 'questions' = 'time',
    timeLimit: number = 60,
    maxPlayers: number = 2
): Promise<DuelRoom> => {
    const roomRef = doc(collection(db, 'duelRooms'));
    const roomId = roomRef.id;
    const roomCode = generateRoomCode();

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
        createdAt: serverTimestamp()
    };

    await setDoc(roomRef, room);
    return room;
};

// Join a duel room
export const joinDuelRoom = async (roomCode: string, userId: string, userName: string): Promise<DuelRoom | null> => {
    const roomsRef = collection(db, 'duelRooms');
    const q = query(roomsRef, where('code', '==', roomCode.toUpperCase()), where('status', '==', 'waiting'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const roomDoc = snapshot.docs[0];
    const room = roomDoc.data() as DuelRoom;

    // Check if room is full
    if (room.currentPlayers.length >= room.maxPlayers) return null;

    // Check if user already in room
    if (room.currentPlayers.includes(userId)) return null;

    // Add player to room
    const updatedPlayers = [...room.currentPlayers, userId];
    const updatedNames = { ...room.playerNames, [userId]: userName };

    await updateDoc(doc(db, 'duelRooms', room.id), {
        currentPlayers: updatedPlayers,
        playerNames: updatedNames,
        guestId: userId,
        guestName: userName
    });

    return { ...room, currentPlayers: updatedPlayers, playerNames: updatedNames };
};

// Start a duel (host starts the game)
export const startDuel = async (roomId: string): Promise<void> => {
    await updateDoc(doc(db, 'duelRooms', roomId), {
        status: 'playing',
        startedAt: serverTimestamp()
    });
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

// Save duel match result
export const saveDuelMatch = async (
    roomId: string,
    player1Id: string,
    player1Name: string,
    player2Id: string,
    player2Name: string,
    player1Score: number,
    player2Score: number,
    winnerId: string | undefined,
    isDraw: boolean,
    gameMode: 'quick' | 'room' | 'ranked' = 'room',
    lpChange?: number
): Promise<DuelMatch> => {
    const matchRef = doc(collection(db, 'duelMatches'));
    const matchId = matchRef.id;

    const match: DuelMatch = {
        id: matchId,
        roomId,
        player1Id,
        player1Name,
        player2Id,
        player2Name,
        player1Score,
        player2Score,
        winnerId,
        isDraw,
        lpChange,
        gameMode,
        createdAt: serverTimestamp()
    };

    await setDoc(matchRef, match);
    return match;
};

// Update user rank after match
export const updateUserRank = async (
    userId: string,
    username: string,
    isWin: boolean,
    isDraw: boolean,
    currentLP: number,
    grade?: number,
    avatar?: string
): Promise<number> => {
    const userRankRef = doc(db, 'userRanks', userId);
    const rankDoc = await getDoc(userRankRef);

    let newLP = currentLP;
    let lpChange = 0;

    if (rankDoc.exists()) {
        const rankData = rankDoc.data() as UserRank;

        if (isWin) {
            // Simulated opponent LP (in real app, get from match)
            const opponentLP = Math.max(0, currentLP + (Math.random() > 0.5 ? 50 : -50));
            lpChange = calculateLPChange(currentLP, opponentLP, false);
            newLP = Math.max(0, currentLP + lpChange);
        } else if (isDraw) {
            newLP = Math.max(0, currentLP + 5);
        } else {
            lpChange = -calculateLPChange(currentLP, currentLP + 50, false);
            newLP = Math.max(0, currentLP + lpChange);
        }

        const newTier = getRankTier(newLP);
        const newStreak = isWin ? rankData.streak + 1 : 0;

        await updateDoc(userRankRef, {
            lp: newLP,
            rankTier: newTier,
            wins: isWin ? increment(1) : rankData.wins,
            losses: !isWin && !isDraw ? increment(1) : rankData.losses,
            draws: isDraw ? increment(1) : rankData.draws,
            streak: newStreak,
            maxStreak: Math.max(rankData.maxStreak, newStreak),
            ...(grade !== undefined && { grade }),
            ...(avatar && { avatar })
        });
    } else {
        // Create new rank document
        lpChange = isWin ? 20 : (isDraw ? 5 : -15);
        newLP = Math.max(0, currentLP + lpChange);

        await setDoc(userRankRef, {
            uid: userId,
            username,
            lp: newLP,
            rankTier: getRankTier(newLP),
            wins: isWin ? 1 : 0,
            losses: (!isWin && !isDraw) ? 1 : 0,
            draws: isDraw ? 1 : 0,
            streak: isWin ? 1 : 0,
            maxStreak: isWin ? 1 : 0,
            ...(grade !== undefined && { grade }),
            ...(avatar && { avatar })
        });
    }

    return lpChange;
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

    // If host leaves, delete room
    if (room.hostId === userId) {
        await deleteDoc(doc(db, 'duelRooms', roomId));
    } else {
        // Remove player from room
        const updatedPlayers = room.currentPlayers.filter(id => id !== userId);
        const { [userId]: removedName, ...remainingNames } = room.playerNames;

        await updateDoc(doc(db, 'duelRooms', roomId), {
            currentPlayers: updatedPlayers,
            playerNames: remainingNames
        });
    }
};

// Quick match - find available room (for simplicity, creates new room for quick match)
export const findQuickMatch = async (userId: string, userName: string): Promise<DuelRoom | null> => {
    // Find a waiting room with only 1 player
    const q = query(
        collection(db, 'duelRooms'),
        where('status', '==', 'waiting')
    );

    const snapshot = await getDocs(q);
    let availableRoom: DuelRoom | null = null;

    snapshot.forEach(doc => {
        const room = doc.data() as DuelRoom;
        if (room.currentPlayers.length === 1 && !room.currentPlayers.includes(userId)) {
            availableRoom = room;
        }
    });

    if (availableRoom) {
        return await joinDuelRoom(availableRoom.code, userId, userName);
    }

    return null;
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

// Find available players for quick match
export const findOpponentForDuel = async (userId: string, userGrade?: number): Promise<{ opponentId: string; opponentName: string; opponentGrade?: number } | null> => {
    try {
        // Simplified query: only filter by status to avoid index requirement
        const q = query(
            collection(db, 'duelQueue'),
            where('status', '==', 'waiting'),
            limit(10) // Fetch a few and filter self locally
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // No opponent found, add self to queue if not already there
            await setDoc(doc(db, 'duelQueue', userId), {
                userId,
                status: 'waiting',
                grade: userGrade || 5,
                createdAt: serverTimestamp()
            });
            return null;
        }

        // Find the first opponent who is not self
        let opponentData: any = null;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.userId !== userId) {
                opponentData = data;
                break;
            }
        }

        if (!opponentData) {
            // Still no opponent (only self in the fetched list)
            return null;
        }

        // Remove opponent from queue
        await deleteDoc(doc(db, 'duelQueue', opponentData.userId));

        return {
            opponentId: opponentData.userId,
            opponentName: 'Đối thủ',
            opponentGrade: opponentData.grade
        };
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
        player1Progress: 0,
        player2Progress: 0,
        status: 'playing',
        gameMode,
        questions: questions ? JSON.stringify(questions) : null,
        createdAt: serverTimestamp(),
        startedAt: serverTimestamp()
    });

    return duelId;
};

// Update real-time score and progress
export const updateDuelScore = async (
    duelId: string,
    userId: string,
    isPlayer1: boolean,
    score: number,
    progress: number
): Promise<void> => {
    const duelRef = doc(db, 'activeDuels', duelId);
    if (isPlayer1) {
        await updateDoc(duelRef, {
            player1Score: score,
            player1Progress: progress
        });
    } else {
        await updateDoc(duelRef, {
            player2Score: score,
            player2Progress: progress
        });
    }
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

// Finish real-time duel
export const completeRealDuel = async (duelId: string): Promise<void> => {
    await updateDoc(doc(db, 'activeDuels', duelId), {
        status: 'finished',
        finishedAt: serverTimestamp()
    });
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
