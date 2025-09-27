const { ethers } = require("ethers");

const ADDRESS = "0xa599dac243deca9b35c57639dc1dfb1f3368e26b";
const POLYGON_RPC_URL = "https://polygon-rpc.com/";

async function checkAddressDetails() {
  console.log("🔍 Checking address details...");
  console.log("Address:", ADDRESS);
  console.log("");

  try {
    // Create provider for Polygon
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const network = await provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("");

    // Check if it's a contract
    console.log("1️⃣ Checking if it's a contract...");
    const code = await provider.getCode(ADDRESS);
    if (code === "0x") {
      console.log("❌ This is NOT a contract (it's an EOA - Externally Owned Account)");
      
      // Check if it has any balance
      const balance = await provider.getBalance(ADDRESS);
      console.log("MATIC Balance:", ethers.formatEther(balance), "MATIC");
      
      if (balance > 0) {
        console.log("✅ This address has MATIC balance");
      } else {
        console.log("⚠️  This address has no MATIC balance");
      }
      
      console.log("\n💡 This address cannot be used as a token contract");
      console.log("💡 You need to use a valid ERC20 token contract address");
      return;
    } else {
      console.log("✅ This is a contract");
      console.log("Bytecode length:", code.length, "characters");
    }
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
      const contract = new ethers.Contract(ADDRESS, erc20ABI, provider);
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
      
      // Try to read some basic contract info
      console.log("\n3️⃣ Trying to read basic contract info...");
      try {
        // Try to call a simple function that most contracts have
        const simpleABI = ["function owner() view returns (address)"];
        const simpleContract = new ethers.Contract(ADDRESS, simpleABI, provider);
        const owner = await simpleContract.owner();
        console.log("Contract Owner:", owner);
      } catch (e) {
        console.log("❌ Could not read basic contract info");
      }
    }
    console.log("");

    // Provide explorer link
    console.log("4️⃣ Explorer Links:");
    console.log("PolygonScan:", `https://polygonscan.com/address/${ADDRESS}`);

  } catch (error) {
    console.log("❌ Error checking address:", error.message);
  }
}

checkAddressDetails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
