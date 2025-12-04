import { Commitment, CommitmentStatus as Status } from '../types'
import { truncateAddress } from '../utils/hash'

interface Props {
  commitment: Commitment
}

export default function CommitmentStatus({ commitment }: Props) {
  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return <span className="badge badge-pending">Pending / 待签名</span>
      case Status.PARTIALLY_SIGNED:
        return <span className="badge bg-blue-100 text-blue-800">Partially Signed / 部分签名</span>
      case Status.COMPLETED:
        return <span className="badge badge-completed">Completed / 已完成</span>
      case Status.CANCELLED:
        return <span className="badge bg-red-100 text-red-800">Cancelled / 已取消</span>
      default:
        return <span className="badge">Unknown</span>
    }
  }

  const totalSigners = 1 + commitment.witnesses.length
  const signedCount = (commitment.signer.hasSigned ? 1 : 0) + 
    commitment.witnesses.filter(w => w.hasSigned).length
  const progressPercent = (signedCount / totalSigners) * 100

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Signature Status / 签名状态</h3>
        {getStatusBadge(commitment.status)}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress / 进度</span>
          <span>{signedCount} / {totalSigners} signed</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Signer */}
      <div className="space-y-3">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          commitment.signer.hasSigned 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              commitment.signer.hasSigned ? 'bg-green-100' : 'bg-gray-200'
            }`}>
              {commitment.signer.hasSigned ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Signer / 签约者</p>
              <p className="text-sm font-mono text-gray-600">{truncateAddress(commitment.signer.address)}</p>
            </div>
          </div>
          <div className="text-right">
            {commitment.signer.hasSigned ? (
              <>
                <span className="text-green-600 text-sm font-medium">Signed</span>
                {commitment.signer.signedAt && commitment.signer.signedAt > 0 && (
                  <p className="text-xs text-gray-500">
                    {new Date(commitment.signer.signedAt * 1000).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-sm">Pending</span>
            )}
          </div>
        </div>

        {/* Witnesses */}
        {commitment.witnesses.map((witness, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              witness.hasSigned 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                witness.hasSigned ? 'bg-green-100' : 'bg-gray-200'
              }`}>
                {witness.hasSigned ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Witness #{index + 1} / 见证者</p>
                <p className="text-sm font-mono text-gray-600">{truncateAddress(witness.address)}</p>
              </div>
            </div>
            <div className="text-right">
              {witness.hasSigned ? (
                <>
                  <span className="text-green-600 text-sm font-medium">Signed</span>
                  {witness.signedAt && witness.signedAt > 0 && (
                    <p className="text-xs text-gray-500">
                      {new Date(witness.signedAt * 1000).toLocaleDateString()}
                    </p>
                  )}
                </>
              ) : (
                <span className="text-gray-500 text-sm">Pending</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}