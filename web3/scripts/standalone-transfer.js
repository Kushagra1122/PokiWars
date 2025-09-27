const { ethers } = require("ethers");

async function main() {
  console.log("Starting PKT token transfer (Standalone)...");

  // Configuration
  const PRIVATE_KEY = "947dfbad2bf17bd1fdca3f21814b48934b10ad98fa70812ad629e5d9baf1fd24";
  const CONTRACT_ADDRESS = "0x80e044c711a6904950ff6cbb8f3bdb18877be483";
  const FROM_ADDRESS = "0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127";
  const TO_ADDRESS = "0x5c084030bF97C84ed3873b731e77e6dBDEdcB1E9";
  const TRANSFER_AMOUNT = 500; // 500 PKT tokens

  // Contract ABI (minimal for transfer functions)
  const contractABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
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

    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("From address:", FROM_ADDRESS);
    console.log("To address:", TO_ADDRESS);
    console.log("Transfer amount:", TRANSFER_AMOUNT, "PKT");

    // Get token info
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    
    console.log("Token:", name, "(" + symbol + ")");
    console.log("Decimals:", decimals);

    // Check wallet balance
    const balance = await contract.balanceOf(wallet.address);
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    
    console.log("Wallet balance:", balanceFormatted, "PKT");

    // Check if the wallet has enough tokens
    const transferAmountWei = ethers.parseUnits(TRANSFER_AMOUNT.toString(), decimals);
    
    if (balance < transferAmountWei) {
      throw new Error(`Insufficient balance. Required: ${TRANSFER_AMOUNT} PKT, Available: ${balanceFormatted} PKT`);
    }

    // Check if the from address has enough balance (if different from wallet)
    if (FROM_ADDRESS.toLowerCase() !== wallet.address.toLowerCase()) {
      const fromBalance = await contract.balanceOf(FROM_ADDRESS);
      const fromBalanceFormatted = ethers.formatUnits(fromBalance, decimals);
      
      console.log("From address balance:", fromBalanceFormatted, "PKT");
      
      if (fromBalance < transferAmountWei) {
        throw new Error(`Insufficient balance in from address. Required: ${TRANSFER_AMOUNT} PKT, Available: ${fromBalanceFormatted} PKT`);
      }

      // Check allowance if transferring from a different address
      const allowance = await contract.allowance(FROM_ADDRESS, wallet.address);
      console.log("Current allowance:", ethers.formatUnits(allowance, decimals), "PKT");

      if (allowance < transferAmountWei) {
        console.log("Insufficient allowance. Attempting to approve...");
        
        // Approve the transfer
        const approveTx = await contract.approve(wallet.address, transferAmountWei);
        console.log("Approval transaction hash:", approveTx.hash);
        
        await approveTx.wait();
        console.log("Approval confirmed!");
      }
    }

    // Execute the transfer
    console.log("\nExecuting transfer...");
    
    let transferTx;
    if (FROM_ADDRESS.toLowerCase() === wallet.address.toLowerCase()) {
      // Direct transfer
      transferTx = await contract.transfer(TO_ADDRESS, transferAmountWei);
    } else {
      // Transfer from another address (requires allowance)
      transferTx = await contract.transferFrom(FROM_ADDRESS, TO_ADDRESS, transferAmountWei);
    }

    console.log("Transfer transaction hash:", transferTx.hash);
    console.log("Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await transferTx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Verify the transfer
    const toBalance = await contract.balanceOf(TO_ADDRESS);
    const toBalanceFormatted = ethers.formatUnits(toBalance, decimals);
    
    console.log("\nTransfer completed successfully!");
    console.log("Recipient balance:", toBalanceFormatted, "PKT");
    console.log("Transaction hash:", transferTx.hash);
    console.log("Block number:", receipt.blockNumber);

  } catch (error) {
    console.error("Error during transfer:", error.message);
    
    // If it's a revert reason, try to decode it
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    
    process.exit(1);
  }
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
