const hre = require("hardhat");
const { upgrades } = require("hardhat");

/**
 * ============================================================================
 * 合约升级脚本
 * ============================================================================
 * 
 * 用于升级已部署的可升级合约
 * 
 * 重要注意事项：
 * 1. 确保你有管理员权限（DEFAULT_ADMIN_ROLE）
 * 2. 新版本合约不能删除或修改已有的状态变量
 * 3. 新版本合约只能在末尾添加新的状态变量
 * 4. 充分测试新版本后再升级
 * 5. 考虑使用时间锁或多签来保护升级过程
 * 
 * 使用方法：
 * 1. 修改下面的 PROXY_ADDRESS 为你的代理合约地址
 * 2. 运行: npx hardhat run scripts/upgrade.ts --network <network-name>
 */

// ⚠️ 重要：修改为你的代理合约地址
const PROXY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // 替换为实际的代理合约地址

async function main() {
  console.log("=".repeat(70));
  console.log("开始升级 CommitmentChain 合约");
  console.log("=".repeat(70));
  console.log("PROXY_ADDRESS =" + PROXY_ADDRESS)
  // 验证代理地址
   if (PROXY_ADDRESS === "0x...") {
    console.error("\n❌ 错误: 请先修改 PROXY_ADDRESS 为实际的代理合约地址");
    process.exit(1);
  }
  
  // 获取升级账户
  const [upgrader] = await hre.ethers.getSigners();
  console.log("\n📋 升级信息:");
  console.log("  升级账户:", upgrader.address);
  console.log("  账户余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(upgrader.address)), "ETH");
  console.log("  网络:", hre.network.name);
  console.log("  代理地址:", PROXY_ADDRESS);
  
  // 获取当前版本信息
  console.log("\n📦 当前版本信息:");
  const currentContract = await hre.ethers.getContractAt("CommitmentChain", PROXY_ADDRESS);
  const currentVersion = await currentContract.version();
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("  当前版本:", currentVersion);
  console.log("  当前实现合约:", currentImplementation);
  
  // 验证权限
  console.log("\n🔐 验证权限:");
  const DEFAULT_ADMIN_ROLE = await currentContract.DEFAULT_ADMIN_ROLE();
  const hasRole = await currentContract.hasRole(DEFAULT_ADMIN_ROLE, upgrader.address);
  
  if (!hasRole) {
    console.error("  ✗ 你没有管理员权限，无法升级合约");
    console.error("  当前账户:", upgrader.address);
    process.exit(1);
  }
  console.log("  ✓ 权限验证通过");
  
  // 确认升级
  console.log("\n⚠️  警告: 你即将升级合约!");
  console.log("  这个操作会更新合约逻辑，但保留所有数据");
  console.log("  请确保新版本经过充分测试");
  
  // 在生产环境中，这里应该添加确认步骤
  // 例如：需要用户输入确认码或使用多签钱包
  
  console.log("\n🚀 开始升级...");
  
  // 获取新版本合约工厂
  const CommitmentChainV2 = await hre.ethers.getContractFactory("CommitmentChain");
  console.log("  ✓ 新版本合约工厂已创建");
  
  // 执行升级
  console.log("  ⏳ 正在升级...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, CommitmentChainV2);
  await upgraded.waitForDeployment();
  
  const newImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  
  console.log("  ✓ 升级成功!");
  
  // 显示升级信息
  console.log("\n📍 升级结果:");
  console.log("  代理地址 (不变):", PROXY_ADDRESS);
  console.log("  旧实现合约:", currentImplementation);
  console.log("  新实现合约:", newImplementation);
  
  // 验证升级
  console.log("\n🔍 验证升级:");
  const newVersion = await upgraded.version();
  console.log("  新版本:", newVersion);
  
  // 验证数据保留
  const commitmentCount = await upgraded.commitmentCount();
  console.log("  承诺数量:", commitmentCount.toString(), "(数据已保留)");
  
  const stillHasRole = await upgraded.hasRole(DEFAULT_ADMIN_ROLE, upgrader.address);
  console.log("  管理员权限:", stillHasRole ? "✓ 保留" : "✗ 丢失");
  
  // 验证新功能（如果有）
  // 例如：测试新添加的函数
  
  // 保存升级信息
  const upgradeInfo = {
    network: hre.network.name,
    proxyAddress: PROXY_ADDRESS,
    oldImplementation: currentImplementation,
    newImplementation: newImplementation,
    oldVersion: currentVersion,
    newVersion: newVersion,
    upgradedBy: upgrader.address,
    upgradedAt: new Date().toISOString()
  };
  
  console.log("\n📄 升级信息 (JSON):");
  console.log(JSON.stringify(upgradeInfo, null, 2));
  
  // 保存到文件
  const fs = require("fs");
  const path = require("path");
  const upgradesDir = path.join(__dirname, "../upgrades");
  
  if (!fs.existsSync(upgradesDir)) {
    fs.mkdirSync(upgradesDir);
  }
  
  const filename = `upgrade-${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(upgradesDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(upgradeInfo, null, 2));
  console.log(`\n💾 升级信息已保存到: ${filepath}`);
  
  // Etherscan 验证（如果不是本地网络）
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ 等待 Etherscan 验证...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      console.log("🔍 验证新实现合约...");
      await hre.run("verify:verify", {
        address: newImplementation,
        constructorArguments: [],
      });
      console.log("  ✓ 验证成功!");
    } catch (error) {
      //console.error("  ✗ 验证失败:", error.message);
      console.log("  ✗ 验证失败:", error.message);
      console.log("  你可以稍后手动验证");
    }
  }
  
  // 完成提示
  console.log("\n" + "=".repeat(70));
  console.log("✅ 升级完成!");
  console.log("=".repeat(70));
  console.log("\n📋 后续步骤:");
  console.log("  1. 测试新版本的所有功能");
  console.log("  2. 验证数据完整性");
  console.log("  3. 通知用户（如有必要）");
  console.log("  4. 监控合约运行状态");
  console.log("\n💡 提示:");
  console.log("  - 代理地址不变，用户无需更新");
  console.log("  - 所有历史数据已保留");
  console.log("  - 确保前端 ABI 已更新（如有新函数）");
  console.log("\n");
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 升级失败:");
    console.error(error);
    process.exit(1);
  });