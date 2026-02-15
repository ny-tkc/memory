export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

export const formatTime = (ms: number, formatMode = 'mm:ss') => {
  const totalSeconds = ms / 1000;
  if (formatMode === 'ss') return `${totalSeconds.toFixed(2)}秒`;
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toFixed(2);
  return `${m}:${s.padStart(5, '0')}`;
};

export const getJapaneseEra = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fullDate = year * 10000 + month * 100 + day;
  if (fullDate >= 20190501) return `令和${year - 2018 === 1 ? '元' : year - 2018}年`;
  if (fullDate >= 19890108) return `平成${year - 1988 === 1 ? '元' : year - 1988}年`;
  if (fullDate >= 19261225) return `昭和${year - 1925 === 1 ? '元' : year - 1925}年`;
  if (fullDate >= 19120730) return `大正${year - 1911 === 1 ? '元' : year - 1911}年`;
  if (fullDate >= 18680125) return `明治${year - 1867 === 1 ? '元' : year - 1867}年`;
  return `${year}年`;
};

export const handleHomeWithConfirm = (
  gameState: string,
  onBack: () => void,
  t: Record<string, string>,
) => {
  const safeStates = ['menu', 'idle', 'finished', 'result', 'math_result', 'conversion', 'lp_menu'];
  if (!safeStates.includes(gameState)) {
    if (window.confirm(t.confirmQuit)) onBack();
  } else {
    onBack();
  }
};
