import { ethers } from 'ethers';
import tokenABI from '../../consts/tokenabi.json';

// Contract configuration
const POKI_TOKEN_ADDRESS = '0xa599dac243deca9b35c57639dc1dfb1f3368e26b';
const STAKING_ADDRESS = '0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127';
const STAKE_AMOUNT = 10; // 10 PKT tokens

// Polygon RPC URL
const POLYGON_RPC_URL = "https://polygon-rpc.com/";

class StakingService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  // Initialize the service with wallet connection
  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.signer = this.provider.getSigner();
    this.contract = new ethers.Contract(POKI_TOKEN_ADDRESS, tokenABI, this.signer);
  }

  // Check if user has enough PKT tokens for staking
  async checkStakingEligibility(userAddress) {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const balance = await this.contract.balanceOf(userAddress);
      const decimals = await this.contract.decimals();
      const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
      
      const stakeAmountWei = ethers.utils.parseUnits(STAKE_AMOUNT.toString(), decimals);
      
      return {
        hasEnoughTokens: balance.gte(stakeAmountWei),
        currentBalance: parseFloat(balanceFormatted),
        requiredAmount: STAKE_AMOUNT,
        shortfall: Math.max(0, STAKE_AMOUNT - parseFloat(balanceFormatted))
      };
    } catch (error) {
      console.error('Error checking staking eligibility:', error);
      throw error;
    }
  }

  // Stake 10 PKT tokens to the staking address
  async stakeTokens() {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const userAddress = await this.signer.getAddress();
      
      // Check eligibility first
      const eligibility = await this.checkStakingEligibility(userAddress);
      if (!eligibility.hasEnoughTokens) {
        throw new Error(`Insufficient PKT tokens. You have ${eligibility.currentBalance} PKT but need ${STAKE_AMOUNT} PKT`);
      }

      const decimals = await this.contract.decimals();
      const stakeAmountWei = ethers.utils.parseUnits(STAKE_AMOUNT.toString(), decimals);

      // Check current allowance
      const allowance = await this.contract.allowance(userAddress, STAKING_ADDRESS);
      
      if (allowance.lt(stakeAmountWei)) {
        // Need to approve first
        console.log('Approving tokens for staking...');
        const approveTx = await this.contract.approve(STAKING_ADDRESS, stakeAmountWei, {
          gasLimit: 150000
        });
        
        console.log('Approval transaction:', approveTx.hash);
        await approveTx.wait();
        console.log('Approval confirmed');
      }

      // Transfer tokens to staking address
      console.log(`Staking ${STAKE_AMOUNT} PKT tokens...`);
      const transferTx = await this.contract.transfer(STAKING_ADDRESS, stakeAmountWei, {
        gasLimit: 100000
      });

      console.log('Staking transaction:', transferTx.hash);
      const receipt = await transferTx.wait();

      if (receipt.status === 1) {
        console.log('Staking successful!');
        return {
          success: true,
          transactionHash: transferTx.hash,
          amount: STAKE_AMOUNT,
          stakingAddress: STAKING_ADDRESS
        };
      } else {
        throw new Error('Staking transaction failed');
      }

    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  // Get staking pool balance (total staked amount)
  async getPoolBalance() {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const balance = await this.contract.balanceOf(STAKING_ADDRESS);
      const decimals = await this.contract.decimals();
      const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
      
      return {
        totalStaked: parseFloat(balanceFormatted),
        stakingAddress: STAKING_ADDRESS
      };
    } catch (error) {
      console.error('Error getting pool balance:', error);
      throw error;
    }
  }

  // Calculate winnings distribution (50-30-20%)
  calculateWinnings(totalPool) {
    return {
      firstPlace: totalPool * 0.5,   // 50%
      secondPlace: totalPool * 0.3,  // 30%
      thirdPlace: totalPool * 0.2    // 20%
    };
  }

  // Check if user has already staked in this lobby
  async hasUserStaked(userAddress) {
    try {
      // This would need to be tracked on the server side
      // For now, we'll return false and let the server handle this
      return false;
    } catch (error) {
      console.error('Error checking if user has staked:', error);
      return false;
    }
  }

  // Get staking status for display
  async getStakingStatus(userAddress) {
    try {
      const eligibility = await this.checkStakingEligibility(userAddress);
      const poolBalance = await this.getPoolBalance();
      const hasStaked = await this.hasUserStaked(userAddress);

      return {
        ...eligibility,
        poolBalance: poolBalance.totalStaked,
        hasStaked,
        stakingAddress: STAKING_ADDRESS,
        stakeAmount: STAKE_AMOUNT
      };
    } catch (error) {
      console.error('Error getting staking status:', error);
      throw error;
    }
  }
}

// Create singleton instance
const stakingService = new StakingService();

export default stakingService;
