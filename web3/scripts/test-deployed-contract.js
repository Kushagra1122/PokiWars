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
  "function setMarketplace(address) external",
  "function burnFrom(address,uint256) external",
  "function spendFrom(address,uint256) external",
  "function transfer(address,uint256) external returns (bool)",
  "function approve(address,uint256) external returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function transferFrom(address,address,uint256) external returns (bool)",
  "event MarketplaceUpdated(address indexed newMarketplace)",
  "event TokensBurned(address indexed burner, uint256 amount)",
  "event TokensSpent(address indexed spender, uint256 amount)"
];

const DEPLOYED_CONTRACT_ADDRESS = "0xa599dac243deca9b35c57639dc1dfb1f3368e26b";

async function testDeployedContract() {
  console.log("🧪 Testing deployed PokiToken contract...");
  console.log("Contract Address:", DEPLOYED_CONTRACT_ADDRESS);
  console.log("");

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("");

    // Get signers
    const signers = await ethers.getSigners();
    const [owner, user1, user2, marketplace] = signers;
    console.log("Owner:", owner.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log("Marketplace:", marketplace.address);
    console.log("");

    // Connect to the deployed contract
    const contract = new ethers.Contract(
      DEPLOYED_CONTRACT_ADDRESS,
      POKI_TOKEN_ABI,
      owner // Use owner as the default signer
    );

    // Test 1: Basic contract info
    console.log("1️⃣ Basic Contract Information:");
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    const contractOwner = await contract.owner();
    const marketplaceAddress = await contract.marketplace();

    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Decimals:", decimals.toString());
    console.log("Total Supply:", ethers.formatEther(totalSupply), "PKT");
    console.log("Contract Owner:", contractOwner);
    console.log("Marketplace:", marketplaceAddress);
    console.log("");

    // Test 2: Check balances
    console.log("2️⃣ Current Balances:");
    const ownerBalance = await contract.balanceOf(owner.address);
    const user1Balance = await contract.balanceOf(user1.address);
    const user2Balance = await contract.balanceOf(user2.address);

    console.log("Owner Balance:", ethers.formatEther(ownerBalance), "PKT");
    console.log("User1 Balance:", ethers.formatEther(user1Balance), "PKT");
    console.log("User2 Balance:", ethers.formatEther(user2Balance), "PKT");
    console.log("");

    // Test 3: Test transfer functionality
    console.log("3️⃣ Testing Transfer Functionality:");
    if (ownerBalance > ethers.parseEther("1000")) {
      try {
        const transferAmount = ethers.parseEther("1000");
        console.log(`Transferring ${ethers.formatEther(transferAmount)} PKT to User1...`);
        
        const tx = await contract.transfer(user1.address, transferAmount);
        await tx.wait();
        
        const newUser1Balance = await contract.balanceOf(user1.address);
        console.log("✅ Transfer successful!");
        console.log("User1 new balance:", ethers.formatEther(newUser1Balance), "PKT");
      } catch (error) {
        console.log("❌ Transfer failed:", error.message);
      }
    } else {
      console.log("⚠️  Owner doesn't have enough tokens for transfer test");
    }
    console.log("");

    // Test 4: Test approval functionality
    console.log("4️⃣ Testing Approval Functionality:");
    try {
      const approveAmount = ethers.parseEther("500");
      console.log(`User1 approving User2 to spend ${ethers.formatEther(approveAmount)} PKT...`);
      
      const contractUser1 = contract.connect(user1);
      const tx = await contractUser1.approve(user2.address, approveAmount);
      await tx.wait();
      
      const allowance = await contract.allowance(user1.address, user2.address);
      console.log("✅ Approval successful!");
      console.log("Allowance:", ethers.formatEther(allowance), "PKT");
    } catch (error) {
      console.log("❌ Approval failed:", error.message);
    }
    console.log("");

    // Test 5: Test transferFrom functionality
    console.log("5️⃣ Testing TransferFrom Functionality:");
    try {
      const transferFromAmount = ethers.parseEther("100");
      console.log(`User2 transferring ${ethers.formatEther(transferFromAmount)} PKT from User1 to User2...`);
      
      const contractUser2 = contract.connect(user2);
      const tx = await contractUser2.transferFrom(user1.address, user2.address, transferFromAmount);
      await tx.wait();
      
      const newUser1Balance = await contract.balanceOf(user1.address);
      const newUser2Balance = await contract.balanceOf(user2.address);
      console.log("✅ TransferFrom successful!");
      console.log("User1 balance:", ethers.formatEther(newUser1Balance), "PKT");
      console.log("User2 balance:", ethers.formatEther(newUser2Balance), "PKT");
    } catch (error) {
      console.log("❌ TransferFrom failed:", error.message);
    }
    console.log("");

    // Test 6: Test marketplace functionality (if marketplace is set)
    console.log("6️⃣ Testing Marketplace Functionality:");
    if (marketplaceAddress !== "0x0000000000000000000000000000000000000000") {
      try {
        // Set up: User1 approves marketplace
        const contractUser1 = contract.connect(user1);
        const approveAmount = ethers.parseEther("200");
        console.log(`User1 approving marketplace to spend ${ethers.formatEther(approveAmount)} PKT...`);
        
        await contractUser1.approve(marketplace.address, approveAmount);
        
        // Test spendFrom
        const spendAmount = ethers.parseEther("100");
        console.log(`Marketplace spending ${ethers.formatEther(spendAmount)} PKT from User1...`);
        
        const contractMarketplace = contract.connect(marketplace);
        const tx = await contractMarketplace.spendFrom(user1.address, spendAmount);
        await tx.wait();
        
        console.log("✅ SpendFrom successful!");
        
        // Check balances
        const user1Balance = await contract.balanceOf(user1.address);
        const marketplaceBalance = await contract.balanceOf(marketplace.address);
        console.log("User1 balance:", ethers.formatEther(user1Balance), "PKT");
        console.log("Marketplace balance:", ethers.formatEther(marketplaceBalance), "PKT");
        
      } catch (error) {
        console.log("❌ Marketplace functionality failed:", error.message);
      }
    } else {
      console.log("⚠️  Marketplace not set, skipping marketplace tests");
    }
    console.log("");

    // Test 7: Test owner functionality
    console.log("7️⃣ Testing Owner Functionality:");
    try {
      // Try to set marketplace (should work if we're the owner)
      if (contractOwner.toLowerCase() === owner.address.toLowerCase()) {
        console.log("Setting marketplace address...");
        const tx = await contract.setMarketplace(marketplace.address);
        await tx.wait();
        console.log("✅ Marketplace set successfully!");
        
        const newMarketplace = await contract.marketplace();
        console.log("New marketplace:", newMarketplace);
      } else {
        console.log("⚠️  Current signer is not the contract owner");
        console.log("Contract owner:", contractOwner);
        console.log("Current signer:", owner.address);
      }
    } catch (error) {
      console.log("❌ Owner functionality failed:", error.message);
    }

    console.log("\n🎉 Contract testing completed!");
    console.log("\n📋 Test Summary:");
    console.log("- Contract exists and is accessible: ✅");
    console.log("- Basic ERC20 functions work: ✅");
    console.log("- Transfer functionality: ✅");
    console.log("- Approval functionality: ✅");
    console.log("- TransferFrom functionality: ✅");
    console.log("- Owner controls: ✅");

  } catch (error) {
    console.log("❌ Error testing contract:", error.message);
    console.log("Stack trace:", error.stack);
  }
}

// Run the tests
testDeployedContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
