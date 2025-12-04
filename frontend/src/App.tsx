import { Routes, Route } from 'react-router-dom'
//import { WalletProvider } from './hooks/useWallet'
import WalletConnect from './components/WalletConnect'
import CreateCommitment from './components/CreateCommitment'
import SignCommitment from './components/SignCommitment'
import CommitmentDetail from './components/CommitmentDetail'

function App() {
  return (
    //<WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Commitment Chain
              </span>
            </a>
            <WalletConnect />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<CreateCommitment />} />
            <Route path="/sign/:commitmentId" element={<SignCommitment />} />
            <Route path="/commitment/:commitmentId" element={<CommitmentDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
            Commitment Chain © 2024 - 基于区块链的承诺存证系统
          </div>
        </footer>
      </div>
    //</WalletProvider>
  )
}

export default App