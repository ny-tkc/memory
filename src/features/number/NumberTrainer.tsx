import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { formatTime, handleHomeWithConfirm } from '@/utils/helpers';
import { MemoryNavControls } from '@/components/MemoryNavControls';
import type { TrainerProps } from '@/types';

const NumberSettingsModal = ({ settings, updateSettings, onClose, t }: any) => {
    return (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-y-auto max-h-[85vh] no-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800"><i className="fa-solid fa-cog text-emerald-500"></i> {t.gameSettings}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="space-y-5">
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.digitsPerGroup}</label>
                        <select value={settings.digitsPerGroup} onChange={(e) => updateSettings('digitsPerGroup', parseInt(e.target.value))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-700 bg-white">
                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </section>
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.totalDigitsNum}</label>
                        <input type="number" min="1" max="1000" value={settings.totalDigits} onChange={(e) => updateSettings('totalDigits', Math.max(1, parseInt(e.target.value)||80))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-center text-slate-700 bg-white" />
                    </section>
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.autoNextSpeed}</label>
                        <select value={settings.autoNext} onChange={(e) => updateSettings('autoNext', parseFloat(e.target.value))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-700 bg-white">
                            <option value={0}>{t.autoNextOff}</option>
                            {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map(n => <option key={n} value={n}>{n}s</option>)}
                        </select>
                    </section>
                </div>
                <button onClick={onClose} className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">{t.close}</button>
            </div>
        </div>
    );
};

