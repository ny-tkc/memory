import { useState, useEffect, useCallback } from 'react';
import { SUITS, SUIT_ICONS, VALUES } from '@/data/constants';
import { generateId, formatTime, handleHomeWithConfirm } from '@/utils/helpers';
import { Card } from '@/components/Card';
import { MemoryNavControls } from '@/components/MemoryNavControls';
import type { TrainerProps } from '@/types';

type CardSettingsModalProps = {
    settings: any;
    updateSettings: (key: string, val: any) => void;
    onClose: () => void;
    t: any;
};

const CardSettingsModal = ({ settings, updateSettings, onClose, t }: CardSettingsModalProps) => {
    return (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-y-auto max-h-[85vh] no-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800"><i className="fa-solid fa-cog text-rose-500"></i> {t.gameSettings}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="space-y-5">
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.bunchCount}</label>
                        <select value={settings.deckCount} onChange={(e) => updateSettings('deckCount', parseInt(e.target.value))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-700 bg-white">
                            {[1, 2, 3].map(n => <option key={n} value={n}>{n} 束</option>)}
                        </select>
                    </section>
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.digitsPerImage} (Cards/Img)</label>
                        <select value={settings.cardsPerImage} onChange={(e) => updateSettings('cardsPerImage', parseInt(e.target.value))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-700 bg-white">
                            {[1, 2].map(n => <option key={n} value={n}>{n} 枚</option>)}
                        </select>
                    </section>
                    <section>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">{t.imagesPerView}</label>
                        <select value={settings.imagesPerView} onChange={(e) => updateSettings('imagesPerView', parseInt(e.target.value))} className="w-full p-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-700 bg-white">
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 枚</option>)}
                        </select>
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

