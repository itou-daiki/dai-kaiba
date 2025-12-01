import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import RaceList from './components/RaceList'
import RaceCard from './components/RaceCard'
import RaceSimulation from './components/RaceSimulation'
import { getUserData, saveUserData } from './utils/storage'

function App() {
  const [currentView, setCurrentView] = useState('dashboard') // dashboard, raceList, raceCard, simulation
  const [userData, setUserData] = useState(null)
  const [races, setRaces] = useState([])
  const [selectedRace, setSelectedRace] = useState(null)
  const [currentBets, setCurrentBets] = useState([])

  // 初期化：ユーザーデータとレースデータを読み込み
  useEffect(() => {
    const data = getUserData()
    setUserData(data)

    // レースデータを読み込み
    fetch(`${import.meta.env.BASE_URL}data/races.json`)
      .then(res => res.json())
      .then(data => setRaces(data))
      .catch(err => console.error('Failed to load races:', err))
  }, [])

  // ユーザーデータを更新
  const updateUserData = (newData) => {
    setUserData(newData)
    saveUserData(newData)
  }

  // レースを選択
  const selectRace = (race) => {
    setSelectedRace(race)
    setCurrentBets([])
    setCurrentView('raceCard')
  }

  // レースを開始
  const startRace = () => {
    setCurrentView('simulation')
  }

  // ダッシュボードに戻る
  const backToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedRace(null)
    setCurrentBets([])
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">🏇</span>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">UmaSim</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-xs text-yellow-100">所持金</p>
                <p className="text-2xl font-bold text-white">
                  ¥{userData.wallet.toLocaleString()}
                </p>
              </div>
              <button
                onClick={backToDashboard}
                className="px-4 py-2 bg-white text-yellow-700 rounded-lg font-semibold hover:bg-yellow-50 transition"
              >
                ホーム
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {currentView === 'dashboard' && (
          <Dashboard
            userData={userData}
            races={races}
            onSelectRace={selectRace}
            onViewAllRaces={() => setCurrentView('raceList')}
          />
        )}

        {currentView === 'raceList' && (
          <RaceList
            races={races}
            onSelectRace={selectRace}
            onBack={backToDashboard}
          />
        )}

        {currentView === 'raceCard' && selectedRace && (
          <RaceCard
            race={selectedRace}
            userData={userData}
            currentBets={currentBets}
            setCurrentBets={setCurrentBets}
            onStartRace={startRace}
            onBack={() => setCurrentView('raceList')}
          />
        )}

        {currentView === 'simulation' && selectedRace && (
          <RaceSimulation
            race={selectedRace}
            bets={currentBets}
            userData={userData}
            updateUserData={updateUserData}
            onFinish={backToDashboard}
          />
        )}
      </main>

      {/* フッター */}
      <footer className="bg-green-950 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-green-200">
          <p className="text-sm">
            UmaSim - 競馬シミュレーションアプリ | 実際の金銭を賭けずに楽しめます
          </p>
          <p className="text-xs mt-2 text-green-400">
            Powered by React + Vite | Hosted on GitHub Pages
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
