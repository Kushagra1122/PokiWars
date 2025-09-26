async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const initialSupply = ethers.utils.parseUnits("1000000", 18); // 1 million tokens with 18 decimals
    const PokiToken = await ethers.getContractFactory("PokiToken");
    const token = await PokiToken.deploy(initialSupply);

    await token.deployed();

    console.log("PokiToken deployed to:", token.address);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});
