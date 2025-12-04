import { useState } from 'react'
import { truncateHash } from '../utils/hash'

// interface Props {
//   commitmentId: string
// }
interface Props {
  commitmentId: bigint | number
}


export default function ShareLink({ commitmentId }: Props) {
  const [copied, setCopied] = useState(false)
  
    // 转成字符串（uint256 → string)
  const commitmentIdStr = String(commitmentId)

  const signUrl = `${window.location.origin}/sign/${commitmentIdStr}`
  //const signUrl = `${window.location.origin}/sign/${commitmentId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Commitment ID */}
      <div>
        <p className="text-sm text-gray-500 mb-2">Commitment ID</p>
        <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
          {truncateHash(commitmentId, 24, 20)}
        </div>
      </div>

      {/* Share Link */}
      <div>
        <p className="text-sm text-gray-500 mb-2">Share Link / 分享链接</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={signUrl}
            readOnly
            className="input-field flex-1 font-mono text-sm bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Next Steps / 下一步：</strong>
        </p>
        <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
          <li>Share this link with the signer / 将此链接分享给签约者</li>
          <li>Share with witnesses (if any) / 分享给见证者（如有）</li>
          <li>All parties sign to complete / 所有人签名即完成</li>
        </ol>
      </div>
    </div>
  )
}