import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

/** Tên linh vật: đổi ở đây là đổi khắp app. */
export const MASCOT_NAME = 'Dino';

/**
 * Biểu cảm của linh vật:
 * - happy: mặc định, ôm sách (đeo kính, ôm sách: chút "học thức")       - wave: vẫy tay chào
 * - cheer: khen khi làm đúng        - oops: động viên khi làm sai
 * - think: đang nghĩ / đang tải     - sleep: ngủ gật trên sách (trang trống)
 * - celebrate: ăn mừng (xong bài, giữ chuỗi ngày học, vinh danh)
 */
export type MascotMood = 'happy' | 'wave' | 'cheer' | 'oops' | 'think' | 'sleep' | 'celebrate';

const C = {
  body: '#6ee7b7',
  line: '#059669',
  belly: '#fef3c7',
  spike: '#fdba74',
  spikeLine: '#f97316',
  ink: '#1e1b4b',
  cheek: '#fb7185',
  frame: '#334155',
    gold: '#facc15',
  book: '#60a5fa',
  bookLine: '#2563eb',
};

// Mắt nằm gần nhau và thấp trên khuôn mặt, kiểu "chibi" cho dễ thương
const EYE_L = 78;
const EYE_R = 122;
const EYE_Y = 100;

const Eyes: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  if (mood === 'cheer' || mood === 'celebrate') {
    return (
      <g stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d={`M${EYE_L - 8} ${EYE_Y + 3} Q${EYE_L} ${EYE_Y - 8} ${EYE_L + 8} ${EYE_Y + 3}`} />
        <path d={`M${EYE_R - 8} ${EYE_Y + 3} Q${EYE_R} ${EYE_Y - 8} ${EYE_R + 8} ${EYE_Y + 3}`} />
      </g>
    );
  }
  if (mood === 'sleep') {
    return (
      <g stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none">
        <path d={`M${EYE_L - 8} ${EYE_Y} Q${EYE_L} ${EYE_Y + 6} ${EYE_L + 8} ${EYE_Y}`} />
        <path d={`M${EYE_R - 8} ${EYE_Y} Q${EYE_R} ${EYE_Y + 6} ${EYE_R + 8} ${EYE_Y}`} />
      </g>
    );
  }
  const look = mood === 'think' ? { x: 2, y: -3 } : mood === 'oops' ? { x: 0, y: 2 } : { x: 0, y: 0 };
  const eye = (cx: number) => (
    <g>
      <ellipse cx={cx + look.x} cy={EYE_Y + look.y} rx={8.5} ry={10.5} fill={C.ink} />
      <circle cx={cx + look.x + 3} cy={EYE_Y + look.y - 4} r={3.4} fill="#fff" />
      <circle cx={cx + look.x - 2.5} cy={EYE_Y + look.y + 4.5} r={1.6} fill="#fff" />
    </g>
  );
  return <g className="mascot-eyes">{eye(EYE_L)}{eye(EYE_R)}</g>;
};

/** Kính tròn: dấu hiệu "học thức" */
const Glasses: React.FC = () => (
  <g>
    <circle cx={EYE_L} cy={EYE_Y} r={17} fill="none" stroke={C.frame} strokeWidth={3.2} />
    <circle cx={EYE_R} cy={EYE_Y} r={17} fill="none" stroke={C.frame} strokeWidth={3.2} />
    <path d={`M${EYE_L + 17} ${EYE_Y - 2} Q100 ${EYE_Y - 7} ${EYE_R - 17} ${EYE_Y - 2}`} fill="none" stroke={C.frame} strokeWidth={3.2} strokeLinecap="round" />
    <path d={`M${EYE_L - 17} ${EYE_Y - 3} L42 ${EYE_Y - 8} M${EYE_R + 17} ${EYE_Y - 3} L158 ${EYE_Y - 8}`} stroke={C.frame} strokeWidth={3} strokeLinecap="round" />
    {/* ánh phản chiếu trên mắt kính */}
    <path d={`M${EYE_L - 10} ${EYE_Y - 8} Q${EYE_L - 6} ${EYE_Y - 13} ${EYE_L - 1} ${EYE_Y - 13}`} stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.8} />
    <path d={`M${EYE_R - 10} ${EYE_Y - 8} Q${EYE_R - 6} ${EYE_Y - 13} ${EYE_R - 1} ${EYE_Y - 13}`} stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.8} />
  </g>
);

const Brows: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  if (mood === 'oops') {
    return (
      <g stroke={C.line} strokeWidth={3.2} strokeLinecap="round">
        <path d="M66 77 L86 72" /> <path d="M134 77 L114 72" />
      </g>
    );
  }
  if (mood === 'think') {
    return <path d="M114 72 Q122 67 132 71" stroke={C.line} strokeWidth={3.2} strokeLinecap="round" fill="none" />;
  }
  return null;
};

