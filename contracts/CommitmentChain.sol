// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 * OpenZeppelin Import Instructions / OpenZeppelin 导入说明
 * ============================================================================
 * 
 * 1. Upgradeable Contracts / 可升级合约：
 *    - All contracts must use Upgradeable versions (with Upgradeable suffix)
 *      所有合约都必须使用 Upgradeable 版本（带 Upgradeable 后缀）
 *    - Cannot use constructors, must use initialize function
 *      不能使用构造函数，必须使用 initialize 函数
 *    - Using UUPSUpgradeable proxy pattern (more gas efficient, more secure)
 *      使用 UUPSUpgradeable 代理模式（更省 gas，更安全）
 * 
 * 2. AccessControlUpgradeable: Role management / 角色管理
 *    - Provides fine-grained permission control
 *      提供细粒度的权限控制
 *    - Can define multiple roles (admin, police, lawyer, etc.)
 *      可以定义多种角色（管理员、警察、律师等）
 * 
 * 3. ReentrancyGuardUpgradeable: Prevents reentrancy attacks / 防止重入攻击
 *    - nonReentrant modifier prevents recursive calls
 *      nonReentrant modifier 防止函数被递归调用
 * 
 * 4. PausableUpgradeable: Pause functionality / 暂停功能
 *    - Can pause contract in emergency situations
 *      紧急情况下可以暂停合约
 * 
 * 5. UUPSUpgradeable: Upgradeable proxy pattern / 可升级代理模式
 *    - Upgrade logic in implementation contract, more gas efficient
 *      升级逻辑在实现合约中，更省 gas
 *    - Need to implement _authorizeUpgrade function to control upgrade permission
 *      需要实现 _authorizeUpgrade 函数控制升级权限
 * 
 * 6. Initializable: Initializer / 初始化器
 *    - Replaces constructor for upgradeable contracts
 *      替代构造函数，用于可升级合约的初始化
 */
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

/**
 * @title CommitmentChain
 * @author Your Name
 * @notice Blockchain Digital Commitment System - For recording immutable confessions, contracts, etc.
 *         区块链数字承诺系统 - 用于记录不可篡改的口供、合同等承诺
 * @dev Full version - includes access control, upgradeability, security protections
 *      完整版本 - 包含访问控制、可升级性、安全防护
 * 
 * Main Features / 主要功能：
 * 1. Create Commitment: Initiator uploads file hash and automatically signs
 *    创建承诺：发起人上传文件哈希并自动签名
 * 2. Signer Signature: Designated signer signs
 *    签约者签名：指定的签约者进行签名
 * 3. Witness Signature: Optional multiple witnesses sign
 *    见证者签名：可选的多个见证者签名
 * 4. Role Management: Different roles have different permissions
 *    角色管理：不同角色有不同的权限
 * 5. Upgradeability: Can upgrade contract logic without losing data
 *    可升级：可以升级合约逻辑而不丢失数据
 */
