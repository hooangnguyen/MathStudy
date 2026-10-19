import React from 'react';

/**
 * Nhân vật đại diện người chơi trong phòng: con vật × màu × phụ kiện.
 * Lưu gọn dạng chuỗi "loài.màu.phụ-kiện" (vd. "cat.orange.crown") trong phòng (playerAvatars.{uid}).
 * Vẽ bằng SVG nên sắc nét ở mọi kích thước và không phụ thuộc font emoji của máy.
 */

export const SPECIES = [
  { id: 'cat', name: 'Mèo' },
  { id: 'bear', name: 'Gấu' },
  { id: 'bunny', name: 'Thỏ' },
  { id: 'frog', name: 'Ếch' },
  { id: 'panda', name: 'Gấu trúc' },
  { id: 'chick', name: 'Gà con' },
  { id: 'robot', name: 'Rô-bốt' },
  { id: 'monster', name: 'Quái vật' },
] as const;

export const COLORS = [
  { id: 'orange', name: 'Cam', fill: '#fb923c', shade: '#ea580c' },
  { id: 'pink', name: 'Hồng', fill: '#f9a8d4', shade: '#ec4899' },
  { id: 'purple', name: 'Tím', fill: '#c4b5fd', shade: '#8b5cf6' },
  { id: 'blue', name: 'Xanh dương', fill: '#93c5fd', shade: '#3b82f6' },
  { id: 'teal', name: 'Xanh ngọc', fill: '#5eead4', shade: '#0d9488' },
  { id: 'green', name: 'Xanh lá', fill: '#86efac', shade: '#16a34a' },
  { id: 'yellow', name: 'Vàng', fill: '#fde047', shade: '#ca8a04' },
  { id: 'red', name: 'Đỏ', fill: '#fca5a5', shade: '#dc2626' },
] as const;

export const ACCESSORIES = [
  { id: 'none', name: 'Không' },
  { id: 'crown', name: 'Vương miện' },
  { id: 'party', name: 'Mũ tiệc' },
  { id: 'glasses', name: 'Kính' },
  { id: 'bow', name: 'Nơ' },
  { id: 'headphones', name: 'Tai nghe' },
  { id: 'flower', name: 'Hoa' },
] as const;

export type SpeciesId = typeof SPECIES[number]['id'];
export type ColorId = typeof COLORS[number]['id'];
export type AccessoryId = typeof ACCESSORIES[number]['id'];
export interface CharacterSpec { species: SpeciesId; color: ColorId; accessory: AccessoryId }

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Nhân vật mặc định cố định theo uid (cho người chưa chọn). */
export const defaultCharacterFor = (uid: string): CharacterSpec => {
  const h = hash(uid);
  return { species: SPECIES[h % SPECIES.length].id, color: COLORS[(h >>> 4) % COLORS.length].id, accessory: 'none' };
};

export const randomCharacter = (): CharacterSpec => ({
  species: SPECIES[Math.floor(Math.random() * SPECIES.length)].id,
  color: COLORS[Math.floor(Math.random() * COLORS.length)].id,
  accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id,
});

export const encodeCharacter = (c: CharacterSpec) => `${c.species}.${c.color}.${c.accessory}`;

/** Đọc chuỗi nhân vật; chuỗi hỏng/thiếu → nhân vật mặc định theo uid. */
export const parseCharacter = (value: string | undefined | null, uid = ''): CharacterSpec => {
  const [species, color, accessory] = (value || '').split('.');
  const fallback = defaultCharacterFor(uid);
  return {
    species: SPECIES.some((s) => s.id === species) ? (species as SpeciesId) : fallback.species,
    color: COLORS.some((c) => c.id === color) ? (color as ColorId) : fallback.color,
    accessory: ACCESSORIES.some((a) => a.id === accessory) ? (accessory as AccessoryId) : 'none',
  };
};

export const describeCharacter = (c: CharacterSpec) =>
  `${SPECIES.find((s) => s.id === c.species)?.name} màu ${COLORS.find((x) => x.id === c.color)?.name?.toLowerCase()}`;

const STORAGE_KEY = 'ms_character';
/** Nhân vật đã chọn lần trước trên máy này (dùng lại cho phòng sau). */
export const loadSavedCharacter = (): CharacterSpec | null => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? parseCharacter(v) : null;
  } catch {
    return null;
  }
};
export const saveCharacter = (c: CharacterSpec) => {
  try {
    localStorage.setItem(STORAGE_KEY, encodeCharacter(c));
  } catch {
    /* bỏ qua */
  }
};

