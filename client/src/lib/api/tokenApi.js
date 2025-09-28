// API service for token operations
const API_BASE_URL = 'http://localhost:3001';

export const tokenApi = {
  // Transfer 500 tokens to the given address
  async transferTokens(address) {
    console.log('\n=== CLIENT: Token API Call ===');
    console.log('Address:', address);
    console.log('API URL:', `${API_BASE_URL}/transfer-tokens`);
    
    try {
      console.log('Sending request...');
      const response = await fetch(`${API_BASE_URL}/transfer-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      console.log('Response received:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        console.log('❌ Response not OK, throwing error');
        throw new Error(data.error || 'Failed to transfer tokens');
      }

      console.log('✅ Request successful');
      console.log('=== END CLIENT: Token API Call ===\n');
      return data;
    } catch (error) {
      console.error('❌ CLIENT: Token transfer error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.log('=== END CLIENT: Token API Call ===\n');
      throw error;
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },

  // Daily Rewards API Functions

  // Claim daily reward (10 PKT tokens)
  async claimDailyReward(address) {
    console.log('\n=== CLIENT: Daily Reward Claim ===');
    console.log('Address:', address);
    console.log('API URL:', `${API_BASE_URL}/claim-daily-reward`);
    
    try {
      console.log('Sending claim request...');
      const response = await fetch(`${API_BASE_URL}/claim-daily-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      console.log('Response received:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);

      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.status === 402) {
        // x402 Payment Required - reward not available yet
        console.log('⏰ Daily reward on cooldown');
        return {
          success: false,
          onCooldown: true,
          x402: data.x402,
          details: data.details
        };
      }

      if (!response.ok) {
        console.log('❌ Response not OK, throwing error');
        throw new Error(data.error || 'Failed to claim daily reward');
      }

      console.log('✅ Daily reward claimed successfully');
      console.log('=== END CLIENT: Daily Reward Claim ===\n');
      return {
        success: true,
        reward: data.reward,
        userStats: data.userStats,
        x402: data.x402
      };
    } catch (error) {
      console.error('❌ CLIENT: Daily reward claim error:', error);
      console.error('Error message:', error.message);
      console.log('=== END CLIENT: Daily Reward Claim ===\n');
      throw error;
    }
  },

  // Get user's reward status and eligibility
  async getRewardStatus(address) {
    console.log('\n=== CLIENT: Get Reward Status ===');
    console.log('Address:', address);
    
    try {
      const response = await fetch(`${API_BASE_URL}/reward-status/${address}`);
      const data = await response.json();
      
      console.log('Reward status:', data);
      console.log('=== END CLIENT: Get Reward Status ===\n');
      return data;
    } catch (error) {
      console.error('❌ CLIENT: Get reward status error:', error);
      console.log('=== END CLIENT: Get Reward Status ===\n');
      throw error;
    }
  },

  // Get system rewards statistics
  async getRewardsStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/rewards-stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get rewards stats error:', error);
      throw error;
    }
  },

  // Get reward system information
  async getRewardInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/reward-info`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get reward info error:', error);
      throw error;
    }
  }
};
