import React, { useState } from 'react';
import { ChevronLeft, Camera, Save, User, Mail, Phone, Calendar, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditProfileProps {
  onBack: () => void;
  onSave: (data: any) => void;
}

const PRESET_AVATARS = [
  { id: 'student', url: 'https://picsum.photos/seed/student/200', label: 'Học sinh' },
  { id: 'math', url: 'https://picsum.photos/seed/math/200', label: 'Toán học' },
  { id: 'genius', url: 'https://picsum.photos/seed/genius/200', label: 'Thiên tài' },
  { id: 'star', url: 'https://picsum.photos/seed/star/200', label: 'Ngôi sao' },
  { id: 'rocket', url: 'https://picsum.photos/seed/rocket/200', label: 'Tên lửa' },
  { id: 'brain', url: 'https://picsum.photos/seed/brain/200', label: 'Trí tuệ' },
];

export const EditProfile: React.FC<EditProfileProps> = ({ onBack, onSave }) => {
  const [formData, setFormData] = useState({
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@example.com',
    phone: '0987654321',
    dob: '2012-05-15',
    avatar: 'https://picsum.photos/seed/student/200',
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(formData.avatar);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleSelectAvatar = (url: string) => {
    setTempAvatar(url);
  };

  const confirmAvatar = () => {
    setFormData({ ...formData, avatar: tempAvatar });
    setIsPickerOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-slate-900">Sửa hồ sơ</h1>
        </div>
        <button 
          onClick={handleSubmit}
          className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Save size={18} />
          <span className="hidden sm:inline">Lưu</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group cursor-pointer" onClick={() => {
              setTempAvatar(formData.avatar);
              setIsPickerOpen(true);
            }}>
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-primary to-secondary p-1 shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={formData.avatar} 
                  alt="Avatar" 
                  className="w-full h-full rounded-[2.2rem] object-cover border-4 border-white"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white">
                  <Camera size={20} />
                </div>
              </div>
              <button 
                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center justify-center text-primary hover:bg-slate-50 active:scale-90 transition-all z-10"
              >
                <Camera size={20} />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thay đổi ảnh đại diện</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Nhập họ và tên"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Nhập địa chỉ email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Phone size={20} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ngày sinh</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={20} />
                </div>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPickerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">Chọn ảnh đại diện</h2>
                <button 
                  onClick={() => setIsPickerOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectAvatar(avatar.url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                        tempAvatar === avatar.url ? 'border-primary ring-4 ring-primary/10' : 'border-transparent'
                      }`}
                    >
                      <img 
                        src={avatar.url} 
                        alt={avatar.label}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {tempAvatar === avatar.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hoặc tải ảnh lên</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="flex-1 py-3 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                      >
                        <Camera size={16} />
                        Chọn từ máy
                      </button>
                      <input 
                        id="avatar-upload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setTempAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hoặc nhập URL ảnh</label>
                    <input
                      type="text"
                      value={tempAvatar}
                      onChange={(e) => setTempAvatar(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <button
                  onClick={confirmAvatar}
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
