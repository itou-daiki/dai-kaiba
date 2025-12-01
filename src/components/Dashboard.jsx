import { getStatistics } from '../utils/storage'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function Dashboard({ userData, races, onSelectRace, onViewAllRaces }) {
  const stats = getStatistics()

  // 収支グラフのデータ（直近20レース）
  const recentHistory = userData.history.slice(0, 20).reverse()
  const chartData = {
    labels: recentHistory.map((_, i) => `${i + 1}`),
    datasets: [
      {
        label: '収支推移',
        data: recentHistory.reduce((acc, item, index) => {
          const prevBalance = index === 0 ? 1000000 : acc[index - 1]
          const change = (item.payout || 0) - item.amount
          acc.push(prevBalance + change)
          return acc
        }, []),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '収支推移（直近20レース）',
        color: '#fff',
      },
    },
    scales: {
      y: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="現在の所持金"
          value={`¥${stats.currentBalance.toLocaleString()}`}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          icon="💰"
        />
        <StatCard
          title="総利益"
          value={`${stats.profit >= 0 ? '+' : ''}¥${stats.profit.toLocaleString()}`}
          color={stats.profit >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}
          icon={stats.profit >= 0 ? '📈' : '📉'}
        />
        <StatCard
          title="的中率"
          value={`${stats.winRate}%`}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          icon="🎯"
        />
        <StatCard
          title="回収率"
          value={`${stats.roi}%`}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          icon="📊"
        />
      </div>

      {/* 収支グラフ */}
      {recentHistory.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* 開催中のレース */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📅</span>
            開催中のレース
          </h2>
          <button
            onClick={onViewAllRaces}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
          >
            すべて表示
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {races.slice(0, 4).map((race) => (
            <RacePreviewCard key={race.id} race={race} onSelect={() => onSelectRace(race)} />
          ))}
        </div>

        {races.length === 0 && (
          <p className="text-white/60 text-center py-8">レースデータを読み込み中...</p>
        )}
      </div>

      {/* 最近の結果 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📝</span>
          最近の結果
        </h2>

        {userData.history.length > 0 ? (
          <div className="space-y-2">
            {userData.history.slice(0, 5).map((item, index) => (
              <HistoryItem key={index} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-white/60 text-center py-8">
            まだレースに参加していません。レースに参加して馬券を購入しましょう！
          </p>
        )}
      </div>
    </div>
  )
}

// 統計カードコンポーネント
function StatCard({ title, value, color, icon }) {
  return (
    <div className={`${color} rounded-xl p-6 shadow-lg text-white`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm opacity-90">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

// レースプレビューカード
function RacePreviewCard({ race, onSelect }) {
  const gradeColors = {
    G1: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    G2: 'bg-gradient-to-r from-gray-300 to-gray-400',
    G3: 'bg-gradient-to-r from-orange-400 to-orange-500',
  }

  return (
    <div
      onClick={onSelect}
      className="bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition border border-white/20"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`${gradeColors[race.grade]} text-xs font-bold px-2 py-1 rounded text-black`}>
              {race.grade}
            </span>
            <span className="text-white/60 text-sm">第{race.week}週</span>
          </div>
          <h3 className="text-lg font-bold text-white">{race.name}</h3>
        </div>
      </div>
      <div className="flex gap-4 text-sm text-white/70">
        <span>{race.track} {race.distance}m</span>
        <span>天候: {race.weather}</span>
        <span>{race.horses.length}頭立て</span>
      </div>
    </div>
  )
}

// 履歴アイテム
function HistoryItem({ item }) {
  const isHit = item.result === 'HIT'
  const profit = (item.payout || 0) - item.amount

  const betTypeNames = {
    WIN: '単勝',
    PLACE: '複勝',
    QUINELLA: '馬連',
    EXACTA: '馬単',
    TRIFECTA: '3連単',
  }

  return (
    <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${isHit ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {isHit ? '的中' : '不的中'}
          </span>
          <span className="text-white font-medium">{betTypeNames[item.bet_type]}</span>
          <span className="text-white/60 text-sm">¥{item.amount.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export default Dashboard
