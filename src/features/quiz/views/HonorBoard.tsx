import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Crown, Maximize2, Trophy, Users, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Character } from '../../rooms/characters';
import { Confetti } from '../../rooms/Confetti';
import { rankPlayers, type RankedPlayer } from '../ranking';
import type { QuizPlayer } from '../types';

/** Bục 1-2-3: thứ tự hiển thị trái → phải là hạng 2, 1, 3 */
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_STYLE = [
  { block: 'from-amber-300 to-amber-200 border-amber-400', text: 'text-amber-800', score: 'text-amber-600', ring: 'ring-amber-300' },
  { block: 'from-slate-300 to-slate-200 border-slate-400', text: 'text-slate-700', score: 'text-slate-600', ring: 'ring-slate-300' },
  { block: 'from-orange-300 to-orange-200 border-orange-400', text: 'text-orange-800', score: 'text-orange-600', ring: 'ring-orange-300' },
];
// Lên bục lần lượt: hạng 3 → hạng 2 → hạng 1
const REVEAL_DELAY = [1.3, 0.8, 0.3];

const Podium: React.FC<{ top: RankedPlayer[]; stage?: boolean }> = ({ top, stage = false }) => (
  <div className={cn('flex items-end justify-center', stage ? 'gap-6' : 'gap-2')}>
    {PODIUM_ORDER.map((idx) => {
      const p = top[idx];
      if (!p) return <div key={idx} className={stage ? 'w-56' : 'w-[31%]'} />;
      const style = PODIUM_STYLE[idx];
      const first = idx === 0;
      return (
        <motion.div
          key={p.id}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: REVEAL_DELAY[idx], type: 'spring', stiffness: 160, damping: 16 }}
          className={cn('flex flex-col items-center min-w-0', stage ? 'w-56' : 'w-[31%]')}
          data-testid={`podium-${idx + 1}`}
        >
          {first && (
            <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: REVEAL_DELAY[0] + 0.4, type: 'spring' }}>
              <Crown className="text-amber-400 drop-shadow" size={stage ? 56 : 30} fill="currentColor" />
            </motion.div>
          )}
          <motion.div
            animate={first ? { y: [0, -6, 0] } : undefined}
            transition={{ duration: 1.8, repeat: Infinity, delay: REVEAL_DELAY[0] + 1 }}
          >
            <Character
              value={p.character}
              uid={p.id}
              className={cn(stage ? (first ? 'w-44 h-44' : 'w-36 h-36') : first ? 'w-24 h-24' : 'w-20 h-20', 'drop-shadow-md')}
            />
          </motion.div>
          <p className={cn('font-black text-center leading-tight line-clamp-2 break-words w-full', stage ? 'text-2xl mt-1' : 'text-sm mt-0.5', p.isMe && !stage && 'text-indigo-700')}>
            {p.name}
          </p>
          <p className={cn('font-black tabular-nums', stage ? 'text-2xl' : 'text-sm', stage ? 'text-white/90' : style.score)}>{p.score ?? 0} điểm</p>
          <div
            className={cn(
              'w-full mt-1 rounded-t-2xl bg-gradient-to-t border-2 border-b-0 flex items-start justify-center',
              style.block,
              stage ? (first ? 'h-40 pt-3' : idx === 1 ? 'h-28 pt-3' : 'h-20 pt-2') : first ? 'h-24 pt-2' : idx === 1 ? 'h-16 pt-1.5' : 'h-12 pt-1'
            )}
          >
            <span className={cn('font-black', style.text, stage ? 'text-5xl' : 'text-2xl')}>{p.rank}</span>
          </div>
        </motion.div>
      );
    })}
  </div>
);

const RankRow: React.FC<{ p: RankedPlayer; stage?: boolean; innerRef?: React.Ref<HTMLLIElement> }> = ({ p, stage = false, innerRef }) => (
  <li
    ref={innerRef}
    className={cn(
      'flex items-center gap-3 rounded-2xl border-2',
      stage ? 'px-4 py-2 bg-white/10 border-white/10' : 'px-3 py-1.5 bg-white border-slate-100',
      p.isMe && !stage && 'bg-indigo-50 border-indigo-300'
    )}
  >
    <span className={cn('w-8 text-center font-black tabular-nums shrink-0', stage ? 'text-2xl text-white/80' : 'text-slate-500')}>{p.rank}</span>
    <Character value={p.character} uid={p.id} className={cn('shrink-0', stage ? 'w-14 h-14' : 'w-11 h-11')} />
    <span className={cn('flex-1 min-w-0 truncate font-bold', stage ? 'text-2xl' : 'text-slate-800', p.isMe && !stage && 'text-indigo-700')}>
      {p.name}{p.isMe && !stage && ' (bạn)'}
    </span>
    <span className={cn('font-black tabular-nums shrink-0', stage ? 'text-2xl' : 'text-indigo-600')}>{p.score ?? 0}</span>
  </li>
);

