import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

/**
 * ============================================================================
 * Hardhat Configuration File (TypeScript) / Hardhat 配置文件 (TypeScript)
 * ============================================================================
 * 
 * Configuration Notes / 配置说明：
 * 1. Solidity compiler version and optimization settings / Solidity 编译器版本和优化设置
 * 2. Network configuration (local, testnet, mainnet) / 网络配置（本地、测试网、主网）
 * 3. Etherscan verification configuration / Etherscan 验证配置
 * 4. Gas reporting configuration / Gas 报告配置
 * 5. Test configuration / 测试配置
 */

const config: HardhatUserConfig = {
  // ============================================================================
  // Solidity Compiler Configuration / Solidity 编译器配置
  // ============================================================================
  solidity: {
    version: "0.8.28",  // Use 0.8.24 for best compatibility with OpenZeppelin 5.x / 使用 0.8.24 以获得与 OpenZeppelin 5.x 的最佳兼容性
    settings: {
      optimizer: {
        enabled: true,    // Enable optimizer to reduce gas consumption / 启用优化器以降低 gas 消耗
        runs: 200         // Optimization runs (200 is recommended for balance) / 优化运行次数（200 是平衡部署和运行成本的推荐值）
      },
      // Optional: Enable viaIR for better optimization (longer compile time)
      // 可选：启用 viaIR 获得更好的优化（但编译时间更长）
      viaIR: true,
      
      // EVM version / EVM 版本
      evmVersion: "cancun"  // Latest EVM version / 最新的 EVM 版本
    }
  },
  
  // ============================================================================
  // Network Configuration / 网络配置
  // ============================================================================
  networks: {
    // Local Hardhat Network / 本地 Hardhat 网络
    hardhat: {
    chainId: 31337,
      // Optional: Fork mainnet for testing / 可选：模拟主网环境
      // forking: {
      //   url: process.env.MAINNET_RPC_URL || "",
      //   blockNumber: 15000000  // Fixed block height for consistent testing / 固定区块高度以保证测试一致性
      // }
    },
    
    // Local Node (started with npx hardhat node) / 本地节点（使用 npx hardhat node 启动）
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    
    // ========== Ethereum Testnets / 以太坊测试网 ==========
    
    // Sepolia Testnet (Recommended) / Sepolia 测试网（推荐）
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto"  // Auto gas price / 自动获取 gas 价格
    },
    
    // Goerli Testnet (Being deprecated) / Goerli 测试网（即将弃用）
    goerli: {
      url: process.env.GOERLI_RPC_URL || "https://rpc.ankr.com/eth_goerli",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5
    },
    
    // ========== Polygon Testnets / Polygon 测试网 ==========
    
    // Mumbai Testnet (Polygon) / Mumbai 测试网（Polygon）
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 20000000000  // 20 Gwei
    },
    
    // Amoy Testnet (Polygon new testnet) / Amoy 测试网（Polygon 新测试网）
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002
    },
    
    // ========== Mainnet Configuration (Use with caution!) / 主网配置（谨慎使用！）==========
    
    // Ethereum Mainnet / 以太坊主网
    // mainnet: {
    //   url: process.env.MAINNET_RPC_URL || "",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 1,
    //   gasPrice: "auto"
    // },
    
    // Polygon Mainnet / Polygon 主网
    // polygon: {
    //   url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 137
    // }
  },
  
  // ============================================================================
  // Etherscan Verification Configuration / Etherscan 验证配置
  // ============================================================================
  etherscan: {
    apiKey: {
      // Ethereum
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      
      // Polygon
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || ""
    },
    // Custom chain configuration (if needed) / 自定义链配置（如果需要）
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },
  
  // ============================================================================
  // Gas Reporter Configuration / Gas 报告配置
  // ============================================================================
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",  // Enable by setting environment variable / 设置环境变量 REPORT_GAS=true 启用
    currency: "USD",                               // Currency unit / 货币单位
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,  // Get real-time prices / 获取实时价格
    outputFile: "gas-report.txt",                 // Output file / 输出文件
    noColors: false,                              // Color output / 彩色输出
    // Optional: Specify token price source / 可选：指定代币价格来源
    // token: "ETH",  // or "MATIC"
    // gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice"
  },
  
  // ============================================================================
  // Path Configuration / 路径配置
  // ============================================================================
  paths: {
    sources: "./contracts",     // Contract source directory / 合约源码目录
    tests: "./test",           // Test file directory / 测试文件目录
    cache: "./cache",          // Cache directory / 缓存目录
    artifacts: "./artifacts"   // Build artifacts directory / 编译产物目录
  },
  
  // ============================================================================
  // Mocha Test Configuration / Mocha 测试配置
  // ============================================================================
  mocha: {
    timeout: 60000,  // Test timeout (milliseconds) / 测试超时时间（毫秒）
    // Optional: Only run specific tests / 可选：只运行特定测试
    // grep: "Create Commitment"
  },
  
  // ============================================================================
  // TypeChain Configuration / TypeChain 配置
  // ============================================================================
  typechain: {
    outDir: "typechain-types",  // Output directory for generated types / 生成的类型文件输出目录
    target: "ethers-v6",        // Target library / 目标库
  }
};

export default config;