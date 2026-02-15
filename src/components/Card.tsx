import { SUIT_ICONS } from '@/data/constants';

type CardProps = {
  suit: string;
  value: string;
  className?: string;
};

const PIP_LAYOUTS: Record<string, { row: number; col: number; flip?: boolean }[]> = {
  A: [{ row: 2, col: 1 }],
  '2': [{ row: 0, col: 1 }, { row: 4, col: 1, flip: true }],
  '3': [{ row: 0, col: 1 }, { row: 2, col: 1 }, { row: 4, col: 1, flip: true }],
  '4': [
    { row: 0, col: 0 }, { row: 0, col: 2 },
    { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true },
  ],
  '5': [
    { row: 0, col: 0 }, { row: 0, col: 2 },
    { row: 2, col: 1 },
    { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true },
  ],
  '6': [
    { row: 0, col: 0 }, { row: 0, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 2 },
    { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true },
  ],
  '7': [
    { row: 0, col: 0 }, { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 2, col: 0 }, { row: 2, col: 2 },
    { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true },
  ],
  '8': [
    { row: 0, col: 0 }, { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 2, col: 0 }, { row: 2, col: 2 },
    { row: 3, col: 1, flip: true },
    { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true },
  ],
  '9': [
    { row: 0, col: 0 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 2 },
    { row: 2, col: 1 },
    { row: 3, col: 0, flip: true }, { row: 3, col: 2, flip: true },
    { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true },
  ],
  '10': [
    { row: 0, col: 0 }, { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 2 },
    { row: 3, col: 0, flip: true }, { row: 3, col: 2, flip: true },
    { row: 3, col: 1, flip: true },
    { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true },
  ],
};

const FaceCardFigure = ({ suit, value }: { suit: string; value: string }) => {
  const isRed = suit === 'heart' || suit === 'diamond';
  const primary = isRed ? '#dc2626' : '#1e293b';
  const accent = isRed ? '#fecaca' : '#cbd5e1';
  const bg = isRed ? '#fef2f2' : '#f1f5f9';
  const icon = SUIT_ICONS[suit];

  const crown = value === 'K';
  const tiara = value === 'Q';

  return (
    <svg viewBox="0 0 60 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="56" height="76" rx="4" fill={bg} stroke={accent} strokeWidth="1.5" />
      <rect x="6" y="6" width="48" height="68" rx="2" fill="none" stroke={primary} strokeWidth="0.5" opacity="0.3" />

      {crown && (
        <g>
          <polygon points="18,26 22,18 26,24 30,16 34,24 38,18 42,26" fill={primary} opacity="0.8" />
          <rect x="18" y="25" width="24" height="3" rx="0.5" fill={primary} opacity="0.6" />
        </g>
      )}
      {tiara && (
        <g>
          <ellipse cx="30" cy="22" rx="10" ry="5" fill="none" stroke={primary} strokeWidth="1" opacity="0.6" />
          <circle cx="30" cy="17" r="1.5" fill={primary} opacity="0.7" />
          <circle cx="24" cy="19" r="1" fill={primary} opacity="0.5" />
          <circle cx="36" cy="19" r="1" fill={primary} opacity="0.5" />
        </g>
      )}
      {value === 'J' && (
        <g>
          <rect x="24" y="18" width="12" height="4" rx="2" fill={primary} opacity="0.5" />
          <polygon points="27,18 30,14 33,18" fill={primary} opacity="0.4" />
        </g>
      )}

      {/* Head */}
      <circle cx="30" cy={crown || tiara ? '33' : '31'} r="6" fill={accent} stroke={primary} strokeWidth="1" />
      {/* Eyes */}
      <circle cx="28" cy={crown || tiara ? '32' : '30'} r="0.8" fill={primary} />
      <circle cx="32" cy={crown || tiara ? '32' : '30'} r="0.8" fill={primary} />

      {/* Body - robe/tunic */}
      <path
        d={crown || tiara
          ? 'M22,40 Q22,38 24,37 Q27,36 30,39 Q33,36 36,37 Q38,38 38,40 L40,58 Q40,62 36,62 L24,62 Q20,62 20,58 Z'
          : 'M22,38 Q22,36 24,35 Q27,34 30,37 Q33,34 36,35 Q38,36 38,38 L40,58 Q40,62 36,62 L24,62 Q20,62 20,58 Z'
        }
        fill={primary}
        opacity="0.75"
      />

      {/* Suit symbol on chest */}
      <text
        x="30"
        y={crown || tiara ? '52' : '50'}
        textAnchor="middle"
        fontSize="10"
        fill="white"
        fontFamily="serif"
      >
        {icon}
      </text>

      {/* Decorative lines */}
      <line x1="22" y1="65" x2="38" y2="65" stroke={primary} strokeWidth="0.5" opacity="0.3" />
      <line x1="20" y1="67" x2="40" y2="67" stroke={primary} strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
};

const PipGrid = ({ suit, value }: { suit: string; value: string }) => {
  const icon = SUIT_ICONS[suit];
  const pips = PIP_LAYOUTS[value];
  if (!pips) return null;

  const isAce = value === 'A';

  // 5 rows x 3 cols grid
  const rowPositions = ['6%', '25%', '44%', '63%', '82%'];
  const colPositions = ['22%', '50%', '78%'];

  return (
    <div className="absolute inset-0" style={{ top: '16%', bottom: '16%', left: '8%', right: '8%' }}>
      {pips.map((pip, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center"
          style={{
            top: rowPositions[pip.row],
            left: colPositions[pip.col],
            transform: `translate(-50%, -50%) ${pip.flip ? 'rotate(180deg)' : ''}`,
            fontSize: isAce ? '2.2em' : '0.85em',
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
};

export const Card = ({ suit, value, className = '' }: CardProps) => {
  const isRed = suit === 'heart' || suit === 'diamond';
  const color = isRed ? '#dc2626' : '#1e293b';
  const isFace = value === 'J' || value === 'Q' || value === 'K';
  const icon = SUIT_ICONS[suit];

  return (
    <div
      className={`bg-white rounded-lg border border-slate-300 card-shadow relative select-none overflow-hidden ${className}`}
      style={{ fontFamily: "'Inter', 'Noto Sans JP', sans-serif" }}
    >
      {/* Top-left corner */}
      <div
        className="absolute flex flex-col items-center leading-none z-10"
        style={{ top: '3%', left: '6%', color }}
      >
        <span style={{ fontSize: '0.7em', fontWeight: 800 }}>{value}</span>
        <span style={{ fontSize: '0.5em', lineHeight: 1 }}>{icon}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div
        className="absolute flex flex-col items-center leading-none z-10 rotate-180"
        style={{ bottom: '3%', right: '6%', color }}
      >
        <span style={{ fontSize: '0.7em', fontWeight: 800 }}>{value}</span>
        <span style={{ fontSize: '0.5em', lineHeight: 1 }}>{icon}</span>
      </div>

      {/* Card body */}
      {isFace ? (
        <div className="absolute inset-0" style={{ top: '10%', bottom: '10%', left: '15%', right: '15%' }}>
          <FaceCardFigure suit={suit} value={value} />
        </div>
      ) : (
        <PipGrid suit={suit} value={value} />
      )}
    </div>
  );
};
