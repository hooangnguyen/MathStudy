import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Search, MoreVertical, Send, 
  Image as ImageIcon, Paperclip, Smile, Phone, Video, X,
  User, Ban, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isTeacher: boolean;
  imageUrl?: string;
}

interface ChatProps {
  onClose: () => void;
  studentName?: string;
  isTeacherView?: boolean;
  onShowProfile?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onClose, studentName = 'Cô Thu Hương', isTeacherView = false, onShowProfile }) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'teacher',
      text: isTeacherView ? 'Chào em, em có câu hỏi gì về bài tập hôm nay không?' : 'Chào em, cô có thể giúp gì cho em?',
      timestamp: '09:00',
      isTeacher: true,
    },
    {
      id: '2',
      senderId: 'student',
      text: isTeacherView ? 'Dạ cô ơi, câu 3 phần phân số em chưa hiểu lắm ạ.' : 'Cô ơi, bài tập toán phần phân số em làm chưa ra kết quả giống đáp án ạ.',
      timestamp: '09:05',
      isTeacher: false,
    }
  ]);

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

  const handleSend = () => {
    if (!message.trim() && !selectedImage) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: isTeacherView ? 'teacher' : 'student',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTeacher: isTeacherView,
      imageUrl: selectedImage || undefined,
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            onClick={onShowProfile}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                {studentName.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{studentName}</h3>
              <p className="text-[10px] font-bold text-emerald-500">Đang hoạt động</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors hidden sm:flex">
            <Phone size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors hidden sm:flex">
            <Video size={20} />
          </button>
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
                    onClick={() => setShowOptions(false)}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <Search size={16} className="text-slate-400" />
                    Tìm kiếm tin nhắn
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button 
                    onClick={() => setShowOptions(false)}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Ban size={16} />
                    Chặn người này
                  </button>
                  <button 
                    onClick={() => setShowOptions(false)}
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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        <div className="text-center my-4">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">Hôm nay</span>
        </div>
        
        {messages.map((msg) => {
          const isMine = isTeacherView ? msg.isTeacher : !msg.isTeacher;
          
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
                  {msg.text && <div className={msg.imageUrl ? "px-2 pb-1" : ""}>{msg.text}</div>}
                </div>
                <span className="text-[10px] font-bold text-slate-400 px-2">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
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
    </motion.div>
  );
};
