import { useWallet } from '../hooks/useWallet'
import { truncateAddress } from '../utils/hash'
import { getNetworkName } from '../utils/contract'

export default function WalletConnect() {
  const { isConnected, address, balance, chainId, isCorrectNetwork, connect, disconnect, switchNetwork } = useWallet()

  if (!isConnected) {
    return (
      <button onClick={connect} className="btn-primary flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {!isCorrectNetwork && (
        <button onClick={switchNetwork} className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors">
          切换网络
        </button>
      )}
      
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">
            {address && truncateAddress(address)}
          </span>
          <span className="text-xs text-gray-500">
            {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH'}
            {chainId && ` · ${getNetworkName(chainId)}`}
          </span>
        </div>
        
        <button onClick={disconnect} className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Disconnect">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}