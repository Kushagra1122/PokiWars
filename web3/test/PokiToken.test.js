const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PokiToken", function () {
  let pokiToken;
  let owner;
  let marketplace;
  let user1;
  let user2;
  let addrs;

  const INITIAL_SUPPLY = ethers.parseEther("100000"); // 100,000 PKT tokens
  const TRANSFER_AMOUNT = ethers.parseEther("1000");
  const BURN_AMOUNT = ethers.parseEther("500");
  const SPEND_AMOUNT = ethers.parseEther("200");

  beforeEach(async function () {
    [owner, marketplace, user1, user2, ...addrs] = await ethers.getSigners();

    // Deploy PokiToken contract
    const PokiToken = await ethers.getContractFactory("PokiToken");
    pokiToken = await PokiToken.deploy();
    await pokiToken.waitForDeployment();

    // Set marketplace address
    await pokiToken.setMarketplace(marketplace.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pokiToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await pokiToken.balanceOf(owner.address);
      expect(await pokiToken.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct name and symbol", async function () {
      expect(await pokiToken.name()).to.equal("PokiToken");
      expect(await pokiToken.symbol()).to.equal("PKT");
    });

    it("Should have correct decimals", async function () {
      expect(await pokiToken.decimals()).to.equal(18);
    });
  });

  describe("setMarketplace", function () {
    it("Should allow owner to set marketplace address", async function () {
      const newMarketplace = addrs[0].address;
      await expect(pokiToken.setMarketplace(newMarketplace))
        .to.emit(pokiToken, "MarketplaceUpdated")
        .withArgs(newMarketplace);
      
      expect(await pokiToken.marketplace()).to.equal(newMarketplace);
    });

    it("Should not allow non-owner to set marketplace", async function () {
      const newMarketplace = addrs[0].address;
      await expect(
        pokiToken.connect(user1).setMarketplace(newMarketplace)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit MarketplaceUpdated event", async function () {
      const newMarketplace = addrs[0].address;
      await expect(pokiToken.setMarketplace(newMarketplace))
        .to.emit(pokiToken, "MarketplaceUpdated")
        .withArgs(newMarketplace);
    });
  });

  describe("Standard ERC20 Functions", function () {
    it("Should transfer tokens between accounts", async function () {
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      expect(await pokiToken.balanceOf(user1.address)).to.equal(TRANSFER_AMOUNT);
      expect(await pokiToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - TRANSFER_AMOUNT);
    });

    it("Should fail if sender doesn't have enough balance", async function () {
      await expect(
        pokiToken.connect(user1).transfer(user2.address, TRANSFER_AMOUNT)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should allow approved spender to transfer tokens", async function () {
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      await pokiToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT);
      expect(await pokiToken.balanceOf(user2.address)).to.equal(TRANSFER_AMOUNT);
      expect(await pokiToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should fail if transferFrom exceeds allowance", async function () {
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT / 2n);
      
      await expect(
        pokiToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("burnFrom", function () {
    beforeEach(async function () {
      // Transfer tokens to user1 and approve marketplace to spend them
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(marketplace.address, BURN_AMOUNT);
    });

    it("Should allow marketplace to burn tokens from user", async function () {
      const initialBalance = await pokiToken.balanceOf(user1.address);
      const initialSupply = await pokiToken.totalSupply();

      await expect(pokiToken.connect(marketplace).burnFrom(user1.address, BURN_AMOUNT))
        .to.emit(pokiToken, "TokensBurned")
        .withArgs(user1.address, BURN_AMOUNT);

      expect(await pokiToken.balanceOf(user1.address)).to.equal(initialBalance - BURN_AMOUNT);
      expect(await pokiToken.totalSupply()).to.equal(initialSupply - BURN_AMOUNT);
    });

    it("Should fail if caller is not marketplace", async function () {
      await expect(
        pokiToken.connect(user2).burnFrom(user1.address, BURN_AMOUNT)
      ).to.be.revertedWith("Only marketplace can burn tokens");
    });

    it("Should fail if user doesn't have enough allowance", async function () {
      await pokiToken.connect(user1).approve(marketplace.address, BURN_AMOUNT / 2n);
      
      await expect(
        pokiToken.connect(marketplace).burnFrom(user1.address, BURN_AMOUNT)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should fail if user doesn't have enough balance", async function () {
      // Approve more than user has
      await pokiToken.connect(user1).approve(marketplace.address, TRANSFER_AMOUNT * 2n);
      
      await expect(
        pokiToken.connect(marketplace).burnFrom(user1.address, TRANSFER_AMOUNT * 2n)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should decrease allowance after burning", async function () {
      const initialAllowance = await pokiToken.allowance(user1.address, marketplace.address);
      
      await pokiToken.connect(marketplace).burnFrom(user1.address, BURN_AMOUNT);
      
      expect(await pokiToken.allowance(user1.address, marketplace.address))
        .to.equal(initialAllowance - BURN_AMOUNT);
    });
  });

  describe("spendFrom", function () {
    beforeEach(async function () {
      // Transfer tokens to user1 and approve marketplace to spend them
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(marketplace.address, SPEND_AMOUNT);
    });

    it("Should allow marketplace to spend tokens from user", async function () {
      const initialUserBalance = await pokiToken.balanceOf(user1.address);
      const initialMarketplaceBalance = await pokiToken.balanceOf(marketplace.address);

      await expect(pokiToken.connect(marketplace).spendFrom(user1.address, SPEND_AMOUNT))
        .to.emit(pokiToken, "TokensSpent")
        .withArgs(user1.address, SPEND_AMOUNT);

      expect(await pokiToken.balanceOf(user1.address)).to.equal(initialUserBalance - SPEND_AMOUNT);
      expect(await pokiToken.balanceOf(marketplace.address)).to.equal(initialMarketplaceBalance + SPEND_AMOUNT);
    });

    it("Should fail if caller is not marketplace", async function () {
      await expect(
        pokiToken.connect(user2).spendFrom(user1.address, SPEND_AMOUNT)
      ).to.be.revertedWith("Only marketplace can spend tokens");
    });

    it("Should fail if user doesn't have enough allowance", async function () {
      await pokiToken.connect(user1).approve(marketplace.address, SPEND_AMOUNT / 2n);
      
      await expect(
        pokiToken.connect(marketplace).spendFrom(user1.address, SPEND_AMOUNT)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should fail if user doesn't have enough balance", async function () {
      // Approve more than user has
      await pokiToken.connect(user1).approve(marketplace.address, TRANSFER_AMOUNT * 2n);
      
      await expect(
        pokiToken.connect(marketplace).spendFrom(user1.address, TRANSFER_AMOUNT * 2n)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should decrease allowance after spending", async function () {
      const initialAllowance = await pokiToken.allowance(user1.address, marketplace.address);
      
      await pokiToken.connect(marketplace).spendFrom(user1.address, SPEND_AMOUNT);
      
      expect(await pokiToken.allowance(user1.address, marketplace.address))
        .to.equal(initialAllowance - SPEND_AMOUNT);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      await pokiToken.transfer(user1.address, 0);
      expect(await pokiToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should handle zero amount burns", async function () {
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(marketplace.address, TRANSFER_AMOUNT);
      
      await expect(pokiToken.connect(marketplace).burnFrom(user1.address, 0))
        .to.emit(pokiToken, "TokensBurned")
        .withArgs(user1.address, 0);
    });

    it("Should handle zero amount spends", async function () {
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(marketplace.address, TRANSFER_AMOUNT);
      
      await expect(pokiToken.connect(marketplace).spendFrom(user1.address, 0))
        .to.emit(pokiToken, "TokensSpent")
        .withArgs(user1.address, 0);
    });

    it("Should handle maximum uint256 values", async function () {
      const maxAmount = ethers.MaxUint256;
      
      // This should fail due to insufficient balance
      await expect(
        pokiToken.transfer(user1.address, maxAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("Events", function () {
    it("Should emit Transfer events for standard transfers", async function () {
      await expect(pokiToken.transfer(user1.address, TRANSFER_AMOUNT))
        .to.emit(pokiToken, "Transfer")
        .withArgs(owner.address, user1.address, TRANSFER_AMOUNT);
    });

    it("Should emit Approval events for approvals", async function () {
      await expect(pokiToken.approve(user1.address, TRANSFER_AMOUNT))
        .to.emit(pokiToken, "Approval")
        .withArgs(owner.address, user1.address, TRANSFER_AMOUNT);
    });

    it("Should emit Transfer events for transferFrom", async function () {
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      await expect(pokiToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT))
        .to.emit(pokiToken, "Transfer")
        .withArgs(user1.address, user2.address, TRANSFER_AMOUNT);
    });
  });

  describe("Integration Tests", function () {
    it("Should work with multiple users and marketplace operations", async function () {
      // Setup: Transfer tokens to multiple users
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.transfer(user2.address, TRANSFER_AMOUNT);
      
      // Users approve marketplace
      await pokiToken.connect(user1).approve(marketplace.address, BURN_AMOUNT);
      await pokiToken.connect(user2).approve(marketplace.address, SPEND_AMOUNT);
      
      // Marketplace burns from user1
      await pokiToken.connect(marketplace).burnFrom(user1.address, BURN_AMOUNT);
      
      // Marketplace spends from user2
      await pokiToken.connect(marketplace).spendFrom(user2.address, SPEND_AMOUNT);
      
      // Verify final balances
      expect(await pokiToken.balanceOf(user1.address)).to.equal(TRANSFER_AMOUNT - BURN_AMOUNT);
      expect(await pokiToken.balanceOf(user2.address)).to.equal(TRANSFER_AMOUNT - SPEND_AMOUNT);
      expect(await pokiToken.balanceOf(marketplace.address)).to.equal(SPEND_AMOUNT);
      
      // Verify total supply decreased by burn amount
      expect(await pokiToken.totalSupply()).to.equal(INITIAL_SUPPLY - BURN_AMOUNT);
    });

    it("Should handle partial allowances correctly", async function () {
      await pokiToken.transfer(user1.address, TRANSFER_AMOUNT);
      await pokiToken.connect(user1).approve(marketplace.address, TRANSFER_AMOUNT);
      
      // Spend half the allowance
      await pokiToken.connect(marketplace).spendFrom(user1.address, TRANSFER_AMOUNT / 2n);
      
      // Should be able to spend the remaining half
      await pokiToken.connect(marketplace).spendFrom(user1.address, TRANSFER_AMOUNT / 2n);
      
      // Should not be able to spend more
      await expect(
        pokiToken.connect(marketplace).spendFrom(user1.address, 1)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });
});
