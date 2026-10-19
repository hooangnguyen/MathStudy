import React from 'react';
import { Mascot } from './mascot/Mascot';

/** Màn chờ khi tải trang/màn hình: linh vật đang nghĩ. */
export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Đang tải...' }) => (
  <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
    <Mascot mood="think" className="w-36 h-36" />
    <p className="text-slate-600 font-bold text-base animate-pulse">{message}</p>
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[100px]" />
    </div>
  </div>
);
