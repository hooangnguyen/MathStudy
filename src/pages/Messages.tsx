import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Circle, ChevronRight, Plus, MessageCircle, Users, Loader2, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';
import { Chat } from '../features/chat/Chat';
import { UserProfileModal } from '../components/common/UserProfileModal';
import { useFirebase } from '../context/FirebaseProvider';
import {
  getUserConversations,
  subscribeToConversations,
  getOrCreateConversation,
  Conversation
} from '../services/messageService';
import { getUsersByIds, getOnlineStatus } from '../services/userService';

interface MessagesProps {
  userRole: 'student' | 'teacher' | null;
}

export const Messages: React.FC<MessagesProps> = ({ userRole }) => {
  const { user } = useFirebase();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<{ name: string; avatar?: string; role?: string; uid?: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [otherUserNames, setOtherUserNames] = useState<{ [uid: string]: { name: string; avatar: string; uid: string } }>({});
  const [onlineStatus, setOnlineStatus] = useState<{ [uid: string]: boolean }>({});

  // Load conversations
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to real-time conversations
    const unsubscribe = subscribeToConversations(user.uid, async (convs) => {
      // Filter out conversations with blocked users
      const { getUserProfile } = await import('../services/userService');
      const currentUserProfile = await getUserProfile(user.uid);
      const blockedUsers = currentUserProfile?.blockedUsers || [];

      const filteredConvs = convs.filter(c => {
        const otherUserId = c.participants.find(p => p !== user.uid);
        return otherUserId && !blockedUsers.includes(otherUserId);
      });

      setConversations(filteredConvs);
      setLoading(false);

      // Get other user info
      const otherUserIds = filteredConvs.map(c => c.participants.find(p => p !== user.uid)).filter(Boolean) as string[];
      if (otherUserIds.length > 0) {
        const users = await getUsersByIds(otherUserIds);
        const names: { [uid: string]: { name: string; avatar: string; uid: string } } = {};
        users.forEach(u => {
          names[u.uid] = { name: u.name || 'User', avatar: u.avatar || '', uid: u.uid };
        });
        setOtherUserNames(names);

        // Get online status
        const status = await getOnlineStatus(otherUserIds);
        setOnlineStatus(status);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const filteredConversations = conversations.filter(c => {
    if (!user) return false;
    const otherUserId = c.participants.find(p => p !== user.uid);
    const otherUser = otherUserNames[otherUserId || ''];
    const name = otherUser?.name || c.participantNames[otherUserId || ''] || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherUser = (conv: Conversation) => {
    if (!user) return { name: 'User', avatar: '', uid: '' };
    const otherUserId = conv.participants.find(p => p !== user.uid) || '';
    const otherUser = otherUserNames[otherUserId];
    return {
      name: otherUser?.name || conv.participantNames[otherUserId] || 'User',
      avatar: otherUser?.avatar || conv.participantAvatars[otherUserId] || '',
      uid: otherUserId
    };
  };

  const handleShowProfile = (userData: { name: string; avatar?: string; role?: string; uid?: string }) => {
    setSelectedProfileUser(userData);
    setShowProfile(true);
  };

  const handleNewChat = async (otherUserId: string) => {
    if (!user) return;
    try {
      const convId = await getOrCreateConversation(user.uid, otherUserId);
      setActiveChat(convId);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-rose-50/10 relative font-sans">
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-rose-200/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-5 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-slate-900">Tin nhắn</h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNewChat(true)}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
          >
            <Plus size={20} />
          </motion.button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50/80 backdrop-blur-sm border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
          </div>
        ) : (
          <>
            {/* AI Assistant Static Item */}
            {'Trợ lý AI Toán học'.toLowerCase().includes(searchQuery.toLowerCase()) && (
              <motion.button
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveChat('ai-assistant')}
                className="w-full bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-4 rounded-[1.5rem] border border-indigo-100 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-indigo-200 transition-all text-left mb-2 group"
              >
                <div className="relative shrink-0 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                    <Sparkles size={24} className="text-white fill-white/20" />
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 truncate pr-2">Trợ lý AI Toán học</h3>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-500 truncate flex items-center gap-1">
                      <Bot size={14} /> Sẵn sàng hỗ trợ bạn
                    </p>
                  </div>
                </div>
              </motion.button>
            )}

            {filteredConversations.length === 0 && !('Trợ lý AI Toán học'.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <MessageCircle size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Chưa có cuộc trò chuyện nào</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(true)}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
                >
                  Bắt đầu trò chuyện
                </motion.button>
              </div>
            )}

          {filteredConversations.map((conv) => {
            const otherUser = getOtherUser(conv);
            const unread = user ? conv.unreadCount[user.uid] || 0 : 0;
            const otherUserId = conv.participants.find(p => p !== user?.uid);
            const isOnline = otherUserId ? onlineStatus[otherUserId] || false : false;

            return (
              <motion.button
                key={conv.id}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveChat(conv.id)}
                className="w-full bg-white/80 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/50 shadow-md flex items-center gap-4 hover:border-indigo-100 hover:shadow-xl transition-all text-left group"
              >
                <div
                  className="relative shrink-0 cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowProfile({ name: otherUser.name, avatar: otherUser.avatar, role: userRole === 'teacher' ? 'Học sinh' : 'Giáo viên', uid: otherUser.uid });
                  }}
                >
                  {otherUser.avatar ? (
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-black text-xl group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                      {otherUser.name.charAt(0)}
                    </div>
                  )}
                  {/* Online indicator */}
                  {isOnline && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-black text-slate-900 truncate pr-2">{otherUser.name}</h3>
                    <span className={cn(
                      "text-xs font-bold shrink-0",
                      unread > 0 ? "text-indigo-600" : "text-slate-400"
                    )}>
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-sm truncate",
                      unread > 0 ? "font-bold text-slate-900" : "font-medium text-slate-500"
                    )}>
                      {conv.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                    {unread > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md"
                      >
                        {unread}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
          </>
        )}
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {activeChat && (
          <Chat
            conversationId={activeChat}
            onClose={() => setActiveChat(null)}
            onShowProfile={() => {
              const conv = conversations.find(c => c.id === activeChat);
              if (conv && user) {
                const otherUser = getOtherUser(conv);
                handleShowProfile({ name: otherUser.name, avatar: otherUser.avatar, role: userRole === 'teacher' ? 'Học sinh' : 'Giáo viên', uid: otherUser.uid });
              }
            }}
            onDelete={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={selectedProfileUser}
      />

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            onClose={() => setShowNewChat(false)}
            onSelectUser={handleNewChat}
            userRole={userRole}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// New Chat Modal Component
interface NewChatModalProps {
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  userRole: 'student' | 'teacher' | null;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onSelectUser, userRole }) => {
  const { user } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<{ uid: string; name: string; avatar: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return;
      try {
        const { getTopUsers, getUserProfile } = await import('../services/userService');
        const allUsers = await getTopUsers(50);

        // Get current user's blocked list
        const currentUserProfile = await getUserProfile(user.uid);
        const blockedUsers = currentUserProfile?.blockedUsers || [];

        const otherUsers = allUsers
          .filter(u => u.uid !== user.uid && !blockedUsers.includes(u.uid))
          .map(u => ({
            uid: u.uid,
            name: u.name || 'User',
            avatar: u.avatar || '',
            role: u.role || 'student'
          }));

        setUsers(otherUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Tin nhắn mới</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
            >
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
          <div className="relative mt-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm người..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-indigo-600 w-6 h-6" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Không tìm thấy người dùng</p>
            </div>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.uid}
                onClick={() => onSelectUser(u.uid)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {u.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
};
