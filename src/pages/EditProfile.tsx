import React, { useState, useRef, lazy, Suspense } from 'react';
import { ChevronLeft, Camera, Save, User, Mail, Shield, Book, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';
import { isBase64Image } from '../services/avatarService';

// Lazy load ImageCropper
const ImageCropper = lazy(() => import('../components/common/ImageCropper').then(m => ({ default: m.ImageCropper })));

interface EditProfileProps {
  onBack: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: {
    name: string;
    email: string;
    avatar?: string;
    grade?: number;
    role?: 'student' | 'teacher';
    school?: string;
    subject?: string;
  };
}

// Cute illustrated avatars - sử dụng DiceBear API
// Xem thêm các style tại: https://www.dicebear.com/docs
const PRESET_AVATARS = [
  // Dễ thương
  { id: 'bear', url: 'https://api.dicebear.com/7.x/bear/svg?backgroundColor=fed7aa', label: 'Gấu', category: 'cute' },
  { id: 'cat', url: 'https://api.dicebear.com/7.x/thumbs/svg?backgroundColor=fed7aa', label: 'Mèo', category: 'cute' },
  { id: 'lorelei', url: 'https://api.dicebear.com/7.x/lorelei/svg?backgroundColor=ffd5dc', label: 'Dễ thương', category: 'cute' },
  { id: 'croodles', url: 'https://api.dicebear.com/7.x/croodles/svg?backgroundColor=ffdfbf', label: 'Hình thù', category: 'cute' },
  { id: 'big-smile', url: 'https://api.dicebear.com/7.x/big-smile/svg?backgroundColor=ffe4c4', label: 'Cười toe', category: 'cute' },

  // Hiện đại
  { id: 'micah', url: 'https://api.dicebear.com/7.x/micah/svg?backgroundColor=c0aede', label: 'Micah', category: 'modern' },
  { id: 'avataaars', url: 'https://api.dicebear.com/7.x/avataaars/svg?backgroundColor=b6e3f4', label: 'Người', category: 'modern' },
  { id: 'notionists', url: 'https://api.dicebear.com/7.x/notionists/svg?backgroundColor=ffdfbf', label: 'Sáng tạo', category: 'modern' },
  { id: 'personas', url: 'https://api.dicebear.com/7.x/personas/svg?backgroundColor=ffd5dc', label: 'Nhân vật', category: 'modern' },
  { id: 'open-peeps', url: 'https://api.dicebear.com/7.x/open-peeps/svg?backgroundColor=ffdfbf', label: 'Phong cách', category: 'modern' },

  // Vui nhộn
  { id: 'fun-emoji', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?backgroundColor=ffe4c4', label: 'Biểu cảm', category: 'fun' },
  { id: 'adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?backgroundColor=d1d4f9', label: 'Phiêu lưu', category: 'fun' },
  { id: 'big-ears', url: 'https://api.dicebear.com/7.x/big-ears/svg?backgroundColor=fed7aa', label: 'Tai to', category: 'fun' },
  { id: 'bottts', url: 'https://api.dicebear.com/7.x/bottts/svg?backgroundColor=d1d4f9', label: 'Robot', category: 'fun' },
  { id: 'pixel-art', url: 'https://api.dicebear.com/7.x/pixel-art/svg?backgroundColor=ffdfbf', label: 'Pixel', category: 'fun' },
];

export const EditProfile: React.FC<EditProfileProps> = ({ onBack, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    avatar: initialData?.avatar || 'https://api.dicebear.com/7.x/bear/svg?backgroundColor=fed7aa',
    grade: initialData?.grade || 5,
    role: initialData?.role || 'student',
    school: initialData?.school || '',
    subject: initialData?.subject || '',
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(formData.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAvatar = (url: string) => {
    setTempAvatar(url);
  };

  const confirmAvatar = () => {
    setFormData({ ...formData, avatar: tempAvatar });
    setIsPickerOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageDataUrl: string) => {
    setTempAvatar(croppedImageDataUrl);
    setShowCropper(false);
    setPendingImage(null);
    setIsPickerOpen(true);
  };

  const handleSaveWithUpload = async () => {
    setIsSaving(true);
    setIsUploading(true);

    try {
      let finalAvatar = formData.avatar;

      // Nếu là ảnh base64 (mới upload hoặc từ cropper)
      if (isBase64Image(tempAvatar)) {
        // Lưu trực tiếp base64 vào Firestore (đã resize qua cropper nên size nhỏ hơn)
        finalAvatar = tempAvatar;
      } else if (tempAvatar !== formData.avatar) {
        // Nếu chọn preset mới
        finalAvatar = tempAvatar;
      }

      setFormData({ ...formData, avatar: finalAvatar });
      await onSave({ ...formData, avatar: finalAvatar });
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
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
          onClick={handleSaveWithUpload}
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span className="hidden sm:inline">{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
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
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] bg-black/20">
                <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700">
                  <Camera size={20} />
                </div>
              </div>
              <button
                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center justify-center text-primary hover:bg-slate-50 active:scale-90 transition-all z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setTempAvatar(formData.avatar);
                  setIsPickerOpen(true);
                }}
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

            {formData.role === 'teacher' ? (
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Trường học</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Shield size={20} />
                    </div>
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Nhập tên trường học"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Môn học</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Book size={20} />
                    </div>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Nhập môn học (ví dụ: Toán học)"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Khối lớp</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, grade: g })}
                      className={cn(
                        "py-3 rounded-xl text-sm font-black transition-all border-2",
                        formData.grade === g
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-black text-slate-900">Chọn ảnh đại diện</h2>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                >
                  <Camera size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Preset Avatars Grid */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Avatar dễ thương</label>
                  <div className="grid grid-cols-4 gap-3">
                    {PRESET_AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => handleSelectAvatar(avatar.url)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${tempAvatar === avatar.url ? 'border-primary ring-4 ring-primary/10' : 'border-transparent'
                          }`}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.label}
                          className="w-full h-full object-cover bg-slate-50"
                          referrerPolicy="no-referrer"
                        />
                        {tempAvatar === avatar.url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tải ảnh lên</label>
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-4 px-4 bg-gradient-to-r from-primary to-secondary border-0 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Upload size={18} />
                      Chọn từ máy
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Hỗ trợ JPG, PNG, GIF. Tối đa 5MB.
                  </p>
                </div>

                {/* URL Input */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hoặc nhập URL</label>
                  <input
                    type="text"
                    value={isBase64Image(tempAvatar) ? '' : tempAvatar}
                    onChange={(e) => {
                      if (!isBase64Image(e.target.value)) {
                        setTempAvatar(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                {/* Preview */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Xem trước</label>
                  <div className="flex items-center justify-center p-4 bg-slate-50 rounded-2xl">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 shadow-lg">
                      <img
                        src={tempAvatar}
                        alt="Preview"
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
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

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {showCropper && pendingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
          >
            <Suspense fallback={
              <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-white w-8 h-8" />
              </div>
            }>
              <ImageCropper
                imageSrc={pendingImage}
                onCrop={handleCropComplete}
                onCancel={() => {
                  setShowCropper(false);
                  setPendingImage(null);
                }}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