const Mouth: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  switch (mood) {
    case 'cheer':
    case 'celebrate':
      return (
        <g>
          <path d="M89 121 Q100 137 111 121 Z" fill={C.ink} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M94 128 Q100 124 106 128 Q103 132 100 132 Q97 132 94 128 Z" fill={C.cheek} />
        </g>
      );
    case 'oops':
      return <path d="M92 127 Q96 123 100 126 Q104 129 108 125" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />;
    case 'think':
      return <circle cx={104} cy={126} r={3.5} fill={C.ink} />;
    case 'sleep':
      return <ellipse cx={100} cy={126} rx={3.5} ry={2.6} fill={C.ink} />;
    default:
      // miệng "ω" nhỏ xinh
      return <path d="M90 121 Q95 128 100 122 Q105 128 110 121" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />;
  }
};

/** Quyển sách mở ôm trước bụng */
const Book: React.FC<{ y?: number }> = ({ y = 0 }) => (
  <g transform={`translate(0 ${y})`}>
    <path d="M100 156 Q84 148 66 152 L66 178 Q84 174 100 180 Q116 174 134 178 L134 152 Q116 148 100 156 Z" fill={C.book} stroke={C.bookLine} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M100 154 Q86 147 71 150 L71 173 Q86 170 100 176 Z" fill="#fff" stroke="#cbd5e1" strokeWidth={1.2} />
    <path d="M100 154 Q114 147 129 150 L129 173 Q114 170 100 176 Z" fill="#fff" stroke="#cbd5e1" strokeWidth={1.2} />
    <g stroke="#94a3b8" strokeWidth={1.6} strokeLinecap="round">
      <path d="M77 157 L93 159 M77 163 L90 165" /> <path d="M107 159 L123 157 M110 165 L123 163" />
    </g>
    <text x={86} y={172} fontSize={8} fontWeight={900} fill={C.bookLine} textAnchor="middle">1+2</text>
    <text x={115} y={172} fontSize={9} fontWeight={900} fill="#f97316" textAnchor="middle">π</text>
  </g>
);

const Hand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <ellipse cx={x} cy={y} rx={8} ry={7} fill={C.body} stroke={C.line} strokeWidth={2.8} />
);

const arm = (d: string) => <path d={d} fill={C.body} stroke={C.line} strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" />;
const ARM_UP_L = 'M70 150 Q46 146 38 124 Q43 115 51 121 Q57 136 74 140';
const ARM_UP_R = 'M130 150 Q154 146 162 124 Q157 115 149 121 Q143 136 126 140';
const ARM_DOWN_L = 'M68 148 Q54 154 56 170 Q64 174 70 164';
const ARM_DOWN_R = 'M132 148 Q146 154 144 170 Q136 174 130 164';

