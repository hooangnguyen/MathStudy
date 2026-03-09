import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  Timestamp,
  or,
  and
} from 'firebase/firestore';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: any;
  imageUrl?: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // user IDs
  participantNames: { [uid: string]: string };
  participantAvatars: { [uid: string]: string };
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount: { [uid: string]: number };
  createdAt: any;
  updatedAt: any;
}

/**
 * Tạo hoặc lấy conversation giữa 2 users
 */
export const getOrCreateConversation = async (userId1: string, userId2: string): Promise<string> => {
  // Tìm conversation đã tồn tại
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId1)
  );

  const snapshot = await getDocs(q);

  for (const convDoc of snapshot.docs) {
    const data = convDoc.data();
    if (data.participants.includes(userId2)) {
      return convDoc.id;
    }
  }

  // Tạo conversation mới
  // Lấy thông tin user
  const [user1Doc, user2Doc] = await Promise.all([
    getDoc(doc(db, 'users', userId1)),
    getDoc(doc(db, 'users', userId2))
  ]);

  const newConv = {
    participants: [userId1, userId2],
    participantNames: {
      [userId1]: user1Doc.exists() ? user1Doc.data().name || 'User' : 'User',
      [userId2]: user2Doc.exists() ? user2Doc.data().name || 'User' : 'User'
    },
    participantAvatars: {
      [userId1]: user1Doc.exists() ? user1Doc.data().avatar || '' : '',
      [userId2]: user2Doc.exists() ? user2Doc.data().avatar || '' : ''
    },
    unreadCount: {
      [userId1]: 0,
      [userId2]: 0
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(conversationsRef, newConv);
  return docRef.id;
};

/**
 * Lấy conversation theo ID
 */
export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
  const convDoc = await getDoc(doc(db, 'conversations', conversationId));
  if (convDoc.exists()) {
    return { id: convDoc.id, ...convDoc.data() } as Conversation;
  }
  return null;
};

/**
 * Lấy tất cả conversations của một user
 */
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );

  const snapshot = await getDocs(q);
  const conversations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Conversation));

  // Sort by updatedAt client-side
  conversations.sort((a, b) => {
    const aTime = a.updatedAt?.toDate?.() || new Date(0);
    const bTime = b.updatedAt?.toDate?.() || new Date(0);
    return bTime.getTime() - aTime.getTime();
  });

  return conversations;
};

/**
 * Lắng nghe real-time conversations
 */
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Conversation));

    // Sort by updatedAt client-side
    conversations.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date(0);
      const bTime = b.updatedAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    callback(conversations);
  });
};

/**
 * Lấy tin nhắn trong một conversation
 */
export const getMessages = async (conversationId: string, limit: number = 50): Promise<Message[]> => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message))
    .reverse()
    .slice(-limit);
};

/**
 * Lắng nghe real-time messages
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });
};

/**
 * Gửi tin nhắn
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  text: string,
  imageUrl?: string
): Promise<string> => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');

  const newMessage = {
    conversationId,
    senderId,
    senderName,
    senderAvatar,
    text,
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
    read: false
  };

  const docRef = await addDoc(messagesRef, newMessage);

  // Cập nhật conversation
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    lastMessage: text || 'Đã gửi một ảnh',
    updatedAt: serverTimestamp()
  });

  return docRef.id;
};

/**
 * Đánh dấu tin nhắn đã đọc
 */
export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  // Cập nhật unread count về 0
  const conversationRef = doc(db, 'conversations', conversationId);
  const convDoc = await getDoc(conversationRef);

  if (convDoc.exists()) {
    const data = convDoc.data();
    const unreadCount = { ...data.unreadCount };
    unreadCount[userId] = 0;

    await updateDoc(conversationRef, { unreadCount });
  }
};

/**
 * Xóa tin nhắn
 */
export const deleteMessage = async (conversationId: string, messageId: string) => {
  await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageId));
};

/**
 * Xóa conversation
 */
export const deleteConversation = async (conversationId: string) => {
  // Xóa tất cả tin nhắn
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const messagesSnapshot = await getDocs(messagesRef);

  const deletePromises = messagesSnapshot.docs.map(msg =>
    deleteDoc(doc(db, 'conversations', conversationId, 'messages', msg.id))
  );
  await Promise.all(deletePromises);

  // Xóa conversation
  await deleteDoc(doc(db, 'conversations', conversationId));
};

/**
 * Lấy hoặc tạo conversation với teacher của lớp
 */
export const getClassConversation = async (userId: string, classId: string): Promise<string | null> => {
  try {
    // Lấy thông tin lớp để tìm teacher
    const classDoc = await getDoc(doc(db, 'classes', classId));
    if (!classDoc.exists()) return null;

    const classData = classDoc.data();
    const teacherId = classData.teacherId;

    if (!teacherId) return null;

    return await getOrCreateConversation(userId, teacherId);
  } catch (error) {
    console.error('Error getting class conversation:', error);
    return null;
  }
};

/**
 * Tìm kiếm tin nhắn trong một conversation
 */
export const searchMessages = async (conversationId: string, searchQuery: string): Promise<Message[]> => {
  const messages = await getMessages(conversationId, 1000); // Get more messages for search
  const query = searchQuery.toLowerCase();
  return messages.filter(msg =>
    msg.text && msg.text.toLowerCase().includes(query)
  );
};

/**
 * Tìm kiếm tin nhắn trong tất cả conversations của user
 */
export const searchAllMessages = async (userId: string, searchQuery: string): Promise<{ conversationId: string; messages: Message[] }[]> => {
  const conversations = await getUserConversations(userId);
  const results: { conversationId: string; messages: Message[] }[] = [];

  for (const conv of conversations) {
    const messages = await searchMessages(conv.id, searchQuery);
    if (messages.length > 0) {
      results.push({ conversationId: conv.id, messages });
    }
  }

  return results;
};
