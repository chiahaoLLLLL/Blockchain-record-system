import { useState, useCallback } from 'react'
import { Contract, ContractTransactionResponse } from 'ethers'
import { useWallet } from './useWallet'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract'
import { Commitment, CommitmentStatus, Witness, TransactionState } from '../types'

export function useContract() {
  const { provider, address, isConnected } = useWallet()
  const [txState, setTxState] = useState<TransactionState>({
    isPending: false,
    hash: null,
    error: null
  })

  // 获取合约实例（只读）
  const getReadContract = useCallback(() => {
    if (!provider) return null
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
  }, [provider])

  // 获取合约实例（可写）
  const getWriteContract = useCallback(async () => {
    if (!provider) return null
    const signer = await provider.getSigner()
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  }, [provider])

  // 创建承诺
  const createCommitment = useCallback(async (
    contentHash: string,
    signerAddress: string,
    witnessAddresses: string[]
  ): Promise<string | null> => {
    if (!isConnected) {
      setTxState({ isPending: false, hash: null, error: 'Please connect wallet first' })
      return null
    }

    setTxState({ isPending: true, hash: null, error: null })

    try {
      const contract = await getWriteContract()
      if (!contract) throw new Error('Contract not available')
      console.log("使用合约地址Using contract address:", contract.target ?? contract.address)
      console.log("ABI entries:", contract.interface.fragments);

      const tx: ContractTransactionResponse = await contract.createCommitment(
        contentHash,
        signerAddress,
        witnessAddresses
      )

      setTxState({ isPending: true, hash: tx.hash, error: null })

      const receipt = await tx.wait()
      
      // 从事件中获取 commitmentId
      const event = receipt?.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data })
          return parsed?.name === 'CommitmentCreated'
        } catch {
          return false
        }
      })

      if (event) {
        const parsed = contract.interface.parseLog({ topics: [...event.topics], data: event.data })
        const commitmentId = parsed?.args[0]
        console.log("useContract从事件中获取 commitmentId:"+commitmentId)
        setTxState({ isPending: false, hash: tx.hash, error: null })
        return commitmentId ? commitmentId.toString() : null
      }

      setTxState({ isPending: false, hash: tx.hash, error: null })
      return tx.hash
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Transaction failed'
      setTxState({ isPending: false, hash: null, error: errMsg })
      return null
    }
  }, [isConnected, getWriteContract])

  // 作为签约者签名
  const signAsSigner = useCallback(async (commitmentId: string): Promise<boolean> => {
    if (!isConnected) {
      setTxState({ isPending: false, hash: null, error: 'Please connect wallet first' })
      return false
    }

    setTxState({ isPending: true, hash: null, error: null })

    try {
      const contract = await getWriteContract()
      if (!contract) throw new Error('Contract not available')

      const tx: ContractTransactionResponse = await contract.signAsSigner(commitmentId)
      setTxState({ isPending: true, hash: tx.hash, error: null })

      await tx.wait()
      setTxState({ isPending: false, hash: tx.hash, error: null })
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Sign failed'
      setTxState({ isPending: false, hash: null, error: errMsg })
      return false
    }
  }, [isConnected, getWriteContract])

  // 作为见证者签名
  const signAsWitness = useCallback(async (commitmentId: string): Promise<boolean> => {
    if (!isConnected) {
      setTxState({ isPending: false, hash: null, error: 'Please connect wallet first' })
      return false
    }

    setTxState({ isPending: true, hash: null, error: null })

    try {
      const contract = await getWriteContract()
      if (!contract) throw new Error('Contract not available')

      const tx: ContractTransactionResponse = await contract.signAsWitness(commitmentId)
      setTxState({ isPending: true, hash: tx.hash, error: null })

      await tx.wait()
      setTxState({ isPending: false, hash: tx.hash, error: null })
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Sign failed'
      setTxState({ isPending: false, hash: null, error: errMsg })
      return false
    }
  }, [isConnected, getWriteContract])

  // 获取承诺详情
  const getCommitment = useCallback(async (commitmentId: string): Promise<Commitment | null> => {
    try {
      const contract = getReadContract()
      if (!contract) return null

      // 必须转换成 uint256 must transfer to uint256
      const id = BigInt(commitmentId)

      console.log("useContract获取承诺详情 commitmentId:"+commitmentId)
      console.log(`useContract获取承诺详情 id: ${id}  id类型为: ${typeof id}`)

      const data = await contract.getCommitment(id)
      console.log(`useContract获取承诺详情 data: ${data}`)

      const witnesses = await contract.getWitnesses(id)
      console.log(`useContract获取承诺详情 witnesses: ${witnesses}`)

      const witnessArray: Witness[] = witnesses.map((w: { witnessAddress: string; hasSigned: boolean; signedAt: bigint }) => ({
        address: w.witnessAddress,
        hasSigned: w.hasSigned,
        signedAt: Number(w.signedAt)
      }))

      return {
        id: commitmentId,
        contentHash: data.contentHash,
        initiator: data.initiator,
        signer: {
          address: data.signerAddress,
          hasSigned: data.signerHasSigned,
          signedAt: Number(data.signerSignedAt)
        },
        witnesses: witnessArray,
        status: data.status as CommitmentStatus,
        createdAt: Number(data.createdAt),
        completedAt: Number(data.completedAt)
      }
    } catch (err) {
      console.error('Failed to get commitment:', err)
      return null
    }
  }, [getReadContract])

  // 检查承诺是否存在
  const commitmentExists = useCallback(async (commitmentId: string): Promise<boolean> => {
    try {
      const contract = getReadContract()
      if (!contract) return false
      return await contract.commitmentExists(commitmentId)
    } catch {
      return false
    }
  }, [getReadContract])

  // 重置交易状态
  const resetTxState = useCallback(() => {
    setTxState({ isPending: false, hash: null, error: null })
  }, [])

  return {
    createCommitment,
    signAsSigner,
    signAsWitness,
    getCommitment,
    commitmentExists,
    txState,
    resetTxState,
    currentAddress: address
  }
}