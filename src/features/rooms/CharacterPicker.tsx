import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Dices } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  ACCESSORIES, COLORS, SPECIES, Character, randomCharacter,
  type CharacterSpec,
} from './characters';

type Tab = 'species' | 'color' | 'accessory';
const TABS: { id: Tab; label: string }[] = [
  { id: 'species', label: 'Nhân vật' },
  { id: 'color', label: 'Màu' },
  { id: 'accessory', label: 'Phụ kiện' },
];

/** Chọn và trang trí nhân vật: loài, màu, phụ kiện, hoặc bốc ngẫu nhiên. */
export const CharacterPicker: React.FC<{
  value: CharacterSpec;
  onChange: (value: CharacterSpec) => void;
  /** Ẩn khung xem trước lớn (khi màn hình cha đã hiện nhân vật) */
  hidePreview?: boolean;
}> = ({ value, onChange, hidePreview = false }) => {
  const [tab, setTab] = useState<Tab>('species');
  const [spin, setSpin] = useState(0);

  const option = (key: string, selected: boolean, label: string, onClick: () => void, children: React.ReactNode) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={cn(
        'aspect-square rounded-2xl border-2 flex items-center justify-center transition-all',
        selected ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {!hidePreview && (
        <div className="flex justify-center">
          <motion.div key={spin} initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
            <Character value={value} className="w-32 h-32 drop-shadow-sm" />
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100" role="tablist" aria-label="Trang trí nhân vật">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn('h-10 rounded-xl text-sm font-bold transition-colors', tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { onChange(randomCharacter()); setSpin((n) => n + 1); }}
          aria-label="Chọn ngẫu nhiên"
          title="Chọn ngẫu nhiên"
          className="w-12 h-12 shrink-0 rounded-2xl bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center justify-center"
        >
          <Dices size={24} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2" role="tabpanel">
        {tab === 'species' && SPECIES.map((s) =>
          option(s.id, value.species === s.id, s.name, () => onChange({ ...value, species: s.id }),
            <Character value={{ ...value, species: s.id, accessory: 'none' }} className="w-full h-full p-1" />))}
        {tab === 'color' && COLORS.map((c) =>
          option(c.id, value.color === c.id, `Màu ${c.name.toLowerCase()}`, () => onChange({ ...value, color: c.id }),
            <span className="w-9 h-9 rounded-full border-4 border-white shadow" style={{ background: c.fill, boxShadow: `0 0 0 2px ${c.shade}` }} />))}
        {tab === 'accessory' && ACCESSORIES.map((a) =>
          option(a.id, value.accessory === a.id, a.name, () => onChange({ ...value, accessory: a.id }),
            <span className="flex flex-col items-center">
              <Character value={{ ...value, accessory: a.id }} className="w-12 h-12" />
              <span className="text-[11px] font-semibold text-slate-600 leading-none">{a.name}</span>
            </span>))}
      </div>
    </div>
  );
};