const ArmsAndProps: React.FC<{ mood: MascotMood; animate: boolean }> = ({ mood, animate }) => {
  switch (mood) {
    case 'wave':
      return (
        <g>
          {arm(ARM_DOWN_L)}
          {animate ? (
            <motion.g style={{ originX: '128px', originY: '146px' }} animate={{ rotate: [0, 16, -6, 16, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}>
              {arm(ARM_UP_R)}
            </motion.g>
          ) : arm(ARM_UP_R)}
        </g>
      );
    case 'cheer':
    case 'celebrate':
      return <g>{arm(ARM_UP_L)}{arm(ARM_UP_R)}</g>;
    case 'think':
      return (
        <g>
          {/* bút chì */}
          <g transform="rotate(-35 50 150)">
            <rect x={44} y={128} width={9} height={34} rx={2} fill={C.gold} stroke="#ca8a04" strokeWidth={1.5} />
            <path d="M44 162 L53 162 L48.5 172 Z" fill="#fde68a" stroke="#ca8a04" strokeWidth={1.5} strokeLinejoin="round" />
            <path d="M47 168 L50 168 L48.5 172 Z" fill={C.ink} />
            <rect x={44} y={124} width={9} height={6} rx={2} fill="#f472b6" />
          </g>
          {arm(ARM_DOWN_L)}
          {/* tay chống cằm */}
          {arm('M132 150 Q140 142 132 134 Q126 130 120 136')}
          <Hand x={120} y={138} />
        </g>
      );
    case 'sleep':
      return <g><Book y={2} /><Hand x={68} y={168} /><Hand x={132} y={168} /></g>;
    default: // happy, oops: ôm sách
      return <g><Book /><Hand x={68} y={164} /><Hand x={132} y={164} /></g>;
  }
};

const Extras: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  switch (mood) {
    case 'cheer':
      return (
        <g fill={C.gold} stroke="#ca8a04" strokeWidth={1.5} strokeLinejoin="round">
          <path d="M24 70 L28 80 L38 82 L30 88 L32 98 L24 92 L16 98 L18 88 L10 82 L20 80 Z" />
          <path d="M178 66 L181 74 L189 75 L183 80 L185 88 L178 84 L171 88 L173 80 L167 75 L175 74 Z" />
        </g>
      );
    case 'celebrate':
      return (
        <g>
          <g fill="#f43f5e"><rect x={20} y={62} width={8} height={4} rx={1} transform="rotate(30 24 64)" /><rect x={168} y={128} width={8} height={4} rx={1} /></g>
          <g fill="#3b82f6"><rect x={174} y={74} width={8} height={4} rx={1} transform="rotate(-20 178 76)" /><rect x={26} y={132} width={7} height={4} rx={1} transform="rotate(60 29 134)" /></g>
          <g fill="#22c55e"><circle cx={30} cy={104} r={3} /><circle cx={176} cy={50} r={3} /></g>
          <g fill={C.gold}><path d="M164 100 L167 106 L173 107 L168 111 L170 117 L164 114 L158 117 L160 111 L155 107 L161 106 Z" /></g>
        </g>
      );
    case 'oops':
      return <path d="M158 76 Q164 86 158 92 Q152 86 158 76 Z" fill="#7dd3fc" stroke="#0284c7" strokeWidth={1.5} />;
    case 'think':
      return (
        <g fill="#fff" stroke="#94a3b8" strokeWidth={2}>
          <circle cx={156} cy={62} r={4} /> <circle cx={166} cy={48} r={6} />
          <ellipse cx={180} cy={28} rx={15} ry={12} />
          <text x={180} y={33} textAnchor="middle" fontSize={15} fontWeight={900} fill="#6366f1" stroke="none">?</text>
        </g>
      );
    case 'sleep':
      return (
        <g fill="#6366f1" fontWeight={900}>
          <text x={150} y={58} fontSize={16}>z</text>
          <text x={164} y={42} fontSize={22}>z</text>
          <text x={180} y={24} fontSize={28}>Z</text>
        </g>
      );
    default:
      return null;
  }
};

/** Khủng long con đeo kính, ôm sách: vẽ bằng SVG, có biểu cảm, nhún nhảy và chớp mắt. */
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
      viewBox="0 0 200 210"
      className={cn('overflow-visible', animate && 'mascot-blink', className)}
      role="img"
      aria-label={title ?? `${MASCOT_NAME}, khủng long con`}
      animate={animate ? (bounce ? { y: [0, -12, 0] } : mood === 'sleep' ? { scale: [1, 1.03, 1] } : { y: [0, -4, 0] }) : undefined}
      transition={{ duration: bounce ? 0.7 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx={100} cy={204} rx={46} ry={5} fill="#0f172a" opacity={0.08} />

      {/* đuôi nhỏ cong sau lưng */}
      <path d="M128 176 Q160 182 176 160 Q180 152 172 152 Q164 168 132 164 Z" fill={C.body} stroke={C.line} strokeWidth={2.8} strokeLinejoin="round" />
      <circle cx={170} cy={154} r={4.5} fill={C.spike} stroke={C.spikeLine} strokeWidth={1.8} />
      <circle cx={156} cy={164} r={4} fill={C.spike} stroke={C.spikeLine} strokeWidth={1.8} />

      {/* chân */}
      <ellipse cx={82} cy={198} rx={14} ry={8} fill={C.body} stroke={C.line} strokeWidth={2.8} />
      <ellipse cx={118} cy={198} rx={14} ry={8} fill={C.body} stroke={C.line} strokeWidth={2.8} />

      {/* thân + bụng */}
      <ellipse cx={100} cy={166} rx={38} ry={32} fill={C.body} stroke={C.line} strokeWidth={2.8} />
      <ellipse cx={100} cy={172} rx={24} ry={21} fill={C.belly} />

      {/* mào gai tròn trên đầu */}
      <g fill={C.spike} stroke={C.spikeLine} strokeWidth={2.4}>
        <circle cx={78} cy={50} r={11} /> <circle cx={100} cy={43} r={13} /> <circle cx={122} cy={50} r={11} />
      </g>

      {/* đầu to tròn */}
      <ellipse cx={100} cy={98} rx={62} ry={54} fill={C.body} stroke={C.line} strokeWidth={2.8} />
      <ellipse cx={74} cy={64} rx={14} ry={7} fill="#fff" opacity={0.35} transform="rotate(-20 74 64)" />

      <ellipse cx={58} cy={122} rx={9} ry={5.5} fill={C.cheek} opacity={0.5} />
      <ellipse cx={142} cy={122} rx={9} ry={5.5} fill={C.cheek} opacity={0.5} />

      <Eyes mood={mood} />
      <Glasses />
      <Brows mood={mood} />
      <Mouth mood={mood} />
      <ArmsAndProps mood={mood} animate={animate} />
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
