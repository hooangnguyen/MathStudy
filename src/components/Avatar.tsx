import React, { useState } from 'react';
import { cn } from '../lib/utils';

const COLORS = [
  'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-orange-500', 'bg-teal-500',
];

const colorFor = (seed: string) => {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
};

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  textClassName?: string;
}

/**
 * Ảnh đại diện; không có ảnh (hoặc ảnh lỗi) thì hiện chữ cái đầu của tên trên nền màu cố định theo tên.
 */
export const Avatar: React.FC<AvatarProps> = ({ src, name, className, textClassName }) => {
  const [failed, setFailed] = useState(false);
  const label = (name || '?').trim();
  const initial = label.split(/\s+/).pop()?.charAt(0).toUpperCase() || '?';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={label}
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        className={cn('object-cover bg-slate-100', className)}
      />
    );
  }
  return (
    <div className={cn('flex items-center justify-center text-white font-black select-none', colorFor(label), className)} aria-label={label}>
      <span className={textClassName}>{initial}</span>
    </div>
  );
};
