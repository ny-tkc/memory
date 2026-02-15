import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { DAYS_JP, DAYS_JP_LONG, DAYS_EN, DAYS_EN_LONG } from '@/data/constants';
import { generateId, formatTime, getJapaneseEra, handleHomeWithConfirm } from '@/utils/helpers';
import { HistoryModal } from '@/components/HistoryModal';
import type { TrainerProps } from '@/types';

export const CalendarTrainer = ({ onBack, globalSettings, t }: TrainerProps) => {
    const [gameState, setGameState] = useState('idle');
    const [isLocalSettingsOpen, setIsLocalSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState('birthday');
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [questions, setQuestions] = useState<Date[]>([]);
    const [laps, setLaps] = useState<any[]>([]);
    const [startTime, setStartTime] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [feedback, setFeedback] = useState<any>(null);
    const [countdownText, setCountdownText] = useState('');

    const [mathQuestion, setMathQuestion] = useState<any>(null);
    const [mathStats, setMathStats] = useState<any>({ count: 0, correct: 0 });
    const [mathFeedback, setMathFeedback] = useState<any>(null);
    const [mathStartTime, setMathStartTime] = useState(0);
    const [mathEndTime, setMathEndTime] = useState(0);
    const [mathRecords, setMathRecords] = useState<any[]>(() => JSON.parse(localStorage.getItem('calendar_math_records_v2') || '[]'));

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('calendar_settings');
        return saved ? JSON.parse(saved) : { yearMode: 'western', showNumbers: true, startDay: 0, timerFormat: 'mm:ss' };
    });
    const [currentSessionId, setCurrentSessionId] = useState<any>(null);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [currentResult, setCurrentResult] = useState<any>(null);

    const timerRef = useRef<any>(null);
    const updateTimer = useCallback(() => {
        if (gameState === 'playing' || gameState === 'playing_math') {
            setCurrentTime(performance.now());
            timerRef.current = requestAnimationFrame(updateTimer);
        }
    }, [gameState]);
    useEffect(() => {
        if (gameState === 'playing' || gameState === 'playing_math') timerRef.current = requestAnimationFrame(updateTimer);
        else if (timerRef.current) cancelAnimationFrame(timerRef.current);
        return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
    }, [gameState, updateTimer]);

    const generateRandomDate = (range: string) => {
        let startYear, endYear;
        const now = new Date();
        if (range === 'birthday') { startYear = now.getFullYear() - 80; endYear = now.getFullYear(); }
        else if (range === 'competition') { startYear = 1500; endYear = 2500; }
        else { startYear = now.getFullYear() - 1; endYear = now.getFullYear() + 1; }
        const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        return new Date(year, month, day);
    };

    const startCountdown = () => {
        setLaps([]); setFeedback(null); setGameState('countdown');
        setIsNewRecord(false); setCurrentResult(null); setCurrentSessionId(generateId());
        setQuestions(Array.from({ length: 5 }, () => generateRandomDate(selectedRange)));
        let count = globalSettings.countdownSeconds || 3;
        setCountdownText(count.toString());
        const interval = window.setInterval(() => {
            count -= 1;
            if (count === 0) setCountdownText('START!');
            else if (count < 0) { clearInterval(interval); startTraining(); }
            else setCountdownText(count.toString());
        }, 1000);
    };

    const startTraining = () => { setActiveQuestion(0); setGameState('playing'); const now = performance.now(); setStartTime(now); setCurrentTime(now); };
    const handleAnswer = (dayIndex: number) => {
        if (gameState !== 'playing' || feedback) return;
        const targetDate = questions[activeQuestion];
        const correctDayIndex = targetDate.getDay();
        const isCorrect = dayIndex === correctDayIndex;
        const now = performance.now();
        const prevTotalDuration = laps.reduce((acc: number, l: any) => acc + l.duration, 0);
        const questionDuration = (now - startTime) - prevTotalDuration;
        const record = { questionNumber: activeQuestion + 1, date: formatDate(targetDate), correct: isCorrect, duration: questionDuration, userAnswer: (globalSettings.lang === 'ja' ? DAYS_JP_LONG : DAYS_EN_LONG)[dayIndex], correctAnswer: (globalSettings.lang === 'ja' ? DAYS_JP_LONG : DAYS_EN_LONG)[correctDayIndex] };
        setFeedback({ index: activeQuestion, isCorrect });
        setLaps(prev => [...prev, record]);
        setTimeout(() => {
            setFeedback(null);
            if (activeQuestion < 4) setActiveQuestion(prev => prev + 1);
            else {
                const finalTime = now - startTime;
                const mistakes = [...laps, record].filter(l => !l.correct).length;
                const session = { id: currentSessionId, timestamp: Date.now(), range: selectedRange, totalTime: finalTime, penaltySeconds: mistakes * 30, finalScore: finalTime + (mistakes * 30000), laps: [...laps, record], settings };
                const history = JSON.parse(localStorage.getItem('calendar_history') || '[]');
                history.unshift(session);
                localStorage.setItem('calendar_history', JSON.stringify(history.slice(0, 100)));
                const records = JSON.parse(localStorage.getItem('calendar_records') || '[]');
                const existingIndex = records.findIndex((r: any) => r.range === selectedRange);
                let newBest = false;
                if (existingIndex >= 0) { if (session.finalScore < records[existingIndex].finalScore) { records[existingIndex] = session; newBest = true; } } else { records.push(session); newBest = true; }
                if (newBest) { localStorage.setItem('calendar_records', JSON.stringify(records)); setIsNewRecord(true); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }
                setCurrentResult(session); setGameState('finished');
            }
        }, 300);
    };

    const generateMathQuestion = () => {
        const n1 = Math.random() < 0.5 ? 0 : 1;
        const n2 = Math.floor(Math.random() * 7);
        const n3 = Math.floor(Math.random() * 7);
        const n4 = Math.floor(Math.random() * 31) + 1;
        return { n1, n2, n3, n4, answer: (n1 + n2 + n3 + n4) % 7 };
    };

    const startMathCountdown = () => {
        setGameState('math_countdown');
        let count = globalSettings.countdownSeconds || 3;
        setCountdownText(count.toString());
        const interval = setInterval(() => {
            count--;
            if (count === 0) setCountdownText('START!');
            else if (count < 0) { clearInterval(interval); startMathGame(); }
            else setCountdownText(count.toString());
        }, 1000);
    };

    const startMathGame = () => {
        setGameState('playing_math');
        setMathStats({ count: 1, correct: 0 });
        setMathFeedback(null);
        setMathQuestion(generateMathQuestion());
        const now = performance.now();
        setMathStartTime(now);
        setCurrentTime(now);
        setIsNewRecord(false);
    };

    const handleMathAnswer = (val: number) => {
        if(mathFeedback) return;
        const isCorrect = val === mathQuestion.answer;
        setMathFeedback(isCorrect ? 'correct' : 'wrong');
        const newCorrect = mathStats.correct + (isCorrect ? 1 : 0);
        setTimeout(() => {
            setMathFeedback(null);
            if(mathStats.count < 10) {
                setMathStats((prev: any) => ({ count: prev.count + 1, correct: newCorrect }));
                setMathQuestion(generateMathQuestion());
            } else {
                finishMathGame(newCorrect);
            }
        }, 300);
    };

    const finishMathGame = (finalCorrect: number) => {
        const endTime = performance.now();
        setMathEndTime(endTime);
        const rawTime = endTime - mathStartTime;
        const mistakes = 10 - finalCorrect;
        const penalty = mistakes * 5000;
        const totalScore = rawTime + penalty;
        const avgScore = totalScore / 10;
        const newRecord = { timestamp: Date.now(), rawTime, correct: finalCorrect, penalty, totalScore, avgScore };
        const currentRecords = [...mathRecords];
        const updatedRecords = [...currentRecords, newRecord].sort((a: any, b: any) => a.totalScore - b.totalScore).slice(0, 50);
        localStorage.setItem('calendar_math_records_v2', JSON.stringify(updatedRecords));
        setMathRecords(updatedRecords);
        if (updatedRecords.length > 0 && updatedRecords[0].timestamp === newRecord.timestamp) {
                setIsNewRecord(true); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } else { setIsNewRecord(false); }
        setMathStats((prev: any) => ({ ...prev, correct: finalCorrect, penalty, totalScore, avgScore, rawTime }));
        setGameState('math_result');
    };

    const getMathBestScore = () => { if(mathRecords.length === 0) return null; return mathRecords[0].avgScore; };
    const getBestScore = (range: string) => {
        const records = JSON.parse(localStorage.getItem('calendar_records') || '[]');
        const filtered = records.filter((r: any) => r.range === range);
        if (filtered.length === 0) return null;
        return Math.min(...filtered.map((r: any) => r.finalScore));
    };
    const handleHomeClick = () => handleHomeWithConfirm(gameState, onBack, t);
    const formatDate = (date: Date) => {
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate(), era = getJapaneseEra(date);
        if (settings.yearMode === 'japanese') return `${era} ${m}月${d}日`;
        if (settings.yearMode === 'both') return `${y}年 (${era}) ${m}月${d}日`;
        return `${y}年 ${m}月${d}日`;
    };
    const updateLocalSettings = (key: string, val: any) => { const ns = {...settings, [key]: val}; setSettings(ns); localStorage.setItem('calendar_settings', JSON.stringify(ns)); };
    const dayList = useMemo(() => {
        const list = (globalSettings.lang === 'ja' ? DAYS_JP : DAYS_EN).map((label, index) => ({ label, index }));
        if (settings.startDay === 1) { const mon = list.slice(1); mon.push(list[0]); return mon; }
        return list;
    }, [settings.startDay, globalSettings.lang]);

    if (gameState === 'idle') return (
        <div className="h-full flex flex-col p-4 overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <button onClick={handleHomeClick} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm hover:text-indigo-600 transition-colors z-50"><i className="fa-solid fa-house"></i></button>
                <h2 className="text-lg font-bold text-slate-800">{t.calendar}</h2>
                <button onClick={() => setIsLocalSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm hover:text-indigo-600 transition-colors"><i className="fa-solid fa-cog"></i></button>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 max-w-sm mx-auto w-full">
                <div className="w-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 text-left">{t.range}</label>
                    <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 bg-white shadow-sm outline-none focus:border-indigo-200">
                        {['birthday', 'recent', 'competition'].map(r => <option key={r} value={r}>{(t as any)[r] || r}</option>)}
                    </select>
                </div>
                <button onClick={startCountdown} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] shadow-lg active:scale-95 transition-all text-left px-8 relative overflow-hidden group">
                    <div className="relative z-10"><div className="text-2xl font-black mb-1">{t.calcStart}</div><div className="text-xs font-bold opacity-70">{t.descCal}</div></div>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-4xl opacity-20 group-hover:scale-110 transition-transform"><i className="fa-solid fa-play"></i></div>
                </button>
                <button onClick={startMathCountdown} className="w-full py-6 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[2rem] shadow-sm active:scale-95 transition-all text-left px-8 relative overflow-hidden group hover:border-indigo-200">
                    <div className="relative z-10"><div className="text-xl font-black mb-1">{t.mentalMath}</div><div className="text-xs font-bold text-slate-400">{t.mentalMathDesc}</div></div>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-10 group-hover:scale-110 transition-transform"><i className="fa-solid fa-calculator"></i></div>
                </button>
                <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors mt-4"><i className="fa-solid fa-clock-rotate-left"></i> {t.historyMenu}</button>
            </div>
            {isLocalSettingsOpen && (
                <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-y-auto max-h-[80vh] no-scrollbar">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800"><i className="fa-solid fa-cog text-indigo-500"></i> {t.gameSettings}</h3>
                        <div className="space-y-5">
                            <section>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.yearMode}</label>
                                <div className="grid grid-cols-3 gap-2">{['western', 'japanese', 'both'].map(m => <button key={m} onClick={() => updateLocalSettings('yearMode', m)} className={`py-2.5 rounded-xl border-2 font-bold text-xs transition-all ${settings.yearMode === m ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>{m === 'japanese' ? t.era : (t as any)[m] || m}</button>)}</div>
                            </section>
                            <section>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.timerFormat}</label>
                                <div className="grid grid-cols-2 gap-2">{['mm:ss', 'ss'].map(f => <button key={f} onClick={() => updateLocalSettings('timerFormat', f)} className={`py-2.5 rounded-xl border-2 font-bold text-xs transition-all ${settings.timerFormat === f ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>{f === 'mm:ss' ? t.minSec : t.onlySec}</button>)}</div>
                            </section>
                            <section>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.showNums}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => updateLocalSettings('showNumbers', true)} className={`py-2.5 rounded-xl border-2 font-bold text-xs transition-all ${settings.showNumbers ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>ON</button>
                                    <button onClick={() => updateLocalSettings('showNumbers', false)} className={`py-2.5 rounded-xl border-2 font-bold text-xs transition-all ${!settings.showNumbers ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>OFF</button>
                                </div>
                            </section>
                        </div>
                        <button onClick={() => setIsLocalSettingsOpen(false)} className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">{t.close}</button>
                    </div>
                </div>
            )}
            {isHistoryOpen && <HistoryModal history={JSON.parse(localStorage.getItem('calendar_history') || '[]')} range={selectedRange} onClose={() => setIsHistoryOpen(false)} t={t} />}
        </div>
    );

    if (gameState === 'countdown' || gameState === 'math_countdown') return <div className="h-full flex items-center justify-center bg-indigo-600 text-white"><div className="text-8xl font-black animate-countdown px-4 text-center">{countdownText}</div></div>;
    if (gameState === 'playing') return (
        <div className="h-full flex flex-col p-4 overflow-hidden">
            <div className="flex justify-between items-start mb-2 flex-none">
                <button onClick={handleHomeClick} className="text-slate-400 hover:text-slate-600 py-2 z-50"><i className="fa-solid fa-house"></i></button>
                <div className="flex flex-col items-center"><span className="text-5xl font-mono font-black text-slate-800 tracking-tighter">{formatTime(currentTime - startTime, settings.timerFormat)}</span></div>
                <button onClick={startCountdown} className="text-slate-400 hover:text-slate-600 py-2 text-sm font-bold flex flex-col items-center gap-1 transition-colors"><i className="fa-solid fa-rotate-right"></i> {t.restart}</button>
            </div>
            <div className="text-center mb-4 flex-none"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{activeQuestion + 1} / 5</span></div>
            <div className="space-y-2 overflow-y-auto no-scrollbar py-2 h-[45vh] flex-none">
                {questions.map((q, idx) => {
                    const isAnswered = idx < laps.length; const isActive = idx === activeQuestion; const lap = laps[idx];
                    return (<div key={idx} className={`p-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-indigo-50 scale-[1.02]' : isAnswered ? 'bg-slate-50 opacity-60' : 'opacity-20 blur-[1px]'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div><span className={`font-bold ${isActive ? 'text-lg' : 'text-sm'}`}>{isActive || isAnswered ? formatDate(q) : '????年??月??日'}</span></div>{isAnswered && (<div className="text-base font-bold text-slate-500 ml-auto">({lap.userAnswer})</div>)}</div></div>);
                })}
            </div>
            <div className="flex-grow flex items-start justify-center pt-4"><div className="grid grid-cols-7 gap-1 w-full max-w-sm">{dayList.map(({ label, index }) => (<button key={label} onClick={() => handleAnswer(index)} className={`aspect-[3/4] flex flex-col items-center justify-center gap-1 rounded-xl shadow-sm border active:scale-95 transition-transform ${index === 0 ? 'text-red-500 bg-red-50 border-red-100' : index === 6 ? 'text-blue-500 bg-blue-50 border-blue-100' : 'bg-white border-slate-200 text-slate-700'}`}><span className="font-bold text-lg sm:text-xl">{label}</span>{settings.showNumbers && <span className="text-[10px] font-black opacity-40">{index}</span>}</button>))}</div></div>
        </div>
    );
    if (gameState === 'playing_math') {
        return (
            <div className="h-full flex flex-col p-6 bg-indigo-50">
                <div className="flex justify-between items-start mb-6 flex-none">
                    <button onClick={handleHomeClick} className="text-indigo-300 hover:text-indigo-600 py-2 z-50"><i className="fa-solid fa-house"></i></button>
                    <div className="flex flex-col items-center"><span className="text-5xl font-mono font-black text-slate-800 tracking-tighter">{formatTime(currentTime - mathStartTime, settings.timerFormat)}</span></div>
                    <button onClick={startMathCountdown} className="text-indigo-300 hover:text-indigo-600 py-2 flex flex-col items-center gap-1 transition-colors"><i className="fa-solid fa-rotate-right"></i></button>
                </div>
                <div className="text-center mb-8 flex-none"><span className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full">{mathStats.count} / 10</span></div>
                <div className="flex-grow flex flex-col items-center justify-center relative">
                    {mathFeedback && (<div className="absolute inset-0 flex items-center justify-center z-10 animate-pop">{mathFeedback === 'correct' ? <i className="fa-regular fa-circle text-9xl text-green-500 opacity-80 drop-shadow-lg"></i> : <i className="fa-solid fa-xmark text-9xl text-red-500 opacity-80 drop-shadow-lg"></i>}</div>)}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm w-full max-w-sm border-2 border-indigo-100">
                        <div className="text-4xl sm:text-5xl font-black text-slate-700 text-center tracking-tight mb-4 flex justify-center gap-1 sm:gap-2"><span>{mathQuestion.n1}</span><span className="text-indigo-300">+</span><span>{mathQuestion.n2}</span><span className="text-indigo-300">+</span><span>{mathQuestion.n3}</span><span className="text-indigo-300">+</span><span>{mathQuestion.n4}</span></div>
                        <div className="flex justify-center"><div className="inline-block border-t-4 border-indigo-100 px-10 pt-2 text-2xl font-bold text-slate-400">÷ 7</div></div>
                    </div>
                </div>
                <div className="mt-auto pt-8 max-w-sm mx-auto w-full">
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map(n => (<button key={n} onClick={() => handleMathAnswer(n)} className="h-20 bg-white rounded-2xl shadow-sm border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 active:bg-slate-50 transition-all text-3xl font-black text-slate-700">{n}</button>))}
                        <div className="col-start-2"><button onClick={() => handleMathAnswer(0)} className="w-full h-20 bg-white rounded-2xl shadow-sm border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 active:bg-slate-50 transition-all text-3xl font-black text-slate-700">0</button></div>
                    </div>
                </div>
            </div>
        );
    }
    if (gameState === 'math_result') {
            const bestAvg = getMathBestScore();
            return (
            <div className="h-full flex flex-col p-4 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6 pt-2">
                    <div><h2 className="text-2xl font-black flex items-center gap-3 text-slate-800"><i className="fa-solid fa-calculator text-indigo-500"></i> {t.result}</h2></div>
                    <div className="flex gap-2"><button onClick={handleHomeClick} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm transition-all hover:text-indigo-600 z-50"><i className="fa-solid fa-house"></i></button></div>
                </div>
                <div className="w-full bg-indigo-600 text-white rounded-[2.5rem] p-8 sm:p-10 mb-8 shadow-2xl relative flex flex-col items-center text-center">
                    {isNewRecord && (<div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-md">{t.newRecord}</div>)}
                    <div className="text-[11px] font-black opacity-60 uppercase tracking-widest mb-1">{t.finalScore} <span className="text-[10px] opacity-80 normal-case">(Avg)</span></div>
                    <div className="text-6xl sm:text-7xl font-mono font-black mb-4 tracking-tighter drop-shadow-lg truncate w-full">{formatTime(mathStats.avgScore, 'ss')}</div>
                    <div className="flex items-center gap-2 mb-10 bg-black/10 px-5 py-2 rounded-full"><i className="fa-solid fa-crown text-yellow-400 text-xs"></i><span className="text-sm font-black tracking-widest uppercase">{t.bestScore}: {bestAvg ? formatTime(bestAvg, 'ss') : '-'}</span></div>
                    <div className="w-full pt-8 border-t border-white/20">
                        <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.rawTime}</div><div className="font-mono font-black text-xl tracking-tight">{formatTime(mathStats.rawTime, settings.timerFormat)}</div></div>
                                <div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.penalty}</div><div className="font-mono font-black text-xl tracking-tight text-red-300">+{mathStats.penalty / 1000}s</div></div>
                        </div>
                        <div className="mt-4 flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.accuracy}</div><div className="font-mono font-black text-2xl tracking-tight">{mathStats.correct} / 10</div></div>
                    </div>
                </div>
                    <div className="space-y-4 pb-12 mt-auto">
                    <button onClick={startMathCountdown} className="w-full py-6 bg-indigo-600 text-white text-xl font-black rounded-[2rem] shadow-lg hover:shadow-xl active:scale-95 transition-all"><i className="fa-solid fa-rotate-right mr-3"></i> {t.retry}</button>
                    <button onClick={() => setGameState('idle')} className="w-full py-6 bg-white border-2 border-slate-100 text-slate-600 text-xl font-black rounded-[2rem] active:scale-95 transition-all"><i className="fa-solid fa-check mr-3"></i> {t.finish}</button>
                </div>
            </div>
            );
    }
    if (gameState === 'finished') {
        if (!currentResult) return null; const avg = currentResult.totalTime / 5; const best = getBestScore(selectedRange); const correctCount = currentResult.laps.filter((l: any) => l.correct).length;
        return (
            <div className="h-full flex flex-col p-4 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6 pt-2"><div><h2 className="text-2xl font-black flex items-center gap-3 text-slate-800"><i className="fa-solid fa-award text-amber-500"></i> {t.result}</h2><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.mode}: {(t as any)[selectedRange] || selectedRange}</span></div><div className="flex gap-2"><button onClick={() => setIsHistoryOpen(true)} className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-full text-indigo-600 shadow-sm transition-all hover:bg-indigo-100"><i className="fa-solid fa-clock-rotate-left"></i></button><button onClick={handleHomeClick} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm transition-all hover:text-indigo-600 z-50"><i className="fa-solid fa-house"></i></button></div></div>
                <div className="w-full bg-indigo-600 text-white rounded-[2.5rem] p-8 sm:p-10 mb-8 shadow-2xl relative flex flex-col items-center text-center">{isNewRecord && (<div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-md">{t.newRecord}</div>)}<div className="text-[11px] font-black opacity-60 uppercase tracking-widest mb-1">{t.finalScore}</div><div className="text-6xl sm:text-7xl font-mono font-black mb-4 tracking-tighter drop-shadow-lg truncate w-full">{formatTime(currentResult.finalScore, settings.timerFormat)}</div><div className="flex items-center gap-2 mb-10 bg-black/10 px-5 py-2 rounded-full"><i className="fa-solid fa-crown text-yellow-400 text-xs"></i><span className="text-sm font-black tracking-widest uppercase">{t.bestScore}: {best ? formatTime(best, settings.timerFormat) : '-'}</span></div><div className="w-full space-y-8 pt-8 border-t border-white/20"><div className="grid grid-cols-2 w-full gap-4"><div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.rawTime}</div><div className="font-mono font-black text-2xl">{formatTime(currentResult.totalTime, settings.timerFormat)}</div></div><div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.accuracy}</div><div className="font-mono font-black text-2xl tracking-tight">{correctCount} / 5</div></div></div><div className="grid grid-cols-2 w-full gap-4"><div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.avgTime}</div><div className="font-mono font-black text-2xl tracking-tight">{formatTime(avg, 'ss')}</div></div><div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.penalty}</div><div className={`font-mono font-black text-2xl tracking-tight ${currentResult.penaltySeconds > 0 ? 'text-red-300' : 'text-green-300'}`}>+{currentResult.penaltySeconds}s</div></div></div></div></div>
                <div className="mb-10 space-y-4">{currentResult.laps.map((lap: any, i: number) => (<div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-xs ${lap.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{i + 1}</div><div className="flex flex-col"><span className="text-[10px] text-slate-400 font-black tracking-wider mb-0.5 uppercase">{lap.date}</span><span className="text-base font-bold text-slate-700">{lap.userAnswer} {!lap.correct && <span className="text-red-400 font-black ml-1">→ {lap.correctAnswer}</span>}</span></div></div><div className="flex flex-col items-end gap-1"><div className="text-xs font-mono font-black text-slate-400 tracking-tight">{formatTime(lap.duration, 'ss')}</div>{lap.correct ? <i className="fa-solid fa-circle-check text-green-500"></i> : <i className="fa-solid fa-circle-xmark text-red-400"></i>}</div></div>))}</div>
                <div className="space-y-4 pb-12 mt-auto"><button onClick={startCountdown} className="w-full py-6 bg-indigo-600 text-white text-xl font-black rounded-[2rem] shadow-lg hover:shadow-xl active:scale-95 transition-all"><i className="fa-solid fa-rotate-right mr-3"></i> {t.retry}</button><button onClick={() => setGameState('idle')} className="w-full py-6 bg-white border-2 border-slate-100 text-slate-600 text-xl font-black rounded-[2rem] active:scale-95 transition-all"><i className="fa-solid fa-check mr-3"></i> {t.finish}</button></div>
                {isHistoryOpen && <HistoryModal history={JSON.parse(localStorage.getItem('calendar_history') || '[]')} range={selectedRange} onClose={() => setIsHistoryOpen(false)} t={t} />}
            </div>
        );
    }

    return null;
};
