const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PokiToken contract...");

  // Get the contract factory
  const PokiToken = await ethers.getContractFactory("PokiToken");

  // Deploy the contract
  const pokiToken = await PokiToken.deploy();
  await pokiToken.waitForDeployment();

  const contractAddress = await pokiToken.getAddress();
  console.log("PokiToken deployed to:", contractAddress);

  // Get deployment info
  const owner = await pokiToken.owner();
  const totalSupply = await pokiToken.totalSupply();
  const name = await pokiToken.name();
  const symbol = await pokiToken.symbol();
  const decimals = await pokiToken.decimals();

  console.log("\nContract Details:");
  console.log("Owner:", owner);
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", ethers.formatEther(totalSupply), "PKT");

  // Verify the contract on PolygonScan (if on mainnet)
  if (network.name === "polygon") {
    console.log("\nWaiting for block confirmations...");
    await pokiToken.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on PolygonScan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\nDeployment completed!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network.name);
  
  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
