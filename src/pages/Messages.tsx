import React, { useState } from 'react';
import { Search, MoreVertical, Circle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';
import { Chat } from '../features/chat/Chat';
import { UserProfileModal } from '../components/common/UserProfileModal';

interface MessagesProps {
  userRole: 'student' | 'teacher' | null;
}

const teacherConversations = [
  { id: '1', name: 'Nguyễn Văn Minh', lastMessage: 'Em chào cô ạ, bài tập hôm nay em...', time: '10:05', unread: 2, online: true },
  { id: '2', name: 'Lê Bảo Ngọc', lastMessage: 'Dạ em hiểu rồi, cảm ơn cô!', time: 'Hôm qua', unread: 0, online: true },
  { id: '3', name: 'Trần Đức Anh', lastMessage: 'Cô ơi cho em hỏi câu 3 với ạ.', time: 'Hôm qua', unread: 0, online: false },
  { id: '4', name: 'Phụ huynh bé Minh', lastMessage: 'Cô cho tôi hỏi tình hình học tập...', time: 'T2', unread: 0, online: false },
];

const studentConversations = [
  { id: '1', name: 'Cô Thu Hương', lastMessage: 'Chào em, em có câu hỏi gì về bài tập...', time: '10:05', unread: 1, online: true },
  { id: '2', name: 'Nguyễn Văn Minh', lastMessage: 'Cậu làm xong bài tập toán chưa?', time: 'Hôm qua', unread: 0, online: true },
  { id: '3', name: 'Lê Bảo Ngọc', lastMessage: 'Ok cậu!', time: 'T3', unread: 0, online: false },
];

export const Messages: React.FC<MessagesProps> = ({ userRole }) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<{ name: string; avatar?: string; role?: string } | null>(null);

  const conversations = userRole === 'teacher' ? teacherConversations : studentConversations;

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShowProfile = (user: { name: string; avatar?: string; role?: string }) => {
    setSelectedProfileUser(user);
    setShowProfile(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] relative font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-slate-900">Tin nhắn</h1>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-100 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar pb-24">
        {filteredConversations.map((conv) => (
          <motion.button
            key={conv.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveChat(conv.name)}
            className="w-full bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-colors text-left group"
          >
            <div 
              className="relative shrink-0 cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleShowProfile({ name: conv.name, role: userRole === 'teacher' ? 'Học sinh' : 'Giáo viên' });
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-200 transition-colors">
                {conv.name.charAt(0)}
              </div>
              {conv.online && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-black text-slate-900 truncate pr-2">{conv.name}</h3>
                <span className={cn(
                  "text-xs font-bold shrink-0",
                  conv.unread > 0 ? "text-indigo-600" : "text-slate-400"
                )}>
                  {conv.time}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  "text-sm truncate",
                  conv.unread > 0 ? "font-bold text-slate-900" : "font-medium text-slate-500"
                )}>
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {conv.unread}
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {activeChat && (
          <Chat 
            onClose={() => setActiveChat(null)} 
            studentName={activeChat}
            isTeacherView={userRole === 'teacher'}
            onShowProfile={() => handleShowProfile({ name: activeChat, role: userRole === 'teacher' ? 'Học sinh' : 'Giáo viên' })}
          />
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
        user={selectedProfileUser}
      />
    </div>
  );
};
