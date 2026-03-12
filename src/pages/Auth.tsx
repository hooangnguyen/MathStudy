import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Chrome, Sparkles, ChevronLeft } from 'lucide-react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { sendOTP, verifyOTP } from '../services/authService';

interface AuthProps {
  onLogin: (role: 'student' | 'teacher' | 'new_user') => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login success:', result.user);
        // We pass 'new_user' even for existing logins so App.tsx can sync from Firestore
        onLogin('new_user');
      } else {
        if (step === 'credentials') {
          if (password !== confirmPassword) {
            setError('Mật khẩu không khớp');
            setIsLoading(false);
            return;
          }
          if (!name.trim()) {
            setError('Vui lòng nhập họ và tên');
            setIsLoading(false);
            return;
          }
          // Send OTP and move to verification
          await sendOTP(email);
          setStep('otp');
        } else if (step === 'otp') {
          // Verify OTP and create user
          const verification = await verifyOTP(email, otp);
          if (verification.success) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Wait until user is created, then update their Firebase Auth profile
            await updateProfile(user, { displayName: name });

            // We no longer initialize the user profile in Firestore here.
            // That will happen during the Onboarding step for ALL new users.

            onLogin('new_user');
          } else {
            setError(verification.error || 'Mã OTP không đúng');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message === 'Firebase: Error (auth/invalid-credential).' ? 'Sai email hoặc mật khẩu' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google login success:', result.user);
      // For Google users, we go to onboarding to let them pick name/grade/role
      onLogin('new_user');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col overflow-x-hidden overflow-y-auto no-scrollbar relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[10%] w-[30%] h-[30%] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col p-8 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 mb-10"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-5">
            <Sparkles size={32} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            {mode === 'login' ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình'}
          </h1>
          <p className="text-slate-500 font-medium text-base">
            {mode === 'login'
              ? 'Đăng nhập để tiếp tục chinh phục những đỉnh cao toán học.'
              : 'Tạo tài khoản để tham gia cộng đồng học toán thông minh.'}
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && step === 'credentials' && (
              <motion.div
                key="name-role"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Tên và Vai trò đã được chuyển sang phần Onboarding */}
              </motion.div>
            )}

            {mode === 'register' && step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nhập mã OTP từ Email</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl py-6 text-center text-3xl font-black tracking-[1rem] outline-none transition-all"
                />
                <p className="text-center text-[10px] font-bold text-slate-400 mt-2">Mã được gửi tới: {email}</p>
                <button
                  type="button"
                  onClick={() => sendOTP(email)}
                  className="w-full text-center text-xs font-black text-primary uppercase mt-4 hover:underline"
                >
                  Gửi lại mã
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {(mode === 'login' || (mode === 'register' && step === 'credentials')) && (
            <>
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-slate-50/80 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-slate-50/80 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                  {mode === 'login' && (
                    <button type="button" className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider hover:text-indigo-600">Quên mật khẩu?</button>
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
                    className="w-full bg-slate-50/80 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50/80 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-rose-500 ml-1"
            >
              {error}
            </motion.p>
          )}

          <div className="flex gap-3">
            {mode === 'register' && step !== 'credentials' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setStep('credentials')}
                className="w-20 bg-slate-100 text-slate-900 py-5 rounded-[2rem] font-black text-lg hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
              >
                <ChevronLeft size={24} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  {mode === 'login' ? 'Đăng nhập' : step === 'otp' ? 'Xác nhận & Đăng ký' : 'Tiếp tục'}
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 px-4 text-slate-400">Hoặc tiếp tục với</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-200 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            <Chrome size={18} className="text-rose-500" />
            Google
          </motion.button>
        </div>

        {/* Footer Link */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-indigo-600 font-black hover:underline"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </motion.button>
          </p>
        </div>
      </div>
    </div>
  );
};
