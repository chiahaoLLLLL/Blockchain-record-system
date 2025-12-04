import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { BrowserProvider, formatEther } from 'ethers'
import { CURRENT_CHAIN_ID, isSupportedNetwork } from '../utils/contract'
import { WalletState } from '../types'

type EthereumEventHandler = (...args: unknown[]) => void;

interface WalletContextType extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: () => Promise<void>
  provider: BrowserProvider | null
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  balance: null,
  isCorrectNetwork: false
}

export const WalletContext = createContext<WalletContextType>({
  ...initialState,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
  provider: null
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)

  // 更新账户信息
  const updateAccountInfo = useCallback(async (ethProvider: BrowserProvider) => {
    try {
      const signer = await ethProvider.getSigner()
      const address = await signer.getAddress()
      const balance = await ethProvider.getBalance(address)
      const network = await ethProvider.getNetwork()
      const chainId = Number(network.chainId)

      setState({
        isConnected: true,
        address,
        chainId,
        balance: formatEther(balance),
        isCorrectNetwork: isSupportedNetwork(chainId)
      })
    } catch (err) {
      console.error('Failed to update account info:', err)
    }
  }, [])

  // 连接钱包
  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('请安装 MetaMask 钱包')
      return
    }

    try {
      const ethProvider = new BrowserProvider(window.ethereum)
      await ethProvider.send('eth_requestAccounts', [])
      setProvider(ethProvider)
      await updateAccountInfo(ethProvider)
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }, [updateAccountInfo])

  // 断开连接
  const disconnect = useCallback(() => {
    setState(initialState)
    setProvider(null)
  }, [])

  // 切换网络
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CURRENT_CHAIN_ID.toString(16)}` }]
      })
    } catch (err: unknown) {
      // 如果网络不存在，添加网络（仅适用于本地网络）
      if ((err as { code?: number })?.code === 4902 && CURRENT_CHAIN_ID === 31337) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${CURRENT_CHAIN_ID.toString(16)}`,
              chainName: 'Localhost 8545',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545']
            }]
          })
        } catch (addErr) {
          console.error('Failed to add network:', addErr)
        }
      } else {
        console.error('Failed to switch network:', err)
      }
    }
  }, [])

  // 监听账户变化
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else if (provider) {
        await updateAccountInfo(provider)
      }
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged as EthereumEventHandler)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged as EthereumEventHandler)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [provider, disconnect, updateAccountInfo])

  // 自动连接（如果之前已连接）
  // useEffect(() => {
  //   const autoConnect = async () => {
  //     if (typeof window.ethereum !== 'undefined') {
  //       const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  //       if (accounts.length > 0) {
  //         await connect()
  //       }
  //     }
  //   }
  //   autoConnect()
  // }, [connect])

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, switchNetwork, provider }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}

// TypeScript 类型声明
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}