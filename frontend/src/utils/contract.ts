// 合约配置
// 注意：部署合约后需要更新这个地址
export const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

// 支持的网络
export const SUPPORTED_CHAINS = {
  LOCALHOST: 31337,
  SEPOLIA: 11155111,
  MAINNET: 1
}

// 当前使用的网络
export const CURRENT_CHAIN_ID = SUPPORTED_CHAINS.LOCALHOST

// 合约 ABI
export const CONTRACT_ABI = [
  // Events
  // "event CommitmentCreated(bytes32 indexed commitmentId, address indexed initiator, bytes32 contentHash)",
  "event CommitmentCreated(uint256 indexed id, address indexed initiator, address indexed signer, string fileHash, uint256 timestamp)",

  //"event CommitmentSigned(bytes32 indexed commitmentId, address indexed signer, uint8 signerType)",
  "event CommitmentSigned(uint256 indexed id, address indexed signer, string role, uint256 timestamp)",

  //"event CommitmentCompleted(bytes32 indexed commitmentId, uint256 completedAt)",
  "event CommitmentCompleted(uint256 indexed commitmentId, uint256 timestamp)",

  //"event CommitmentCancelled(bytes32 indexed commitmentId)",
  "event CommitmentCancelled(uint256 indexed commitmentId)",
  // Read Functions
  //"function getCommitment(bytes32 commitmentId) view returns (tuple(bytes32 contentHash, address initiator, address signerAddress, bool signerHasSigned, uint256 signerSignedAt, uint8 status, uint256 createdAt, uint256 completedAt))",
  "function getCommitment(uint256 _commitmentId) view returns (uint256 id, address initiator, address signer, address[] witnesses, string fileHash, uint256 createdAt, bool initiatorSigned, bool signerSigned, uint256 witnessSignedCount, bool isCompleted, bool isFrozen, bool isVerified)",

  //"function getWitnesses(bytes32 commitmentId) view returns (tuple(address witnessAddress, bool hasSigned, uint256 signedAt)[])",
  "function getWitnesses(uint256 commitmentId) view returns (tuple(address witnessAddress, bool hasSigned, uint256 signedAt)[])",

  //"function getCommitmentStatus(bytes32 commitmentId) view returns (uint8)",
  "function getCommitmentStatus(uint256 commitmentId) view returns (uint8)",

  "function hasSignerSigned(bytes32 commitmentId) view returns (bool)",
  //"function hasWitnessSigned(bytes32 commitmentId, address witness) view returns (bool)",
  "function hasWitnessSigned(uint256 _commitmentId, address _witness) view returns (bool)",
  "function isCommitmentComplete(bytes32 commitmentId) view returns (bool)",
  "function commitmentExists(bytes32 commitmentId) view returns (bool)",

  // Write Functions
  //"function createCommitment(bytes32 contentHash, address signerAddress, address[] witnessAddresses) returns (bytes32)",
  "function createCommitment(string _fileHash, address _signer, address[] _witnesses) returns (uint256)",

  //"function signAsSigner(bytes32 commitmentId)",
  "function signAsSigner(uint256 _commitmentId)",

  //"function signAsWitness(bytes32 commitmentId)",
  "function signAsWitness(uint256 _commitmentId)",

  //"function cancelCommitment(bytes32 commitmentId)"
  "function cancelCommitment(uint256 commitmentId)"
]

// 获取网络名称
export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case SUPPORTED_CHAINS.LOCALHOST:
      return 'Localhost'
    case SUPPORTED_CHAINS.SEPOLIA:
      return 'Sepolia Testnet'
    case SUPPORTED_CHAINS.MAINNET:
      return 'Ethereum Mainnet'
    default:
      return 'Unknown Network'
  }
}

// 检查是否为支持的网络
export function isSupportedNetwork(chainId: number): boolean {
  return Object.values(SUPPORTED_CHAINS).includes(chainId)
}