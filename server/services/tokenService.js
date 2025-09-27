const { ethers } = require('ethers');
const tokenABI = require('../consts/tokenabi.json');

class TokenService {
    constructor() {
        // Configuration - reads from environment variables
        this.privateKey = process.env.PRIVATE_KEY;
        // Try multiple RPC URLs for better reliability
        this.rpcUrls = [
            'https://polygon-rpc.com/',
            'https://polygon.drpc.org',
            'https://rpc.ankr.com/polygon'
        ];
        this.rpcUrl = this.rpcUrls[0]; // Start with the first one
        this.contractAddress = '0x80e044c711a6904950ff6cbb8f3bdb18877be483';
        
        // Validate private key
        if (!this.privateKey) {
            throw new Error('PRIVATE_KEY environment variable is not set');
        }
        
        // Remove '0x' prefix if present and validate format
        if (this.privateKey.startsWith('0x')) {
            this.privateKey = this.privateKey.slice(2);
        }
        
        // Validate private key length (should be 64 hex characters)
        if (this.privateKey.length !== 64) {
            throw new Error('Invalid private key length. Must be 64 hex characters.');
        }
        
        // Validate hex format
        if (!/^[0-9a-fA-F]+$/.test(this.privateKey)) {
            throw new Error('Invalid private key format. Must be hexadecimal.');
        }
        
        // Initialize synchronously, provider will be initialized on first use
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.transferAmount = ethers.parseUnits('500', 18);
        this.initialized = false;
        
        console.log('TokenService created, will initialize provider on first use');
    }

    async initializeProvider() {
        console.log('Initializing RPC provider...');
        
        for (let i = 0; i < this.rpcUrls.length; i++) {
            const rpcUrl = this.rpcUrls[i];
            console.log(`Trying RPC ${i + 1}/${this.rpcUrls.length}: ${rpcUrl}`);
            
            try {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                
                // Test the connection by getting the network
                const network = await provider.getNetwork();
                console.log(`✅ RPC ${i + 1} connected successfully. Network:`, network.name, network.chainId);
                
                this.provider = provider;
                this.rpcUrl = rpcUrl;
                return;
                
            } catch (error) {
                console.log(`❌ RPC ${i + 1} failed:`, error.message);
                if (i === this.rpcUrls.length - 1) {
                    // Last RPC failed, throw error
                    throw new Error(`All RPC endpoints failed. Last error: ${error.message}`);
                }
            }
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            console.log('TokenService not initialized, initializing now...');
            await this.initializeProvider();
            this.wallet = new ethers.Wallet('0x' + this.privateKey, this.provider);
            this.contract = new ethers.Contract(this.contractAddress, tokenABI, this.wallet);
            this.initialized = true;
            console.log('✅ TokenService fully initialized');
            console.log('Wallet address:', this.wallet.address);
            console.log('Using RPC:', this.rpcUrl);
        }
    }

    async transferTokens(toAddress) {
        console.log('\n--- TokenService.transferTokens ---');
        console.log('To address:', toAddress);
        
        // Ensure service is initialized
        await this.ensureInitialized();
        
        console.log('From address (wallet):', this.wallet.address);
        console.log('Transfer amount:', this.transferAmount.toString());
        
        try {
            // Validate address
            console.log('Validating address...');
            if (!ethers.isAddress(toAddress)) {
                console.log('❌ Invalid address format');
                throw new Error('Invalid address format');
            }
            console.log('✅ Address validation passed');

            // Check if we have enough balance
            console.log('Checking wallet balance...');
            const balance = await this.contract.balanceOf(this.wallet.address);
            console.log('Current balance:', balance.toString());
            console.log('Required amount:', this.transferAmount.toString());
            
            if (balance < this.transferAmount) {
                console.log('❌ Insufficient balance');
                throw new Error('Insufficient balance for transfer');
            }
            console.log('✅ Sufficient balance confirmed');

            // Perform the transfer
            console.log('Sending transfer transaction...');
            const tx = await this.contract.transfer(toAddress, this.transferAmount);
            console.log('Transaction sent, hash:', tx.hash);
            console.log('Waiting for confirmation...');
            
            // Wait for transaction confirmation
            const receipt = await tx.wait();
            console.log('Transaction confirmed!');
            console.log('Block number:', receipt.blockNumber);
            console.log('Gas used:', receipt.gasUsed.toString());
            
            const result = {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                from: this.wallet.address,
                to: toAddress,
                amount: '500',
                gasUsed: receipt.gasUsed.toString()
            };
            
            console.log('✅ Transfer completed successfully');
            console.log('Result:', JSON.stringify(result, null, 2));
            return result;
            
        } catch (error) {
            console.error('❌ Token transfer error:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error stack:', error.stack);
            
            const result = {
                success: false,
                error: error.message
            };
            
            console.log('Returning error result:', JSON.stringify(result, null, 2));
            return result;
        }
        
        console.log('--- End TokenService.transferTokens ---\n');
    }

    async getBalance(address) {
        try {
            const balance = await this.contract.balanceOf(address);
            return ethers.formatUnits(balance, 18);
        } catch (error) {
            console.error('Get balance error:', error);
            return '0';
        }
    }
}

module.exports = TokenService;
