import { useState } from 'react'
import { isAddress } from 'ethers'
import { useWallet } from '../hooks/useWallet'
import { useContract } from '../hooks/useContract'
import FileUpload from './FileUpload'
import ShareLink from './ShareLink'
import { FileInfo } from '../types'
import { truncateAddress } from '../utils/hash'

export default function CreateCommitment() {
  const { isConnected, address } = useWallet()
  const { createCommitment, txState } = useContract()
  
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [signerAddress, setSignerAddress] = useState('')
  const [witnesses, setWitnesses] = useState<string[]>([''])
  const [createdCommitmentId, setCreatedCommitmentId] = useState<string | null>(null)

  const handleAddWitness = () => {
    setWitnesses([...witnesses, ''])
  }

  const handleRemoveWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index))
  }

  const handleWitnessChange = (index: number, value: string) => {
    const newWitnesses = [...witnesses]
    newWitnesses[index] = value
    setWitnesses(newWitnesses)
  }

  const validateForm = (): boolean => {
    if (!fileInfo?.hash) return false
    if (!signerAddress || !isAddress(signerAddress)) return false
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const validWitnesses = witnesses.filter(w => w && isAddress(w))
    const commitmentId = await createCommitment(
      fileInfo!.hash,
      signerAddress,
      validWitnesses
    )

    if (commitmentId) {
      setCreatedCommitmentId(commitmentId)
    }
  }

  const handleReset = () => {
    setFileInfo(null)
    setSignerAddress('')
    setWitnesses([''])
    setCreatedCommitmentId(null)
  }

  // 成功创建后显示分享链接
  if (createdCommitmentId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Commitment Created!</h2>
            <p className="text-gray-600 mt-2">承诺已成功创建并上链</p>
          </div>

          <ShareLink commitmentId={createdCommitmentId} />

          <div className="mt-6 flex gap-3">
            <button onClick={handleReset} className="btn-secondary flex-1">
              Create New / 创建新承诺
            </button>
            <a href={`/commitment/${createdCommitmentId}`} className="btn-primary flex-1 text-center">
              View Details / 查看详情
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Commitment</h1>
        <p className="text-gray-600 mt-2">创建新承诺</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: File Upload */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">1</span>
            <h3 className="font-semibold text-gray-900">Select File / 选择文件</h3>
          </div>
          <FileUpload onFileSelect={setFileInfo} />
        </div>

        {/* Step 2: Initiator Info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">2</span>
            <h3 className="font-semibold text-gray-900">Initiator / 发起人</h3>
          </div>
          
          {isConnected && address ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{truncateAddress(address)}</p>
                  <p className="text-sm text-green-600">Auto-sign enabled / 自动签名</p>
                </div>
              </div>
              <span className="badge badge-signed">Connected</span>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              Please connect your wallet first / 请先连接钱包
            </div>
          )}
        </div>

        {/* Step 3: Signer */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">3</span>
            <h3 className="font-semibold text-gray-900">Signer / 签约者</h3>
          </div>
          
          <input
            type="text"
            value={signerAddress}
            onChange={(e) => setSignerAddress(e.target.value)}
            placeholder="0x..."
            className={`input-field font-mono ${
              signerAddress && !isAddress(signerAddress) 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : ''
            }`}
          />
          {signerAddress && !isAddress(signerAddress) && (
            <p className="text-red-500 text-sm mt-2">Invalid address / 地址格式无效</p>
          )}
        </div>

        {/* Step 4: Witnesses */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">4</span>
            <h3 className="font-semibold text-gray-900">Witnesses (Optional) / 见证者（可选）</h3>
          </div>

          <div className="space-y-3">
            {witnesses.map((witness, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={witness}
                  onChange={(e) => handleWitnessChange(index, e.target.value)}
                  placeholder="0x..."
                  className={`input-field font-mono flex-1 ${
                    witness && !isAddress(witness) 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : ''
                  }`}
                />
                {witnesses.length > 1 && (
                  <button
                    onClick={() => handleRemoveWitness(index)}
                    className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            <button
              onClick={handleAddWitness}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Witness / 添加见证者
            </button>
          </div>
        </div>

        {/* Error Display */}
        {txState.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {txState.error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isConnected || !validateForm() || txState.isPending}
          className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
        >
          {txState.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create Commitment / 创建承诺
            </>
          )}
        </button>
      </div>
    </div>
  )
}