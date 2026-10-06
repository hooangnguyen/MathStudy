import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { CharacterPicker } from './CharacterPicker';
import type { CharacterSpec } from './characters';

/** Hộp thoại "Trang trí nhân vật" (portal ra <body> để không bị bó trong phần tử cha có transform). */
export const CharacterDialog: React.FC<{
  initial: CharacterSpec;
  onSave: (value: CharacterSpec) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [draft, setDraft] = useState<CharacterSpec>(initial);
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-slate-900/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Đổi nhân vật"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <h3 className="text-lg font-black text-center">Trang trí nhân vật</h3>
        <CharacterPicker value={draft} onChange={setDraft} />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClose} className="h-12 rounded-2xl bg-slate-100 font-bold text-slate-600">Huỷ</button>
          <button onClick={() => { onSave(draft); onClose(); }} className="h-12 rounded-2xl bg-indigo-600 text-white font-black">Xong</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
