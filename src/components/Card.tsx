import { SUIT_ICONS } from '@/data/constants';

type CardProps = {
  suit: string;
  value: string;
  className?: string;
};

export const Card = ({ suit, value, className = '' }: CardProps) => {
  const isRed = suit === 'heart' || suit === 'diamond';
  const colorClass = isRed ? 'text-red-500' : 'text-slate-800';

  return (
    <div
      className={`bg-white rounded-lg border border-slate-300 card-shadow flex flex-col items-center justify-center relative select-none overflow-hidden ${className}`}
    >
      <div className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${colorClass}`}>
        <span className="text-sm font-bold tracking-tighter">{value}</span>
        <span className="text-[10px]">{SUIT_ICONS[suit]}</span>
      </div>
      <div className={`w-full h-full flex flex-col items-center justify-center ${colorClass}`}>
        <div className="text-4xl sm:text-6xl mb-1">{SUIT_ICONS[suit]}</div>
        <div className="text-4xl sm:text-6xl font-black">{value}</div>
      </div>
      <div className={`absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 ${colorClass}`}>
        <span className="text-sm font-bold tracking-tighter">{value}</span>
        <span className="text-[10px]">{SUIT_ICONS[suit]}</span>
      </div>
    </div>
  );
};
