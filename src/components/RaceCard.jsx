import { useState, useEffect } from 'react'
import { calculateOdds, calculatePlaceOdds } from '../utils/raceSimulator'
import { getAllPredictions } from '../utils/aiPredictors'

function RaceCard({ race, userData, currentBets, setCurrentBets, onStartRace, onBack }) {
  const [selectedBetType, setSelectedBetType] = useState('WIN')
  const [selectedHorses, setSelectedHorses] = useState([])
  const [betAmount, setBetAmount] = useState(1000)
  const [showPredictions, setShowPredictions] = useState(false)
  const [oddsMap, setOddsMap] = useState({})

  // オッズを計算
  useEffect(() => {
    const newOddsMap = {}
    race.horses.forEach(horse => {
      newOddsMap[horse.id] = calculateOdds(horse, race.horses)
    })
    setOddsMap(newOddsMap)
  }, [race])

  // AI予想を取得
  const predictions = getAllPredictions(race.horses, race)

  // 馬を選択
  const toggleHorseSelection = (horseId) => {
    const maxSelections = {
      WIN: 1,
      PLACE: 1,
      QUINELLA: 2,
      EXACTA: 2,
      TRIFECTA: 3,
    }

    const max = maxSelections[selectedBetType]

    if (selectedHorses.includes(horseId)) {
      setSelectedHorses(selectedHorses.filter(id => id !== horseId))
    } else {
      if (selectedHorses.length < max) {
        setSelectedHorses([...selectedHorses, horseId])
      } else {
        setSelectedHorses([...selectedHorses.slice(1), horseId])
      }
    }
  }

  // 馬券を購入
  const purchaseBet = () => {
    const requiredSelections = {
      WIN: 1,
      PLACE: 1,
      QUINELLA: 2,
      EXACTA: 2,
      TRIFECTA: 3,
    }

    if (selectedHorses.length !== requiredSelections[selectedBetType]) {
      alert(`${requiredSelections[selectedBetType]}頭選択してください`)
      return
    }

    if (betAmount < 100) {
      alert('最低購入金額は100円です')
      return
    }

    if (betAmount > userData.wallet) {
      alert('所持金が不足しています')
      return
    }

    const newBet = {
      betType: selectedBetType,
      selectedHorses: [...selectedHorses],
      amount: betAmount,
    }

    setCurrentBets([...currentBets, newBet])
    setSelectedHorses([])
    alert('馬券を購入しました！')
  }

  // 購入済み馬券を削除
  const removeBet = (index) => {
    setCurrentBets(currentBets.filter((_, i) => i !== index))
  }

  // 合計購入金額
  const totalBetAmount = currentBets.reduce((sum, bet) => sum + bet.amount, 0)

  // 券種名
  const betTypeNames = {
    WIN: '単勝',
    PLACE: '複勝',
    QUINELLA: '馬連',
    EXACTA: '馬単',
    TRIFECTA: '3連単',
  }

  const gradeColors = {
    G1: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    G2: 'bg-gradient-to-r from-gray-300 to-gray-400',
    G3: 'bg-gradient-to-r from-orange-400 to-orange-500',
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`${gradeColors[race.grade]} text-sm font-bold px-3 py-1 rounded text-black`}>
              {race.grade}
            </span>
            <span className="text-white/60">第{race.week}週</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{race.name}</h1>
          <p className="text-white/70 mt-1">{race.description}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
        >
          ← 戻る
        </button>
      </div>

      {/* レース情報 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex gap-6 text-white">
        <div className="flex items-center gap-2">
          <span>🏃</span>
          <span>{race.track} {race.distance}m</span>
        </div>
        <div className="flex items-center gap-2">
          <span>☁️</span>
          <span>天候: {race.weather}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🐴</span>
          <span>{race.horses.length}頭立て</span>
        </div>
      </div>

      {/* AI予想家 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <button
          onClick={() => setShowPredictions(!showPredictions)}
          className="w-full flex items-center justify-between text-white font-bold text-lg mb-4"
        >
          <span className="flex items-center gap-2">
            <span>🤖</span>
            AI予想家の見解
          </span>
          <span>{showPredictions ? '▲' : '▼'}</span>
        </button>

        {showPredictions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictions.map((pred, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{pred.icon}</span>
                  <div>
                    <p className={`font-bold ${pred.color}`}>{pred.name}</p>
                    <p className="text-xs text-white/60">{pred.style}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-yellow-400 font-bold text-xl">
                    ◎ {pred.prediction.win}番
                  </span>
                </div>
                <p className="text-sm text-white/80 mb-2">{pred.prediction.comment}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">信頼度: {pred.prediction.confidence}%</span>
                  <span className="bg-white/20 px-2 py-1 rounded">{betTypeNames[pred.prediction.recommendedBet]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 出走表 */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📋</span>
              出走表
            </h2>

            <div className="space-y-2">
              {race.horses.map((horse) => {
                const isSelected = selectedHorses.includes(horse.id)
                const winOdds = oddsMap[horse.id] || horse.odds_base
                const placeOdds = calculatePlaceOdds(winOdds)

                return (
                  <div
                    key={horse.id}
                    onClick={() => toggleHorseSelection(horse.id)}
                    className={`p-4 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-yellow-500/30 border-2 border-yellow-400'
                        : 'bg-white/5 hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">{horse.number}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg">{horse.name}</h3>
                          <p className="text-white/60 text-sm">{horse.jockey} / {horse.trainer}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 items-center">
                        <div className="text-center">
                          <p className="text-white/60 text-xs">能力</p>
                          <p className="text-white text-sm">S:{horse.speed} / St:{horse.stamina}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white/60 text-xs">単勝</p>
                          <p className="text-yellow-400 font-bold text-xl">{winOdds}倍</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white/60 text-xs">複勝</p>
                          <p className="text-yellow-400 font-bold text-xl">{placeOdds}倍</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 馬券購入パネル */}
        <div className="space-y-4">
          {/* 券種選択 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-white font-bold mb-3">券種を選択</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(betTypeNames).map(([type, name]) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedBetType(type)
                    setSelectedHorses([])
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedBetType === type
                      ? 'bg-yellow-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 購入金額 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-white font-bold mb-3">購入金額</h3>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
              min="100"
              step="100"
            />
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className="flex-1 px-2 py-1 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition"
                >
                  ¥{amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 購入ボタン */}
          <button
            onClick={purchaseBet}
            disabled={selectedHorses.length === 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition shadow-lg disabled:cursor-not-allowed"
          >
            馬券を購入
          </button>

          {/* 購入済み馬券 */}
          {currentBets.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white font-bold mb-3">購入済み馬券</h3>
              <div className="space-y-2">
                {currentBets.map((bet, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{betTypeNames[bet.betType]}</p>
                      <p className="text-white/60 text-sm">
                        {bet.selectedHorses.map(id => {
                          const horse = race.horses.find(h => h.id === id)
                          return horse ? `${horse.number}番` : ''
                        }).join('-')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-yellow-400 font-bold">¥{bet.amount.toLocaleString()}</p>
                      <button
                        onClick={() => removeBet(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between text-white mb-4">
                  <span>合計購入金額</span>
                  <span className="font-bold text-xl">¥{totalBetAmount.toLocaleString()}</span>
                </div>
                <button
                  onClick={onStartRace}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition shadow-lg"
                >
                  レース開始 🏁
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RaceCard
