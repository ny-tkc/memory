import { useState } from 'react';
import { formatTime } from '@/utils/helpers';
import type { Translations, HistoryEntry } from '@/types';

type HistoryModalProps = {
  history: HistoryEntry[];
  range: string;
  onClose: () => void;
  t: Translations;
};

export const HistoryModal = ({ history, range, onClose, t }: HistoryModalProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const filtered = history.filter((h) => h.range === range);
  const top10 = filtered.slice(0, 10);
  const toggle = (id: number) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6 flex-none">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i> {t.historyMenu}
            <span className="text-[10px] bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 font-black uppercase tracking-widest ml-1">
              {(t as Record<string, string>)[range] || range}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="overflow-y-auto no-scrollbar space-y-3 flex-grow">
          {top10.length === 0 && (
            <div className="text-center text-slate-400 py-4 font-bold">{t.noData}</div>
          )}
          {top10.map((h, i) => {
            const correctCount = h.laps
              ? h.laps.filter((l) => l.correct).length
              : h.accuracy || 0;
            const isExpanded = expandedId === i;
            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                onClick={() => toggle(i)}
              >
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-500">
                    {new Date(h.timestamp).toLocaleString(undefined, {
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </div>
                  <div className="font-mono font-black text-slate-800 text-lg">
                    {formatTime(h.finalScore, h.settings?.timerFormat || 'mm:ss')}
                    <i
                      className={`fa-solid fa-chevron-down ml-3 text-xs text-slate-300 transition-transform ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}
                    ></i>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-indigo-100 space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400 uppercase">{t.accuracy}</span>
                      <span className="text-indigo-600">
                        {h.accuracy !== undefined ? h.accuracy : correctCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400 uppercase">{t.penalty}</span>
                      <span className={h.penaltySeconds > 0 ? 'text-red-500' : 'text-green-500'}>
                        +{h.penaltySeconds}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
