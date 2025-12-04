// 承诺状态枚举
export enum CommitmentStatus {
  PENDING = 0,
  PARTIALLY_SIGNED = 1,
  COMPLETED = 2,
  CANCELLED = 3
}

// 签名者信息
export interface Signer {
  address: string
  hasSigned: boolean
  signedAt?: number
}

// 见证者信息
export interface Witness {
  address: string
  hasSigned: boolean
  signedAt?: number
}

// 承诺详情
export interface Commitment {
  id: string
  contentHash: string
  initiator: string
  signer: Signer
  witnesses: Witness[]
  status: CommitmentStatus
  createdAt: number
  completedAt?: number
}

// 创建承诺参数
export interface CreateCommitmentParams {
  contentHash: string
  signerAddress: string
  witnessAddresses: string[]
}

// 钱包状态
export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balance: string | null
  isCorrectNetwork: boolean
}

// 交易状态
export interface TransactionState {
  isPending: boolean
  hash: string | null
  error: string | null
}

// 文件信息
export interface FileInfo {
  name: string
  size: number
  type: string
  hash: string
}