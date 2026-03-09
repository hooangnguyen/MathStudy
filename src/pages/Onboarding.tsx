import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    User, School, ArrowRight, CheckCircle2,
    GraduationCap, Venus, Mars, UserRound
} from 'lucide-react';
import { cn } from '../utils/utils';
import { saveUserProfile } from '../services/userService';
import { useFirebase } from '../context/FirebaseProvider';

interface OnboardingProps {
    onComplete: (data: { role: 'student' | 'teacher'; grade?: number; name?: string }) => void;
    initialGrade?: number;
    name?: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialGrade, name }) => {
    const { user: firebaseUser } = useFirebase();
    const [step, setStep] = useState<'role_selection' | 'teacher_info' | 'finish'>('role_selection');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [grade, setGrade] = useState<number>(initialGrade || 5);
    const [teacherName, setTeacherName] = useState(name || '');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
    const [isSaving, setIsSaving] = useState(false);

    const handleFinish = async () => {
        setIsSaving(true);
        try {
            if (firebaseUser) {
                const profileData: any = {
                    name: role === 'teacher' ? teacherName : (name || firebaseUser.displayName || 'Người dùng'),
                    role: role,
                    onboarded: true
                };

                if (role === 'student') {
                    profileData.grade = grade;
                } else {
                    profileData.gender = gender;
                }

                await saveUserProfile(firebaseUser.uid, profileData);
            }
            onComplete({
                role: role,
                grade: role === 'student' ? grade : undefined,
                name: role === 'teacher' ? teacherName : (name || firebaseUser?.displayName || 'Người dùng')
            });
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRoleSelectionComplete = () => {
        if (role === 'teacher') {
            setStep('teacher_info');
        } else {
            setStep('finish');
        }
    };

    return (
        <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar">
            <div className="max-w-md w-full">
                <AnimatePresence mode="wait">

                    {step === 'role_selection' && (
                        <motion.div
                            key="role_selection"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                                    <User size={32} />
                                </div>
                                <h1 className="text-2xl font-black text-slate-900">Hoàn thiện hồ sơ</h1>
                                <p className="text-slate-500 font-medium text-sm">Cho chúng mình biết thêm về bạn nhé</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Vai trò của bạn</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setRole('student')}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3",
                                                role === 'student' ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <GraduationCap size={28} />
                                            <span className="font-bold">Học sinh</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('teacher')}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3",
                                                role === 'teacher' ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <School size={28} />
                                            <span className="font-bold">Giáo viên</span>
                                        </button>
                                    </div>
                                </div>

                                {role === 'student' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-3"
                                    >
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Khối lớp</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setGrade(g)}
                                                    className={cn(
                                                        "py-3 rounded-xl font-black text-sm transition-all",
                                                        grade === g
                                                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                            : "bg-slate-50 text-slate-400 border-2 border-slate-100 hover:border-slate-200"
                                                    )}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <button
                                onClick={handleRoleSelectionComplete}
                                disabled={isSaving}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Đang lưu...' : (role === 'teacher' ? 'Tiếp tục' : 'Hoàn thành')}
                                {!isSaving && <ArrowRight size={20} />}
                            </button>
                        </motion.div>
                    )}

                    {step === 'teacher_info' && (
                        <motion.div
                            key="teacher_info"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mx-auto mb-4">
                                    <School size={32} />
                                </div>
                                <h1 className="text-2xl font-black text-slate-900">Thông tin giáo viên</h1>
                                <p className="text-slate-500 font-medium text-sm">Vui lòng nhập thông tin cá nhân</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Giới tính</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setGender('male')}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2",
                                                gender === 'male' ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Mars size={24} />
                                            <span className="font-bold text-sm">Nam</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender('female')}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2",
                                                gender === 'female' ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Venus size={24} />
                                            <span className="font-bold text-sm">Nữ</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender('other')}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2",
                                                gender === 'other' ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <UserRound size={24} />
                                            <span className="font-bold text-sm">Khác</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={teacherName}
                                        onChange={(e) => setTeacherName(e.target.value)}
                                        placeholder="Nhập họ và tên của bạn"
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-base font-bold focus:border-secondary focus:bg-white transition-all outline-none placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleFinish}
                                disabled={isSaving || !teacherName.trim()}
                                className="w-full bg-secondary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSaving ? 'Đang lưu...' : 'Hoàn thành'}
                                {!isSaving && <ArrowRight size={20} />}
                            </button>
                        </motion.div>
                    )}

                    {step === 'finish' && (
                        <motion.div
                            key="finish"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            <div className="w-24 h-24 bg-emerald-500 rounded-[3rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-200 relative">
                                <CheckCircle2 size={48} />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {role === 'student' ? `Chào mừng, ${name || 'bạn'}!` : `Chào mừng, ${teacherName}!`}
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    {role === 'student'
                                        ? 'Sẵn sàng chinh phục toán học nào!'
                                        : 'Sẵn sàng giảng dạy nào!'}
                                </p>
                            </div>

                            <button
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 active:scale-95 transition-all"
                            >
                                {isSaving ? 'Đang lưu...' : 'Tiếp tục'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
