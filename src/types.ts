export type Translations = Record<string, string>;

export type GlobalSettings = {
  lang: 'ja' | 'en';
  theme: string;
  countdownSeconds: number;
};

export type TrainerProps = {
  onBack: () => void;
  globalSettings: GlobalSettings;
  t: Translations;
};

export type CardData = {
  suit: string;
  value: string;
  id: string;
};

export type LapRecord = {
  questionNumber: number;
  date: string;
  correct: boolean;
  duration: number;
  userAnswer: string;
  correctAnswer: string;
};

export type HistoryEntry = {
  id: string;
  timestamp: number;
  range: string;
  totalTime: number;
  penaltySeconds: number;
  finalScore: number;
  laps: LapRecord[];
  accuracy?: number;
  settings?: { timerFormat?: string };
};
