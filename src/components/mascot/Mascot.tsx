import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

/** Tên linh vật: đổi ở đây là đổi khắp app. */
export const MASCOT_NAME = 'Dino';

/**
 * Biểu cảm của linh vật:
 * - happy: mặc định, mỉm cười      - wave: vẫy tay chào
 * - cheer: khen khi làm đúng        - oops: động viên khi làm sai
 * - think: đang nghĩ / đang tải     - sleep: ngủ (trang trống, lâu không học)
 * - celebrate: ăn mừng (xong bài, giữ chuỗi ngày học, vinh danh)
 */
export type MascotMood = 'happy' | 'wave' | 'cheer' | 'oops' | 'think' | 'sleep' | 'celebrate';

const C = {
  body: '#4ade80',
  line: '#15803d',
  belly: '#fef9c3',
  bellyLine: '#facc15',
  spike: '#fb923c',
  spikeLine: '#ea580c',
  ink: '#1e1b4b',
  cheek: '#fb7185',
};

const Eyes: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  if (mood === 'sleep') {
    return (
      <g stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M66 82 Q76 90 86 82" /> <path d="M114 82 Q124 90 134 82" />
      </g>
    );
  }
  if (mood === 'cheer' || mood === 'celebrate') {
    // Mắt cười híp
    return (
      <g stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none">
        <path d="M65 84 Q76 70 87 84" /> <path d="M113 84 Q124 70 135 84" />
      </g>
    );
  }
  const look = mood === 'think' ? { dx: 3, dy: -4 } : mood === 'oops' ? { dx: 0, dy: 2 } : { dx: 1, dy: 1 };
  return (
    <g className="mascot-eyes">
      <ellipse cx={76} cy={80} rx={14} ry={16} fill="#fff" stroke={C.line} strokeWidth={2.5} />
      <ellipse cx={124} cy={80} rx={14} ry={16} fill="#fff" stroke={C.line} strokeWidth={2.5} />
      <circle cx={76 + look.dx} cy={81 + look.dy} r={9} fill={C.ink} />
      <circle cx={124 + look.dx} cy={81 + look.dy} r={9} fill={C.ink} />
      <circle cx={79 + look.dx} cy={77 + look.dy} r={3.4} fill="#fff" />
      <circle cx={127 + look.dx} cy={77 + look.dy} r={3.4} fill="#fff" />
      <circle cx={73 + look.dx} cy={85 + look.dy} r={1.6} fill="#fff" />
      <circle cx={121 + look.dx} cy={85 + look.dy} r={1.6} fill="#fff" />
      {mood === 'oops' && (
        <g stroke={C.line} strokeWidth={3.5} strokeLinecap="round">
          <path d="M64 60 L84 64" /> <path d="M136 60 L116 64" />
        </g>
      )}
    </g>
  );
};

const Mouth: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  switch (mood) {
    case 'cheer':
    case 'celebrate':
      return (
        <g>
          <path d="M84 104 Q100 128 116 104 Z" fill={C.ink} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <path d="M91 114 Q100 108 109 114 Q105 121 100 121 Q95 121 91 114 Z" fill={C.cheek} />
          <path d="M95 104 L100 110 L105 104" fill="#fff" />
        </g>
      );
    case 'oops':
      return <path d="M88 112 Q94 106 100 110 Q106 114 112 108" fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />;
    case 'think':
      return <ellipse cx={104} cy={110} rx={5} ry={6} fill={C.ink} />;
    case 'sleep':
      return <ellipse cx={100} cy={110} rx={6} ry={4} fill={C.ink} opacity={0.8} />;
    default:
      return (
        <g>
          <path d="M86 104 Q100 120 114 104" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M96 108 L100 114 L104 108" fill="#fff" stroke={C.ink} strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      );
  }
};

