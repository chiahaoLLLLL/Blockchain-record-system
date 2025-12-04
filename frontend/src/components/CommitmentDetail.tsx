import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import CommitmentStatus from './CommitmentStatus'
import ShareLink from './ShareLink'
import { Commitment } from '../types'
import { truncateAddress } from '../utils/hash'

export default function CommitmentDetail() {
  const { commitmentId } = useParams<{ commitmentId: string }>()
  const { getCommitment } = useContract()
  
  const [commitment, setCommitment] = useState<Commitment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCommitment = async () => {
      if (!commitmentId) {
        setError('Invalid commitment ID')
        setLoading(false)
        return
      }

      try {
        const data = await getCommitment(commitmentId)
        console.log("  CommitmentDetail调用getCommitment, data为："+ data);
        if (data) {
          setCommitment(data)
        } else {
          console.log(" CommitmentDetail调用useContract()失败");
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
  }, [commitmentId, getCommitment])

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
        <h1 className="text-3xl font-bold text-gray-900">Commitment Details</h1>
        <p className="text-gray-600 mt-2">承诺详情</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Basic Information / 基本信息</h3>
          
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Commitment ID</p>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">{commitment.id}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Content Hash / 内容哈希</p>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">{commitment.contentHash}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Initiator / 发起人</p>
                <p className="font-mono text-sm">{truncateAddress(commitment.initiator)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Created At / 创建时间</p>
                <p className="text-sm">{new Date(commitment.createdAt * 1000).toLocaleString()}</p>
              </div>
            </div>

            {commitment.completedAt && commitment.completedAt > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed At / 完成时间</p>
                <p className="text-sm">{new Date(commitment.completedAt * 1000).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature Status */}
        <CommitmentStatus commitment={commitment} />

        {/* Share Link */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Share / 分享</h3>
          <ShareLink commitmentId={commitment.id} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/" className="btn-secondary flex-1 text-center">
            ← Back to Home
          </Link>
          <Link to={`/sign/${commitment.id}`} className="btn-primary flex-1 text-center">
            Go to Sign Page →
          </Link>
        </div>
      </div>
    </div>
  )
}