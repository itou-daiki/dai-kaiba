// レースシミュレーションエンジン

/**
 * 各馬の強さスコアを計算
 * Score = (Speed × 0.6 + Stamina × 0.4) × Condition × Random(0.9, 1.1)
 */
const calculateStrengthScore = (horse, distance, weather) => {
  const { speed, stamina } = horse;

  // 距離適性：短距離はスピード重視、長距離はスタミナ重視
  let speedWeight = 0.6;
  let staminaWeight = 0.4;

  if (distance < 1600) {
    speedWeight = 0.75;
    staminaWeight = 0.25;
  } else if (distance > 2200) {
    speedWeight = 0.45;
    staminaWeight = 0.55;
  }

  // 天候による影響（雨の場合、一部の馬が苦手）
  let weatherModifier = 1.0;
  if (weather === '雨') {
    // スピードが高い馬は雨が苦手な傾向
    weatherModifier = speed > 85 ? 0.9 : 1.05;
  }

  // コンディション（ランダム要素）
  const condition = 0.85 + Math.random() * 0.3; // 0.85 ~ 1.15

  // レース展開のランダム性
  const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1

  // 最終スコア計算
  const baseScore = speed * speedWeight + stamina * staminaWeight;
  const finalScore = baseScore * condition * randomFactor * weatherModifier;

  return finalScore;
};

/**
 * 重み付けランダム抽選
 */
const weightedRandom = (items, weights) => {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
};

/**
 * レースをシミュレート
 */
export const simulateRace = (race) => {
  const { horses, distance, weather } = race;

  // 各馬のスコアを計算
  const horsesWithScores = horses.map((horse) => ({
    ...horse,
    score: calculateStrengthScore(horse, distance, weather),
  }));

  // スコア順にソート（降順）
  const sortedHorses = [...horsesWithScores].sort((a, b) => b.score - a.score);

  // 着順を決定（上位3頭を取得）
  const results = {
    first: sortedHorses[0],
    second: sortedHorses[1],
    third: sortedHorses[2],
    allHorses: sortedHorses,
  };

  return results;
};

/**
 * オッズを計算（動的）
 */
export const calculateOdds = (horse, allHorses, variation = 0.2) => {
  const { odds_base } = horse;

  // 基本オッズにランダムな変動を加える
  const randomVariation = 1 + (Math.random() * 2 - 1) * variation; // 0.8 ~ 1.2
  const currentOdds = odds_base * randomVariation;

  return Math.max(1.1, Math.round(currentOdds * 10) / 10);
};

/**
 * 複勝オッズを計算（単勝の約1/3）
 */
export const calculatePlaceOdds = (winOdds) => {
  const placeOdds = winOdds / 3;
  return Math.max(1.0, Math.round(placeOdds * 10) / 10);
};

/**
 * 馬券の的中判定と払い戻し計算
 */
export const calculatePayout = (betType, selectedHorses, raceResults, betAmount) => {
  const { first, second, third } = raceResults;

  switch (betType) {
    case 'WIN': {
      // 単勝：1着を当てる
      const [horseId] = selectedHorses;
      if (first.id === horseId) {
        const odds = calculateOdds(first, raceResults.allHorses);
        return {
          hit: true,
          payout: Math.floor(betAmount * odds),
          odds,
        };
      }
      return { hit: false, payout: 0, odds: 0 };
    }

    case 'PLACE': {
      // 複勝：3着以内を当てる
      const [horseId] = selectedHorses;
      const topThree = [first.id, second.id, third.id];

      if (topThree.includes(horseId)) {
        const horse = raceResults.allHorses.find(h => h.id === horseId);
        const winOdds = calculateOdds(horse, raceResults.allHorses);
        const placeOdds = calculatePlaceOdds(winOdds);
        return {
          hit: true,
          payout: Math.floor(betAmount * placeOdds),
          odds: placeOdds,
        };
      }
      return { hit: false, payout: 0, odds: 0 };
    }

    case 'QUINELLA': {
      // 馬連：1着・2着を順不同で当てる
      const [horse1, horse2] = selectedHorses.sort();
      const result = [first.id, second.id].sort();

      if (horse1 === result[0] && horse2 === result[1]) {
        // 馬連オッズは両馬の単勝オッズの積の一部
        const odds1 = calculateOdds(first, raceResults.allHorses);
        const odds2 = calculateOdds(second, raceResults.allHorses);
        const quinellaOdds = Math.round(Math.sqrt(odds1 * odds2) * 5 * 10) / 10;

        return {
          hit: true,
          payout: Math.floor(betAmount * quinellaOdds),
          odds: quinellaOdds,
        };
      }
      return { hit: false, payout: 0, odds: 0 };
    }

    case 'EXACTA': {
      // 馬単：1着・2着を順番通りに当てる
      const [horse1, horse2] = selectedHorses;

      if (first.id === horse1 && second.id === horse2) {
        const odds1 = calculateOdds(first, raceResults.allHorses);
        const odds2 = calculateOdds(second, raceResults.allHorses);
        const exactaOdds = Math.round(odds1 * odds2 * 3 * 10) / 10;

        return {
          hit: true,
          payout: Math.floor(betAmount * exactaOdds),
          odds: exactaOdds,
        };
      }
      return { hit: false, payout: 0, odds: 0 };
    }

    case 'TRIFECTA': {
      // 3連単：1着・2着・3着を順番通りに当てる
      const [horse1, horse2, horse3] = selectedHorses;

      if (first.id === horse1 && second.id === horse2 && third.id === horse3) {
        const odds1 = calculateOdds(first, raceResults.allHorses);
        const odds2 = calculateOdds(second, raceResults.allHorses);
        const odds3 = calculateOdds(third, raceResults.allHorses);
        const trifectaOdds = Math.round(odds1 * odds2 * odds3 * 10 * 10) / 10;

        return {
          hit: true,
          payout: Math.floor(betAmount * trifectaOdds),
          odds: trifectaOdds,
        };
      }
      return { hit: false, payout: 0, odds: 0 };
    }

    default:
      return { hit: false, payout: 0, odds: 0 };
  }
};

/**
 * レース実況を生成
 */
export const generateRaceCommentary = (race, results, currentProgress) => {
  const { name } = race;
  const { first, second, third, allHorses } = results;

  const commentaries = [
    `${name}、スタートしました！`,
    `序盤は${allHorses[Math.floor(Math.random() * 3)].name}が先頭に立っています！`,
    `1コーナーを回って、${second.name}が追い上げてきました！`,
    `向こう正面、${first.name}がポジションを上げています！`,
    `3コーナー！ ${third.name}も侮れない走りを見せています！`,
    `第4コーナーを回って、先頭は${first.name}！`,
    `直線に入りました！激しい叩き合いです！`,
    `残り200m！${first.name}が抜け出すか！`,
    `ゴール！勝ったのは${first.name}！`,
    `2着は${second.name}、3着は${third.name}でした！`,
  ];

  const index = Math.min(
    Math.floor((currentProgress / 100) * commentaries.length),
    commentaries.length - 1
  );

  return commentaries[index];
};
