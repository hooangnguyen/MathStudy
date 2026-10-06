import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInAnonymously } from 'firebase/auth';
import { ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { CharacterPicker } from './CharacterPicker';
import { FloatingSymbols } from './FloatingSymbols';
import { loadSavedCharacter, randomCharacter, saveCharacter, type CharacterSpec } from './characters';
import { loadGuestName, saveGuestName, GUEST_NAME_MAX } from './guest';

/**
 * Vào phòng quiz không cần tài khoản (như Kahoot): nhập tên, chọn nhân vật rồi vào.
 * Bên dưới dùng đăng nhập ẩn danh của Firebase để có uid; khách chỉ dùng được phòng quiz.
 */
export const GuestJoin: React.FC<{ code: string; onSignIn: () => void }> = ({ code, onSignIn }) => {
  const [name, setName] = useState(loadGuestName);
  const [character, setCharacter] = useState<CharacterSpec>(() => loadSavedCharacter() ?? randomCharacter());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Bạn hãy nhập tên để mọi người biết bạn là ai nhé.');
      return;
    }
    setBusy(true);
    setError(null);
    saveGuestName(trimmed);
    saveCharacter(character);
    try {
      // App nhận phiên khách qua onAuthStateChanged rồi tự vào phòng bằng mã đang chờ
      await signInAnonymously(auth);
    } catch (err: any) {
      setBusy(false);
      setError(err?.code === 'auth/operation-not-allowed'
        ? 'Trang web chưa bật chế độ vào phòng không cần tài khoản. Bạn hãy đăng nhập để vào phòng.'
        : 'Không vào được phòng, bạn kiểm tra mạng rồi thử lại nhé.');
    }
  };

  return (
    <div className="relative min-h-full flex-1 flex flex-col bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 overflow-y-auto">
      <FloatingSymbols />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex-1 flex flex-col justify-center gap-4">
        <div className="text-center text-white">
          <p className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-sm font-bold">Phòng <span className="tracking-widest">{code}</span></p>
          <h1 className="text-3xl font-black mt-3">Sẵn sàng chơi chưa?</h1>
          <p className="text-indigo-100 font-medium mt-1">Nhập tên và chọn nhân vật của bạn</p>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-600">Tên của bạn</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, GUEST_NAME_MAX))}
              placeholder="Vd: Minh Anh"
              autoComplete="nickname"
              className="mt-1.5 w-full h-14 rounded-2xl border-2 border-slate-200 px-4 text-xl font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </label>

          <div>
            <p className="text-sm font-bold text-slate-600 mb-2">Nhân vật của bạn</p>
            <CharacterPicker value={character} onChange={setCharacter} />
          </div>

          {error && <p role="alert" className="text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-60"
          >
            {busy ? <Loader2 className="animate-spin" size={22} /> : <>VÀO PHÒNG <ArrowRight size={22} /></>}
          </button>
        </motion.div>

        <button type="button" onClick={onSignIn} className="text-center text-white/90 font-semibold text-sm py-2 hover:text-white">
          Đã có tài khoản? <span className="underline">Đăng nhập để lưu điểm</span>
        </button>
      </form>
    </div>
  );
};
