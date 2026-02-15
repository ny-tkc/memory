import type { Translations, GlobalSettings } from '@/types';

type GlobalSettingsModalProps = {
  globalSettings: GlobalSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  onClose: () => void;
  t: Translations;
};

export const GlobalSettingsModal = ({
  globalSettings,
  setGlobalSettings,
  onClose,
  t,
}: GlobalSettingsModalProps) => {
  if (!t) return null;

  const handleReset = () => {
    if (window.confirm(t.resetConfirm)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = { ...localStorage };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memorypro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.keys(data).forEach((k) => localStorage.setItem(k, data[k]));
        if (data.global_settings) setGlobalSettings(JSON.parse(data.global_settings));
        alert('インポート完了。');
        window.location.reload();
      } catch {
        alert('不正なファイル形式です。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 overflow-y-auto max-h-[85vh] no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-sliders text-indigo-600"></i> {t.settings}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="space-y-6">
          <section>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">
              {t.countdown}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setGlobalSettings((prev) => ({ ...prev, countdownSeconds: s }))}
                  className={`py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${globalSettings.countdownSeconds === s ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  {s}
                  {t.sec}
                </button>
              ))}
            </div>
          </section>
          <section>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.lang}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['ja', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setGlobalSettings((s) => ({ ...s, lang: l }))}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${globalSettings.lang === l ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  {l === 'ja' ? '日本語' : 'English'}
                </button>
              ))}
            </div>
          </section>
          <section>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.backup}</label>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full py-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <i className="fa-solid fa-download"></i> {t.export}
              </button>
              <label className="w-full py-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <i className="fa-solid fa-upload"></i> {t.import}
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <button
                onClick={handleReset}
                className="w-full py-4 bg-red-50 text-red-500 rounded-xl font-bold text-sm border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                {t.reset}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
