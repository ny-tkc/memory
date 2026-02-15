import { useState, useEffect } from 'react';
import { translations } from '@/data/translations';
import { HomeView } from '@/components/HomeView';
import { GlobalSettingsModal } from '@/components/GlobalSettingsModal';
import { CalendarTrainer } from '@/features/calendar/CalendarTrainer';
import { NumberTrainer } from '@/features/number/NumberTrainer';
import { CardTrainer } from '@/features/card/CardTrainer';
import { LetterPairTrainer } from '@/features/letterpair/LetterPairTrainer';
import type { GlobalSettings } from '@/types';

export const App = () => {
  const [mode, setMode] = useState('home');
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem('global_settings');
      return saved
        ? JSON.parse(saved)
        : { lang: 'ja', theme: 'light', countdownSeconds: 3 };
    } catch {
      return { lang: 'ja', theme: 'light', countdownSeconds: 3 };
    }
  });

  useEffect(() => {
    localStorage.setItem('global_settings', JSON.stringify(globalSettings));
  }, [globalSettings]);

  const t = translations[globalSettings.lang] || translations.ja;

  return (
    <main className="w-full h-full flex flex-col relative overflow-hidden bg-slate-50">
      {mode === 'home' && (
        <HomeView
          t={t}
          onSelectMode={setMode}
          onOpenSettings={() => setIsGlobalSettingsOpen(true)}
        />
      )}
      {mode === 'calendar' && (
        <CalendarTrainer t={t} globalSettings={globalSettings} onBack={() => setMode('home')} />
      )}
      {mode === 'number' && (
        <NumberTrainer t={t} globalSettings={globalSettings} onBack={() => setMode('home')} />
      )}
      {mode === 'card' && (
        <CardTrainer t={t} globalSettings={globalSettings} onBack={() => setMode('home')} />
      )}
      {mode === 'letterpair' && (
        <LetterPairTrainer t={t} globalSettings={globalSettings} onBack={() => setMode('home')} />
      )}
      {isGlobalSettingsOpen && (
        <GlobalSettingsModal
          globalSettings={globalSettings}
          setGlobalSettings={setGlobalSettings}
          onClose={() => setIsGlobalSettingsOpen(false)}
          t={t}
        />
      )}
    </main>
  );
};
