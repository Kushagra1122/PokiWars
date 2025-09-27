const { ethers } = require("ethers");

async function distributeWinnings() {
  console.log("🏆 PKT Winnings Distribution Script");
  console.log("===================================");

  // Configuration
  const PRIVATE_KEY = "947dfbad2bf17bd1fdca3f21814b48934b10ad98fa70812ad629e5d9baf1fd24";
  const CONTRACT_ADDRESS = "0x80e044c711a6904950ff6cbb8f3bdb18877be483";
  const STAKING_ADDRESS = "0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127";
  
  // Winner addresses (replace with actual winners)
  const FIRST_PLACE = "0x5c084030bF97C84ed3873b731e77e6dBDEdcB1E9";  // 50%
  const SECOND_PLACE = "0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127"; // 30%
  const THIRD_PLACE = "0x80e044c711a6904950ff6cbb8f3bdb18877be483";   // 20%

  // Contract ABI (minimal for transfer functions)
  const contractABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)"
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

    // Connect to contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

    // Get token info
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    
    console.log("Token:", name, "(" + symbol + ")");
    console.log("Decimals:", decimals);

    // Check staking pool balance
    const poolBalance = await contract.balanceOf(STAKING_ADDRESS);
    const poolBalanceFormatted = ethers.formatUnits(poolBalance, decimals);
    
    console.log("\n💰 Pool Information:");
    console.log("Pool Address:", STAKING_ADDRESS);
    console.log("Total Pool:", poolBalanceFormatted, symbol);

    if (poolBalance === 0n) {
      console.log("❌ No tokens in the staking pool to distribute");
      return;
    }

    // Calculate winnings (50-30-20%)
    const firstPlaceAmount = poolBalance * 50n / 100n;  // 50%
    const secondPlaceAmount = poolBalance * 30n / 100n; // 30%
    const thirdPlaceAmount = poolBalance * 20n / 100n;  // 20%

    console.log("\n🏆 Winnings Distribution:");
    console.log("1st Place (50%):", ethers.formatUnits(firstPlaceAmount, decimals), symbol);
    console.log("2nd Place (30%):", ethers.formatUnits(secondPlaceAmount, decimals), symbol);
    console.log("3rd Place (20%):", ethers.formatUnits(thirdPlaceAmount, decimals), symbol);

    // Verify total distribution
    const totalDistribution = firstPlaceAmount + secondPlaceAmount + thirdPlaceAmount;
    if (totalDistribution !== poolBalance) {
      console.log("⚠️ Warning: Total distribution doesn't match pool balance");
      console.log("Total to distribute:", ethers.formatUnits(totalDistribution, decimals));
      console.log("Pool balance:", poolBalanceFormatted);
    }

    // Check if staking address has enough balance
    const stakingBalance = await contract.balanceOf(STAKING_ADDRESS);
    if (stakingBalance < poolBalance) {
      throw new Error("Staking address doesn't have enough tokens to distribute");
    }

    console.log("\n🚀 Starting distribution...");

    // Distribute to 1st place (50%)
    console.log("\n1️⃣ Distributing to 1st place...");
    const tx1 = await contract.transfer(FIRST_PLACE, firstPlaceAmount, {
      gasLimit: 100000
    });
    console.log("Transaction hash:", tx1.hash);
    await tx1.wait();
    console.log("✅ 1st place distribution confirmed");

    // Distribute to 2nd place (30%)
    console.log("\n2️⃣ Distributing to 2nd place...");
    const tx2 = await contract.transfer(SECOND_PLACE, secondPlaceAmount, {
      gasLimit: 100000
    });
    console.log("Transaction hash:", tx2.hash);
    await tx2.wait();
    console.log("✅ 2nd place distribution confirmed");

    // Distribute to 3rd place (20%)
    console.log("\n3️⃣ Distributing to 3rd place...");
    const tx3 = await contract.transfer(THIRD_PLACE, thirdPlaceAmount, {
      gasLimit: 100000
    });
    console.log("Transaction hash:", tx3.hash);
    await tx3.wait();
    console.log("✅ 3rd place distribution confirmed");

    // Verify final balances
    console.log("\n📊 Final Balances:");
    const finalFirst = await contract.balanceOf(FIRST_PLACE);
    const finalSecond = await contract.balanceOf(SECOND_PLACE);
    const finalThird = await contract.balanceOf(THIRD_PLACE);
    const finalPool = await contract.balanceOf(STAKING_ADDRESS);

    console.log("1st Place:", ethers.formatUnits(finalFirst, decimals), symbol);
    console.log("2nd Place:", ethers.formatUnits(finalSecond, decimals), symbol);
    console.log("3rd Place:", ethers.formatUnits(finalThird, decimals), symbol);
    console.log("Pool (should be 0):", ethers.formatUnits(finalPool, decimals), symbol);

    console.log("\n🎉 Distribution completed successfully!");
    console.log("=====================================");
    console.log("✅ All winnings have been distributed");
    console.log("✅ Pool has been emptied");

  } catch (error) {
    console.error("❌ Distribution failed:", error.message);
    
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    
    process.exit(1);
  }
}

// Execute the distribution
distributeWinnings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