// ---------- Vẽ ----------

const INK = '#1e1b4b';

const Eyes: React.FC<{ y: number; gap?: number; r?: number }> = ({ y, gap = 12, r = 5 }) => (
  <g>
    <circle cx={50 - gap} cy={y} r={r} fill={INK} />
    <circle cx={50 + gap} cy={y} r={r} fill={INK} />
    <circle cx={50 - gap + 1.6} cy={y - 1.8} r={r * 0.36} fill="#fff" />
    <circle cx={50 + gap + 1.6} cy={y - 1.8} r={r * 0.36} fill="#fff" />
  </g>
);
const Cheeks: React.FC<{ y: number; gap?: number }> = ({ y, gap = 21 }) => (
  <g fill="#fb7185" opacity={0.45}>
    <ellipse cx={50 - gap} cy={y} rx={5} ry={3.2} />
    <ellipse cx={50 + gap} cy={y} rx={5} ry={3.2} />
  </g>
);
const Smile: React.FC<{ y: number; w?: number }> = ({ y, w = 7 }) => (
  <path d={`M${50 - w} ${y} Q50 ${y + w * 0.9} ${50 + w} ${y}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
);

/** Mắt ở độ cao bao nhiêu (để đeo kính đúng chỗ) */
const EYE_Y: Record<SpeciesId, number> = {
  cat: 56, bear: 56, bunny: 58, frog: 30, panda: 56, chick: 54, robot: 54, monster: 52,
};

const Body: React.FC<{ s: SpeciesId; fill: string; shade: string }> = ({ s, fill, shade }) => {
  switch (s) {
    case 'cat':
      return (
        <g>
          <path d="M20 44 L24 12 L46 30 Z" fill={fill} stroke={shade} strokeWidth={2} strokeLinejoin="round" />
          <path d="M80 44 L76 12 L54 30 Z" fill={fill} stroke={shade} strokeWidth={2} strokeLinejoin="round" />
          <path d="M26 36 L28 20 L39 30 Z" fill="#fda4af" />
          <path d="M74 36 L72 20 L61 30 Z" fill="#fda4af" />
          <circle cx={50} cy={60} r={34} fill={fill} stroke={shade} strokeWidth={2} />
          <Eyes y={56} /> <Cheeks y={67} />
          <path d="M46 63 L54 63 L50 67 Z" fill="#f472b6" />
          <path d="M50 67 Q46 72 42 70 M50 67 Q54 72 58 70" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M14 62 L28 64 M14 70 L28 68 M86 62 L72 64 M86 70 L72 68" stroke={shade} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      );
    case 'bear':
      return (
        <g>
          <circle cx={24} cy={32} r={13} fill={fill} stroke={shade} strokeWidth={2} />
          <circle cx={76} cy={32} r={13} fill={fill} stroke={shade} strokeWidth={2} />
          <circle cx={24} cy={32} r={6} fill={shade} opacity={0.5} />
          <circle cx={76} cy={32} r={6} fill={shade} opacity={0.5} />
          <circle cx={50} cy={60} r={34} fill={fill} stroke={shade} strokeWidth={2} />
          <ellipse cx={50} cy={70} rx={14} ry={10} fill="#fff7ed" />
          <Eyes y={56} /> <Cheeks y={66} gap={23} />
          <ellipse cx={50} cy={66} rx={4.5} ry={3.2} fill={INK} />
          <Smile y={71} w={5} />
        </g>
      );
    case 'bunny':
      return (
        <g>
          <ellipse cx={36} cy={22} rx={9} ry={22} fill={fill} stroke={shade} strokeWidth={2} />
          <ellipse cx={64} cy={22} rx={9} ry={22} fill={fill} stroke={shade} strokeWidth={2} />
          <ellipse cx={36} cy={24} rx={4} ry={15} fill="#fda4af" />
          <ellipse cx={64} cy={24} rx={4} ry={15} fill="#fda4af" />
          <circle cx={50} cy={62} r={32} fill={fill} stroke={shade} strokeWidth={2} />
          <Eyes y={58} /> <Cheeks y={68} />
          <ellipse cx={50} cy={66} rx={3.5} ry={2.6} fill="#f472b6" />
          <path d="M50 68 L50 72 M50 72 Q46 76 43 73 M50 72 Q54 76 57 73" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <rect x={46.5} y={73} width={7} height={6} rx={1.5} fill="#fff" stroke={INK} strokeWidth={1.2} />
        </g>
      );
    case 'frog':
      return (
        <g>
          <ellipse cx={50} cy={62} rx={38} ry={30} fill={fill} stroke={shade} strokeWidth={2} />
          <circle cx={32} cy={32} r={14} fill={fill} stroke={shade} strokeWidth={2} />
          <circle cx={68} cy={32} r={14} fill={fill} stroke={shade} strokeWidth={2} />
          <circle cx={32} cy={31} r={9} fill="#fff" />
          <circle cx={68} cy={31} r={9} fill="#fff" />
          <Eyes y={31} gap={18} r={5} />
          <Cheeks y={62} gap={26} />
          <path d="M28 64 Q50 84 72 64" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
          <circle cx={44} cy={54} r={1.6} fill={shade} /> <circle cx={56} cy={54} r={1.6} fill={shade} />
        </g>
      );
    case 'panda':
      return (
        <g>
          <circle cx={24} cy={32} r={13} fill={shade} />
          <circle cx={76} cy={32} r={13} fill={shade} />
          <circle cx={50} cy={60} r={34} fill="#ffffff" stroke="#cbd5e1" strokeWidth={2} />
          <ellipse cx={37} cy={57} rx={9} ry={11} fill={shade} transform="rotate(-25 37 57)" />
          <ellipse cx={63} cy={57} rx={9} ry={11} fill={shade} transform="rotate(25 63 57)" />
          <circle cx={38} cy={56} r={4} fill="#fff" /> <circle cx={62} cy={56} r={4} fill="#fff" />
          <circle cx={38.5} cy={56.5} r={2.4} fill={INK} /> <circle cx={62.5} cy={56.5} r={2.4} fill={INK} />
          <Cheeks y={70} gap={24} />
          <ellipse cx={50} cy={68} rx={4.5} ry={3} fill={INK} />
          <Smile y={73} w={5} />
        </g>
      );
    case 'chick':
      return (
        <g>
          <path d="M44 24 Q46 12 50 22 Q52 10 56 24" fill={fill} stroke={shade} strokeWidth={2} strokeLinejoin="round" />
          <circle cx={50} cy={60} r={34} fill={fill} stroke={shade} strokeWidth={2} />
          <path d="M18 66 Q10 58 16 50 Q22 58 22 64 Z M82 66 Q90 58 84 50 Q78 58 78 64 Z" fill={shade} opacity={0.7} />
          <Eyes y={54} /> <Cheeks y={66} />
          <path d="M42 62 L58 62 L50 72 Z" fill="#f97316" stroke="#c2410c" strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M42 62 L58 62" stroke="#c2410c" strokeWidth={1.5} />
        </g>
      );
    case 'robot':
      return (
        <g>
          <line x1={50} y1={24} x2={50} y2={10} stroke={INK} strokeWidth={3} />
          <circle cx={50} cy={9} r={5} fill="#facc15" stroke="#ca8a04" strokeWidth={1.5} />
          <rect x={10} y={46} width={8} height={18} rx={3} fill={shade} />
          <rect x={82} y={46} width={8} height={18} rx={3} fill={shade} />
          <rect x={17} y={24} width={66} height={64} rx={16} fill={fill} stroke={shade} strokeWidth={2} />
          <rect x={25} y={40} width={50} height={26} rx={10} fill={INK} />
          <rect x={33} y={47} width={10} height={12} rx={3} fill="#67e8f9" />
          <rect x={57} y={47} width={10} height={12} rx={3} fill="#67e8f9" />
          <rect x={36} y={73} width={28} height={7} rx={3.5} fill="#fff" stroke={INK} strokeWidth={1.5} />
          <path d="M43 73 V80 M50 73 V80 M57 73 V80" stroke={INK} strokeWidth={1.3} />
        </g>
      );
    case 'monster':
      return (
        <g>
          <path d="M28 34 Q22 16 32 12 Q32 24 38 30 Z" fill="#fef3c7" stroke="#d97706" strokeWidth={1.5} />
          <path d="M72 34 Q78 16 68 12 Q68 24 62 30 Z" fill="#fef3c7" stroke="#d97706" strokeWidth={1.5} />
          <path d="M16 62 Q16 26 50 26 Q84 26 84 62 Q84 92 66 92 L62 86 L56 92 L50 86 L44 92 L38 86 L34 92 Q16 92 16 62 Z" fill={fill} stroke={shade} strokeWidth={2} strokeLinejoin="round" />
          <circle cx={50} cy={52} r={13} fill="#fff" stroke={shade} strokeWidth={1.5} />
          <circle cx={52} cy={53} r={7} fill={INK} />
          <circle cx={54.5} cy={50.5} r={2.4} fill="#fff" />
          <path d="M36 72 Q50 82 64 72" fill="#fff" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M44 74 L46 78 L48 75 M52 75 L54 78 L56 74" fill="none" stroke={INK} strokeWidth={1.2} />
          <circle cx={28} cy={66} r={3} fill={shade} opacity={0.6} /> <circle cx={73} cy={42} r={2.5} fill={shade} opacity={0.6} />
        </g>
      );
  }
};

const Accessory: React.FC<{ a: AccessoryId; s: SpeciesId }> = ({ a, s }) => {
  const top = s === 'robot' ? 24 : s === 'frog' ? 20 : 27;
  switch (a) {
    case 'crown':
      return (
        <g transform={`translate(0 ${top - 27})`}>
          <path d="M33 26 L35 8 L43 18 L50 4 L57 18 L65 8 L67 26 Z" fill="#facc15" stroke="#ca8a04" strokeWidth={2} strokeLinejoin="round" />
          <circle cx={50} cy={18} r={2.8} fill="#ef4444" /> <circle cx={39} cy={21} r={2} fill="#3b82f6" /> <circle cx={61} cy={21} r={2} fill="#22c55e" />
        </g>
      );
    case 'party':
      return (
        <g transform={`translate(0 ${top - 27}) rotate(12 58 18)`}>
          <path d="M58 -2 L46 30 L72 30 Z" fill="#a78bfa" stroke="#7c3aed" strokeWidth={2} strokeLinejoin="round" />
          <path d="M53 12 L64 14 M50 21 L68 23" stroke="#fde047" strokeWidth={3} strokeLinecap="round" />
          <circle cx={58} cy={-3} r={4.5} fill="#f472b6" />
        </g>
      );
    case 'glasses': {
      const y = EYE_Y[s];
      const gap = s === 'frog' ? 18 : 12;
      return (
        <g fill="rgba(255,255,255,0.25)" stroke={INK} strokeWidth={2.6}>
          <circle cx={50 - gap} cy={y} r={9} /> <circle cx={50 + gap} cy={y} r={9} />
          <path d={`M${50 - gap + 9} ${y} Q50 ${y - 4} ${50 + gap - 9} ${y}`} fill="none" />
        </g>
      );
    }
    case 'bow':
      return (
        <g transform={`translate(${s === 'bunny' ? 2 : 0} ${top - 27})`}>
          <path d="M70 26 L58 18 L58 34 Z M70 26 L82 18 L82 34 Z" fill="#f472b6" stroke="#db2777" strokeWidth={2} strokeLinejoin="round" />
          <circle cx={70} cy={26} r={4} fill="#db2777" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d={`M14 ${top + 34} Q14 ${top - 10} 50 ${top - 10} Q86 ${top - 10} 86 ${top + 34}`} fill="none" stroke="#334155" strokeWidth={5} strokeLinecap="round" />
          <rect x={6} y={top + 26} width={14} height={22} rx={6} fill="#ef4444" stroke="#991b1b" strokeWidth={1.5} />
          <rect x={80} y={top + 26} width={14} height={22} rx={6} fill="#ef4444" stroke="#991b1b" strokeWidth={1.5} />
        </g>
      );
    case 'flower':
      return (
        <g transform={`translate(26 ${top + 1})`}>
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx={0} cy={-6} rx={4.5} ry={6.5} fill="#fda4af" stroke="#e11d48" strokeWidth={1} transform={`rotate(${r})`} />
          ))}
          <circle cx={0} cy={0} r={3.6} fill="#facc15" />
        </g>
      );
    default:
      return null;
  }
};

interface CharacterProps {
  /** Chuỗi nhân vật "loài.màu.phụ-kiện" hoặc đối tượng đã đọc */
  value?: string | CharacterSpec | null;
  /** uid để chọn nhân vật mặc định khi chưa có */
  uid?: string;
  className?: string;
  title?: string;
}

export const Character: React.FC<CharacterProps> = ({ value, uid = '', className, title }) => {
  const spec = typeof value === 'object' && value ? value : parseCharacter(value as string | undefined, uid);
  const color = COLORS.find((c) => c.id === spec.color) ?? COLORS[0];
  return (
    <svg viewBox="-4 -8 108 104" className={className} role="img" aria-label={title ?? describeCharacter(spec)}>
      <ellipse cx={50} cy={94} rx={26} ry={4} fill="#0f172a" opacity={0.08} />
      <Body s={spec.species} fill={color.fill} shade={color.shade} />
      <Accessory a={spec.accessory} s={spec.species} />
    </svg>
  );
};