/** Màn trình chiếu Vinh danh cho giáo viên chiếu lên bảng. */
const HonorStage: React.FC<{ ranked: RankedPlayer[]; title?: string; onClose: () => void }> = ({ ranked, title, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const next = ranked.slice(3, 13);
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Trình chiếu vinh danh" className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 text-white overflow-y-auto">
      <Confetti count={120} delay={1.5} />
      <button onClick={onClose} aria-label="Đóng trình chiếu" className="absolute top-4 right-4 z-30 w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center">
        <X size={26} />
      </button>
      <div className="min-h-full flex flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <p className="text-5xl font-black flex items-center gap-3 justify-center"><Trophy size={48} className="text-amber-300" /> Vinh danh</p>
          {title && <p className="text-2xl font-semibold text-indigo-100 mt-2">{title}</p>}
        </div>
        <Podium top={ranked.slice(0, 3)} stage />
        {next.length > 0 && (
          <ol className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-5xl">
            {next.map((p) => <RankRow key={p.id} p={p} stage />)}
          </ol>
        )}
        <p className="text-xl font-semibold text-indigo-100 flex items-center gap-2"><Users size={24} /> {ranked.length} bạn tham gia</p>
      </div>
    </div>,
    document.body
  );
};

/**
 * Vinh danh cuối trận: bục 1-2-3 với tên + nhân vật từng bạn đã trang trí, pháo giấy,
 * danh sách các hạng còn lại (dùng được cho lớp đông), học sinh thấy hạng của mình.
 */
export const HonorBoard: React.FC<{
  players: QuizPlayer[];
  title?: string;
  roomCode: string;
  isHost: boolean;
  onBack: () => void;
}> = ({ players, title, roomCode, isHost, onBack }) => {
  const ranked = useMemo(() => rankPlayers(players), [players]);
  const me = ranked.find((p) => p.isMe);
  const rest = ranked.slice(3);
  const [presenting, setPresenting] = useState(false);
  const meRef = useRef<HTMLLIElement>(null);

  return (
    <div className="relative flex-1 flex flex-col">
      <Confetti delay={1.5} />
      <div className="bg-gradient-to-b from-indigo-600 to-violet-600 text-white px-4 pt-5 pb-4 rounded-b-[2rem] shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-black flex items-center justify-center gap-2"><Trophy className="text-amber-300" size={26} /> Vinh danh</h2>
          <p className="text-sm text-indigo-100 font-semibold mt-0.5 truncate">
            {title ? `${title} · ` : ''}Phòng {roomCode} · {ranked.length} bạn
          </p>
        </div>
        <div className="mt-4 bg-white/95 rounded-3xl px-2 pt-3 text-slate-900">
          {ranked.length > 0
            ? <Podium top={ranked.slice(0, 3)} />
            : <p className="text-center text-slate-500 py-8">Chưa có ai làm bài.</p>}
        </div>
      </div>

      {me && (
        <button
          type="button"
          onClick={() => meRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="mx-4 -mt-3 relative z-10 flex items-center gap-3 px-3 py-2 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-900 shadow text-left"
        >
          <Character value={me.character} uid={me.id} className="w-12 h-12 shrink-0" />
          <span className="flex-1 font-bold leading-tight">
            Bạn đứng hạng <span className="font-black text-lg">{me.rank}</span>/{ranked.length}
            <span className="block text-sm font-semibold">{me.score ?? 0} điểm{me.rank <= 3 ? ' · Lên bục vinh danh!' : ''}</span>
          </span>
        </button>
      )}

      {rest.length > 0 && (
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4" aria-label="Các hạng tiếp theo">
          {rest.map((p) => <RankRow key={p.id} p={p} innerRef={p.isMe ? meRef : undefined} />)}
        </ol>
      )}

      <div className="mt-auto p-4 pt-2 space-y-2">
        {isHost && ranked.length > 0 && (
          <button onClick={() => setPresenting(true)} className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center justify-center gap-2">
            <Maximize2 size={20} /> Trình chiếu vinh danh
          </button>
        )}
        <button onClick={onBack} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black">
          QUAY LẠI
        </button>
      </div>

      {presenting && <HonorStage ranked={ranked} title={title} onClose={() => setPresenting(false)} />}
    </div>
  );
};
