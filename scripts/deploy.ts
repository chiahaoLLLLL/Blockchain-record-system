// scripts/deploy.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const CommitmentChain = await ethers.getContractFactory("CommitmentChain");
  
  // 部署代理合约 (这也是这一步最关键的地方)
  const commitmentChain = await upgrades.deployProxy(CommitmentChain, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });

  await commitmentChain.waitForDeployment();

  const proxyAddress = await commitmentChain.getAddress();
  console.log("CommitmentChain (Proxy) deployed to:", proxyAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});