export const NumberTrainer = ({ onBack, globalSettings, t }: TrainerProps) => {
    const [gameState, setGameState] = useState('menu');
    const [trainingType, setTrainingType] = useState<any>(null);
    const [sequence, setSequence] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [countdownText, setCountdownText] = useState('');
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [endlessNumber, setEndlessNumber] = useState('');
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [resultData, setResultData] = useState<any>(null);

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('number_settings_v3');
        return saved ? JSON.parse(saved) : { digitsPerGroup: 2, totalDigits: 80, autoNext: 0 };
    });

    const updateSettings = (key: any, val: any) => { const ns = {...settings, [key]: val}; setSettings(ns); localStorage.setItem('number_settings_v3', JSON.stringify(ns)); };

    const generateSequence = useCallback(() => {
        const total = settings.totalDigits;
        const seq: string[] = [];
        for(let i=0; i<total; i++) {
                seq.push(Math.floor(Math.random() * 10).toString());
        }
        return seq;
    }, [settings]);

    const generateEndlessNumber = useCallback(() => {
        let num = "";
        for(let i=0; i<settings.digitsPerGroup; i++) num += Math.floor(Math.random() * 10).toString();
        return num;
    }, [settings.digitsPerGroup]);

    const startTraining = (type: any) => {
        setTrainingType(type);
        if (type === 'memory') {
            const rawSeq = generateSequence();
            const chunked: string[] = [];
            for(let i=0; i<rawSeq.length; i+=settings.digitsPerGroup) {
                    chunked.push(rawSeq.slice(i, i+settings.digitsPerGroup).join(''));
            }
            setSequence(chunked);
            setCurrentIndex(0);
            setUserInput("");
            setResultData(null);

            setGameState('countdown');
            let count = globalSettings.countdownSeconds || 3;
            setCountdownText(count.toString());
            const interval = setInterval(() => {
                count--;
                if (count === 0) setCountdownText('START!');
                else if (count < 0) {
                    clearInterval(interval);
                    setGameState('memorization');
                    setStartTime(performance.now());
                } else setCountdownText(count.toString());
            }, 1000);
        } else {
            setEndlessNumber(generateEndlessNumber());
            setGameState('conversion');
        }
    };

    const handleNext = () => {
        if(trainingType === 'memory') {
                if(currentIndex + 1 >= sequence.length) {
                setGameState('recall');
                } else {
                setCurrentIndex(prev => prev + 1);
                }
        } else {
            setEndlessNumber(generateEndlessNumber());
        }
    };

    const handlePrev = () => {
        setCurrentIndex(Math.max(0, currentIndex - 1));
    };

    const handleFirst = () => {
        setCurrentIndex(0);
    };

    useEffect(() => {
        let timer: any;
        if((gameState === 'memorization' || gameState === 'conversion') && settings.autoNext > 0) {
            timer = setInterval(() => {
                handleNext();
            }, settings.autoNext * 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, currentIndex, settings.autoNext, endlessNumber]);

    const handleRecallInput = (num: any) => { setUserInput(prev => prev + num); };
    const handleBackspace = () => { setUserInput(prev => prev.slice(0, -1)); };

    const finishRecall = () => {
        const now = performance.now();
        setEndTime(now);

        const time = now - startTime;
        const rawSeq = sequence.join('');
        let mistakes = 0;
        const len = Math.max(rawSeq.length, userInput.length);
        for(let i=0; i<len; i++) {
            if (rawSeq[i] !== userInput[i]) mistakes++;
        }
        const penaltySeconds = mistakes * 5;
        const finalScore = time + (penaltySeconds * 1000);
        const correctCount = len - mistakes;

        const records = JSON.parse(localStorage.getItem('number_records') || '[]');
        const best = records.length > 0 ? Math.min(...records.map((r: any) => r.finalScore)) : null;
        const isNew = best === null || finalScore < best;

        if(isNew) {
             confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
             setIsNewRecord(true);
        } else {
             setIsNewRecord(false);
        }

        const newRecord = {
            timestamp: Date.now(),
            totalDigits: settings.totalDigits,
            time,
            penaltySeconds,
            finalScore,
            accuracy: correctCount
        };
        localStorage.setItem('number_records', JSON.stringify([...records, newRecord].slice(-100)));

        setResultData({
            time, penaltySeconds, finalScore, correctCount, rawSeq, userInput
        });
        setGameState('result');
    };

    const handleHomeClick = () => handleHomeWithConfirm(gameState, onBack, t);

    if (gameState === 'menu') return (
        <div className="h-full flex flex-col p-4 relative overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6"><button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm hover:text-emerald-600 transition-colors z-50"><i className="fa-solid fa-house"></i></button><h2 className="text-lg font-bold text-slate-800">{t.number}</h2><button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm hover:text-emerald-600 transition-colors"><i className="fa-solid fa-cog"></i></button></div>
            <div className="flex-grow flex flex-col items-center justify-center gap-6">
                <button onClick={() => startTraining('conversion')} className="w-full max-w-sm p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm active:scale-95 transition-all text-left group hover:border-emerald-200"><div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 text-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors"><i className="fa-solid fa-shuffle"></i></div><div className="text-xl font-black text-slate-800 mb-1">{t.numConversion}</div><div className="text-xs font-bold text-slate-400">{t.descConversion}</div></button>
                <button onClick={() => startTraining('memory')} className="w-full max-w-sm p-6 bg-emerald-600 text-white rounded-[2rem] shadow-lg active:scale-95 transition-all text-left relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div><div className="relative z-10"><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 text-2xl"><i className="fa-solid fa-brain"></i></div><div className="text-xl font-black mb-1">{t.numMemory}</div><div className="text-xs font-bold text-emerald-100">{t.descMemory}</div></div></button>
            </div>
            {isSettingsOpen && <NumberSettingsModal settings={settings} updateSettings={updateSettings} onClose={() => setIsSettingsOpen(false)} t={t} />}
        </div>
    );

    if (gameState === 'countdown') return <div className="h-full flex items-center justify-center bg-emerald-600 text-white"><div className="text-8xl font-black animate-countdown px-4 text-center">{countdownText}</div></div>;

    if (gameState === 'conversion') {
            return (
            <div className="h-full flex flex-col p-6 bg-emerald-50">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={handleHomeClick} className="w-8 h-8 flex items-center justify-center bg-white/50 rounded-full text-emerald-700 hover:bg-white transition-colors z-50"><i className="fa-solid fa-house text-xs"></i></button>
                        <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{t.numConversion}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-400">{t.endless}</div>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center"><div className="text-7xl sm:text-9xl font-mono font-black text-emerald-800 text-center tracking-tight">{endlessNumber}</div></div>
                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button onClick={() => setGameState('menu')} className="w-full py-6 bg-white text-slate-400 font-black rounded-[2rem] shadow-sm active:scale-95 transition-all">{t.finish}</button>
                    <button onClick={handleNext} className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2rem] shadow-lg active:scale-95 transition-all">{t.next}</button>
                </div>
            </div>
        );
    }

    if (gameState === 'memorization') {
        return (
            <div className="h-full flex flex-col p-6 bg-emerald-50">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={handleHomeClick} className="w-8 h-8 flex items-center justify-center bg-white/50 rounded-full text-emerald-700 hover:bg-white transition-colors z-50"><i className="fa-solid fa-house text-xs"></i></button>
                        <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{t.memorization}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-400">{currentIndex + 1} / {sequence.length}</div>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center"><div className="text-7xl sm:text-9xl font-mono font-black text-emerald-800 text-center tracking-tight">{sequence[currentIndex]}</div></div>

                <MemoryNavControls
                    onFirst={handleFirst}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onFinish={() => setGameState('recall')}
                    current={currentIndex}
                    total={sequence.length}
                    t={t}
                />
            </div>
        );
    }

    if (gameState === 'recall') {
        const formattedInput = userInput.replace(new RegExp(`.{1,${settings.digitsPerGroup}}`, 'g'), '$& ').trim();
        return (
            <div className="h-full flex flex-col p-4 bg-slate-50">
                    <div className="mb-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-center mb-2 flex-none">
                        <div className="flex items-center gap-4">
                            <button onClick={handleHomeClick} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-50"><i className="fa-solid fa-house text-xs"></i></button>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.recallInput}</div>
                        </div>
                        <div className="text-xs font-bold text-slate-400">{userInput.length} / {settings.totalDigits}</div>
                    </div>
                    <div className="flex-grow w-full bg-white rounded-2xl border-2 border-slate-200 p-6 font-mono text-3xl sm:text-4xl font-bold text-slate-800 overflow-y-auto break-all tracking-widest shadow-inner leading-relaxed">
                        {formattedInput || <span className="text-slate-300 tracking-normal font-sans text-lg">{t.inputPlace}</span>}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4 h-64 flex-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <button key={n} onClick={() => handleRecallInput(n.toString())} className="bg-white rounded-xl shadow-sm border-b-4 border-slate-100 active:border-b-0 active:translate-y-1 transition-all text-2xl font-bold text-slate-700 flex items-center justify-center">{n}</button>)}
                    <button onClick={handleBackspace} className="bg-red-50 text-red-500 rounded-xl shadow-sm border-b-4 border-red-100 active:border-b-0 active:translate-y-1 transition-all text-xl font-bold flex items-center justify-center"><i className="fa-solid fa-delete-left"></i></button>
                    <button onClick={() => handleRecallInput('0')} className="bg-white rounded-xl shadow-sm border-b-4 border-slate-100 active:border-b-0 active:translate-y-1 transition-all text-2xl font-bold text-slate-700 flex items-center justify-center">0</button>
                    <button onClick={finishRecall} className="bg-emerald-600 text-white rounded-xl shadow-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all text-xl font-bold flex items-center justify-center">{t.checkResult}</button>
                </div>
            </div>
        );
    }

    if (gameState === 'result' && resultData) {
        const { time, penaltySeconds, finalScore, correctCount, rawSeq, userInput } = resultData;
        const records = JSON.parse(localStorage.getItem('number_records') || '[]');
        const best = records.length > 0 ? Math.min(...records.map((r: any) => r.finalScore)) : null;

        return (
            <div className="h-full flex flex-col p-4 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6 pt-2">
                    <div><h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-award text-emerald-500"></i> {t.result}</h2></div>
                    <div className="flex gap-2"><button onClick={handleHomeClick} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm transition-all hover:text-emerald-600 z-50"><i className="fa-solid fa-house"></i></button></div>
                </div>

                    <div className="w-full bg-emerald-600 text-white rounded-[2.5rem] p-8 sm:p-10 mb-8 shadow-2xl relative flex flex-col items-center text-center">
                    {isNewRecord && (<div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-md">{t.newRecord}</div>)}
                    <div className="text-[11px] font-black opacity-60 uppercase tracking-widest mb-1">{t.finalScore}</div>
                    <div className="text-6xl sm:text-7xl font-mono font-black mb-4 tracking-tighter drop-shadow-lg truncate w-full">{formatTime(finalScore)}</div>
                    <div className="flex items-center gap-2 mb-10 bg-black/10 px-5 py-2 rounded-full"><i className="fa-solid fa-crown text-yellow-400 text-xs"></i><span className="text-sm font-black tracking-widest uppercase">{t.bestScore}: {best ? formatTime(Math.min(best, finalScore)) : formatTime(finalScore)}</span></div>

                    <div className="w-full space-y-8 pt-8 border-t border-white/20">
                        <div className="grid grid-cols-2 w-full gap-4">
                            <div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.rawTime}</div><div className="font-mono font-black text-2xl">{formatTime(time)}</div></div>
                            <div className="flex flex-col items-center"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.accuracy}</div><div className="font-mono font-black text-2xl tracking-tight">{correctCount} / {rawSeq.length}</div></div>
                        </div>
                        <div className="grid grid-cols-2 w-full gap-4">
                            <div className="flex flex-col items-center col-span-2"><div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{t.penalty}</div><div className={`font-mono font-black text-2xl tracking-tight ${penaltySeconds > 0 ? 'text-red-300' : 'text-green-300'}`}>+{penaltySeconds}s <span className="text-[10px] opacity-70">({t.fiveSecPenalty})</span></div></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6 flex-grow overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">DETAILS</h3>
                    <div className="font-mono text-lg break-all tracking-widest leading-loose">
                        {rawSeq.split('').map((char: any, i: any) => {
                            const userChar = userInput[i];
                            let color = 'text-slate-300';
                            if (userChar === char) color = 'text-emerald-600 font-bold';
                            else if (userChar) color = 'text-red-500 font-bold bg-red-50';
                            return <span key={i} className={color}>{char}</span>;
                        })}
                    </div>
                </div>
                <button onClick={() => startTraining('memory')} className="w-full py-6 bg-emerald-600 text-white text-xl font-black rounded-[2rem] shadow-lg active:scale-95 transition-all mb-4"><i className="fa-solid fa-rotate-right mr-2"></i> {t.retry}</button>
            </div>
        );
    }
    return null;
};
