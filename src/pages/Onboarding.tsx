import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    User, School, ArrowRight, CheckCircle2,
    ChevronRight, Star, Sparkles, Brain,
    GraduationCap
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
    const [step, setStep] = useState<'role_selection' | 'quiz' | 'finish'>('role_selection');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [grade, setGrade] = useState<number>(initialGrade || 5);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Sample questions based on grade levels
    const questionsByGrade: Record<number, any[]> = {
        1: [
            { q: '1 + 1 = ?', a: '2', options: ['1', '2', '3', '4'] },
            { q: 'Số nào sau đây lớn nhất?', a: '9', options: ['5', '7', '9', '2'] },
            { q: '3 - 1 = ?', a: '2', options: ['1', '2', '3', '0'] },
            { q: 'Số nào đứng trước số 5?', a: '4', options: ['3', '4', '6', '1'] },
            { q: '2 + 3 = ?', a: '5', options: ['4', '5', '6', '7'] },
        ],
        2: [
            { q: '5 x 2 = ?', a: '10', options: ['7', '8', '10', '12'] },
            { q: '24 + 16 = ?', a: '40', options: ['30', '40', '50', '34'] },
            { q: 'Số liền sau của 99 là?', a: '100', options: ['98', '100', '101', '110'] },
            { q: '15 - 7 = ?', a: '8', options: ['7', '8', '9', '6'] },
            { q: '10 x 3 = ?', a: '30', options: ['20', '30', '40', '13'] },
        ],
        3: [
            { q: '15 : 3 = ?', a: '5', options: ['3', '4', '5', '6'] },
            { q: '123 + 456 = ?', a: '579', options: ['579', '589', '479', '679'] },
            { q: 'Một hình vuông có cạnh 4cm. Chu vi là?', a: '16cm', options: ['8cm', '12cm', '16cm', '20cm'] },
            { q: '8 x 7 = ?', a: '56', options: ['54', '56', '64', '49'] },
            { q: '900 - 450 = ?', a: '450', options: ['450', '550', '350', '540'] },
        ],
        4: [
            { q: '1/2 + 1/2 = ?', a: '1', options: ['1/4', '1/2', '1', '2'] },
            { q: '25 x 4 = ?', a: '100', options: ['90', '100', '110', '125'] },
            { q: 'Trung bình cộng của 10 và 20 là?', a: '15', options: ['10', '15', '20', '30'] },
            { q: 'Diện tích hình chữ nhật dài 5cm, rộng 3cm?', a: '15cm²', options: ['8cm²', '15cm²', '16cm²', '25cm²'] },
            { q: '1000 : 8 = ?', a: '125', options: ['120', '125', '130', '150'] },
        ],
        5: [
            { q: 'Diện tích hình vuông cạnh 5cm?', a: '25cm²', options: ['10cm²', '20cm²', '25cm²', '50cm²'] },
            { q: '0.5 + 0.25 = ?', a: '0.75', options: ['0.7', '0.75', '0.8', '1.0'] },
            { q: 'Chu vi đường tròn bán kinh 1cm (π=3.14)?', a: '6.28cm', options: ['3.14cm', '6.28cm', '1cm', '2cm'] },
            { q: '2/5 viết dưới dạng số thập phân là?', a: '0.4', options: ['0.2', '0.4', '0.5', '0.6'] },
            { q: '8dm³ = ... cm³?', a: '8000', options: ['80', '800', '8000', '80000'] },
        ],
        6: [
            { q: '(-5) + 3 = ?', a: '-2', options: ['-8', '-2', '2', '8'] },
            { q: 'Phân số 3/4 bằng tỉ số phần trăm nào?', a: '75%', options: ['25%', '50%', '75%', '100%'] },
            { q: 'Số đối của -10 là?', a: '10', options: ['-10', '0', '10', '1/10'] },
            { q: 'Ước chung lớn nhất của 12 và 18 là?', a: '6', options: ['2', '3', '6', '12'] },
            { q: 'Tỉ số của 2 và 5 là?', a: '0.4', options: ['0.2', '0.4', '0.5', '2.5'] },
        ],
        7: [
            { q: 'Tìm x: 2x = 10', a: '5', options: ['2', '5', '10', '20'] },
            { q: 'Giá trị tuyệt đối của -7 là?', a: '7', options: ['-7', '0', '7', '14'] },
            { q: 'Góc bẹt có số đo là bao nhiêu độ?', a: '180°', options: ['90°', '180°', '270°', '360°'] },
            { q: 'Tổng ba góc trong một tam giác bằng?', a: '180°', options: ['90°', '180°', '270°', '360°'] },
            { q: '7² = ?', a: '49', options: ['14', '49', '56', '63'] },
        ],
        8: [
            { q: '√16 = ?', a: '4', options: ['2', '4', '8', '16'] },
            { q: 'Hệ thức Py-ta-go trong tam giác vuông c² = ?', a: 'a² + b²', options: ['a + b', 'a² + b²', 'a² - b²', 'ab'] },
            { q: '(x + 1)² = ?', a: 'x² + 2x + 1', options: ['x² + 1', 'x² + 2x + 1', 'x² + x + 1', 'x² + 2'] },
            { q: 'Số vô tỉ là số?', a: 'Số thập phân vô hạn không tuần hoàn', options: ['Số nguyên', 'Số hữu tỉ', 'Số thập phân hữu hạn', 'Số thập phân vô hạn không tuần hoàn'] },
            { q: 'Đồ thị hàm số y = ax (a≠0) là?', a: 'Đường thẳng qua gốc tọa độ', options: ['Đường cong', 'Đường thẳng qua gốc tọa độ', 'Đường tròn', 'Điểm'] },
        ],
        9: [
            { q: 'sin(30°) = ?', a: '1/2', options: ['0', '1/2', '√2/2', '1'] },
            { q: 'Phương trình x² - 4 = 0 có nghiệm là?', a: 'x = ±2', options: ['x = 2', 'x = -2', 'x = ±2', 'x = 4'] },
            { q: 'Diện tích mặt cầu bán kính R?', a: '4πR²', options: ['πR²', '2πR', '4πR²', '4/3πR³'] },
            { q: 'cos(0°) = ?', a: '1', options: ['0', '1/2', '√3/2', '1'] },
            { q: 'Đường thẳng y = 2x + 1 cắt trục tung tại điểm?', a: '(0; 1)', options: ['(1; 0)', '(0; 1)', '(2; 0)', '(0; 2)'] },
        ],
    };


    const handleFinish = async () => {
        setIsSaving(true);
        try {
            if (firebaseUser) {
                // For Google login users, we need to save their name, role, and grade here
                const profileData: any = {
                    name: name || firebaseUser.displayName || 'Người dùng',
                    role: role,
                    onboarded: true
                };

                if (role === 'student') {
                    profileData.grade = grade;
                }

                await saveUserProfile(firebaseUser.uid, profileData);
            }
            onComplete({ role: role, grade: role === 'student' ? grade : undefined, name: name || firebaseUser?.displayName || 'Người dùng' });
        } catch (error) {
            console.error('Failed to save student profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnswer = (selected: string) => {
        const qList = questionsByGrade[grade] || questionsByGrade[5];
        if (selected === qList[currentQuestion].a) {
            setScore(score + 1);
        }

        if (currentQuestion < qList.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setStep('finish');
        }
    };

    const handleRoleSelectionComplete = () => {
        if (role === 'teacher') {
            handleFinish();
        } else {
            setStep('quiz');
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
                                {isSaving ? 'Đang lưu...' : (role === 'teacher' ? 'Bắt đầu ngay' : 'Tiếp tục')}
                                {!isSaving && <ArrowRight size={20} />}
                            </button>
                        </motion.div>
                    )}

                    {step === 'quiz' && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                    <Brain size={16} />
                                    Thử thách nhỏ
                                </div>
                                <h1 className="text-2xl font-black text-slate-900">Kiểm tra kiến thức lớp {grade}</h1>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                                <p className="text-center text-xl font-black text-slate-700">
                                    {questionsByGrade[grade][currentQuestion].q}
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    {questionsByGrade[grade][currentQuestion].options.map((opt: string) => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(opt)}
                                            className="py-4 bg-slate-50 hover:bg-primary hover:text-white rounded-2xl font-black transition-all border-2 border-transparent"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
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
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white border-4 border-white"
                                >
                                    <Star size={20} fill="currentColor" />
                                </motion.div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tuyệt vời, {name}!</h1>
                                <p className="text-slate-500 font-medium">Chúc mừng em đã hoàn thành bài kiểm tra và sẵn sàng chinh phục toán học.</p>
                            </div>

                            <button
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Đang lưu...' : 'Vào học ngay!'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
