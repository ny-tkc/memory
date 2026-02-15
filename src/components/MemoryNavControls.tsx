import type { Translations } from '@/types';

type MemoryNavControlsProps = {
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  current: number;
  total: number;
  t: Translations;
};

export const MemoryNavControls = ({
  onFirst,
  onPrev,
  onNext,
  onFinish,
  current,
  total,
  t,
}: MemoryNavControlsProps) => {
  return (
    <div className="w-full max-w-sm grid grid-cols-4 gap-2 mt-auto pt-4">
      <button
        onClick={onFirst}
        className="bg-slate-100 text-slate-500 rounded-xl h-14 flex items-center justify-center text-lg hover:bg-slate-200 active:scale-95 transition-all"
      >
        <i className="fa-solid fa-backward-step"></i>
      </button>
      <button
        onClick={onPrev}
        className="bg-slate-100 text-slate-500 rounded-xl h-14 flex items-center justify-center text-lg hover:bg-slate-200 active:scale-95 transition-all"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button
        onClick={onNext}
        className="bg-slate-800 text-white rounded-xl h-14 flex items-center justify-center text-lg hover:bg-slate-700 active:scale-95 transition-all"
      >
        {current + 1 >= total ? t.recall : <i className="fa-solid fa-chevron-right"></i>}
      </button>
      <button
        onClick={onFinish}
        className="bg-green-100 text-green-600 rounded-xl h-14 flex items-center justify-center text-xl hover:bg-green-200 active:scale-95 transition-all"
      >
        <i className="fa-solid fa-check"></i>
      </button>
    </div>
  );
};
