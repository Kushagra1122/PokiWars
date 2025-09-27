const { ethers } = require("ethers");

// CORRECTED Contract configuration
const POKI_TOKEN_ADDRESS = "0xa599dac243deca9b35c57639dc1dfb1f3368e26b"; // The verified contract
const FROM_ADDRESS = "0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127";
const TO_ADDRESS = "0x5c084030bF97C84ed3873b731e77e6dBDEdcB1E9";
const TRANSFER_AMOUNT = ethers.parseEther("500"); // 500 PKT tokens
const PRIVATE_KEY = "947dfbad2bf17bd1fdca3f21814b48934b10ad98fa70812ad629e5d9baf1fd24";

// Polygon RPC URL
const POLYGON_RPC_URL = "https://polygon-rpc.com/";

// Contract ABI for PKT token
const PKT_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function owner() view returns (address)",
  "function marketplace() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function transferPKTTokens() {
  console.log("🚀 PKT Token Transfer Script (CORRECTED)");
  console.log("=========================================");
  console.log("Contract Address:", POKI_TOKEN_ADDRESS);
  console.log("From Address:", FROM_ADDRESS);
  console.log("To Address:", TO_ADDRESS);
  console.log("Amount:", ethers.formatEther(TRANSFER_AMOUNT), "PKT");
  console.log("");

  try {
    // Create provider for Polygon
    console.log("1️⃣ Setting up Polygon provider...");
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const network = await provider.getNetwork();
    console.log("✅ Connected to:", network.name);
    console.log("✅ Chain ID:", network.chainId.toString());
    console.log("");

    // Create wallet from private key
    console.log("2️⃣ Setting up wallet...");
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("✅ Wallet address:", wallet.address);
    
    // Verify the wallet address matches the from address
    if (wallet.address.toLowerCase() !== FROM_ADDRESS.toLowerCase()) {
      console.log("❌ ERROR: Wallet address doesn't match FROM_ADDRESS");
      console.log("Wallet:", wallet.address);
      console.log("Expected:", FROM_ADDRESS);
      return;
    }
    console.log("✅ Wallet address matches FROM_ADDRESS");
    console.log("");

    // Connect to the PKT token contract
    console.log("3️⃣ Connecting to PKT token contract...");
    const pktContract = new ethers.Contract(POKI_TOKEN_ADDRESS, PKT_TOKEN_ABI, wallet);
    console.log("✅ Connected to contract");
    console.log("");

    // Check contract info
    console.log("4️⃣ Checking contract information...");
    const name = await pktContract.name();
    const symbol = await pktContract.symbol();
    const decimals = await pktContract.decimals();
    const totalSupply = await pktContract.totalSupply();
    const owner = await pktContract.owner();
    const marketplace = await pktContract.marketplace();
    
    console.log("✅ Contract Name:", name);
    console.log("✅ Contract Symbol:", symbol);
    console.log("✅ Contract Decimals:", decimals.toString());
    console.log("✅ Total Supply:", ethers.formatEther(totalSupply), "tokens");
    console.log("✅ Contract Owner:", owner);
    console.log("✅ Marketplace:", marketplace);
    console.log("");

    // Check balances before transfer
    console.log("5️⃣ Checking balances before transfer...");
    const fromBalance = await pktContract.balanceOf(FROM_ADDRESS);
    const toBalance = await pktContract.balanceOf(TO_ADDRESS);
    
    console.log("From Balance:", ethers.formatEther(fromBalance), "PKT");
    console.log("To Balance:", ethers.formatEther(toBalance), "PKT");
    console.log("");

    // Check if sender has enough balance
    if (fromBalance < TRANSFER_AMOUNT) {
      console.log("❌ ERROR: Insufficient balance for transfer");
      console.log("Required:", ethers.formatEther(TRANSFER_AMOUNT), "PKT");
      console.log("Available:", ethers.formatEther(fromBalance), "PKT");
      return;
    }
    console.log("✅ Sufficient balance confirmed");
    console.log("");

    // Perform the transfer
    console.log("6️⃣ Performing transfer...");
    console.log(`Transferring ${ethers.formatEther(TRANSFER_AMOUNT)} PKT from ${FROM_ADDRESS} to ${TO_ADDRESS}...`);
    
    // Estimate gas first
    const gasEstimate = await pktContract.transfer.estimateGas(TO_ADDRESS, TRANSFER_AMOUNT);
    console.log("Estimated gas:", gasEstimate.toString());
    
    // Send the transaction
    const tx = await pktContract.transfer(TO_ADDRESS, TRANSFER_AMOUNT, {
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    
    console.log("✅ Transaction sent!");
    console.log("Transaction Hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("");

    // Check balances after transfer
    console.log("7️⃣ Checking balances after transfer...");
    const newFromBalance = await pktContract.balanceOf(FROM_ADDRESS);
    const newToBalance = await pktContract.balanceOf(TO_ADDRESS);
    
    console.log("From Balance (after):", ethers.formatEther(newFromBalance), "PKT");
    console.log("To Balance (after):", ethers.formatEther(newToBalance), "PKT");
    console.log("");

    // Verify the transfer
    const expectedToBalance = toBalance + TRANSFER_AMOUNT;
    if (newToBalance.toString() === expectedToBalance.toString()) {
      console.log("✅ Transfer successful!");
      console.log("Amount transferred:", ethers.formatEther(TRANSFER_AMOUNT), "PKT");
    } else {
      console.log("❌ Transfer verification failed");
      console.log("Expected to balance:", ethers.formatEther(expectedToBalance));
      console.log("Actual to balance:", ethers.formatEther(newToBalance));
    }
    console.log("");

    console.log("8️⃣ Transaction Details:");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("Transaction Hash:", tx.hash);
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("");

    // Provide explorer link
    console.log("🌐 View on PolygonScan:");
    console.log(`https://polygonscan.com/tx/${tx.hash}`);

    console.log("\n🎉 Transfer completed successfully!");
    console.log("================================");
    console.log("✅ 500 PKT tokens transferred successfully");
    console.log("✅ From:", FROM_ADDRESS);
    console.log("✅ To:", TO_ADDRESS);
    console.log("✅ Transaction Hash:", tx.hash);

  } catch (error) {
    console.log("❌ Error during transfer:", error.message);
    console.log("Stack trace:", error.stack);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("\n💡 Suggestion: Check if you have enough MATIC for gas fees");
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      console.log("\n💡 Suggestion: The transaction might fail, check contract state");
    } else if (error.message.includes('insufficient allowance')) {
      console.log("\n💡 Suggestion: Check if the contract has proper transfer permissions");
    }
  }
}

// Run the transfer
transferPKTTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
