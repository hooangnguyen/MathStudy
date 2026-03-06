import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Sparkles, ChevronLeft } from 'lucide-react';
import { cn } from '../utils/utils';

interface AuthProps {
  onLogin: (role: 'student' | 'teacher') => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call with test credentials check
    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'login') {
        if (email === '2' && password === '2') {
          onLogin('teacher');
        } else if (email === '1' && password === '1') {
          onLogin('student');
        } else {
          alert('Sai tài khoản hoặc mật khẩu! Thử lại với 1/1 (Học sinh) hoặc 2/2 (Giáo viên)');
        }
      } else {
        onLogin('student');
      }
    }, 1000);
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-x-hidden overflow-y-auto no-scrollbar relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col p-8 pt-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 mb-12"
        >
          <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-6">
            <Sparkles size={32} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            {mode === 'login' ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình'}
          </h1>
          <p className="text-slate-500 font-medium">
            {mode === 'login' 
              ? 'Đăng nhập để tiếp tục chinh phục những đỉnh cao toán học.' 
              : 'Tạo tài khoản để tham gia cộng đồng học toán thông minh.'}
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email hoặc tên đăng nhập"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mật khẩu</label>
              {mode === 'login' && (
                <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-wider">Quên mật khẩu?</button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="bg-white px-4 text-slate-400">Hoặc tiếp tục với</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <button type="button" className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
            <Chrome size={18} className="text-rose-500" />
            Google
          </button>
          <button type="button" className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
            <Github size={18} className="text-slate-900" />
            GitHub
          </button>
        </div>

        {/* Footer Link */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-primary font-black hover:underline"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
