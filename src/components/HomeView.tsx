import type { Translations } from '@/types';

type HomeViewProps = {
  onSelectMode: (mode: string) => void;
  onOpenSettings: () => void;
  t: Translations;
};

export const HomeView = ({ onSelectMode, onOpenSettings, t }: HomeViewProps) => {
  const modes = [
    { id: 'calendar', label: t.calendar, icon: 'fa-calendar-days', color: 'bg-indigo-500', desc: t.descCal },
    { id: 'number', label: t.number, icon: 'fa-hashtag', color: 'bg-emerald-500', desc: t.descNum },
    { id: 'card', label: t.card, icon: 'fa-diamond', color: 'bg-rose-500', desc: t.descCard },
    { id: 'letterpair', label: t.letterPair, icon: 'fa-font', color: 'bg-amber-500', desc: t.descLP },
  ];

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-12 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-brain text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">{t.appTitle}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
              {t.trainingType}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 transition-all"
        >
          <i className="fa-solid fa-gear"></i>
        </button>
      </div>
      <div className="space-y-5">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectMode(m.id)}
            className="w-full bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active:scale-95 transition-all flex items-center text-left hover:shadow-md"
          >
            <div
              className={`w-14 h-14 ${m.color} rounded-2xl flex items-center justify-center text-white shadow-md mr-5`}
            >
              <i className={`fa-solid ${m.icon} text-xl`}></i>
            </div>
            <div className="flex-grow">
              <div className="font-black text-lg mb-0.5 text-slate-800">{m.label}</div>
              <div className="text-xs text-slate-400 font-bold tracking-tight">{m.desc}</div>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300 ml-2"></i>
          </button>
        ))}
      </div>
    </div>
  );
};
