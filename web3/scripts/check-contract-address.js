const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0xa599dac243deca9b35c57639dc1dfb1f3368e26b";

async function checkContractAddress() {
  console.log("🔍 Checking contract address...");
  console.log("Address:", CONTRACT_ADDRESS);
  console.log("");

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("");

    // Check if contract exists
    console.log("1️⃣ Checking if contract exists...");
    const code = await ethers.provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      console.log("❌ No contract found at this address");
      console.log("This could mean:");
      console.log("- Address is not a contract");
      console.log("- Contract was self-destructed");
      console.log("- Wrong network");
      return;
    }
    console.log("✅ Contract exists");
    console.log("Bytecode length:", code.length, "characters");
    console.log("");

    // Try to read as ERC20
    console.log("2️⃣ Testing as ERC20 token...");
    const erc20ABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)"
    ];

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, erc20ABI, ethers.provider);
      const name = await contract.name();
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      const totalSupply = await contract.totalSupply();
      
      console.log("✅ This is an ERC20 token!");
      console.log("Name:", name);
      console.log("Symbol:", symbol);
      console.log("Decimals:", decimals.toString());
      console.log("Total Supply:", ethers.formatEther(totalSupply), "tokens");
    } catch (error) {
      console.log("❌ Not a valid ERC20 token");
      console.log("Error:", error.message);
    }
    console.log("");

    // Check if it's an EOA (Externally Owned Account)
    console.log("3️⃣ Checking if it's an EOA...");
    try {
      const balance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
      console.log("ETH/MATIC Balance:", ethers.formatEther(balance), "MATIC");
      
      if (balance > 0) {
        console.log("✅ This address has a balance (likely an EOA)");
      } else {
        console.log("⚠️  This address has no balance");
      }
    } catch (error) {
      console.log("❌ Error checking balance:", error.message);
    }
    console.log("");

    // Provide explorer link
    console.log("4️⃣ Explorer Links:");
    if (network.chainId === 137n) {
      console.log("PolygonScan:", `https://polygonscan.com/address/${CONTRACT_ADDRESS}`);
    } else if (network.chainId === 80002n) {
      console.log("PolygonScan Amoy:", `https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`);
    } else {
      console.log("Check your local blockchain explorer");
    }

  } catch (error) {
    console.log("❌ Error checking address:", error.message);
  }
}

checkContractAddress()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
