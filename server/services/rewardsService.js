const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

class RewardsService {
    constructor(tokenService) {
        this.tokenService = tokenService;
        this.dbPath = path.join(__dirname, '../data/rewards.json');
        this.rewardAmount = ethers.parseUnits('10', 18); // 10 PKT tokens
        this.ensureDataDirectory();
        this.initializeDatabase();
    }

    ensureDataDirectory() {
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('📁 Created data directory for rewards database');
        }
    }

    initializeDatabase() {
        try {
            if (!fs.existsSync(this.dbPath)) {
                const initialData = {
                    userClaims: {},
                    metadata: {
                        created: Date.now(),
                        lastUpdate: Date.now(),
                        totalClaims: 0,
                        totalTokensDistributed: '0'
                    }
                };
                fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2));
                console.log('📋 Initialized rewards database');
            }
        } catch (error) {
            console.error('❌ Failed to initialize rewards database:', error);
            throw error;
        }
    }

    loadDatabase() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Failed to load rewards database:', error);
            throw error;
        }
    }

    saveDatabase(data) {
        try {
            data.metadata.lastUpdate = Date.now();
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save rewards database:', error);
            throw error;
        }
    }

    isEligibleForReward(userAddress) {
        const db = this.loadDatabase();
        const userClaim = db.userClaims[userAddress.toLowerCase()];
        
        if (!userClaim) {
            // First time claiming
            return {
                eligible: true,
                reason: 'first_claim',
                lastClaim: null
            };
        }

        // Check if 24 hours have passed since last claim
        const now = Date.now();
        const timeSinceLastClaim = now - userClaim.lastClaimTime;
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (timeSinceLastClaim >= oneDayInMs) {
            return {
                eligible: true,
                reason: 'time_elapsed',
                lastClaim: new Date(userClaim.lastClaimTime).toISOString(),
                hoursWaited: Math.floor(timeSinceLastClaim / (1000 * 60 * 60))
            };
        }

        // Calculate remaining time
        const remainingTime = oneDayInMs - timeSinceLastClaim;
        const hoursRemaining = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

        return {
            eligible: false,
            reason: 'too_soon',
            lastClaim: new Date(userClaim.lastClaimTime).toISOString(),
            hoursRemaining,
            minutesRemaining,
            nextClaimAvailable: new Date(userClaim.lastClaimTime + oneDayInMs).toISOString()
        };
    }

    async claimDailyReward(userAddress) {
        console.log('\n--- RewardsService.claimDailyReward ---');
        console.log('User address:', userAddress);

        try {
            // Validate address format
            if (!ethers.isAddress(userAddress)) {
                return {
                    success: false,
                    error: 'Invalid wallet address format',
                    code: 'INVALID_ADDRESS'
                };
            }

            // Check eligibility
            const eligibility = this.isEligibleForReward(userAddress);
            console.log('Eligibility check:', eligibility);

            if (!eligibility.eligible) {
                return {
                    success: false,
                    error: 'Daily reward already claimed or not yet available',
                    code: 'NOT_ELIGIBLE',
                    details: eligibility
                };
            }

            // Create a custom token service call with 10 PKT instead of 500
            console.log('Processing daily reward transfer of 10 PKT...');
            const transferResult = await this.transferDailyReward(userAddress);

            if (!transferResult.success) {
                return {
                    success: false,
                    error: 'Failed to transfer daily reward tokens',
                    code: 'TRANSFER_FAILED',
                    details: transferResult.error
                };
            }

            // Update database
            const db = this.loadDatabase();
            const now = Date.now();
            
            db.userClaims[userAddress.toLowerCase()] = {
                address: userAddress,
                lastClaimTime: now,
                totalClaims: (db.userClaims[userAddress.toLowerCase()]?.totalClaims || 0) + 1,
                transactionHash: transferResult.transactionHash,
                lastClaimDate: new Date(now).toISOString()
            };

            // Update metadata
            db.metadata.totalClaims += 1;
            const currentDistributed = parseFloat(db.metadata.totalTokensDistributed || '0');
            db.metadata.totalTokensDistributed = (currentDistributed + 10).toString();

            this.saveDatabase(db);
            console.log('✅ Database updated with successful claim');

            return {
                success: true,
                message: 'Daily reward claimed successfully!',
                reward: {
                    amount: '10',
                    token: 'PKT',
                    transactionHash: transferResult.transactionHash,
                    blockNumber: transferResult.blockNumber,
                    claimDate: new Date(now).toISOString()
                },
                userStats: db.userClaims[userAddress.toLowerCase()]
            };

        } catch (error) {
            console.error('❌ Claim daily reward error:', error);
            return {
                success: false,
                error: 'Internal server error during reward claim',
                code: 'INTERNAL_ERROR'
            };
        }
    }

    async transferDailyReward(toAddress) {
        console.log('Transferring daily reward to:', toAddress);
        
        try {
            // Ensure token service is initialized
            await this.tokenService.ensureInitialized();

            // Perform the transfer with 10 PKT (instead of the default 500)
            const tx = await this.tokenService.contract.transfer(toAddress, this.rewardAmount);
            console.log('Daily reward transaction sent, hash:', tx.hash);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('Daily reward transaction confirmed!');
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                from: this.tokenService.wallet.address,
                to: toAddress,
                amount: '10',
                gasUsed: receipt.gasUsed.toString()
            };

        } catch (error) {
            console.error('❌ Daily reward transfer error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getUserClaimHistory(userAddress) {
        try {
            const db = this.loadDatabase();
            const userClaim = db.userClaims[userAddress.toLowerCase()];
            
            if (!userClaim) {
                return {
                    hasHistory: false,
                    message: 'No claim history found for this address'
                };
            }

            const eligibility = this.isEligibleForReward(userAddress);
            
            return {
                hasHistory: true,
                userStats: userClaim,
                eligibility,
                nextClaimIn: eligibility.eligible ? 'Available now!' : 
                    `${eligibility.hoursRemaining}h ${eligibility.minutesRemaining}m`
            };

        } catch (error) {
            console.error('❌ Get user claim history error:', error);
            return {
                hasHistory: false,
                error: 'Failed to retrieve claim history'
            };
        }
    }

    getSystemStats() {
        try {
            const db = this.loadDatabase();
            const totalUsers = Object.keys(db.userClaims).length;
            
            return {
                success: true,
                stats: {
                    totalUsers,
                    totalClaims: db.metadata.totalClaims,
                    totalTokensDistributed: db.metadata.totalTokensDistributed,
                    systemUptime: Date.now() - db.metadata.created,
                    lastUpdate: new Date(db.metadata.lastUpdate).toISOString()
                }
            };
        } catch (error) {
            console.error('❌ Get system stats error:', error);
            return {
                success: false,
                error: 'Failed to retrieve system stats'
            };
        }
    }
}

module.exports = RewardsService;