export const CardTrainer = ({ onBack, globalSettings, t }: TrainerProps) => {
    const [gameState, setGameState] = useState<string>('menu');
    const [trainingType, setTrainingType] = useState<string | null>(null);
    const [deck, setDeck] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [userRecall, setUserRecall] = useState<any[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [countdownText, setCountdownText] = useState<string>('');
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [selectedSuit, setSelectedSuit] = useState<string | null>(null);

    const [settings, setSettings] = useState<any>(() => {
        const saved = localStorage.getItem('card_settings');
        return saved ? JSON.parse(saved) : {
            deckCount: 1, cardsPerImage: 2, imagesPerView: 1,
            autoNext: 0
        };
    });

    const updateSettings = (key: string, val: any) => {
        const ns = {...settings, [key]: val};
        setSettings(ns);
        localStorage.setItem('card_settings', JSON.stringify(ns));
    };

    const generateDeck = useCallback(() => {
        let d: any[] = [];
        for(let i=0; i<settings.deckCount; i++) {
            const tempDeck: any[] = [];
            SUITS.forEach(suit => {
                VALUES.forEach(val => {
                    tempDeck.push({ suit, value: val, id: generateId() });
                });
            });
            for (let j = tempDeck.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [tempDeck[j], tempDeck[k]] = [tempDeck[k], tempDeck[j]];
            }
            d = [...d, ...tempDeck];
        }
        return d;
    }, [settings.deckCount]);

    const startTraining = (type: string) => {
        setTrainingType(type);
        setDeck(generateDeck());
        setCurrentIndex(0);
        setUserRecall([]);
        setSelectedSuit(null);

        if (type === 'conversion') {
            setGameState('memorization');
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
                    setGameState('memorization');
                    setStartTime(performance.now());
                }
                else setCountdownText(count.toString());
            }, 1000);
        }
    };

    const handleNext = () => {
        const step = settings.cardsPerImage * settings.imagesPerView;
        const nextIdx = currentIndex + step;
        if(nextIdx >= deck.length) {
            if(trainingType === 'memory') {
                setGameState('recall');
            } else {
                setGameState('menu');
            }
        } else {
            setCurrentIndex(nextIdx);
        }
    };

    const handlePrev = () => {
        const step = settings.cardsPerImage * settings.imagesPerView;
        setCurrentIndex(Math.max(0, currentIndex - step));
    };

    const handleFirst = () => {
        setCurrentIndex(0);
    };

    useEffect(() => {
        let timer: any;
        if(gameState === 'memorization' && settings.autoNext > 0) {
            timer = setInterval(() => {
                handleNext();
            }, settings.autoNext * 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, currentIndex, settings.autoNext]);

    const handleRecallInput = (val: string) => {
        if(selectedSuit) {
            const card = { suit: selectedSuit, value: val, id: generateId() };
            setUserRecall(prev => [...prev, card]);
            setSelectedSuit(null);
        }
    };

    const handleBackspace = () => {
        setUserRecall(prev => prev.slice(0, -1));
    };

    const finishRecall = () => {
        setEndTime(performance.now());
        setGameState('result');
    };

    const handleHomeClick = () => handleHomeWithConfirm(gameState, onBack, t);

    if (gameState === 'menu') {
        return (
            <div className="h-full flex flex-col p-4 relative overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm hover:text-rose-600 transition-colors z-50"><i className="fa-solid fa-house"></i></button>
                    <h2 className="text-lg font-bold text-slate-800">{t.card}</h2>
                    <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm hover:text-rose-600 transition-colors"><i className="fa-solid fa-cog"></i></button>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center gap-6">
                    <button onClick={() => startTraining('conversion')} className="w-full max-w-sm p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm active:scale-95 transition-all text-left group hover:border-rose-200">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 text-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors"><i className="fa-solid fa-shuffle"></i></div>
                        <div className="text-xl font-black text-slate-800 mb-1">{t.numConversion}</div>
                        <div className="text-xs font-bold text-slate-400">{t.descConversion}</div>
                    </button>
                    <button onClick={() => startTraining('memory')} className="w-full max-w-sm p-6 bg-rose-500 text-white rounded-[2rem] shadow-lg active:scale-95 transition-all text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 text-2xl"><i className="fa-solid fa-brain"></i></div>
                            <div className="text-xl font-black mb-1">{t.numMemory}</div>
                            <div className="text-xs font-bold text-rose-100">{t.descMemory}</div>
                        </div>
                    </button>
                </div>
                {isSettingsOpen && <CardSettingsModal settings={settings} updateSettings={updateSettings} onClose={() => setIsSettingsOpen(false)} t={t} />}
            </div>
        );
    }

    if (gameState === 'countdown') return <div className="h-full flex items-center justify-center bg-rose-500 text-white"><div className="text-8xl font-black animate-countdown px-4 text-center">{countdownText}</div></div>;

    if (gameState === 'memorization') {
        const step = settings.cardsPerImage * settings.imagesPerView;
        const currentBatch = deck.slice(currentIndex, currentIndex + step);
        const images: any[][] = [];
        for (let i = 0; i < currentBatch.length; i += settings.cardsPerImage) {
            images.push(currentBatch.slice(i, i + settings.cardsPerImage));
        }

        return (
            <div className="h-full flex flex-col p-6 bg-rose-50">
                <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                        <button onClick={handleHomeClick} className="w-8 h-8 flex items-center justify-center bg-white/50 rounded-full text-rose-700 hover:bg-white transition-colors z-50"><i className="fa-solid fa-house text-xs"></i></button>
                        <div className="text-sm font-bold text-rose-600 uppercase tracking-widest">{trainingType === 'conversion' ? t.numConversion : t.memorization}</div>
                        </div>
                        <div className="text-xs font-bold text-slate-400">{currentIndex} / {deck.length}</div>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center gap-8">
                    {images.map((imgGroup, idx) => (
                        <div key={idx} className="flex gap-4">
                            {imgGroup.map((c: any) => (
                                <Card key={c.id} suit={c.suit} value={c.value} className="w-24 h-36 sm:w-32 sm:h-48 text-2xl sm:text-4xl" />
                            ))}
                        </div>
                    ))}
                </div>

                {trainingType === 'memory' ? (
                    <MemoryNavControls
                        onFirst={handleFirst}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        onFinish={() => setGameState('recall')}
                        current={currentIndex}
                        total={deck.length}
                        t={t}
                    />
                ) : (
                    <button onClick={handleNext} className="w-full py-6 bg-white text-rose-600 text-xl font-black rounded-[2rem] shadow-xl active:scale-95 transition-all mt-6">
                        {currentIndex + step >= deck.length ? t.finish : t.next}
                    </button>
                )}
            </div>
        );
    }

    if (gameState === 'recall') {
        return (
            <div className="h-full flex flex-col bg-slate-50">
                <div className="flex-grow p-4 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-4">
                                <button onClick={handleHomeClick} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-50"><i className="fa-solid fa-house text-xs"></i></button>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.recallInput}</div>
                            </div>
                            <div className="text-xs font-bold text-slate-400">{userRecall.length} / {deck.length}</div>
                        </div>
                        <div className="flex-grow bg-white rounded-2xl border-2 border-slate-200 p-2 overflow-y-auto shadow-inner content-start grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 place-content-start">
                        {userRecall.length === 0 && <span className="text-slate-300 col-span-full text-center py-10">{t.inputPlace}</span>}
                        {userRecall.map((c: any, i: number) => (
                            <div key={i} className={`relative rounded border p-1 flex items-center justify-center bg-slate-50 ${c.suit === 'heart' || c.suit === 'diamond' ? 'text-red-500 border-red-100' : 'text-slate-800 border-slate-200'}`}>
                                <span className="text-xs mr-0.5">{SUIT_ICONS[c.suit]}</span>
                                <span className="font-bold text-sm">{c.value}</span>
                            </div>
                        ))}
                        </div>
                </div>
                <div className="bg-white rounded-t-[2rem] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 pb-8 z-10">
                    <div className="flex justify-between mb-4 px-2">
                        <button onClick={handleBackspace} className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm active:bg-red-100"><i className="fa-solid fa-delete-left"></i></button>
                        <button onClick={finishRecall} className="px-6 h-12 bg-rose-500 text-white font-bold rounded-full shadow-lg active:scale-95">{t.checkResult}</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {SUITS.map(s => (
                            <button key={s} onClick={() => setSelectedSuit(selectedSuit === s ? null : s)} className={`h-14 rounded-2xl text-2xl flex items-center justify-center transition-all ${selectedSuit === s ? 'bg-slate-800 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-400'}`}>
                                <span className={selectedSuit !== s && (s === 'heart' || s === 'diamond') ? 'text-red-400' : ''}>{SUIT_ICONS[s]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {VALUES.map(v => (
                            <button key={v} onClick={() => handleRecallInput(v)} disabled={!selectedSuit} className={`aspect-square rounded-xl font-bold text-lg flex items-center justify-center transition-all ${!selectedSuit ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 shadow-sm active:scale-90 active:bg-slate-100'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'result') {
            const fullDeck = deck;
            let correct = 0;
            for(let i=0; i<Math.min(fullDeck.length, userRecall.length); i++) {
                if(fullDeck[i].suit === userRecall[i].suit && fullDeck[i].value === userRecall[i].value) { correct++; }
            }
            const time = endTime - startTime;
            return (
            <div className="h-full flex flex-col p-4 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6 pt-2">
                    <h2 className="text-2xl font-black text-slate-800"><i className="fa-solid fa-square-check text-rose-500 mr-2"></i> {t.result}</h2>
                    <button onClick={() => setGameState('menu')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="bg-white rounded-[2rem] p-6 shadow-xl mb-6 border border-slate-100">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.correctRate}</div><div className="text-3xl font-black text-slate-800">{correct} <span className="text-lg text-slate-400">/ {fullDeck.length}</span></div></div>
                            <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.rawTime}</div><div className="text-3xl font-black text-slate-800">{formatTime(time)}</div></div>
                        </div>
                </div>
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6 flex-grow overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">DETAILS</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {fullDeck.map((card: any, i: number) => {
                            const userCard = userRecall[i];
                            const isCorrect = userCard && userCard.suit === card.suit && userCard.value === card.value;
                            return (
                                <div key={i} className="flex items-center justify-between p-2 border-b border-slate-50 last:border-0">
                                    <span className="text-xs text-slate-300 font-mono w-6">{i+1}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 w-12 justify-end"><span className={`text-sm ${card.suit === 'heart' || card.suit === 'diamond' ? 'text-red-500' : 'text-slate-700'}`}>{SUIT_ICONS[card.suit]} {card.value}</span></div>
                                        <i className={`fa-solid fa-arrow-right text-xs text-slate-200`}></i>
                                        <div className="flex items-center gap-1 w-12">{userCard ? (<span className={`text-sm font-bold ${userCard.suit === 'heart' || userCard.suit === 'diamond' ? 'text-red-500' : 'text-slate-700'}`}>{SUIT_ICONS[userCard.suit]} {userCard.value}</span>) : (<span className="text-slate-300 text-xs">-</span>)}</div>
                                    </div>
                                    <div className="w-6 text-right">{isCorrect ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-xmark text-red-400"></i>}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <button onClick={() => startTraining('memory')} className="w-full py-6 bg-rose-500 text-white text-xl font-black rounded-[2rem] shadow-lg active:scale-95 transition-all mb-4"><i className="fa-solid fa-rotate-right mr-2"></i> {t.retry}</button>
            </div>
        );
    }
    return null;
};
