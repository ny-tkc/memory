import { useState, useEffect, useCallback } from 'react';
import { KANA_ROWS } from '@/data/constants';
import { DEFAULT_LETTER_MASTER } from '@/data/letterPairMaster';
import { formatTime, handleHomeWithConfirm } from '@/utils/helpers';
import type { TrainerProps } from '@/types';

const LetterPairSettingsModal = ({ settings, updateSettings, onClose, t }: any) => {
    return (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-y-auto max-h-[85vh] no-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800"><i className="fa-solid fa-cog text-amber-500"></i> {t.gameSettings}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="space-y-5">
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.rowSelect}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {KANA_ROWS.map((r: any) => (
                                <button key={r} onClick={() => updateSettings('activeRows', settings.activeRows.includes(r) ? settings.activeRows.filter((x: any) => x!==r) : [...settings.activeRows, r])} className={`py-2 rounded-xl border-2 font-bold text-sm transition-all ${settings.activeRows.includes(r) ? 'bg-amber-50 border-amber-600 text-amber-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>{r}行</button>
                            ))}
                        </div>
                    </section>
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.qCount}</label>
                        <input type="number" min="1" max="100" value={settings.qCount} onChange={e=>updateSettings('qCount', Math.max(1, Math.min(100, parseInt(e.target.value)||10)))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-center text-slate-700 bg-white" />
                    </section>
                    <section>
                        <label className="flex items-center gap-3 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50">
                            <input type="checkbox" checked={settings.alwaysShowAnswer} onChange={(e) => updateSettings('alwaysShowAnswer', e.target.checked)} className="w-5 h-5 accent-amber-500" />
                            <span className="font-bold text-sm text-slate-700">{t.alwaysShow}</span>
                        </label>
                    </section>
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.autoNextSpeed}</label>
                        <select value={settings.autoNext} onChange={(e) => updateSettings('autoNext', parseFloat(e.target.value))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-700 bg-white">
                            <option value={0}>{t.autoNextOff}</option>
                            {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map(n => <option key={n} value={n}>{n}s</option>)}
                        </select>
                    </section>
                </div>
                <button onClick={onClose} className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-95 transition-all">{t.close}</button>
            </div>
        </div>
    );
};

export const LetterPairTrainer = ({ onBack, globalSettings, t }: any) => {
    const [gameState, setGameState] = useState('menu');
    const [trainingType, setTrainingType] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAnswerShown, setIsAnswerShown] = useState(false);
    const [countdownText, setCountdownText] = useState('');
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('letter_settings_v7');
        return saved ? JSON.parse(saved) : { activeRows: ['あ', 'か', 'さ', 'た', 'な', 'は'], qCount: 10, autoNext: 0, alwaysShowAnswer: false };
    });

    const [masterData, setMasterData] = useState<any>(() => {
        const saved = localStorage.getItem('letter_master_custom_v6');
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...DEFAULT_LETTER_MASTER, ...parsed };
        }
        return DEFAULT_LETTER_MASTER;
    });

    const updateSettings = (key: any, val: any) => {
        const ns = {...settings, [key]: val};
        setSettings(ns);
        localStorage.setItem('letter_settings_v7', JSON.stringify(ns));
    };

    const generateQuestions = useCallback(() => {
        const pool: any[] = [];
        settings.activeRows.forEach((row: any) => {
            const data = masterData[row];
            if (data) Object.keys(data).forEach(pair => pool.push({ pair, answer: data[pair], row }));
        });
        if (pool.length === 0) return [];
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, settings.qCount);
    }, [settings, masterData]);

    const startTraining = (type: any) => {
        const qs = generateQuestions();
        if (qs.length === 0) { alert('選択された行にデータがありません'); return; }
        setTrainingType(type);
        setQuestions(qs);
        setCurrentIndex(0);
        setUserAnswers([]);
        setInput("");
        setIsAnswerShown(type === 'conversion' ? settings.alwaysShowAnswer : false);

        if (type === 'conversion') {
            setGameState('training');
            setStartTime(performance.now());
        } else {
            setGameState('countdown');
            let count = globalSettings.countdownSeconds || 3;
            setCountdownText(count.toString());
            const interval = setInterval(() => {
                count--;
                if (count === 0) setCountdownText('START!');
                else if (count < 0) {
                    clearInterval(interval);
                    setGameState('training');
                    setStartTime(performance.now());
                } else setCountdownText(count.toString());
            }, 1000);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 >= questions.length) {
            setEndTime(performance.now());
            setGameState(trainingType === 'memory' ? 'result' : 'menu');
        } else {
            setCurrentIndex(prev => prev + 1);
            setInput("");
            setIsAnswerShown(trainingType === 'conversion' ? settings.alwaysShowAnswer : false);
        }
    };

    const handleMemoryInput = () => {
        const ans = [...userAnswers];
        ans[currentIndex] = input;
        setUserAnswers(ans);
        handleNext();
    };

    useEffect(() => {
        let timer: any;
        if (gameState === 'training' && settings.autoNext > 0 && trainingType === 'conversion') {
            if (!isAnswerShown) {
                 timer = setTimeout(() => setIsAnswerShown(true), settings.autoNext * 1000);
            } else {
                 timer = setTimeout(() => handleNext(), settings.autoNext * 1000);
            }
        }
        return () => clearTimeout(timer);
    }, [gameState, currentIndex, isAnswerShown, settings.autoNext, trainingType]);

    const handleEditAnswer = () => {
        const q = questions[currentIndex];
        const newAns = prompt(`${q.pair} のイメージを編集:`, q.answer);
        if(newAns !== null && newAns.trim() !== "") {
            const updatedMaster = { ...masterData, [q.row]: { ...masterData[q.row], [q.pair]: newAns.trim() } };
            setMasterData(updatedMaster);
            localStorage.setItem('letter_master_custom_v6', JSON.stringify(updatedMaster));
            const newQs = [...questions];
            newQs[currentIndex].answer = newAns.trim();
            setQuestions(newQs);
        }
    };

    const handleHomeClick = () => handleHomeWithConfirm(gameState, onBack, t);

    if (gameState === 'menu') return (
        <div className="h-full flex flex-col p-6 items-center justify-center gap-6 relative">
            <button onClick={onBack} className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm z-50"><i className="fa-solid fa-house"></i></button>
            <h2 className="absolute top-8 text-lg font-bold text-slate-800">{t.letterPair}</h2>
            <button onClick={() => setIsSettingsOpen(true)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-amber-500"><i className="fa-solid fa-cog"></i></button>

            <button onClick={() => startTraining('conversion')} className="w-full max-w-sm p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm active:scale-95 text-left group hover:border-amber-200 transition-all">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 text-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors"><i className="fa-solid fa-shuffle"></i></div>
                <div className="text-xl font-black text-slate-800 mb-1">{t.numConversion}</div>
                <div className="text-xs font-bold text-slate-400">{t.descConversion}</div>
            </button>

             <button onClick={() => startTraining('memory')} className="w-full max-w-sm p-6 bg-amber-600 text-white rounded-[2rem] shadow-lg active:scale-95 text-left transition-all">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 text-2xl"><i className="fa-solid fa-brain"></i></div>
                <div className="text-xl font-black mb-1">{t.numMemory}</div>
                <div className="text-xs font-bold text-amber-100">{t.descMemory}</div>
            </button>

            {isSettingsOpen && <LetterPairSettingsModal settings={settings} updateSettings={updateSettings} onClose={() => setIsSettingsOpen(false)} t={t} />}
        </div>
    );

    if (gameState === 'countdown') return <div className="h-full flex items-center justify-center bg-amber-500 text-white"><div className="text-8xl font-black animate-countdown px-4 text-center">{countdownText}</div></div>;

    if (gameState === 'training') {
        const q = questions[currentIndex];
        return (
            <div className="h-full flex flex-col p-6 bg-amber-50">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={handleHomeClick} className="w-8 h-8 flex items-center justify-center bg-white/50 rounded-full text-amber-700 hover:bg-white transition-colors z-50"><i className="fa-solid fa-house text-xs"></i></button>
                        <span className="font-black text-amber-700 uppercase tracking-widest text-sm">{trainingType === 'memory' ? t.numMemory : t.numConversion}</span>
                    </div>
                    <span className="font-black text-amber-700 uppercase tracking-widest">{currentIndex + 1} / {questions.length}</span>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="text-8xl font-black text-amber-800 mb-10">{q.pair}</div>

                    {trainingType === 'conversion' && (
                        <div className="h-32 flex items-center justify-center w-full">
                            {isAnswerShown ? (
                                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="text-5xl font-black text-slate-600 mb-4 text-center">{q.answer}</div>
                                    <button onClick={handleEditAnswer} className="text-slate-300 hover:text-amber-500 transition-colors text-sm font-bold flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm"><i className="fa-solid fa-pen"></i> {t.edit}</button>
                                </div>
                            ) : (
                                <button onClick={() => setIsAnswerShown(true)} className="px-8 py-4 bg-white/60 text-slate-400 font-bold rounded-2xl border-2 border-slate-200 hover:bg-white hover:text-amber-500 hover:border-amber-200 transition-all">{t.showAnswer || '答えを表示'}</button>
                            )}
                        </div>
                    )}

                    {trainingType === 'memory' && (
                        <div className="w-full max-w-sm">
                            <input
                                type="text"
                                value={input}
                                autoFocus
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleMemoryInput()}
                                className="w-full p-6 text-center text-3xl font-bold border-4 border-amber-200 rounded-3xl outline-none focus:border-amber-500 bg-white shadow-lg"
                                placeholder={t.wordPlaceholder}
                            />
                        </div>
                    )}
                </div>

                <button onClick={trainingType === 'memory' ? handleMemoryInput : handleNext} className="w-full py-8 bg-white text-amber-600 text-2xl font-black rounded-[2rem] shadow-xl active:scale-95 transition-all">
                    {currentIndex + 1 >= questions.length ? t.finish : t.next}
                </button>
            </div>
        );
    }

    if (gameState === 'result') {
        const correctCount = userAnswers.filter((ans: any, i: number) => ans === questions[i].answer).length;
        return (
            <div className="h-full flex flex-col p-4 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6 pt-2">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-square-check text-amber-500"></i> {t.result}</h2>
                    <button onClick={() => setGameState('menu')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="bg-amber-50 rounded-[2rem] p-8 w-full mb-6 flex justify-between items-center border border-amber-100 shadow-sm">
                    <div><div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{t.accuracy}</div><div className="text-4xl font-black text-slate-800">{correctCount} <span className="text-lg text-slate-400">/ {questions.length}</span></div></div>
                    <div><div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{t.rawTime}</div><div className="text-4xl font-black text-slate-800">{formatTime(endTime - startTime)}</div></div>
                </div>
                <div className="space-y-2 mb-10 flex-grow overflow-y-auto">
                    {questions.map((q: any, i: number) => {
                        const isCorrect = userAnswers[i] === q.answer;
                        return (
                            <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div>
                                    <div className="font-black text-lg text-slate-700">{q.pair} <i className="fa-solid fa-arrow-right text-xs text-slate-300 mx-2"></i> {q.answer}</div>
                                    <div className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{isCorrect ? 'Correct' : `Your Ans: ${userAnswers[i] || '(空欄)'}`}</div>
                                </div>
                                {isCorrect ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-xmark text-red-500"></i>}
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => startTraining('memory')} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-lg mb-10 active:scale-95">{t.retry}</button>
            </div>
        );
    }
    return null;
};
