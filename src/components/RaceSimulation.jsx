import { useState, useEffect } from 'react'
import { simulateRace, calculatePayout, generateRaceCommentary } from '../utils/raceSimulator'
import { addHistory } from '../utils/storage'

function RaceSimulation({ race, bets, userData, updateUserData, onFinish }) {
  const [raceProgress, setRaceProgress] = useState(0)
  const [raceResults, setRaceResults] = useState(null)
  const [commentary, setCommentary] = useState('')
  const [isRaceFinished, setIsRaceFinished] = useState(false)
  const [payoutResults, setPayoutResults] = useState([])
  const [totalPayout, setTotalPayout] = useState(0)

  useEffect(() => {
    // レース開始
    const results = simulateRace(race)
    setRaceResults(results)

    // レース進行アニメーション
    const interval = setInterval(() => {
      setRaceProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRaceFinished(true)
          return 100
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // 実況更新
  useEffect(() => {
    if (raceResults && raceProgress < 100) {
      const newCommentary = generateRaceCommentary(race, raceResults, raceProgress)
      setCommentary(newCommentary)
    }
  }, [raceProgress, raceResults])

  // レース終了時の処理
  useEffect(() => {
    if (isRaceFinished && raceResults) {
      // 払い戻し計算
      const results = bets.map((bet) => {
        const payoutResult = calculatePayout(
          bet.betType,
          bet.selectedHorses,
          raceResults,
          bet.amount
        )

        // 履歴に追加
        addHistory({
          race_id: race.id,
          race_name: race.name,
          bet_type: bet.betType,
          target: bet.selectedHorses,
          amount: bet.amount,
          result: payoutResult.hit ? 'HIT' : 'MISS',
          payout: payoutResult.payout,
          odds: payoutResult.odds,
          timestamp: new Date().toISOString(),
        })

        return {
          ...bet,
          ...payoutResult,
        }
      })

      setPayoutResults(results)

      // 合計払い戻し
      const total = results.reduce((sum, r) => sum + r.payout, 0)
      setTotalPayout(total)

      // 所持金更新
      const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0)
      const newWallet = userData.wallet - totalBetAmount + total

      updateUserData({
        ...userData,
        wallet: newWallet,
      })
    }
  }, [isRaceFinished, raceResults])

  if (!raceResults) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-2xl">レースを準備中...</div>
      </div>
    )
  }

  const { first, second, third, allHorses } = raceResults

  // 各馬の位置を計算（進行度に基づく）
  const getHorsePosition = (index) => {
    const baseProgress = raceProgress
    const variation = (allHorses[index].score / 100) * 10
    return Math.min(100, baseProgress + variation - (index * 3))
  }

  const betTypeNames = {
    WIN: '単勝',
    PLACE: '複勝',
    QUINELLA: '馬連',
    EXACTA: '馬単',
    TRIFECTA: '3連単',
  }

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0)
  const profit = totalPayout - totalBetAmount

  return (
    <div className="space-y-6">
      {/* レースタイトル */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{race.name}</h1>
        <p className="text-white/70">{race.track} {race.distance}m</p>
      </div>

      {/* レースアニメーション */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <div className="mb-4">
          <div className="flex justify-between text-white/60 text-sm mb-2">
            <span>スタート</span>
            <span>ゴール</span>
          </div>
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-yellow-400 h-full transition-all duration-100"
              style={{ width: `${raceProgress}%` }}
            />
          </div>
        </div>

        {/* 馬の位置表示 */}
        <div className="space-y-2 mb-6">
          {allHorses.map((horse, index) => {
            const position = getHorsePosition(index)
            return (
              <div key={horse.id} className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/60 text-sm w-8">#{horse.number}</span>
                  <span className="text-white text-sm flex-1">{horse.name}</span>
                  {isRaceFinished && index < 3 && (
                    <span className="text-yellow-400 font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
                <div className="bg-white/10 rounded-full h-8 overflow-hidden relative">
                  <div
                    className={`h-full flex items-center justify-end pr-2 transition-all duration-100 ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${position}%` }}
                  >
                    <span className="text-2xl">🏇</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 実況 */}
        <div className="bg-green-900/50 rounded-lg p-4 border-2 border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📢</span>
            <span className="text-green-400 font-bold">実況</span>
          </div>
          <p className="text-white text-lg">{commentary}</p>
        </div>
      </div>

      {/* レース結果 */}
      {isRaceFinished && (
        <>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">着順</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResultCard place="1着" horse={first} color="from-yellow-500 to-yellow-600" emoji="🥇" />
              <ResultCard place="2着" horse={second} color="from-gray-400 to-gray-500" emoji="🥈" />
              <ResultCard place="3着" horse={third} color="from-orange-500 to-orange-600" emoji="🥉" />
            </div>
          </div>

          {/* 払い戻し結果 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">払い戻し結果</h2>

            {payoutResults.length > 0 ? (
              <div className="space-y-3">
                {payoutResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      result.hit ? 'bg-green-500/20 border-2 border-green-400' : 'bg-red-500/20 border-2 border-red-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl`}>{result.hit ? '✅' : '❌'}</span>
                        <div>
                          <p className="text-white font-bold">{betTypeNames[result.betType]}</p>
                          <p className="text-white/60 text-sm">
                            {result.selectedHorses.map(id => {
                              const horse = race.horses.find(h => h.id === id)
                              return horse ? `${horse.number}.${horse.name}` : ''
                            }).join(' - ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-sm">購入: ¥{result.amount.toLocaleString()}</p>
                        {result.hit && (
                          <>
                            <p className="text-yellow-400 font-bold">オッズ: {result.odds}倍</p>
                            <p className="text-green-400 font-bold text-xl">払戻: ¥{result.payout.toLocaleString()}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 合計 */}
                <div className="mt-6 pt-6 border-t-2 border-white/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-white/60 text-sm mb-1">購入金額</p>
                      <p className="text-white font-bold text-xl">¥{totalBetAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">払戻金額</p>
                      <p className="text-yellow-400 font-bold text-xl">¥{totalPayout.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">収支</p>
                      <p className={`font-bold text-2xl ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/60 text-center py-8">馬券を購入していませんでした</p>
            )}

            <button
              onClick={onFinish}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-lg transition shadow-lg"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// 着順カード
function ResultCard({ place, horse, color, emoji }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white text-center shadow-lg`}>
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="text-sm opacity-90 mb-1">{place}</p>
      <p className="text-2xl font-bold mb-1">{horse.name}</p>
      <p className="text-sm opacity-75">#{horse.number} / {horse.jockey}</p>
    </div>
  )
}

export default RaceSimulation
