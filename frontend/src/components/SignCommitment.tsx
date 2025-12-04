import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { useContract } from '../hooks/useContract'
import CommitmentStatus from './CommitmentStatus'
import { Commitment } from '../types'
import { truncateAddress, truncateHash } from '../utils/hash'

export default function SignCommitment() {
  const { commitmentId } = useParams<{ commitmentId: string }>()
  const { isConnected, address } = useWallet()
  const { getCommitment, signAsSigner, signAsWitness, txState } = useContract()
  
  const [commitment, setCommitment] = useState<Commitment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signSuccess, setSignSuccess] = useState(false)

  // 检查当前用户的角色
  const isSigner = address?.toLowerCase() === commitment?.signer.address.toLowerCase()
  const isWitness = commitment?.witnesses.some(w => w.address.toLowerCase() === address?.toLowerCase())
  const witnessIndex = commitment?.witnesses.findIndex(w => w.address.toLowerCase() === address?.toLowerCase())
  
  // 检查是否已签名
  const hasSignedAsSigner = isSigner && commitment?.signer.hasSigned
  const hasSignedAsWitness = isWitness && witnessIndex !== undefined && witnessIndex >= 0 && commitment?.witnesses[witnessIndex].hasSigned

  // 加载承诺数据
  useEffect(() => {
    const loadCommitment = async () => {
      if (!commitmentId) {
        setError('Invalid commitment ID')
        setLoading(false)
        return
      }

      try {
        const data = await getCommitment(commitmentId)
        if (data) {
          setCommitment(data)
        } else {
          setError('Commitment not found')
        }
      } catch (err) {
        setError('Failed to load commitment')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadCommitment()
  }, [commitmentId, getCommitment, signSuccess])

  const handleSign = async () => {
    if (!commitmentId) return

    let success = false
    if (isSigner && !hasSignedAsSigner) {
      success = await signAsSigner(commitmentId)
    } else if (isWitness && !hasSignedAsWitness) {
      success = await signAsWitness(commitmentId)
    }

    if (success) {
      setSignSuccess(true)
      // 重新加载承诺数据
      const data = await getCommitment(commitmentId)
      if (data) setCommitment(data)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card flex items-center justify-center py-12">
          <div className="w-10 h-10 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !commitment) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Commitment not found'}</p>
          <Link to="/" className="btn-primary inline-block mt-6">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sign Commitment</h1>
        <p className="text-gray-600 mt-2">签署承诺</p>
      </div>

      <div className="space-y-6">
        {/* Commitment Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Commitment Details / 承诺详情</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Commitment ID</p>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">{truncateHash(commitment.id, 20, 16)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Content Hash</p>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">{truncateHash(commitment.contentHash, 20, 16)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Initiator / 发起人</p>
              <p className="font-mono text-sm">{truncateAddress(commitment.initiator)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Created At / 创建时间</p>
              <p className="text-sm">{new Date(commitment.createdAt * 1000).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Signature Status */}
        <CommitmentStatus commitment={commitment} />

        {/* Sign Action */}
        {isConnected ? (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Your Action / 您的操作</h3>
            
            {!isSigner && !isWitness ? (
              <div className="p-4 bg-gray-50 rounded-lg text-gray-600 text-center">
                <p>You are not a participant of this commitment</p>
                <p className="text-sm mt-1">您不是此承诺的参与者</p>
              </div>
            ) : hasSignedAsSigner || hasSignedAsWitness ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium text-green-800">You have already signed</p>
                <p className="text-sm text-green-600 mt-1">您已完成签名</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-blue-800">
                    {isSigner ? (
                      <>You are the <strong>Signer</strong> of this commitment</>
                    ) : (
                      <>You are a <strong>Witness</strong> of this commitment</>
                    )}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {isSigner ? '您是此承诺的签约者' : '您是此承诺的见证者'}
                  </p>
                </div>

                {txState.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                    {txState.error}
                  </div>
                )}

                <button
                  onClick={handleSign}
                  disabled={txState.isPending}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {txState.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Sign Now / 立即签名
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 font-medium">Please connect your wallet to sign</p>
              <p className="text-sm text-yellow-600 mt-1">请连接钱包以进行签名</p>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Back to Home / 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}