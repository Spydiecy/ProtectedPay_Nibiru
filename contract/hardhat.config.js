require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Please set your PRIVATE_KEY in a .env file");
  process.exit(1);
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      }
    }
  },
  networks: {
    nibiru: {
      url: "https://evm-rpc.testnet-1.nibiru.fi",
      chainId: 7210,
      accounts: [`0x${PRIVATE_KEY}`],
      timeout: 120000,
      gasPrice: 'auto',
      gasMultiplier: 1.2,
      allowUnlimitedContractSize: true
    }
  }
};