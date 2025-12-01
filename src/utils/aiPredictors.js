// AI予想家

/**
 * 本命党：人気馬（オッズが低い馬）を推奨
 */
export const favoritePredictor = (horses) => {
  const sortedByOdds = [...horses].sort((a, b) => a.odds_base - b.odds_base);
  const topPick = sortedByOdds[0];

  return {
    name: '本命 太郎',
    style: '本命党',
    color: 'text-blue-600',
    icon: '⭐',
    prediction: {
      win: topPick.number,
      comment: `${topPick.name}が圧倒的！実績、能力ともに文句なし。堅く単勝で勝負！`,
      confidence: 85,
      recommendedBet: 'WIN',
    },
  };
};

/**
 * 穴党：人気薄（オッズが高い馬）を推奨
 */
export const darkHorsePredictor = (horses) => {
  // オッズが高い馬を選ぶが、あまりにも弱すぎる馬は除外
  const candidates = horses.filter(h => h.speed > 70 || h.stamina > 75);
  const sortedByOdds = [...candidates].sort((a, b) => b.odds_base - a.odds_base);
  const topPick = sortedByOdds[0];

  return {
    name: '穴狙い 花子',
    style: '穴党',
    color: 'text-red-600',
    icon: '🎯',
    prediction: {
      win: topPick.number,
      comment: `${topPick.name}に大穴の可能性！この馬、調教の動きが素晴らしい。複勝でコツコツ狙うのも手だが、ここは単勝で勝負！`,
      confidence: 45,
      recommendedBet: 'PLACE',
    },
  };
};

/**
 * データ派：能力値を分析して推奨
 */
export const dataPredictor = (horses, race) => {
  const { distance } = race;

  // 距離適性を考慮してスコア計算
  const horsesWithScore = horses.map(horse => {
    let score;
    if (distance < 1600) {
      // 短距離：スピード重視
      score = horse.speed * 0.8 + horse.stamina * 0.2;
    } else if (distance > 2200) {
      // 長距離：スタミナ重視
      score = horse.speed * 0.4 + horse.stamina * 0.6;
    } else {
      // 中距離：バランス
      score = horse.speed * 0.6 + horse.stamina * 0.4;
    }

    return { ...horse, score };
  });

  const sortedByScore = [...horsesWithScore].sort((a, b) => b.score - a.score);
  const topPick = sortedByScore[0];
  const secondPick = sortedByScore[1];

  let distanceAnalysis = '';
  if (distance < 1600) {
    distanceAnalysis = 'この距離ならスピード能力が重要';
  } else if (distance > 2200) {
    distanceAnalysis = 'この距離ではスタミナが決め手';
  } else {
    distanceAnalysis = 'この距離はスピードとスタミナのバランスが鍵';
  }

  return {
    name: 'データ分析 一郎',
    style: 'データ派',
    color: 'text-green-600',
    icon: '📊',
    prediction: {
      win: topPick.number,
      comment: `${distanceAnalysis}。能力値的には${topPick.name}が最有力。${secondPick.name}との馬連も面白い。`,
      confidence: 70,
      recommendedBet: 'QUINELLA',
      quinella: [topPick.number, secondPick.number],
    },
  };
};

/**
 * すべての予想家の予想を取得
 */
export const getAllPredictions = (horses, race) => {
  return [
    favoritePredictor(horses),
    darkHorsePredictor(horses),
    dataPredictor(horses, race),
  ];
};

/**
 * 予想家の的中率を計算（実績シミュレーション）
 */
export const getPredictorStats = (predictorName) => {
  // シミュレーション用の固定データ
  const stats = {
    '本命 太郎': {
      totalPredictions: 120,
      hits: 42,
      roi: 85,
    },
    '穴狙い 花子': {
      totalPredictions: 120,
      hits: 28,
      roi: 145,
    },
    'データ分析 一郎': {
      totalPredictions: 120,
      hits: 38,
      roi: 112,
    },
  };

  return stats[predictorName] || { totalPredictions: 0, hits: 0, roi: 0 };
};