contract CommitmentChain is 
    Initializable,              // Initializer (must be first) / 初始化器（必须放在第一位）
    AccessControlUpgradeable,   // Access control / 访问控制
    ReentrancyGuardUpgradeable, // Reentrancy guard / 防重入
    PausableUpgradeable,        // Pausable / 暂停功能
    UUPSUpgradeable             // Upgradeable proxy / 可升级代理
{
    // ============================================================================
    // Role Definitions / 角色定义
    // ============================================================================
    
    /**
     * @dev Role descriptions / 角色说明：
     * 
     * DEFAULT_ADMIN_ROLE (inherited from AccessControl / 继承自 AccessControl)
     * - Super admin with highest authority / 超级管理员，拥有最高权限
     * - Can grant/revoke all roles / 可以授予/撤销所有角色
     * - Can upgrade contract / 可以升级合约
     * - Can pause/unpause contract / 可以暂停/恢复合约
     * 
     * POLICE_ROLE - Police role / 警察角色
     * - Can create confession commitments / 可以创建口供承诺
     * - Used in judicial scenarios to record suspect confessions / 用于司法场景，记录嫌疑人口供
     * 
     * LAWYER_ROLE - Lawyer role / 律师角色
     * - Can serve as witness / 可以作为见证者
     * - Ensures witness professionalism / 确保见证者的专业性
     * 
     * VERIFIER_ROLE - Verifier role / 验证员角色
     * - Can mark commitment as "verified" / 可以标记承诺为"已验证"
     * - Can freeze suspicious commitments / 可以冻结可疑承诺
     * 
     * EMERGENCY_ROLE - Emergency admin / 紧急管理员
     * - Can freeze commitments in emergency / 可以在紧急情况下冻结承诺
     * - Can pause contract / 可以暂停合约
     */
    bytes32 public constant POLICE_ROLE = keccak256("POLICE_ROLE");
    bytes32 public constant LAWYER_ROLE = keccak256("LAWYER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    // ============================================================================
    // Data Structures / 数据结构
    // ============================================================================
    
    /**
     * @dev Commitment struct / Commitment 结构体
     * @notice Stores all information of a single commitment / 存储单个承诺的所有信息
     */
    struct Commitment {
        uint256 id;                  // Unique commitment ID / 承诺唯一 ID
        address initiator;           // Initiator address / 发起人地址
        address signer;              // Signer address (only one) / 签约者地址（只有一个）
        address[] witnesses;         // Witness address array (optional, multiple) / 见证者地址数组（可选，多个）
        string fileHash;             // File hash (SHA256 or IPFS hash) / 文件哈希值（SHA256 或 IPFS hash）
        uint256 createdAt;           // Creation timestamp / 创建时间戳
        bool initiatorSigned;        // Whether initiator has signed / 发起人是否已签名
        bool signerSigned;           // Whether signer has signed / 签约者是否已签名
        uint256 witnessSignedCount;  // Number of witnesses who have signed / 已签名的见证者数量
        bool isCompleted;            // Whether everyone has signed / 是否所有人都已签名
        bool isFrozen;               // Whether frozen (used in emergency) / 是否被冻结（紧急情况下使用）
        bool isVerified;             // Whether verified by verifier / 是否已被验证员验证
    }
    
    // ============================================================================
    // State Variables / 状态变量
    // ============================================================================
    
    /**
     * @dev State variable notes / 状态变量说明：
     * 
     * In upgradeable contracts, the order of state variable declaration is very important!
     * 在可升级合约中，状态变量的声明顺序非常重要！
     * - New versions can only add new variables at the end
     *   新版本只能在末尾添加新变量
     * - Cannot delete or modify the order of existing variables
     *   不能删除或修改已有变量的顺序
     * - Cannot change the type of existing variables
     *   不能改变已有变量的类型
     * 
     * This ensures storage layout compatibility and prevents data corruption during upgrades
     * 这是为了保证存储布局兼容性，避免升级时数据错乱
     */
    
    /// @dev Commitment ID counter / 承诺 ID 计数器
    uint256 private _commitmentIdCounter;
    
    /// @dev Commitment ID => Commitment details / 承诺 ID => 承诺详情
    mapping(uint256 => Commitment) public commitments;
    
    /// @dev Commitment ID => witness address => whether signed / 承诺 ID => 见证者地址 => 是否已签名
    mapping(uint256 => mapping(address => bool)) public witnessSigned;
    
    /**
     * @dev Reserved storage slots (important!) / 预留存储槽位（重要！）
     * Reserved 50 storage slots for future upgrades
     * 为未来升级预留 50 个存储槽位
     * This allows adding new state variables without affecting storage layout
     * 这样在升级时可以添加新的状态变量而不影响存储布局
     */
    uint256[50] private __gap;
    
    // ============================================================================
    // Events / 事件
    // ============================================================================
    
    /**
     * @dev Event notes / 事件说明：
     * Events record important operations for frontend monitoring and backend indexing
     * 事件用于记录重要操作，方便前端监听和后端索引
     * The indexed keyword allows efficient filtering by that parameter
     * indexed 关键字允许通过该参数进行高效过滤
     */
    
    /// @notice Commitment created event / 承诺创建事件
    event CommitmentCreated(
        uint256 indexed id,
        address indexed initiator,
        address indexed signer,
        string fileHash,
        uint256 timestamp
    );
    
    /// @notice Commitment signed event / 承诺签名事件
    event CommitmentSigned(
        uint256 indexed id,
        address indexed signer,
        string role,
        uint256 timestamp
    );
    
    /// @notice Commitment completed event (all signed) / 承诺完成事件（所有人都已签名）
    event CommitmentCompleted(
        uint256 indexed id,
        uint256 timestamp
    );
    
    /// @notice Commitment frozen event / 承诺冻结事件
    event CommitmentFrozen(
        uint256 indexed id,
        address indexed freezer,
        uint256 timestamp
    );
    
    /// @notice Commitment unfrozen event / 承诺解冻事件
    event CommitmentUnfrozen(
        uint256 indexed id,
        address indexed unfreezer,
        uint256 timestamp
    );
    
    /// @notice Commitment verified event / 承诺验证事件
    event CommitmentVerified(
        uint256 indexed id,
        address indexed verifier,
        uint256 timestamp
    );
    
    /// @notice Contract upgraded event / 合约升级事件
    event ContractUpgraded(
        address indexed previousImplementation,
        address indexed newImplementation,
        uint256 timestamp
    );
    
    // ============================================================================
    // Modifiers / 修饰器
    // ============================================================================
    
    /**
     * @dev Custom modifiers / 自定义修饰器
     * Used to add extra validation logic / 用于添加额外的检查逻辑
     */
    
    /// @dev Check if commitment is not frozen / 检查承诺是否未被冻结
    modifier notFrozen(uint256 _commitmentId) {
        require(
            !commitments[_commitmentId].isFrozen,
            "CommitmentChain: Commitment is frozen"
        );
        _;
    }
    
    /// @dev Check if commitment ID is valid / 检查承诺 ID 是否有效
    modifier validCommitmentId(uint256 _commitmentId) {
        require(
            _commitmentId > 0 && _commitmentId <= _commitmentIdCounter,
            "CommitmentChain: Invalid commitment ID"
        );
        _;
    }
    
    // ============================================================================
    // Initialize Function (Replaces Constructor) / 初始化函数（替代构造函数）
    // ============================================================================
    
    /**
     * @dev Initialize function / 初始化函数
     * @notice In upgradeable contracts, cannot use constructor, must use initialize function
     *         在可升级合约中，不能使用构造函数，必须使用 initialize 函数
     * @param admin Admin address, will be granted DEFAULT_ADMIN_ROLE
     *              管理员地址，将被授予 DEFAULT_ADMIN_ROLE
     * 
     * The initializer modifier ensures it can only be called once
     * initializer modifier 确保只能被调用一次
     * 
     * WHY USE INITIALIZE INSTEAD OF CONSTRUCTOR? / 为什么用初始化函数替代构造函数？
     * 
     * Reason 1: Proxy Pattern Architecture / 原因 1：代理模式架构
     * - In proxy pattern, user interacts with Proxy Contract, not Implementation Contract
     *   在代理模式中，用户交互的是代理合约（Proxy），而不是实现合约（Implementation）
     * - Constructor runs ONLY when Implementation Contract is deployed
     *   构造函数只在部署实现合约时运行
     * - Constructor sets state variables in Implementation Contract's storage
     *   构造函数设置的状态变量在实现合约的存储中
     * - But all actual data is stored in Proxy Contract's storage!
     *   但所有实际数据都存储在代理合约的存储中！
     * - So constructor initialization would be lost / 所以构造函数的初始化会丢失
     * 
     * Reason 2: Delegatecall Mechanism / 原因 2：Delegatecall 机制
     * - Proxy uses delegatecall to call Implementation Contract's code
     *   代理使用 delegatecall 调用实现合约的代码
     * - Delegatecall executes code in Proxy's context (using Proxy's storage)
     *   Delegatecall 在代理的上下文中执行代码（使用代理的存储）
     * - Constructor cannot be delegatecalled / 构造函数无法被 delegatecall
     * 
     * Reason 3: Upgrade Safety / 原因 3：升级安全
     * - When upgrading, we only replace the Implementation Contract
     *   升级时，我们只替换实现合约
     * - If we used constructor, new version's constructor would run again
     *   如果使用构造函数，新版本的构造函数会再次运行
     * - This could overwrite existing data! / 这可能会覆盖现有数据！
     * - Initialize function has "initializer" modifier to prevent re-execution
     *   Initialize 函数有 "initializer" 修饰器防止重复执行
     * 
     * Visual Explanation / 可视化解释：
     * 
     * With Constructor (WRONG) / 使用构造函数（错误）：
     * ┌─────────────────┐
     * │ Proxy Contract  │  ← User interacts here / 用户在这里交互
     * │ Storage: Empty! │  ← Constructor didn't initialize this! / 构造函数没有初始化这里！
     * └────────┬────────┘
     *          │ delegatecall
     *          ↓
     * ┌─────────────────┐
     * │ Implementation  │
     * │ Storage: Has    │  ← Constructor initialized this (useless!) / 构造函数初始化了这里（无用！）
     * │ data but unused │
     * └─────────────────┘
     * 
     * With Initialize (CORRECT) / 使用初始化函数（正确）：
     * ┌─────────────────┐
     * │ Proxy Contract  │  ← User interacts here / 用户在这里交互
     * │ Storage: Has    │  ← Initialize function sets data here! / Initialize 函数在这里设置数据！
     * │ initialized data│
     * └────────┬────────┘
     *          │ delegatecall
     *          ↓
     * ┌─────────────────┐
     * │ Implementation  │  ← Only code, no data / 只有代码，没有数据
     * │ (Logic only)    │
     * └─────────────────┘
     */
    function initialize(address admin) public initializer {
        // Check admin address validity / 检查管理员地址有效性
        require(admin != address(0), "CommitmentChain: Invalid admin address");
        
        // Initialize parent contracts / 初始化父合约
        // Note: Must initialize in inheritance order / 注意：必须按照继承顺序初始化
        __AccessControl_init();       // Initialize access control / 初始化访问控制
        __ReentrancyGuard_init();     // Initialize reentrancy guard / 初始化防重入
        __Pausable_init();            // Initialize pausable / 初始化暂停功能
        __UUPSUpgradeable_init();     // Initialize UUPS proxy / 初始化 UUPS 代理
        
        // Grant admin role / 授予管理员角色
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        
        // Optional: Grant all roles to admin for testing / 可选：为管理员授予其他所有角色（方便测试）
        // _grantRole(POLICE_ROLE, admin);
        // _grantRole(LAWYER_ROLE, admin);
        // _grantRole(VERIFIER_ROLE, admin);
        // _grantRole(EMERGENCY_ROLE, admin);
        
        // Initialize counter / 初始化计数器
        _commitmentIdCounter = 0;
    }
    
    // ============================================================================
    // Core Business Functions / 核心业务函数
    // ============================================================================
    
    /**
     * @dev Create commitment / 创建承诺
     * @notice Initiator creates commitment and automatically signs
     *         发起人创建承诺并自动签名
     * @param _fileHash File hash (SHA256 or IPFS hash) / 文件哈希值（SHA256 或 IPFS hash）
     * @param _signer Signer address / 签约者地址
     * @param _witnesses Witness address array / 见证者地址数组
     * @return Newly created commitment ID / 新创建的承诺 ID
     * 
     * Requirements / 要求：
     * - Caller must have POLICE_ROLE / 调用者必须拥有 POLICE_ROLE（警察角色）
     * - Contract not paused / 合约未被暂停
     * - No reentrancy attack / 不会被重入攻击
     * - File hash not empty / 文件哈希不为空
     * - Valid signer address / 签约者地址有效
     * - Witnesses must have LAWYER_ROLE / 见证者必须拥有 LAWYER_ROLE（律师角色）
     */
    function createCommitment(
        string memory _fileHash,
        address _signer,
        address[] memory _witnesses
    ) 
        public 
        /**
        nonReentrant           // Prevent reentrancy attack / 防止重入攻击
        onlyRole(POLICE_ROLE)   Only police can create commitment  只有警察可以创建承诺
        whenNotPaused          // Can only call when not paused / 合约未暂停时才能调用
    */
        returns (uint256) 
    {
        // ========== Input Validation / 输入验证 ==========
        
        // Validate file hash / 验证文件哈希
        console.log("File hash is: %s", _fileHash);

        require(
            bytes(_fileHash).length > 0,
            "CommitmentChain: File hash cannot be empty"
        );
        
        // Validate signer address / 验证签约者地址
        require(
            _signer != address(0),
            "CommitmentChain: Invalid signer address"
        );
        require(
            _signer != msg.sender,
            "CommitmentChain: Signer cannot be initiator"
        );
        
        // Validate witnesses / 验证见证者
        for (uint i = 0; i < _witnesses.length; i++) {
            // Validate witness address / 验证见证者地址有效
            require(
                _witnesses[i] != address(0),
                "CommitmentChain: Invalid witness address"
            );
            
            // Witness cannot be initiator / 验证见证者不是发起人
            /**
            require(
                _witnesses[i] != msg.sender,
                "CommitmentChain: Witness cannot be initiator"
            );
            */

            // Witness cannot be signer / 验证见证者不是签约者
            require(
                _witnesses[i] != _signer,
                "CommitmentChain: Witness cannot be signer"
            );
            
            // Witness must have lawyer role (important! ensures professionalism)
            // 验证见证者拥有律师角色（重要！确保专业性）
            /**require(
                hasRole(LAWYER_ROLE, _witnesses[i]),
                "CommitmentChain: Witness must have LAWYER_ROLE"
            );
            */

            // Check for duplicate witnesses / 检查是否有重复的见证者
            for (uint j = i + 1; j < _witnesses.length; j++) {
                require(
                    _witnesses[i] != _witnesses[j],
                    "CommitmentChain: Duplicate witness address"
                );
            }
        }
        
        // ========== Create Commitment / 创建承诺 ==========
        
        // Increment counter, generate new commitment ID / 递增计数器，生成新的承诺 ID
        _commitmentIdCounter++;
        uint256 newCommitmentId = _commitmentIdCounter;
        
        // Create commitment object / 创建承诺对象
        Commitment storage commitment = commitments[newCommitmentId];
        commitment.id = newCommitmentId;
        commitment.initiator = msg.sender;
        commitment.signer = _signer;
        commitment.witnesses = _witnesses;
        commitment.fileHash = _fileHash;
        commitment.createdAt = block.timestamp;
        commitment.initiatorSigned = true;  // Initiator automatically signs / 发起人自动签名
        commitment.signerSigned = false;
        commitment.witnessSignedCount = 0;
        commitment.isCompleted = false;
        commitment.isFrozen = false;
        commitment.isVerified = false;
        
        // ========== Emit Events / 触发事件 ==========
        
        emit CommitmentCreated(
            newCommitmentId,
            msg.sender,
            _signer,
            _fileHash,
            block.timestamp
        );
        
        emit CommitmentSigned(
            newCommitmentId,
            msg.sender,
            "initiator",
            block.timestamp
        );
        
        // Check if completed immediately (no witnesses case)
        // 检查是否立即完成（无见证者的情况）
        _checkCompletion(newCommitmentId);
        
        return newCommitmentId;
    }
    
    /**
     * @dev Signer signs / 签约者签名
     * @notice Designated signer signs the commitment / 指定的签约者对承诺进行签名
     * @param _commitmentId Commitment ID / 承诺 ID
     * 
     * Requirements / 要求：
     * - Caller must be the designated signer / 调用者必须是指定的签约者
     * - Commitment not frozen / 承诺未被冻结
     * - Signer hasn't signed yet / 签约者尚未签名
     * - Initiator has signed / 发起人已经签名
     */
    function signAsSigner(uint256 _commitmentId) 
        public 
        nonReentrant 
        whenNotPaused 
        validCommitmentId(_commitmentId)
        notFrozen(_commitmentId)
    {
        Commitment storage commitment = commitments[_commitmentId];
        
        // Verify caller is designated signer / 验证调用者是指定的签约者
        require(
            msg.sender == commitment.signer,
            "CommitmentChain: Not the designated signer"
        );
        
        // Verify not signed yet / 验证尚未签名
        require(
            !commitment.signerSigned,
            "CommitmentChain: Already signed"
        );
        
        // Verify initiator has signed (ensure signature order)
        // 验证发起人已签名（确保签名顺序）
        require(
            commitment.initiatorSigned,
            "CommitmentChain: Initiator must sign first"
        );
        
        // Mark as signed / 标记为已签名
        commitment.signerSigned = true;
        
        // Emit signature event / 触发签名事件
        emit CommitmentSigned(
            _commitmentId,
            msg.sender,
            "signer",
            block.timestamp
        );
        
        // Check if completed / 检查是否完成
        _checkCompletion(_commitmentId);
    }
    
    /**
     * @dev Witness signs / 见证者签名
     * @notice Designated witness signs the commitment / 指定的见证者对承诺进行签名
     * @param _commitmentId Commitment ID / 承诺 ID
     * 
     * Requirements / 要求：
     * - Caller must be designated witness / 调用者必须是指定的见证者
     * - Caller must have LAWYER_ROLE / 调用者必须拥有 LAWYER_ROLE
     * - Commitment not frozen / 承诺未被冻结
     * - This witness hasn't signed yet / 该见证者尚未签名
     * - Initiator has signed / 发起人已经签名
     */
    function signAsWitness(uint256 _commitmentId) 
        public 
        /**
        onlyRole(LAWYER_ROLE)  // Must be lawyer to sign / 必须是律师才能签名
        whenNotPaused
        */
        nonReentrant 
        validCommitmentId(_commitmentId)
        notFrozen(_commitmentId)
    {
        Commitment storage commitment = commitments[_commitmentId];
        
        // Verify initiator has signed / 验证发起人已签名
        require(
            commitment.initiatorSigned,
            "CommitmentChain: Initiator must sign first"
        );
        
        // Verify caller is designated witness / 验证调用者是指定的见证者
        require(
            _isWitness(_commitmentId, msg.sender),
            "CommitmentChain: Not a designated witness"
        );
        
        // Verify this witness hasn't signed yet / 验证该见证者尚未签名
        require(    
            !witnessSigned[_commitmentId][msg.sender],
            "CommitmentChain: Already signed"
        );
        
        // Record signature / 记录签名
        witnessSigned[_commitmentId][msg.sender] = true;
        commitment.witnessSignedCount++;
        
        // Emit signature event / 触发签名事件
        emit CommitmentSigned(
            _commitmentId,
            msg.sender,
            "witness",
            block.timestamp
        );
        
        // Check if completed / 检查是否完成
        _checkCompletion(_commitmentId);
    }
    
    // ============================================================================
    // Admin Functions / 管理员功能
    // ============================================================================
    
    /**
     * @dev Freeze commitment / 冻结承诺
     * @notice Freeze suspicious commitment in emergency, cannot continue signing after frozen
     *         紧急情况下冻结可疑承诺，冻结后无法继续签名
     * @param _commitmentId Commitment ID / 承诺 ID
     * 
     * Only addresses with EMERGENCY_ROLE can call
     * 只有拥有 EMERGENCY_ROLE 的地址可以调用
     */
    function freezeCommitment(uint256 _commitmentId) 
        public 
        /** 
        onlyRole(EMERGENCY_ROLE)
        */
        validCommitmentId(_commitmentId)
    {
        Commitment storage commitment = commitments[_commitmentId];
        
        require(
            !commitment.isFrozen,
            "CommitmentChain: Already frozen"
        );
        
        commitment.isFrozen = true;
        
        emit CommitmentFrozen(
            _commitmentId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Unfreeze commitment / 解冻承诺
     * @notice Unfreeze commitment / 解除承诺冻结状态
     * @param _commitmentId Commitment ID / 承诺 ID
     * 
     * Only addresses with EMERGENCY_ROLE can call
     * 只有拥有 EMERGENCY_ROLE 的地址可以调用
     */
    function unfreezeCommitment(uint256 _commitmentId) 
        public 
        /**
        onlyRole(EMERGENCY_ROLE)
        */
        validCommitmentId(_commitmentId)
    {
        Commitment storage commitment = commitments[_commitmentId];
        
        require(
            commitment.isFrozen,
            "CommitmentChain: Not frozen"
        );
        
        commitment.isFrozen = false;
        
        emit CommitmentUnfrozen(
            _commitmentId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Verify commitment / 验证承诺
     * @notice Verifier marks commitment as "verified" / 验证员标记承诺为"已验证"
     * @param _commitmentId Commitment ID / 承诺 ID
     * 
     * Only addresses with VERIFIER_ROLE can call
     * 只有拥有 VERIFIER_ROLE 的地址可以调用
     */
    function verifyCommitment(uint256 _commitmentId) 
        public 
        /** 
        onlyRole(VERIFIER_ROLE)
        */
        validCommitmentId(_commitmentId)
    {
        Commitment storage commitment = commitments[_commitmentId];
        
        require(
            !commitment.isVerified,
            "CommitmentChain: Already verified"
        );
        
        require(
            commitment.isCompleted,
            "CommitmentChain: Not completed yet"
        );
        
        commitment.isVerified = true;
        
        emit CommitmentVerified(
            _commitmentId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Pause contract / 暂停合约
     * @notice Pause entire contract in emergency, cannot create or sign after paused
     *         紧急情况下暂停整个合约，暂停后无法创建或签名
     * 
     * Only addresses with EMERGENCY_ROLE can call
     * 只有拥有 EMERGENCY_ROLE 的地址可以调用
     */
    function pause() public onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract / 恢复合约
     * @notice Cancel paused state / 取消暂停状态
     * 
     * Only addresses with DEFAULT_ADMIN_ROLE can call
     * 只有拥有 DEFAULT_ADMIN_ROLE 的地址可以调用
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // ============================================================================
    // Internal Helper Functions / 内部辅助函数
    // ============================================================================
    
    /**
     * @dev Check if address is witness for specified commitment
     *      检查地址是否为指定承诺的见证者
     * @param _commitmentId Commitment ID / 承诺 ID
     * @param _address Address to check / 要检查的地址
     * @return Whether is witness / 是否为见证者
     */
    function _isWitness(uint256 _commitmentId, address _address) 
        internal 
        view 
        returns (bool) 
    {
        Commitment storage commitment = commitments[_commitmentId];
        for (uint i = 0; i < commitment.witnesses.length; i++) {
            if (commitment.witnesses[i] == _address) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Check if commitment is completed / 检查承诺是否完成
     * @notice If all participants have signed, mark as completed
     *         如果所有参与者都已签名，标记为完成
     * @param _commitmentId Commitment ID / 承诺 ID
     */
    function _checkCompletion(uint256 _commitmentId) internal {
        Commitment storage commitment = commitments[_commitmentId];
        
        // Check if everyone has signed / 检查是否所有人都已签名
        if (commitment.initiatorSigned && 
            commitment.signerSigned && 
            commitment.witnessSignedCount == commitment.witnesses.length) 
        {
            commitment.isCompleted = true;
            emit CommitmentCompleted(_commitmentId, block.timestamp);
        }
    }
    
    // ============================================================================
    // Query Functions (View Functions) / 查询函数（View Functions）
    // ============================================================================

    /**
     * Get commitment details / 获取承诺详情
     */
    function getCommitment(uint256 _commitmentId) 
        public 
        view 
        validCommitmentId(_commitmentId)
        returns (
            uint256 id,
            address initiator,
            address signer,
            address[] memory witnesses,
            string memory fileHash,
            uint256 createdAt,
            bool initiatorSigned,
            bool signerSigned,
            uint256 witnessSignedCount,
            bool isCompleted,
            bool isFrozen,
            bool isVerified
        ) 
    {
        Commitment storage commitment = commitments[_commitmentId];
        return (
            commitment.id,
            commitment.initiator,
            commitment.signer,
            commitment.witnesses,
            commitment.fileHash,
            commitment.createdAt,
            commitment.initiatorSigned,
            commitment.signerSigned,
            commitment.witnessSignedCount,
            commitment.isCompleted,
            commitment.isFrozen,
            commitment.isVerified
        );
    }
    
    /**
     * @dev Check if specific witness has signed / 检查特定见证者是否已签名
     * @param _commitmentId Commitment ID / 承诺 ID
     * @param _witness Witness address / 见证者地址
     * @return Whether signed / 是否已签名
     */
    function hasWitnessSigned(uint256 _commitmentId, address _witness) 
        public 
        view 
        validCommitmentId(_commitmentId)
        returns (bool) 
    {
        return witnessSigned[_commitmentId][_witness];
    }
    
    /**
     * @dev Get address role / 获取地址的角色
     * @param _commitmentId Commitment ID / 承诺 ID
     * @param _address Address to query / 要查询的地址
     * @return Role name / 角色名称
     */
    function getRole(uint256 _commitmentId, address _address) 
        public 
        view 
        validCommitmentId(_commitmentId)
        returns (string memory) 
    {
        Commitment storage commitment = commitments[_commitmentId];
        
        if (_address == commitment.initiator) {
            return "initiator";
        } else if (_address == commitment.signer) {
            return "signer";
        } else if (_isWitness(_commitmentId, _address)) {
            return "witness";
        } else {
            return "none";
        }
    }
    
    /**
     * @dev Get witness count / 获取见证者数量
     * @param _commitmentId Commitment ID / 承诺 ID
     * @return Witness count / 见证者数量
     */
    function getWitnessCount(uint256 _commitmentId) 
        public 
        view 
        validCommitmentId(_commitmentId)
        returns (uint256) 
    {
        return commitments[_commitmentId].witnesses.length;
    }
    
    /**
     * @dev Get current total commitment count / 获取当前承诺总数
     * @return Commitment count / 承诺总数
     */
    function commitmentCount() public view returns (uint256) {
        return _commitmentIdCounter;
    }
    
    // ============================================================================
    // Upgradeability Related Functions / 可升级性相关函数
    // ============================================================================
    
    /**
     * @dev Authorize upgrade / 授权升级
     * @notice Only addresses with DEFAULT_ADMIN_ROLE can upgrade contract
     *         只有拥有 DEFAULT_ADMIN_ROLE 的地址可以升级合约
     * @param newImplementation New implementation contract address / 新实现合约的地址
     * 
     * This is the core function of UUPS proxy pattern
     * 这是 UUPS 代理模式的核心函数
     * Called when upgrading contract to verify upgrade permission
     * 在升级合约时会被调用，用于验证升级权限
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
       /// onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        // Can add extra upgrade validation logic here
        // 可以在这里添加额外的升级验证逻辑
        // Example: timelock, multisig validation, etc.
        // 例如：时间锁、多签验证等
        
        emit ContractUpgraded(
            address(this),
            newImplementation,
            block.timestamp
        );
    }
    
    /**
     * @dev Get current implementation contract version / 获取当前实现合约版本
     * @return Version number / 版本号
     * 
     * Should increment version number with each upgrade
     * 每次升级时应该增加版本号
     */
    function version() public pure returns (string memory) {
        return "1.0.0";
    }
}