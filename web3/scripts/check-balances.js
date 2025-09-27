const { ethers } = require("ethers");

async function checkBalances() {
  console.log("🔍 PKT Token Balance Checker");
  console.log("=============================");

  // Configuration
  const PRIVATE_KEY = "947dfbad2bf17bd1fdca3f21814b48934b10ad98fa70812ad629e5d9baf1fd24";
  const CONTRACT_ADDRESS = "0xa599dac243deca9b35c57639dc1dfb1f3368e26b";
  const ADDRESS_1 = "0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127";
  const ADDRESS_2 = "0x5c084030bF97C84ed3873b731e77e6dBDEdcB1E9";

  // Contract ABI (minimal for balance checking)
  const contractABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function totalSupply() external view returns (uint256)"
  ];

  try {
    // Set up provider (using Polygon mainnet)
    const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com/");
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("Wallet address:", wallet.address);

    // Get network info
    const network = await provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId);
    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("");

    // Connect to contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

    // Get token info
    console.log("📊 Token Information:");
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    
    console.log("Token Name:", name);
    console.log("Token Symbol:", symbol);
    console.log("Decimals:", decimals.toString());
    console.log("Total Supply:", ethers.formatUnits(totalSupply, decimals), "tokens");
    console.log("");

    // Check balances
    console.log("💰 Balance Check:");
    console.log("=================");

    // Check balance of address 1
    console.log("1️⃣ Address 1:");
    console.log("Address:", ADDRESS_1);
    const balance1 = await contract.balanceOf(ADDRESS_1);
    const balance1Formatted = ethers.formatUnits(balance1, decimals);
    console.log("Balance:", balance1Formatted, symbol);
    console.log("");

    // Check balance of address 2
    console.log("2️⃣ Address 2:");
    console.log("Address:", ADDRESS_2);
    const balance2 = await contract.balanceOf(ADDRESS_2);
    const balance2Formatted = ethers.formatUnits(balance2, decimals);
    console.log("Balance:", balance2Formatted, symbol);
    console.log("");

    // Summary
    console.log("📋 Summary:");
    console.log("===========");
    console.log(`${ADDRESS_1}: ${balance1Formatted} ${symbol}`);
    console.log(`${ADDRESS_2}: ${balance2Formatted} ${symbol}`);
    
    const totalBalance = balance1 + balance2;
    const totalBalanceFormatted = ethers.formatUnits(totalBalance, decimals);
    console.log(`Total: ${totalBalanceFormatted} ${symbol}`);
    console.log("");

    // Check if addresses are the same as wallet
    console.log("🔗 Address Verification:");
    console.log("========================");
    if (ADDRESS_1.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("✅ Address 1 matches wallet address");
    } else {
      console.log("❌ Address 1 does not match wallet address");
    }
    
    if (ADDRESS_2.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("✅ Address 2 matches wallet address");
    } else {
      console.log("❌ Address 2 does not match wallet address");
    }

  } catch (error) {
    console.error("❌ Error checking balances:", error.message);
    
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    
    process.exit(1);
  }
}

// Execute the balance check
checkBalances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
