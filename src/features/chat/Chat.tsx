import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, Search, MoreVertical, Send,
  Image as ImageIcon, Paperclip, Smile, Phone, Video, X,
  User, Ban, Trash2, ArrowLeft, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';
import { useFirebase } from '../../context/FirebaseProvider';
import {
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationById,
  deleteConversation,
  searchMessages,
  Message
} from '../../services/messageService';
import { getUserProfile, getOnlineStatus, blockUser } from '../../services/userService';
import { MathRenderer } from '../../components/common/MathRenderer';
import { saveAIConsultation, getAIConsultationsByUserId } from '../../services/dataService';

interface ChatProps {
  conversationId: string;
  onClose: () => void;
  onShowProfile?: () => void;
  onDelete?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ conversationId, onClose, onShowProfile, onDelete }) => {
  const { user } = useFirebase();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{ name: string; avatar: string; isOnline: boolean; id: string }>({ name: 'Đang tải...', avatar: '', isOnline: false, id: '' });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isAiMode, setIsAiMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [localAiMsgs, setLocalAiMsgs] = useState<Message[]>([]);

  // Load messages and conversation info
  useEffect(() => {
    if (!user || !conversationId) return;

    if (conversationId === 'ai-assistant') {
      setIsAiMode(true);
      setOtherUser({
        id: 'ai-bot',
        name: 'Trợ lý AI Toán học',
        avatar: '', // We'll render a special icon
        isOnline: true
      });
      
      // Load history
      getAIConsultationsByUserId(user.uid).then(logs => {
        const historyMsgs: Message[] = [];
        logs.forEach((log, index) => {
          // 1. User message
          historyMsgs.push({
            id: `ai_user_hist_${log.id || index}`,
            senderId: user.uid,
            senderName: 'Bạn',
            senderAvatar: '',
            text: log.prompt,
            imageUrl: log.imageUrl || undefined,
            createdAt: log.timestamp || new Date(),
            read: true,
            conversationId: 'ai-assistant'
          });
          // 2. AI response
          historyMsgs.push({
            id: `ai_bot_hist_${log.id || index}`,
            senderId: 'ai-bot',
            senderName: 'Trợ lý AI',
            senderAvatar: '',
            text: log.response,
            createdAt: log.timestamp || new Date(),
            read: true,
            conversationId: 'ai-assistant'
          });
        });
        setLocalAiMsgs(historyMsgs);
        setLoading(false);
      });
      
      return;
    }

    setIsAiMode(false);
    setLoading(true);

    // Load conversation to get other user info
    const loadConversation = async () => {
      const conv = await getConversationById(conversationId);
      if (conv && user) {
        // Find the other participant (not current user)
        const otherUserId = conv.participants.find(p => p !== user.uid);
        if (otherUserId) {
          // Get online status
          const status = await getOnlineStatus([otherUserId]);
          setOtherUser({
            id: otherUserId,
            name: conv.participantNames[otherUserId] || 'User',
            avatar: conv.participantAvatars[otherUserId] || '',
            isOnline: status[otherUserId] || false
          });
        }
      }
    };

    loadConversation();

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);

      // Mark messages as read
      markMessagesAsRead(conversationId, user.uid);
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, localAiMsgs, isAiLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendToAI = async () => {
    const userMsgText = message;
    const userMsgImage = selectedImage;
    
    // Create temporary message for user
    const userTempMsg: Message = {
      id: `ai_user_${Date.now()}`,
      senderId: user!.uid,
      senderName: 'Bạn',
      senderAvatar: '',
      text: userMsgText,
      imageUrl: userMsgImage || undefined,
      createdAt: new Date(),
      read: true,
      conversationId: conversationId
    };
    
    setLocalAiMsgs(prev => [...prev, userTempMsg]);
    setMessage('');
    setSelectedImage(null);
    setIsAiLoading(true);

    try {
      const userProfile = await getUserProfile(user!.uid);
      const grade = userProfile?.grade || 'chưa xác định';
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsgText,
          image: userMsgImage,
          grade
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const aiTempMsg: Message = {
          id: `ai_bot_${Date.now()}`,
          senderId: 'ai-bot',
          senderName: 'Trợ lý AI',
          senderAvatar: '', 
          text: data.text,
          createdAt: new Date(),
          read: true,
          conversationId: conversationId
        };
        
        setLocalAiMsgs(prev => [...prev, aiTempMsg]);
        
        await saveAIConsultation({
          userId: user!.uid,
          grade: grade,
          prompt: userMsgText,
          imageUrl: userMsgImage || null,
          response: data.text
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return;
    if (!user) return;

    if (isAiMode) {
      await handleSendToAI();
      return;
    }

    try {
      const userProfile = await getUserProfile(user.uid);
      const senderName = userProfile?.name || 'User';
      const senderAvatar = userProfile?.avatar || '';

      await sendMessage(
        conversationId,
        user.uid,
        senderName,
        senderAvatar,
        message,
        selectedImage || undefined
      );

      setMessage('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const displayMessages = isAiMode ? localAiMsgs : messages;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchMessages(conversationId, searchQuery);
    setSearchResults(results);
  };

  const handleBlockUser = async () => {
    if (!user || !otherUser.id) return;
    try {
      await blockUser(user.uid, otherUser.id);
      setShowConfirmBlock(false);
      setShowOptions(false);
      onClose();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleDeleteChat = async () => {
    try {
      await deleteConversation(conversationId);
      setShowConfirmDelete(false);
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col md:rounded-l-3xl md:left-64 md:w-[calc(100%-16rem)]"
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-colors -ml-2"
            onClick={!isAiMode ? onShowProfile : undefined}
          >
            <div className="relative">
              {otherUser.avatar ? (
                <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-2xl object-cover" />
              ) : isAiMode ? (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                   <Bot size={20} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                  {otherUser.name.charAt(0)}
                </div>
              )}
              {otherUser.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{otherUser.name}</h3>
              <p className="text-[10px] font-bold text-emerald-500">
                {otherUser.isOnline ? 'Đang hoạt động' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        {!isAiMode && (
        <div className="flex items-center gap-2">
          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-2xl transition-colors",
                showOptions ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600"
              )}
            >
              <MoreVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-1"
                >
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onShowProfile?.();
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <User size={16} className="text-slate-400" />
                    Xem trang cá nhân
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      setShowSearch(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <Search size={16} className="text-slate-400" />
                    Tìm kiếm tin nhắn
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      setShowConfirmBlock(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Ban size={16} />
                    Chặn người này
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      setShowConfirmDelete(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Trash2 size={16} />
                    Xóa đoạn chat
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {loading && !isAiMode ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              {isAiMode ? <Bot size={24} className="text-indigo-600" /> : <Send size={24} className="text-indigo-400" />}
            </div>
            <p className="text-slate-500 font-medium">{isAiMode ? "Bắt đầu trò chuyện với Trợ lý AI" : "Chưa có tin nhắn nào"}</p>
            <p className="text-slate-400 text-sm">{isAiMode ? "Hỏi bất kì bài toán nào!" : "Hãy gửi tin nhắn đầu tiên!"}</p>
          </div>
        ) : (
          <>
            <div className="text-center my-4">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">{isAiMode ? "Trợ lý AI" : "Tin nhắn"}</span>
            </div>

            {displayMessages.map((msg) => {
              const isMine = msg.senderId === user?.uid;

              return (
                <div key={msg.id} className={cn(
                  "flex w-full",
                  isMine ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[75%] md:max-w-[60%] flex flex-col gap-1",
                    isMine ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-3xl text-sm font-medium",
                      isMine
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm",
                      msg.imageUrl ? "p-2" : "p-4"
                    )}>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Attached"
                          className="max-w-full rounded-2xl mb-2 object-contain max-h-64"
                        />
                      )}
                      {msg.text && (
                        <div className={msg.imageUrl ? "px-2 pb-1" : ""}>
                          {isAiMode && !isMine ? <MathRenderer content={msg.text} /> : msg.text}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 px-2">
                      {msg.senderName} • {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {isAiLoading && isAiMode && (
              <div className="flex w-full justify-start">
                <div className="max-w-[75%] md:max-w-[60%] flex flex-col gap-1 items-start">
                  <div className="p-4 rounded-3xl text-sm font-medium bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm flex items-center gap-2">
                     <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                     <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                     <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 px-2">Trợ lý AI • Đang soạn...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4 shrink-0 pb-safe">
        {selectedImage && (
          <div className="mb-4 relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-24 rounded-xl border-2 border-slate-200 object-cover" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex items-center gap-1 mb-1">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ImageIcon size={20} />
            </button>
          </div>

          <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-100 flex items-center pr-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-sm font-medium placeholder:text-slate-400"
            />
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Smile size={20} />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() && !selectedImage}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 mb-0.5"
          >
            <Send size={18} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-30 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500"
              >
                <ArrowLeft size={20} />
              </button>
              <input
                type="text"
                placeholder="Tìm kiếm tin nhắn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-sm font-bold"
              >
                Tìm
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {searchResults.length > 0 ? (
                searchResults.map((msg) => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={cn(
                      "p-3 rounded-xl mb-2 cursor-pointer hover:bg-slate-50",
                      isMine ? "bg-indigo-50" : "bg-white border border-slate-100"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500">{msg.senderName}</span>
                        <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700">{msg.text}</p>
                    </div>
                  );
                })
              ) : searchQuery ? (
                <div className="text-center py-8 text-slate-400">
                  Không tìm thấy tin nhắn nào
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Nhập từ khóa để tìm kiếm
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Block Modal */}
      <AnimatePresence>
        {showConfirmBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 z-40 flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ban size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 text-center mb-2">Chặn người dùng?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Bạn sẽ không nhận được tin nhắn từ {otherUser.name} nữa.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmBlock(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBlockUser}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm"
                >
                  Chặn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 z-40 flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 text-center mb-2">Xóa đoạn chat?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Tất cả tin nhắn trong cuộc trò chuyện này sẽ bị xóa vĩnh viễn.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteChat}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