/** Tay: tư thế theo biểu cảm. Gốc xoay ở vai để vẫy được. */
const Arms: React.FC<{ mood: MascotMood; animate: boolean }> = ({ mood, animate }) => {
  const arm = (d: string) => <path d={d} fill={C.body} stroke={C.line} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />;
  // Tay giơ cao phải nằm ngoài viền đầu (x 40–160) thì mới thấy được
  const left = {
    happy: 'M60 136 Q40 144 44 160 Q52 166 62 152', wave: 'M60 136 Q40 144 44 160 Q52 166 62 152',
    think: 'M60 136 Q40 144 44 160 Q52 166 62 152',
    cheer: 'M60 140 Q34 132 26 108 Q32 100 40 108 Q46 126 66 132', celebrate: 'M60 140 Q34 132 26 108 Q32 100 40 108 Q46 126 66 132',
    oops: 'M60 138 Q40 136 34 122 Q40 114 48 124 Q54 130 64 132', sleep: 'M60 142 Q60 160 74 162 Q80 154 70 146',
  }[mood];
  const right = {
    happy: 'M140 136 Q160 144 156 160 Q148 166 138 152',
    wave: 'M140 140 Q166 132 174 106 Q168 98 160 106 Q154 126 134 132',
    cheer: 'M140 140 Q166 132 174 108 Q168 100 160 108 Q154 126 134 132', celebrate: 'M140 140 Q166 132 174 108 Q168 100 160 108 Q154 126 134 132',
    oops: 'M140 138 Q160 136 166 122 Q160 114 152 124 Q146 130 136 132',
    think: 'M140 138 Q130 136 122 128 Q118 120 124 116 Q132 118 134 128',
    sleep: 'M140 142 Q140 160 126 162 Q120 154 130 146',
  }[mood];
  return (
    <g>
      {arm(left)}
      {mood === 'wave' && animate ? (
        <motion.g
          style={{ originX: '140px', originY: '138px' }}
          animate={{ rotate: [0, 18, -6, 18, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
        >
          {arm(right)}
        </motion.g>
      ) : arm(right)}
    </g>
  );
};

const Extras: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  switch (mood) {
    case 'cheer':
      return (
        <g fill="#facc15" stroke="#ca8a04" strokeWidth={1.5} strokeLinejoin="round">
          <path d="M28 54 L32 64 L42 66 L34 72 L36 82 L28 76 L20 82 L22 72 L14 66 L24 64 Z" />
          <path d="M172 40 L175 48 L183 49 L177 54 L179 62 L172 58 L165 62 L167 54 L161 49 L169 48 Z" />
        </g>
      );
    case 'celebrate':
      return (
        <g>
          {/* mũ tiệc */}
          <path d="M100 2 L82 36 L118 36 Z" fill="#a78bfa" stroke="#7c3aed" strokeWidth={3} strokeLinejoin="round" />
          <path d="M92 20 L108 22 M87 30 L113 32" stroke="#fde047" strokeWidth={4} strokeLinecap="round" />
          <circle cx={100} cy={2} r={6} fill="#f472b6" />
          <g fill="#f43f5e"><rect x={22} y={60} width={7} height={4} rx={1} transform="rotate(30 25 62)" /></g>
          <g fill="#3b82f6"><rect x={170} y={70} width={7} height={4} rx={1} transform="rotate(-20 173 72)" /></g>
          <g fill="#22c55e"><circle cx={30} cy={100} r={3} /><circle cx={176} cy={46} r={3} /></g>
          <g fill="#f59e0b"><rect x={160} y={110} width={6} height={4} rx={1} transform="rotate(50 163 112)" /></g>
        </g>
      );
    case 'oops':
      // giọt mồ hôi
      return <path d="M150 62 Q156 72 150 78 Q144 72 150 62 Z" fill="#7dd3fc" stroke="#0284c7" strokeWidth={1.5} />;
    case 'think':
      return (
        <g fill="#fff" stroke="#94a3b8" strokeWidth={2}>
          <circle cx={150} cy={44} r={4} /> <circle cx={160} cy={32} r={6} />
          <ellipse cx={176} cy={16} rx={14} ry={11} />
          <text x={176} y={21} textAnchor="middle" fontSize={14} fontWeight={900} fill="#6366f1" stroke="none">?</text>
        </g>
      );
    case 'sleep':
      return (
        <g fill="#6366f1" fontWeight={900}>
          <text x={146} y={50} fontSize={18}>z</text>
          <text x={160} y={34} fontSize={24}>z</text>
          <text x={178} y={16} fontSize={30}>Z</text>
        </g>
      );
    default:
      return null;
  }
};

/** Khủng long con: vẽ bằng SVG, có biểu cảm, nhún nhảy và chớp mắt nhẹ. */
export const Mascot: React.FC<{
  mood?: MascotMood;
  className?: string;
  /** Tắt chuyển động (vd. ảnh nhỏ trong danh sách) */
  still?: boolean;
  title?: string;
}> = ({ mood = 'happy', className, still = false, title }) => {
  const reduce = useReducedMotion();
  const animate = !still && !reduce;
  const bounce = mood === 'cheer' || mood === 'celebrate';
  return (
    <motion.svg
      viewBox="0 -8 200 208"
      className={cn('overflow-visible', animate && mood !== 'sleep' && 'mascot-blink', className)}
      role="img"
      aria-label={title ?? `${MASCOT_NAME}, khủng long con`}
      animate={animate ? (bounce ? { y: [0, -12, 0] } : mood === 'sleep' ? { scale: [1, 1.03, 1] } : { y: [0, -4, 0] }) : undefined}
      transition={{ duration: bounce ? 0.7 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx={100} cy={194} rx={52} ry={6} fill="#0f172a" opacity={0.08} />

      {/* đuôi */}
      <path d="M138 168 Q170 172 186 150 Q190 142 182 142 Q172 158 140 150 Z" fill={C.body} stroke={C.line} strokeWidth={3} strokeLinejoin="round" />
      <path d="M176 146 L182 134 L186 146 Z M160 156 L164 144 L170 154 Z" fill={C.spike} stroke={C.spikeLine} strokeWidth={2} strokeLinejoin="round" />

      {/* chân */}
      <ellipse cx={76} cy={186} rx={18} ry={10} fill={C.body} stroke={C.line} strokeWidth={3} />
      <ellipse cx={124} cy={186} rx={18} ry={10} fill={C.body} stroke={C.line} strokeWidth={3} />
      <g fill={C.belly}><circle cx={68} cy={189} r={2.5} /><circle cx={76} cy={191} r={2.5} /><circle cx={84} cy={189} r={2.5} />
        <circle cx={116} cy={189} r={2.5} /><circle cx={124} cy={191} r={2.5} /><circle cx={132} cy={189} r={2.5} /></g>

      {/* thân + bụng */}
      <ellipse cx={100} cy={150} rx={46} ry={40} fill={C.body} stroke={C.line} strokeWidth={3} />
      <ellipse cx={100} cy={156} rx={30} ry={28} fill={C.belly} />
      <g stroke={C.bellyLine} strokeWidth={2.5} strokeLinecap="round" fill="none">
        <path d="M80 144 Q100 150 120 144" /> <path d="M76 158 Q100 164 124 158" /> <path d="M80 172 Q100 178 120 172" />
      </g>

      {/* gai trên đầu (vẽ trước để nằm sau đầu) */}
      <g fill={C.spike} stroke={C.spikeLine} strokeWidth={3} strokeLinejoin="round">
        <path d="M70 46 Q66 28 80 26 Q86 34 86 44 Z" />
        <path d="M90 38 Q90 14 104 16 Q110 28 108 38 Z" />
        <path d="M114 40 Q120 22 132 28 Q132 38 128 46 Z" />
      </g>

      {/* đầu */}
      <path d="M100 30 C148 30 162 62 160 92 C158 120 134 130 100 130 C66 130 42 120 40 92 C38 62 52 30 100 30 Z" fill={C.body} stroke={C.line} strokeWidth={3} />
      <ellipse cx={58} cy={104} rx={9} ry={5.5} fill={C.cheek} opacity={0.45} />
      <ellipse cx={142} cy={104} rx={9} ry={5.5} fill={C.cheek} opacity={0.45} />
      <g fill={C.line} opacity={0.35}><circle cx={60} cy={56} r={3} /><circle cx={142} cy={60} r={4} /><circle cx={134} cy={50} r={2.5} /></g>

      <Arms mood={mood} animate={animate} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      <Extras mood={mood} />
    </motion.svg>
  );
};

/** Linh vật kèm bong bóng lời thoại. */
export const MascotSays: React.FC<{
  mood?: MascotMood;
  children: React.ReactNode;
  className?: string;
  mascotClassName?: string;
  /** Bong bóng nằm bên phải (mặc định) hay phía trên linh vật */
  layout?: 'side' | 'top';
}> = ({ mood = 'happy', children, className, mascotClassName, layout = 'side' }) => (
  <div className={cn(layout === 'side' ? 'flex items-end gap-2' : 'flex flex-col items-center gap-1', className)}>
    {layout === 'top' && <Bubble pointer="bottom">{children}</Bubble>}
    <Mascot mood={mood} className={cn('shrink-0', mascotClassName ?? 'w-20 h-20')} />
    {layout === 'side' && <Bubble pointer="left">{children}</Bubble>}
  </div>
);

const Bubble: React.FC<{ pointer: 'left' | 'bottom'; children: React.ReactNode }> = ({ pointer, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'relative bg-white border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 font-bold text-[15px] leading-snug shadow-sm',
      pointer === 'left' ? 'mb-6 min-w-0' : 'max-w-xs text-center'
    )}
  >
    {children}
    <span
      aria-hidden
      className={cn(
        'absolute w-3.5 h-3.5 bg-white border-slate-200 rotate-45',
        pointer === 'left' ? '-left-[9px] bottom-4 border-l-2 border-b-2' : 'left-1/2 -bottom-[9px] -ml-[7px] border-r-2 border-b-2'
      )}
    />
  </motion.div>
);
