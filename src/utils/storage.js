// LocalStorage管理ユーティリティ

const STORAGE_KEY = 'umasim_data';
const INITIAL_WALLET = 1000000; // 初期資金100万円

/**
 * 初期データ構造
 */
const getInitialData = () => ({
  wallet: INITIAL_WALLET,
  history: [],
  createdAt: new Date().toISOString(),
});

/**
 * ユーザーデータを取得
 */
export const getUserData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initialData = getInitialData();
      saveUserData(initialData);
      return initialData;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load user data:', error);
    return getInitialData();
  }
};

/**
 * ユーザーデータを保存
 */
export const saveUserData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save user data:', error);
    return false;
  }
};

/**
 * 所持金を更新
 */
export const updateWallet = (amount) => {
  const data = getUserData();
  data.wallet = amount;
  saveUserData(data);
  return data;
};

/**
 * レース履歴を追加
 */
export const addHistory = (historyItem) => {
  const data = getUserData();
  data.history.unshift(historyItem); // 新しい履歴を先頭に追加

  // 履歴は最大100件まで保持
  if (data.history.length > 100) {
    data.history = data.history.slice(0, 100);
  }

  saveUserData(data);
  return data;
};

/**
 * データをリセット
 */
export const resetUserData = () => {
  const initialData = getInitialData();
  saveUserData(initialData);
  return initialData;
};

/**
 * データをエクスポート（Base64）
 */
export const exportData = () => {
  const data = getUserData();
  const jsonString = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(jsonString)));
};

/**
 * データをインポート（Base64）
 */
export const importData = (base64String) => {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64String)));
    const data = JSON.parse(jsonString);

    // データ検証
    if (typeof data.wallet !== 'number' || !Array.isArray(data.history)) {
      throw new Error('Invalid data format');
    }

    saveUserData(data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to import data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 収支統計を計算
 */
export const getStatistics = () => {
  const data = getUserData();
  const { history, wallet } = data;

  if (history.length === 0) {
    return {
      totalBets: 0,
      totalWins: 0,
      totalPayout: 0,
      totalSpent: 0,
      winRate: 0,
      roi: 0,
      currentBalance: wallet,
      profit: wallet - INITIAL_WALLET,
    };
  }

  const totalBets = history.length;
  const totalWins = history.filter(h => h.result === 'HIT').length;
  const totalPayout = history.reduce((sum, h) => sum + (h.payout || 0), 0);
  const totalSpent = history.reduce((sum, h) => sum + h.amount, 0);
  const winRate = (totalWins / totalBets) * 100;
  const roi = totalSpent > 0 ? ((totalPayout - totalSpent) / totalSpent) * 100 : 0;
  const profit = wallet - INITIAL_WALLET;

  return {
    totalBets,
    totalWins,
    totalPayout,
    totalSpent,
    winRate: winRate.toFixed(1),
    roi: roi.toFixed(1),
    currentBalance: wallet,
    profit,
  };
};
