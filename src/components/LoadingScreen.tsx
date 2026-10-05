import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center space-y-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-indigo-600"
            >
                <Loader2 size={48} strokeWidth={2.5} />
            </motion.div>

            <div className="text-center">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">MathStudy</h1>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 animate-pulse">
                    Đang tải trải nghiệm...
                </p>
            </div>

            {/* Decorative background elements consistent with the theme */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-50 rounded-full blur-[100px]" />
            </div>
        </div>
    );
};
