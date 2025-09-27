const { ethers } = require("hardhat");

const DEPLOYED_CONTRACT_ADDRESS = "0x80e044c711a6904950ff6cbb8f3bdb18877be483";

async function checkContractOnExplorer() {
  console.log("🔍 Checking contract on blockchain explorer...");
  console.log("Contract Address:", DEPLOYED_CONTRACT_ADDRESS);
  console.log("");

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network Name:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("");

    // Check if contract exists
    const code = await ethers.provider.getCode(DEPLOYED_CONTRACT_ADDRESS);
    if (code === "0x") {
      console.log("❌ Contract does not exist at this address");
      console.log("This could mean:");
      console.log("- Contract was never deployed");
      console.log("- Contract was self-destructed");
      console.log("- Wrong network (contract might be on a different network)");
      return;
    }

    console.log("✅ Contract exists on this network");
    console.log("Bytecode length:", code.length, "characters");
    console.log("");

    // Get contract info
    const contract = new ethers.Contract(
      DEPLOYED_CONTRACT_ADDRESS,
      [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function owner() view returns (address)",
        "function marketplace() view returns (address)"
      ],
      ethers.provider
    );

    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      const totalSupply = await contract.totalSupply();
      const owner = await contract.owner();
      const marketplace = await contract.marketplace();

      console.log("📋 Contract Information:");
      console.log("Name:", name);
      console.log("Symbol:", symbol);
      console.log("Decimals:", decimals.toString());
      console.log("Total Supply:", ethers.formatEther(totalSupply), "tokens");
      console.log("Owner:", owner);
      console.log("Marketplace:", marketplace);
      console.log("");

      // Check if it's our PokiToken
      if (name === "PokiToken" && symbol === "PKT") {
        console.log("✅ This is a PokiToken contract!");
      } else {
        console.log("❌ This is NOT a PokiToken contract");
        console.log("Expected: PokiToken (PKT)");
        console.log("Found:", name, "(" + symbol + ")");
      }

    } catch (error) {
      console.log("❌ Error reading contract info:", error.message);
    }

    // Get recent transactions
    console.log("\n🔍 Checking recent activity...");
    try {
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log("Current block number:", blockNumber);

      // Try to get the block where contract was deployed
      let deploymentBlock = null;
      for (let i = 0; i < 1000; i++) {
        const blockNum = blockNumber - i;
        const codeAtBlock = await ethers.provider.getCode(DEPLOYED_CONTRACT_ADDRESS, blockNum);
        if (codeAtBlock === "0x") {
          deploymentBlock = blockNum + 1;
          break;
        }
      }

      if (deploymentBlock) {
        console.log("Contract deployed at block:", deploymentBlock);
        console.log("Blocks since deployment:", blockNumber - deploymentBlock);
      } else {
        console.log("Contract was deployed more than 1000 blocks ago");
      }

    } catch (error) {
      console.log("❌ Error checking recent activity:", error.message);
    }

    // Provide explorer links
    console.log("\n🌐 Explorer Links:");
    if (network.chainId === 137n) {
      console.log("PolygonScan:", `https://polygonscan.com/address/${DEPLOYED_CONTRACT_ADDRESS}`);
    } else if (network.chainId === 80002n) {
      console.log("PolygonScan Amoy:", `https://amoy.polygonscan.com/address/${DEPLOYED_CONTRACT_ADDRESS}`);
    } else if (network.chainId === 1n) {
      console.log("Etherscan:", `https://etherscan.io/address/${DEPLOYED_CONTRACT_ADDRESS}`);
    } else {
      console.log("Unknown network - check your local blockchain explorer");
    }

    console.log("\n🎉 Contract check completed!");

  } catch (error) {
    console.log("❌ Error checking contract:", error.message);
    console.log("Stack trace:", error.stack);
  }
}

// Run the check
checkContractOnExplorer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
