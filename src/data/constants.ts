export const DAYS_JP = ['日', '月', '火', '水', '木', '金', '土'];
export const DAYS_JP_LONG = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_EN_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SUITS = ['spade', 'heart', 'diamond', 'club'] as const;
export const SUIT_ICONS: Record<string, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
};
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const KANA_ROWS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];
export const KANA_COLS = ['あ', 'い', 'う', 'え', 'お'];
