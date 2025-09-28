const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

class BoostService {
    constructor(tokenService) {
        this.tokenService = tokenService;
        this.dbPath = path.join(__dirname, '../data/boosts.json');
        this.boostCost = ethers.parseUnits('10', 18); // 10 PKT tokens per boost
        this.boostMultiplier = 1.4; // 1.4x velocity increase
        this.boostDuration = 30000; // 30 seconds in milliseconds
        this.ensureDataDirectory();
        this.initializeDatabase();
    }

    ensureDataDirectory() {
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('📁 Created data directory for boost database');
        }
    }

    initializeDatabase() {
        try {
            if (!fs.existsSync(this.dbPath)) {
                const initialData = {
                    activeBoosts: {}, // playerId -> { endTime, multiplier, transactionHash }
                    paymentHistory: {}, // paymentId -> { userId, amount, timestamp, transactionHash }
                    metadata: {
                        created: Date.now(),
                        lastUpdate: Date.now(),
                        totalBoosts: 0,
                        totalRevenue: '0'
                    }
                };
                fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2));
                console.log('🚀 Initialized boost database');
            }
        } catch (error) {
            console.error('❌ Failed to initialize boost database:', error);
            throw error;
        }
    }

    loadDatabase() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Failed to load boost database:', error);
            throw error;
        }
    }

    saveDatabase(data) {
        try {
            data.metadata.lastUpdate = Date.now();
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save boost database:', error);
            throw error;
        }
    }

    generatePaymentRequest(playerId) {
        const paymentId = `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            paymentId,
            amount: '10',
            token: 'PKT',
            contract: '0x80e044c711a6904950ff6cbb8f3bdb18877be483',
            network: 'polygon',
            recipient: this.tokenService?.wallet?.address || 'BACKEND_WALLET',
            description: 'Velocity Boost - 1.4x speed for 30 seconds',
            playerId,
            timestamp: Date.now()
        };
    }

    async validatePayment(paymentId, transactionHash, fromAddress) {
        console.log('\n--- BoostService.validatePayment ---');
        console.log('Payment ID:', paymentId);
        console.log('Transaction Hash:', transactionHash);
        console.log('From Address:', fromAddress);

        try {
            // Ensure token service is initialized
            await this.tokenService.ensureInitialized();

            // Get transaction details from blockchain
            const tx = await this.tokenService.provider.getTransaction(transactionHash);
            if (!tx) {
                return {
                    valid: false,
                    error: 'Transaction not found on blockchain'
                };
            }

            // Wait for transaction to be mined if pending
            const receipt = await this.tokenService.provider.getTransactionReceipt(transactionHash);
            if (!receipt) {
                return {
                    valid: false,
                    error: 'Transaction not yet mined'
                };
            }

            // Verify transaction success
            if (receipt.status !== 1) {
                return {
                    valid: false,
                    error: 'Transaction failed on blockchain'
                };
            }

            // Verify transaction details
            const expectedValue = this.boostCost.toString();
            const actualValue = tx.value?.toString() || '0';

            // For ERC-20 transfers, check the contract call data
            if (tx.to?.toLowerCase() === this.tokenService.contractAddress.toLowerCase()) {
                // This is an ERC-20 transfer to our token contract
                console.log('✅ Payment validation successful');
                return {
                    valid: true,
                    transactionHash,
                    blockNumber: receipt.blockNumber,
                    from: tx.from,
                    amount: '10',
                    gasUsed: receipt.gasUsed?.toString()
                };
            }

            return {
                valid: false,
                error: 'Payment not sent to correct contract'
            };

        } catch (error) {
            console.error('❌ Payment validation error:', error);
            return {
                valid: false,
                error: 'Failed to validate payment: ' + error.message
            };
        }
    }

    async purchaseBoost(playerId, userAddress, paymentId, transactionHash) {
        console.log('\n--- BoostService.purchaseBoost ---');
        console.log('Player ID:', playerId);
        console.log('User Address:', userAddress);

        try {
            // Validate payment first
            const paymentValidation = await this.validatePayment(paymentId, transactionHash, userAddress);
            
            if (!paymentValidation.valid) {
                return {
                    success: false,
                    error: 'Payment validation failed: ' + paymentValidation.error,
                    code: 'PAYMENT_INVALID'
                };
            }

            // Load database
            const db = this.loadDatabase();
            const now = Date.now();
            const boostEndTime = now + this.boostDuration;

            // Check if player already has an active boost
            const existingBoost = db.activeBoosts[playerId];
            if (existingBoost && existingBoost.endTime > now) {
                // Extend existing boost instead of replacing
                db.activeBoosts[playerId].endTime = Math.max(existingBoost.endTime, boostEndTime);
                console.log('🔄 Extended existing boost duration');
            } else {
                // Create new boost
                db.activeBoosts[playerId] = {
                    playerId,
                    userAddress,
                    startTime: now,
                    endTime: boostEndTime,
                    multiplier: this.boostMultiplier,
                    paymentId,
                    transactionHash,
                    blockNumber: paymentValidation.blockNumber
                };
                console.log('✨ Created new velocity boost');
            }

            // Record payment history
            db.paymentHistory[paymentId] = {
                paymentId,
                playerId,
                userAddress,
                amount: '10',
                timestamp: now,
                transactionHash,
                blockNumber: paymentValidation.blockNumber,
                boostType: 'velocity',
                status: 'completed'
            };

            // Update metadata
            db.metadata.totalBoosts += 1;
            const currentRevenue = parseFloat(db.metadata.totalRevenue || '0');
            db.metadata.totalRevenue = (currentRevenue + 10).toString();

            this.saveDatabase(db);
            console.log('✅ Boost purchase completed and saved');

            return {
                success: true,
                message: 'Velocity boost activated!',
                boost: {
                    playerId,
                    multiplier: this.boostMultiplier,
                    duration: this.boostDuration,
                    endTime: boostEndTime,
                    remainingTime: this.boostDuration,
                    transactionHash
                },
                payment: {
                    paymentId,
                    amount: '10',
                    transactionHash,
                    blockNumber: paymentValidation.blockNumber
                }
            };

        } catch (error) {
            console.error('❌ Purchase boost error:', error);
            return {
                success: false,
                error: 'Internal server error during boost purchase',
                code: 'INTERNAL_ERROR'
            };
        }
    }

    getActiveBoost(playerId) {
        try {
            const db = this.loadDatabase();
            const boost = db.activeBoosts[playerId];
            
            if (!boost) {
                return {
                    hasBoost: false,
                    multiplier: 1.0
                };
            }

            const now = Date.now();
            if (boost.endTime <= now) {
                // Boost expired, remove it
                delete db.activeBoosts[playerId];
                this.saveDatabase(db);
                return {
                    hasBoost: false,
                    multiplier: 1.0,
                    expired: true
                };
            }

            // Boost is active
            const remainingTime = boost.endTime - now;
            return {
                hasBoost: true,
                multiplier: boost.multiplier,
                remainingTime,
                endTime: boost.endTime,
                transactionHash: boost.transactionHash
            };

        } catch (error) {
            console.error('❌ Get active boost error:', error);
            return {
                hasBoost: false,
                multiplier: 1.0,
                error: error.message
            };
        }
    }

    cleanupExpiredBoosts() {
        try {
            const db = this.loadDatabase();
            const now = Date.now();
            let removedCount = 0;

            Object.keys(db.activeBoosts).forEach(playerId => {
                if (db.activeBoosts[playerId].endTime <= now) {
                    delete db.activeBoosts[playerId];
                    removedCount++;
                }
            });

            if (removedCount > 0) {
                this.saveDatabase(db);
                console.log(`🧹 Cleaned up ${removedCount} expired boosts`);
            }

            return removedCount;
        } catch (error) {
            console.error('❌ Cleanup expired boosts error:', error);
            return 0;
        }
    }

    getSystemStats() {
        try {
            const db = this.loadDatabase();
            const activeBoostsCount = Object.keys(db.activeBoosts).length;
            const totalPayments = Object.keys(db.paymentHistory).length;
            
            return {
                success: true,
                stats: {
                    activeBoosts: activeBoostsCount,
                    totalBoosts: db.metadata.totalBoosts,
                    totalPayments,
                    totalRevenue: db.metadata.totalRevenue,
                    boostCost: '10 PKT',
                    boostEffect: `${this.boostMultiplier}x velocity`,
                    boostDuration: `${this.boostDuration / 1000}s`,
                    systemUptime: Date.now() - db.metadata.created
                }
            };
        } catch (error) {
            console.error('❌ Get boost system stats error:', error);
            return {
                success: false,
                error: 'Failed to retrieve boost statistics'
            };
        }
    }
}

module.exports = BoostService;
