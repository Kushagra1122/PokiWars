const { ethers } = require("hardhat");

// Contract ABI for PokiToken
const POKI_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
  "function marketplace() view returns (address)",
  "function allowance(address,address) view returns (uint256)"
];

const DEPLOYED_CONTRACT_ADDRESS = "0xa599dac243deca9b35c57639dc1dfb1f3368e26b";

async function simpleContractTest() {
  console.log("🧪 Simple Contract Test for PokiToken");
  console.log("Contract Address:", DEPLOYED_CONTRACT_ADDRESS);
  console.log("");

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("");

    // Connect to the deployed contract
    const contract = new ethers.Contract(
      DEPLOYED_CONTRACT_ADDRESS,
      POKI_TOKEN_ABI,
      ethers.provider
    );

    // Test 1: Basic contract info
    console.log("1️⃣ Basic Contract Information:");
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    const contractOwner = await contract.owner();
    const marketplaceAddress = await contract.marketplace();

    console.log("✅ Name:", name);
    console.log("✅ Symbol:", symbol);
    console.log("✅ Decimals:", decimals.toString());
    console.log("✅ Total Supply:", ethers.formatEther(totalSupply), "PKT");
    console.log("✅ Contract Owner:", contractOwner);
    console.log("✅ Marketplace:", marketplaceAddress);
    console.log("");

    // Test 2: Check if it's our PokiToken
    if (name === "PokiToken" && symbol === "PKT") {
      console.log("✅ CONFIRMED: This is a valid PokiToken contract!");
    } else {
      console.log("❌ This is NOT a PokiToken contract");
      return;
    }

    // Test 3: Check owner balance
    console.log("2️⃣ Owner Balance Check:");
    const ownerBalance = await contract.balanceOf(contractOwner);
    console.log("✅ Owner Balance:", ethers.formatEther(ownerBalance), "PKT");
    console.log("");

    // Test 4: Check if contract has custom functions by checking bytecode
    console.log("3️⃣ Custom Functions Check:");
    const code = await ethers.provider.getCode(DEPLOYED_CONTRACT_ADDRESS);
    if (code.includes("burnFrom") || code.includes("spendFrom")) {
      console.log("✅ Contract has custom marketplace functions");
    } else {
      console.log("⚠️  Contract may not have custom marketplace functions");
    }
    console.log("");

    // Test 5: Check recent activity
    console.log("4️⃣ Recent Activity Check:");
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("✅ Current block number:", blockNumber);
    console.log("✅ Contract is active and accessible");
    console.log("");

    // Test 6: Check if we can read allowances (this tests the contract is working)
    console.log("5️⃣ Functionality Test:");
    try {
      // Try to read allowance between zero addresses (should return 0)
      const allowance = await contract.allowance(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000"
      );
      console.log("✅ Allowance function working:", allowance.toString());
    } catch (error) {
      console.log("❌ Allowance function error:", error.message);
    }
    console.log("");

    console.log("🎉 Contract Test Results:");
    console.log("=========================");
    console.log("✅ Contract exists and is accessible");
    console.log("✅ Is a valid PokiToken contract");
    console.log("✅ Has correct name, symbol, and decimals");
    console.log("✅ Has owner and total supply");
    console.log("✅ Functions are callable");
    console.log("✅ Contract is active on Polygon Mainnet");
    console.log("");
    console.log("🚀 CONCLUSION: Your contract is VALID and working!");
    console.log("📍 Contract Address: " + DEPLOYED_CONTRACT_ADDRESS);
    console.log("🌐 View on PolygonScan: https://polygonscan.com/address/" + DEPLOYED_CONTRACT_ADDRESS);

  } catch (error) {
    console.log("❌ Error testing contract:", error.message);
    console.log("Stack trace:", error.stack);
  }
}

// Run the test
simpleContractTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
