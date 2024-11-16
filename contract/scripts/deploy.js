const hre = require("hardhat");

async function main() {
  try {
    console.log("Starting deployment of ProtectedPay...");

    // Get the deployer's signer
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance));

    // Get network details
    const network = await deployer.provider.getNetwork();
    console.log("Network:", {
      name: network.name,
      chainId: network.chainId
    });

    // Deploy with explicit gas settings
    const ProtectedPay = await hre.ethers.getContractFactory("ProtectedPay");
    
    console.log("Deploying ProtectedPay contract...");
    const protectedPay = await ProtectedPay.deploy({
      gasLimit: 8000000,  // Explicit gas limit
    });

    console.log("Deployment transaction submitted. Waiting for confirmation...");
    
    await protectedPay.waitForDeployment();
    const contractAddress = await protectedPay.getAddress();

    console.log("ProtectedPay deployed to:", contractAddress);
    
    // Wait for additional confirmations
    const deployTx = protectedPay.deploymentTransaction();
    console.log("Waiting for 5 confirmations...");
    await deployTx.wait(5);
    
    // Test basic contract functionality
    try {
      // Register a test user
      console.log("\nTesting contract functionality...");
      const testUsername = "test_user_" + Math.floor(Math.random() * 10000);
      const registerTx = await protectedPay.registerUsername(testUsername, {
        gasLimit: 200000
      });
      await registerTx.wait();
      console.log("Test user registered successfully:", testUsername);
      
    } catch (error) {
      console.log("Test transaction failed:", error.message);
    }

    // Print deployment summary
    console.log("\nDeployment Summary");
    console.log("==================");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId);
    console.log("Contract Address:", contractAddress);
    console.log("Deployer Address:", deployer.address);
    console.log("Block Number:", await deployer.provider.getBlockNumber());
    
    // Return the contract address
    return contractAddress;

  } catch (error) {
    console.error("\nDeployment failed!");
    console.error(error);
    
    // More detailed error logging
    if (error.error) {
      console.error("\nError details:", error.error);
    }
    
    process.exit(1);
  }
}

main()
  .then((contractAddress) => {
    console.log("\nDeployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });