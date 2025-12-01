function RaceList({ races, onSelectRace, onBack }) {
  const gradeColors = {
    G1: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    G2: 'bg-gradient-to-r from-gray-300 to-gray-400',
    G3: 'bg-gradient-to-r from-orange-400 to-orange-500',
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span>🏁</span>
          レース一覧
        </h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
        >
          ← 戻る
        </button>
      </div>

      {/* レースカード一覧 */}
      <div className="grid grid-cols-1 gap-4">
        {races.map((race) => (
          <div
            key={race.id}
            onClick={() => onSelectRace(race)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/15 rounded-xl p-6 cursor-pointer transition shadow-lg border border-white/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`${gradeColors[race.grade]} text-sm font-bold px-3 py-1 rounded text-black`}>
                    {race.grade}
                  </span>
                  <span className="text-white/60">第{race.week}週</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{race.name}</h2>
                <p className="text-white/70 mb-3">{race.description}</p>
                <div className="flex gap-6 text-sm text-white/80">
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
              </div>
              <div className="text-right">
                <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-lg transition shadow-lg">
                  出走表を見る →
                </button>
              </div>
            </div>

            {/* 出走馬プレビュー（上位3頭） */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/60 text-xs mb-2">注目馬</p>
              <div className="flex gap-2">
                {race.horses
                  .sort((a, b) => a.odds_base - b.odds_base)
                  .slice(0, 3)
                  .map((horse, index) => (
                    <div
                      key={horse.id}
                      className="bg-white/5 rounded px-3 py-1 text-sm"
                    >
                      <span className="text-white/60">#{horse.number}</span>
                      <span className="text-white font-medium ml-2">{horse.name}</span>
                      <span className="text-yellow-400 ml-2">{horse.odds_base}倍</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RaceList
