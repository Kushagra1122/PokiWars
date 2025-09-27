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
  }
};
