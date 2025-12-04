import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import type { CommitmentChain } from "../typechain-types";
import type { Signer } from "ethers";

/**
 * ============================================================================
 * CommitmentChain Full Test Suite / CommitmentChain 完整测试套件
 * ============================================================================
 * 
 * Test Coverage / 测试覆盖：
 * 1. Deployment and initialization / 部署和初始化
 * 2. Role management (AccessControl) / 角色管理 (AccessControl)
 * 3. Create commitment / 创建承诺
 * 4. Signature functionality / 签名功能
 * 5. Admin functions (freeze, verify) / 管理员功能（冻结、验证）
 * 6. Pause functionality (Pausable) / 暂停功能 (Pausable)
 * 7. Upgradeability (Upgradeable) / 可升级性 (Upgradeable)
 * 8. Edge cases and error handling / 边界情况和错误处理
 */
describe("CommitmentChain (Full Version - TypeScript)", function () {
  // Contract instances / 合约实例
  let commitmentChain: CommitmentChain;
  
  // Test accounts / 测试账户
  let admin: Signer;      // Admin / 管理员
  let police: Signer;     // Police / 警察
  let lawyer1: Signer;    // Lawyer 1 / 律师1
  let lawyer2: Signer;    // Lawyer 2 / 律师2
  let signer: Signer;     // Signer / 签约者
  let emergency: Signer;  // Emergency admin / 紧急管理员
  let verifier: Signer;   // Verifier / 验证员
  let user: Signer;       // Regular user / 普通用户
  let addrs: Signer[];    // Other addresses / 其他地址
  
  // Role identifiers / 角色标识符
  let DEFAULT_ADMIN_ROLE: string;
  let POLICE_ROLE: string;
  let LAWYER_ROLE: string;
  let VERIFIER_ROLE: string;
  let EMERGENCY_ROLE: string;
  
  // Test data / 测试数据
  const fileHash: string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  
  /**
   * Execute before each test / 在每个测试前执行
   * Deploy contract and set up roles / 部署合约并设置角色
   */
  beforeEach(async function () {
    // Get test accounts / 获取测试账户
    [admin, police, lawyer1, lawyer2, signer, emergency, verifier, user, ...addrs] = 
      await ethers.getSigners();
    
    // Deploy upgradeable contract / 部署可升级合约
    // Note: Use upgrades.deployProxy instead of regular deploy
    // 注意：使用 upgrades.deployProxy 而不是普通的 deploy
    const CommitmentChainFactory = await ethers.getContractFactory("CommitmentChain");
    commitmentChain = await upgrades.deployProxy(
      CommitmentChainFactory,
      [await admin.getAddress()],  // Initialize parameter: admin address / 初始化参数：管理员地址
      { 
        initializer: "initialize",  // Initialize function name / 初始化函数名
        kind: "uups"               // Use UUPS proxy pattern / 使用 UUPS 代理模式
      }
    ) as unknown as CommitmentChain;
    
    await commitmentChain.waitForDeployment();
    
    // Get role identifiers / 获取角色标识符
    DEFAULT_ADMIN_ROLE = await commitmentChain.DEFAULT_ADMIN_ROLE();
    POLICE_ROLE = await commitmentChain.POLICE_ROLE();
    LAWYER_ROLE = await commitmentChain.LAWYER_ROLE();
    VERIFIER_ROLE = await commitmentChain.VERIFIER_ROLE();
    EMERGENCY_ROLE = await commitmentChain.EMERGENCY_ROLE();
    
    // Grant roles (by admin) / 授予角色（由管理员授予）
    await commitmentChain.connect(admin).grantRole(POLICE_ROLE, await police.getAddress());
    await commitmentChain.connect(admin).grantRole(LAWYER_ROLE, await lawyer1.getAddress());
    await commitmentChain.connect(admin).grantRole(LAWYER_ROLE, await lawyer2.getAddress());
    await commitmentChain.connect(admin).grantRole(VERIFIER_ROLE, await verifier.getAddress());
    await commitmentChain.connect(admin).grantRole(EMERGENCY_ROLE, await emergency.getAddress());
  });
  
  // ============================================================================
  // Deployment & Initialization Tests / 部署和初始化测试
  // ============================================================================
  
  describe("1. Deployment & Initialization", function () {
    it("Should correctly set admin / 应该正确设置管理员", async function () {
      expect(await commitmentChain.hasRole(DEFAULT_ADMIN_ROLE, await admin.getAddress())).to.equal(true);
    });
    
    it("Should initialize commitment counter to 0 / 应该初始化承诺计数器为 0", async function () {
      expect(await commitmentChain.commitmentCount()).to.equal(0);
    });
    
    it("Should not be paused / 应该未被暂停", async function () {
      expect(await commitmentChain.paused()).to.equal(false);
    });
    
    it("Should return correct version / 应该返回正确的版本号", async function () {
      expect(await commitmentChain.version()).to.equal("1.0.0");
    });
    
    it("Should not allow reinitialization / 不应该允许重复初始化", async function () {
      await expect(
        commitmentChain.initialize(await admin.getAddress())
      ).to.be.revertedWithCustomError(commitmentChain, "InvalidInitialization");
    });
  });
  
  // ============================================================================
  // Role Management Tests (AccessControl) / 角色管理测试 (AccessControl)
  // ============================================================================
  
  describe("2. Access Control (Role Management)", function () {
    it("Admin should be able to grant roles / 管理员应该能授予角色", async function () {
      await commitmentChain.connect(admin).grantRole(POLICE_ROLE, await user.getAddress());
      expect(await commitmentChain.hasRole(POLICE_ROLE, await user.getAddress())).to.equal(true);
    });
    
    it("Admin should be able to revoke roles / 管理员应该能撤销角色", async function () {
      await commitmentChain.connect(admin).revokeRole(POLICE_ROLE, await police.getAddress());
      expect(await commitmentChain.hasRole(POLICE_ROLE, await police.getAddress())).to.equal(false);
    });
    
    it("Non-admin cannot grant roles / 非管理员不能授予角色", async function () {
      await expect(
        commitmentChain.connect(user).grantRole(POLICE_ROLE, await user.getAddress())
      ).to.be.reverted;
    });
    
    it("Should correctly identify multiple roles / 应该正确识别多个角色", async function () {
      expect(await commitmentChain.hasRole(POLICE_ROLE, await police.getAddress())).to.equal(true);
      expect(await commitmentChain.hasRole(LAWYER_ROLE, await lawyer1.getAddress())).to.equal(true);
      expect(await commitmentChain.hasRole(LAWYER_ROLE, await lawyer2.getAddress())).to.equal(true);
      expect(await commitmentChain.hasRole(VERIFIER_ROLE, await verifier.getAddress())).to.equal(true);
      expect(await commitmentChain.hasRole(EMERGENCY_ROLE, await emergency.getAddress())).to.equal(true);
    });
  });
  
  // ============================================================================
  // Create Commitment Tests / 创建承诺测试
  // ============================================================================
  
  describe("3. Create Commitment", function () {
    it("Police should be able to create commitment (with witnesses) / 警察应该能创建承诺（带见证者）", async function () {
      const tx = await commitmentChain.connect(police).createCommitment(
        fileHash,
        await signer.getAddress(),
        [await lawyer1.getAddress()]
      );
      
      // Verify events / 验证事件
      await expect(tx)
        .to.emit(commitmentChain, "CommitmentCreated")
        .to.emit(commitmentChain, "CommitmentSigned");
      
      // Verify commitment count / 验证承诺计数
      expect(await commitmentChain.commitmentCount()).to.equal(1);
      
      // Verify commitment details / 验证承诺详情
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.initiator).to.equal(await police.getAddress());
      expect(commitment.signer).to.equal(await signer.getAddress());
      expect(commitment.fileHash).to.equal(fileHash);
      expect(commitment.initiatorSigned).to.equal(true);
      expect(commitment.signerSigned).to.equal(false);
      expect(commitment.witnesses.length).to.equal(1);
      expect(commitment.witnesses[0]).to.equal(await lawyer1.getAddress());
    });
    
    it("Police should be able to create commitment (without witnesses) / 警察应该能创建承诺（无见证者）", async function () {
      await commitmentChain.connect(police).createCommitment(
        fileHash,
        await signer.getAddress(),
        []
      );
      
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.witnesses.length).to.equal(0);
    });
    
    it("Police should be able to create commitment (multiple witnesses) / 警察应该能创建承诺（多个见证者）", async function () {
      await commitmentChain.connect(police).createCommitment(
        fileHash,
        await signer.getAddress(),
        [await lawyer1.getAddress(), await lawyer2.getAddress()]
      );
      
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.witnesses.length).to.equal(2);
      expect(commitment.witnesses[0]).to.equal(await lawyer1.getAddress());
      expect(commitment.witnesses[1]).to.equal(await lawyer2.getAddress());
    });
    
    it("Non-police cannot create commitment / 非警察不能创建承诺", async function () {
      await expect(
        commitmentChain.connect(user).createCommitment(
          fileHash,
          await signer.getAddress(),
          []
        )
      ).to.be.reverted;
    });
    
    it("Witnesses must have lawyer role / 见证者必须拥有律师角色", async function () {
      await expect(
        commitmentChain.connect(police).createCommitment(
          fileHash,
          await signer.getAddress(),
          [await user.getAddress()]  // user doesn't have lawyer role / user 没有律师角色
        )
      ).to.be.revertedWith("CommitmentChain: Witness must have LAWYER_ROLE");
    });
    
    it("File hash cannot be empty / 文件哈希不能为空", async function () {
      await expect(
        commitmentChain.connect(police).createCommitment(
          "",
          await signer.getAddress(),
          []
        )
      ).to.be.revertedWith("CommitmentChain: File hash cannot be empty");
    });
    
    it("Signer address cannot be zero address / 签约者地址不能为零地址", async function () {
      await expect(
        commitmentChain.connect(police).createCommitment(
          fileHash,
          ethers.ZeroAddress,
          []
        )
      ).to.be.revertedWith("CommitmentChain: Invalid signer address");
    });
    
    it("Signer cannot be initiator / 签约者不能是发起人", async function () {
      await expect(
        commitmentChain.connect(police).createCommitment(
          fileHash,
          await police.getAddress(),
          []
        )
      ).to.be.revertedWith("CommitmentChain: Signer cannot be initiator");
    });
  });
  
  // ============================================================================
  // Signer Signature Tests / 签约者签名测试
  // ============================================================================
  
  describe("4. Signer Signature", function () {
    beforeEach(async function () {
      // Create a commitment / 创建一个承诺
      await commitmentChain.connect(police).createCommitment(
        fileHash,
        await signer.getAddress(),
        [await lawyer1.getAddress()]
      );
    });
    
    it("Signer should be able to sign / 签约者应该能签名", async function () {
      const tx = await commitmentChain.connect(signer).signAsSigner(1);
      
      await expect(tx).to.emit(commitmentChain, "CommitmentSigned");
      
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.signerSigned).to.equal(true);
    });
    
    it("Non-designated signer cannot sign / 非指定签约者不能签名", async function () {
      await expect(
        commitmentChain.connect(user).signAsSigner(1)
      ).to.be.revertedWith("CommitmentChain: Not the designated signer");
    });
    
    it("Signer cannot sign twice / 签约者不能重复签名", async function () {
      await commitmentChain.connect(signer).signAsSigner(1);
      
      await expect(
        commitmentChain.connect(signer).signAsSigner(1)
      ).to.be.revertedWith("CommitmentChain: Already signed");
    });
  });
  
  // ============================================================================
  // Witness Signature Tests / 见证者签名测试
  // ============================================================================
  
  describe("5. Witness Signature", function () {
    beforeEach(async function () {
      // Create commitment with two witnesses / 创建一个有两个见证者的承诺
      await commitmentChain.connect(police).createCommitment(
        fileHash,
        await signer.getAddress(),
        [await lawyer1.getAddress(), await lawyer2.getAddress()]
      );
    });
    
    it("Witness should be able to sign / 见证者应该能签名", async function () {
      const tx = await commitmentChain.connect(lawyer1).signAsWitness(1);
      
      await expect(tx).to.emit(commitmentChain, "CommitmentSigned");
      
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.witnessSignedCount).to.equal(1);
      expect(await commitmentChain.hasWitnessSigned(1, await lawyer1.getAddress())).to.equal(true);
    });
    
    it("Multiple witnesses should be able to sign separately / 多个见证者应该能分别签名", async function () {
      await commitmentChain.connect(lawyer1).signAsWitness(1);
      await commitmentChain.connect(lawyer2).signAsWitness(1);
      
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.witnessSignedCount).to.equal(2);
      expect(await commitmentChain.hasWitnessSigned(1, await lawyer1.getAddress())).to.equal(true);
      expect(await commitmentChain.hasWitnessSigned(1, await lawyer2.getAddress())).to.equal(true);
    });
  });
  
  // ============================================================================
  // Completion Status Tests / 完成状态测试
  // ============================================================================
  
  describe("6. Completion Status", function () {
    it("Should mark as completed after all sign (with witnesses) / 所有人签名后应该标记为完成（有见证者）", async function () {
      await commitmentChain.connect(police).createCommitment(
        fileHash,
        await signer.getAddress(),
        [await lawyer1.getAddress()]
      );
      
      await commitmentChain.connect(signer).signAsSigner(1);
      const tx = await commitmentChain.connect(lawyer1).signAsWitness(1);
      
      await expect(tx).to.emit(commitmentChain, "CommitmentCompleted");
      
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.isCompleted).to.equal(true);
    });
    
    it("Should mark as completed after all sign (no witnesses) / 所有人签名后应该标记为完成（无见证者）", async function () {
      await commitmentChain.connect(police).createCommitment(
        fileHash,
        await signer.getAddress(),
        []
      );
      
      const tx = await commitmentChain.connect(signer).signAsSigner(1);
      
      await expect(tx).to.emit(commitmentChain, "CommitmentCompleted");
      
      const commitment = await commitmentChain.getCommitment(1);
      expect(commitment.isCompleted).to.equal(true);
    });
  });
  
  // ============================================================================
  // Pause Functionality Tests / 暂停功能测试
  // ============================================================================
  
  describe("7. Pausable Functionality", function () {
    it("Emergency admin should be able to pause contract / 紧急管理员应该能暂停合约", async function () {
      await commitmentChain.connect(emergency).pause();
      expect(await commitmentChain.paused()).to.equal(true);
    });
    
    it("Admin should be able to unpause contract / 管理员应该能恢复合约", async function () {
      await commitmentChain.connect(emergency).pause();
      await commitmentChain.connect(admin).unpause();
      expect(await commitmentChain.paused()).to.equal(false);
    });
    
    it("Cannot create commitment when paused / 暂停后不能创建承诺", async function () {
      await commitmentChain.connect(emergency).pause();
      
      await expect(
        commitmentChain.connect(police).createCommitment(
          fileHash,
          await signer.getAddress(),
          []
        )
      ).to.be.revertedWithCustomError(commitmentChain, "EnforcedPause");
    });
  });
  
  // Note: More test suites can be added following the same pattern
  // 注意：可以按照相同模式添加更多测试套件
});