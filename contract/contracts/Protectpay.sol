// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ProtectedPay is ReentrancyGuard {
    enum TransferStatus { Pending, Claimed, Refunded }
    enum GroupPaymentStatus { Pending, Completed, Refunded }
    enum PotStatus { Active, Broken }

    struct Transfer {
        address sender;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        TransferStatus status;
        string remarks;
    }

    struct GroupPayment {
        bytes32 paymentId;
        address creator;
        address recipient;
        uint256 totalAmount;
        uint256 amountPerPerson;
        uint256 numParticipants;
        uint256 amountCollected;
        uint256 timestamp;
        string remarks;
        GroupPaymentStatus status;
        mapping(address => bool) hasPaid;
        mapping(address => uint256) contributions;
    }

    struct SavingsPot {
        bytes32 potId;
        address owner;
        string name;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 timestamp;
        PotStatus status;
        string remarks;
    }

    struct User {
        string username;
        bytes32[] transferIds;
        bytes32[] groupPaymentIds;
        bytes32[] participatedGroupPayments;
        bytes32[] savingsPotIds;
    }

    mapping(bytes32 => Transfer) public transfers;
    mapping(bytes32 => GroupPayment) public groupPayments;
    mapping(bytes32 => SavingsPot) public savingsPots;
    mapping(address => User) public users;
    mapping(string => address) public usernameToAddress;
    mapping(address => bytes32[]) public pendingTransfersBySender;

    // Events
    event UserRegistered(address indexed userAddress, string username);
    
    event TransferInitiated(
        bytes32 indexed transferId, 
        address indexed sender, 
        address indexed recipient, 
        uint256 amount,
        string remarks
    );
    event TransferClaimed(bytes32 indexed transferId, address indexed recipient, uint256 amount);
    event TransferRefunded(bytes32 indexed transferId, address indexed sender, uint256 amount);
    
    event GroupPaymentCreated(
        bytes32 indexed paymentId,
        address indexed creator,
        address recipient,
        uint256 totalAmount,
        uint256 numParticipants,
        string remarks
    );
    event GroupPaymentContributed(
        bytes32 indexed paymentId,
        address indexed contributor,
        uint256 amount
    );
    event GroupPaymentCompleted(
        bytes32 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );
    
    event SavingsPotCreated(
        bytes32 indexed potId,
        address indexed owner,
        string name,
        uint256 targetAmount,
        string remarks
    );
    event PotContribution(bytes32 indexed potId, address indexed contributor, uint256 amount);
    event PotBroken(bytes32 indexed potId, address indexed owner, uint256 amount);

    // Username Registration and Basic Transfer Functions
    function registerUsername(string memory _username) external {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(users[msg.sender].username).length == 0, "User already registered");
        require(usernameToAddress[_username] == address(0), "Username already taken");

        users[msg.sender].username = _username;
        usernameToAddress[_username] = msg.sender;

        emit UserRegistered(msg.sender, _username);
    }

    function sendToAddress(address _recipient, string memory _remarks) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient address");

        _initiateTransfer(_recipient, _remarks);
    }

    function sendToUsername(string memory _username, string memory _remarks) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        address recipientAddress = usernameToAddress[_username];
        require(recipientAddress != address(0), "Username not found");

        _initiateTransfer(recipientAddress, _remarks);
    }

    function _initiateTransfer(address _recipient, string memory _remarks) private {
        bytes32 transferId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient,
            msg.value,
            block.timestamp
        ));

        transfers[transferId] = Transfer({
            sender: msg.sender,
            recipient: _recipient,
            amount: msg.value,
            timestamp: block.timestamp,
            status: TransferStatus.Pending,
            remarks: _remarks
        });

        users[msg.sender].transferIds.push(transferId);
        pendingTransfersBySender[msg.sender].push(transferId);

        emit TransferInitiated(transferId, msg.sender, _recipient, msg.value, _remarks);
    }

    function claimTransfer(bytes32 _transferId) internal {
        Transfer storage transfer = transfers[_transferId];
        require(transfer.recipient == msg.sender, "You are not the intended recipient");
        require(transfer.status == TransferStatus.Pending, "Transfer is not claimable");

        transfer.status = TransferStatus.Claimed;
        payable(msg.sender).transfer(transfer.amount);

        if (bytes(users[msg.sender].username).length > 0) {
            users[msg.sender].transferIds.push(_transferId);
        }

        removePendingTransfer(transfer.sender, _transferId);
        emit TransferClaimed(_transferId, msg.sender, transfer.amount);
    }

    function claimTransferByUsername(string memory _senderUsername) external nonReentrant {
        address senderAddress = usernameToAddress[_senderUsername];
        require(senderAddress != address(0), "Sender username not found");
        bytes32 transferId = findPendingTransfer(senderAddress);
        claimTransfer(transferId);
    }

    function claimTransferByAddress(address _senderAddress) external nonReentrant {
        bytes32 transferId = findPendingTransfer(_senderAddress);
        claimTransfer(transferId);
    }

    function claimTransferById(bytes32 _transferId) external nonReentrant {
        claimTransfer(_transferId);
    }

    function findPendingTransfer(address _sender) internal view returns (bytes32) {
        bytes32[] memory pendingTransfers = pendingTransfersBySender[_sender];
        for (uint i = 0; i < pendingTransfers.length; i++) {
            Transfer memory transfer = transfers[pendingTransfers[i]];
            if (transfer.recipient == msg.sender && transfer.status == TransferStatus.Pending) {
                return pendingTransfers[i];
            }
        }
        revert("No pending transfer found");
    }

    function removePendingTransfer(address _sender, bytes32 _transferId) internal {
        bytes32[] storage pendingTransfers = pendingTransfersBySender[_sender];
        for (uint i = 0; i < pendingTransfers.length; i++) {
            if (pendingTransfers[i] == _transferId) {
                pendingTransfers[i] = pendingTransfers[pendingTransfers.length - 1];
                pendingTransfers.pop();
                break;
            }
        }
    }

    function refundTransfer(bytes32 _transferId) external nonReentrant {
        Transfer storage transfer = transfers[_transferId];
        require(transfer.sender == msg.sender, "You are not the sender");
        require(transfer.status == TransferStatus.Pending, "Transfer is not refundable");

        transfer.status = TransferStatus.Refunded;
        payable(msg.sender).transfer(transfer.amount);

        removePendingTransfer(msg.sender, _transferId);
        emit TransferRefunded(_transferId, msg.sender, transfer.amount);
    }

    // Group Payment Functions
    function createGroupPayment(
        address _recipient,
        uint256 _numParticipants,
        string memory _remarks
    ) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_numParticipants > 1, "Need at least 2 participants");
        require(_recipient != address(0), "Invalid recipient address");

        bytes32 paymentId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient,
            msg.value,
            block.timestamp
        ));

        GroupPayment storage payment = groupPayments[paymentId];
        payment.paymentId = paymentId;
        payment.creator = msg.sender;
        payment.recipient = _recipient;
        payment.totalAmount = msg.value * _numParticipants;
        payment.numParticipants = _numParticipants;
        payment.amountPerPerson = msg.value;
        payment.timestamp = block.timestamp;
        payment.remarks = _remarks;
        payment.status = GroupPaymentStatus.Pending;

        // Register first contribution from creator
        payment.hasPaid[msg.sender] = true;
        payment.contributions[msg.sender] = msg.value;
        payment.amountCollected = msg.value;

        users[msg.sender].groupPaymentIds.push(paymentId);

        emit GroupPaymentCreated(
            paymentId,
            msg.sender,
            _recipient,
            payment.totalAmount,
            _numParticipants,
            _remarks
        );
    }

    function contributeToGroupPayment(bytes32 _paymentId) external payable nonReentrant {
        GroupPayment storage payment = groupPayments[_paymentId];
        require(payment.status == GroupPaymentStatus.Pending, "Payment not pending");
        require(!payment.hasPaid[msg.sender], "Already contributed");
        require(msg.value == payment.amountPerPerson, "Incorrect amount");

        payment.hasPaid[msg.sender] = true;
        payment.contributions[msg.sender] = msg.value;
        payment.amountCollected += msg.value;

        users[msg.sender].participatedGroupPayments.push(_paymentId);

        emit GroupPaymentContributed(_paymentId, msg.sender, msg.value);

        if (payment.amountCollected == payment.totalAmount) {
            payment.status = GroupPaymentStatus.Completed;
            payable(payment.recipient).transfer(payment.totalAmount);
            emit GroupPaymentCompleted(_paymentId, payment.recipient, payment.totalAmount);
        }
    }

    // Savings Pot Functions
    function createSavingsPot(
        string memory _name,
        uint256 _targetAmount,
        string memory _remarks
    ) external returns (bytes32) {
        bytes32 potId = keccak256(abi.encodePacked(
            msg.sender,
            _name,
            block.timestamp
        ));

        savingsPots[potId] = SavingsPot({
            potId: potId,
            owner: msg.sender,
            name: _name,
            targetAmount: _targetAmount,
            currentAmount: 0,
            timestamp: block.timestamp,
            status: PotStatus.Active,
            remarks: _remarks
        });

        users[msg.sender].savingsPotIds.push(potId);

        emit SavingsPotCreated(
            potId,
            msg.sender,
            _name,
            _targetAmount,
            _remarks
        );

        return potId;
    }

    function contributeToSavingsPot(bytes32 _potId) external payable nonReentrant {
        SavingsPot storage pot = savingsPots[_potId];
        require(pot.status == PotStatus.Active, "Pot is not active");
        
        pot.currentAmount += msg.value;
        emit PotContribution(_potId, msg.sender, msg.value);
    }

    function breakPot(bytes32 _potId) external nonReentrant {
        SavingsPot storage pot = savingsPots[_potId];
        require(pot.owner == msg.sender, "Not pot owner");
        require(pot.status == PotStatus.Active, "Pot already broken");

        uint256 amount = pot.currentAmount;
        pot.status = PotStatus.Broken;
        pot.currentAmount = 0;

        payable(msg.sender).transfer(amount);
        emit PotBroken(_potId, msg.sender, amount);
    }

    // Getter Functions
    function getUserTransfers(address _userAddress) external view returns (Transfer[] memory) {
        bytes32[] memory userTransferIds = users[_userAddress].transferIds;
        Transfer[] memory userTransfers = new Transfer[](userTransferIds.length);

        for (uint i = 0; i < userTransferIds.length; i++) {
            userTransfers[i] = transfers[userTransferIds[i]];
        }

        return userTransfers;
    }

    function getTransferDetails(bytes32 _transferId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        uint256 timestamp,
        TransferStatus status,
        string memory remarks
    ) {
        Transfer storage transfer = transfers[_transferId];
        return (
            transfer.sender,
            transfer.recipient,
            transfer.amount,
            transfer.timestamp,
            transfer.status,
            transfer.remarks
        );
    }

    function getUserByUsername(string memory _username) external view returns (address) {
        return usernameToAddress[_username];
    }

    function getUserByAddress(address _userAddress) external view returns (string memory) {
        return users[_userAddress].username;
    }

    function getUserProfile(address _userAddress) external view returns (
        string memory username,
        bytes32[] memory transferIds,
        bytes32[] memory groupPaymentIds,
        bytes32[] memory participatedGroupPayments,
        bytes32[] memory savingsPotIds
    ) {
        User storage user = users[_userAddress];
        return (
            user.username,
            user.transferIds,
            user.groupPaymentIds,
            user.participatedGroupPayments,
            user.savingsPotIds
        );
    }

    function getGroupPaymentDetails(bytes32 _paymentId) external view returns (
        address creator,
        address recipient,
        uint256 totalAmount,
        uint256 amountPerPerson,
        uint256 numParticipants,
        uint256 amountCollected,
        uint256 timestamp,
        GroupPaymentStatus status,
        string memory remarks
    ) {
        GroupPayment storage payment = groupPayments[_paymentId];
        return (
            payment.creator,
            payment.recipient,
            payment.totalAmount,
            payment.amountPerPerson,
            payment.numParticipants,
            payment.amountCollected,
            payment.timestamp,
            payment.status,
            payment.remarks
        );
    }

    function getSavingsPotDetails(bytes32 _potId) external view returns (
        address owner,
        string memory name,
        uint256 targetAmount,
        uint256 currentAmount,
        uint256 timestamp,
        PotStatus status,
        string memory remarks
    ) {
        SavingsPot storage pot = savingsPots[_potId];
        return (
            pot.owner,
            pot.name,
            pot.targetAmount,
            pot.currentAmount,
            pot.timestamp,
            pot.status,
            pot.remarks
        );
    }

    function hasContributedToGroupPayment(bytes32 _paymentId, address _user) external view returns (bool) {
        return groupPayments[_paymentId].hasPaid[_user];
    }

    function getGroupPaymentContribution(bytes32 _paymentId, address _user) external view returns (uint256) {
        return groupPayments[_paymentId].contributions[_user];
    }

    function getPendingTransfers(address _sender) external view returns (bytes32[] memory) {
        return pendingTransfersBySender[_sender];
    }
}