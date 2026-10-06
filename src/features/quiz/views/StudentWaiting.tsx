import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Palette } from 'lucide-react';
import { Character, parseCharacter, type CharacterSpec } from '../../rooms/characters';
import { CharacterDialog } from '../../rooms/CharacterDialog';
import { FloatingSymbols } from '../../rooms/FloatingSymbols';
import type { QuizPlayer } from '../types';

const CHEERS = ['Sẵn sàng!', 'Cố lên nào!', 'Mình giỏi Toán!', 'Hí hí', 'Chờ xíu nha', 'Quẩy thôi!', '1 + 1 = 2!'];
const MAX_OTHERS = 15;

/** Phòng chờ của học sinh: nhân vật của mình (bấm vào để nhảy), đổi nhân vật, các bạn đã vào. */
export const StudentWaiting: React.FC<{
  roomCode: string;
  me: QuizPlayer | undefined;
  myId: string;
  myName: string;
  players: QuizPlayer[];
  onChangeCharacter: (value: CharacterSpec) => void;
  onLeave: () => void;
}> = ({ roomCode, me, myId, myName, players, onChangeCharacter, onLeave }) => {
  const reduce = useReducedMotion();
  const [jump, setJump] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const mine = parseCharacter(me?.character, myId);
  const others = players.filter((p) => !p.isMe);

  const poke = () => {
    setJump((n) => n + 1);
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    window.setTimeout(() => setCheer(null), 1400);
  };

  return (
    <div className="relative flex-1 flex flex-col bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white overflow-hidden">
      <FloatingSymbols />

      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-5 gap-4">
        <p className="px-4 py-1.5 rounded-full bg-white/15 text-sm font-bold">
          Phòng <span className="tracking-widest">{roomCode}</span> · {players.length} bạn
        </p>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[260px]">
          <div className="relative">
            <AnimatePresence>
              {cheer && (
                <motion.span
                  key={cheer + jump}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-2xl bg-white text-indigo-700 text-sm font-black shadow-lg"
                >
                  {cheer}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={poke}
              aria-label="Bấm vào nhân vật của bạn"
              key={jump}
              initial={jump && !reduce ? { y: 0, rotate: 0 } : false}
              animate={jump && !reduce ? { y: [0, -36, 0, -12, 0], rotate: [0, -8, 8, 0, 0] } : { y: 0 }}
              transition={{ duration: 0.7 }}
              className="block"
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Character value={mine} className="w-44 h-44 drop-shadow-xl" />
              </motion.div>
            </motion.button>
          </div>
          <p className="mt-2 text-2xl font-black max-w-[16rem] truncate">{myName}</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-3 h-11 px-5 rounded-2xl bg-white/20 hover:bg-white/30 font-bold flex items-center gap-2"
          >
            <Palette size={18} /> Đổi nhân vật
          </button>
        </div>

        <div className="w-full max-w-md bg-white/15 rounded-2xl py-3 text-center font-bold flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
          Đang chờ giáo viên bắt đầu...
        </div>

        {others.length > 0 && (
          <div className="w-full max-w-md">
            <p className="text-sm font-semibold text-indigo-100 mb-2">Các bạn trong phòng</p>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {others.slice(0, MAX_OTHERS).map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5 pl-0.5 pr-3 py-0.5 rounded-full bg-white/15"
                  >
                    <Character value={p.character} uid={p.id} className="w-8 h-8" />
                    <span className="text-sm font-semibold max-w-[7rem] truncate">{p.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {others.length > MAX_OTHERS && (
                <span className="px-3 py-1.5 rounded-full bg-white/15 text-sm font-bold">+{others.length - MAX_OTHERS}</span>
              )}
            </div>
          </div>
        )}

        <button onClick={onLeave} className="text-white/80 hover:text-white font-bold text-sm py-2">
          Rời phòng
        </button>
      </div>

      {editing && (
        <CharacterDialog
          initial={mine}
          onSave={(value) => { onChangeCharacter(value); setJump((n) => n + 1); }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
};
