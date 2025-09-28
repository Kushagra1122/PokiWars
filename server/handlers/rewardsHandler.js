// x402 Daily Rewards Handler
// Implements the x402 protocol for daily token rewards

class RewardsHandler {
    constructor(rewardsService) {
        this.rewardsService = rewardsService;
    }

    // x402 middleware to handle payment required responses
    async handleX402Flow(req, res, next) {
        console.log('\n=== X402 REWARDS FLOW ===');
        console.log('Request method:', req.method);
        console.log('Request path:', req.path);
        console.log('User address:', req.body?.address || req.query?.address);

        try {
            const userAddress = req.body?.address || req.query?.address;
            
            if (!userAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User address is required',
                    code: 'MISSING_ADDRESS'
                });
            }

            // Check if user is eligible for daily reward
            const eligibility = this.rewardsService.isEligibleForReward(userAddress);
            
            if (!eligibility.eligible) {
                // Return HTTP 402 Payment Required with details about when next reward is available
                return res.status(402).json({
                    success: false,
                    error: 'Daily reward not available yet',
                    code: 'PAYMENT_REQUIRED',
                    x402: {
                        type: 'daily_reward_cooldown',
                        message: 'Daily reward can only be claimed once every 24 hours',
                        nextAvailable: eligibility.nextClaimAvailable,
                        hoursRemaining: eligibility.hoursRemaining,
                        minutesRemaining: eligibility.minutesRemaining
                    },
                    details: eligibility
                });
            }

            // User is eligible, proceed to next middleware (actual claim processing)
            req.userAddress = userAddress;
            req.eligibility = eligibility;
            next();

        } catch (error) {
            console.error('❌ X402 flow error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error in x402 flow',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Process the actual daily reward claim
    async processDailyRewardClaim(req, res) {
        console.log('\n=== PROCESSING DAILY REWARD CLAIM ===');
        console.log('User address:', req.userAddress);
        console.log('Eligibility:', req.eligibility);

        try {
            const claimResult = await this.rewardsService.claimDailyReward(req.userAddress);
            
            if (claimResult.success) {
                console.log('✅ Daily reward claimed successfully');
                
                // Return successful x402 response with payment details
                res.status(200).json({
                    success: true,
                    message: 'Daily reward claimed successfully!',
                    x402: {
                        type: 'reward_granted',
                        paymentType: 'reverse_payment', // Server pays user
                        amount: '10 PKT',
                        network: 'polygon',
                        transactionHash: claimResult.reward.transactionHash
                    },
                    reward: claimResult.reward,
                    userStats: claimResult.userStats
                });
            } else {
                console.log('❌ Daily reward claim failed');
                res.status(400).json(claimResult);
            }

        } catch (error) {
            console.error('❌ Process daily reward claim error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process daily reward claim',
                code: 'CLAIM_PROCESSING_ERROR'
            });
        }
    }

    // Get user's claim status and history
    async getUserRewardStatus(req, res) {
        console.log('\n=== GET USER REWARD STATUS ===');
        
        try {
            const userAddress = req.query.address || req.params.address;
            
            if (!userAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User address is required',
                    code: 'MISSING_ADDRESS'
                });
            }

            const history = this.rewardsService.getUserClaimHistory(userAddress);
            const eligibility = this.rewardsService.isEligibleForReward(userAddress);

            res.json({
                success: true,
                userAddress,
                history,
                eligibility,
                x402: {
                    canClaim: eligibility.eligible,
                    nextRewardValue: '10 PKT',
                    claimEndpoint: '/claim-daily-reward'
                }
            });

        } catch (error) {
            console.error('❌ Get user reward status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get reward status',
                code: 'STATUS_ERROR'
            });
        }
    }

    // Get system-wide rewards statistics
    async getRewardsStats(req, res) {
        console.log('\n=== GET REWARDS STATS ===');
        
        try {
            const stats = this.rewardsService.getSystemStats();
            
            res.json({
                success: true,
                stats: stats.stats,
                x402: {
                    protocol: 'daily_rewards',
                    rewardAmount: '10 PKT',
                    network: 'polygon',
                    claimCooldown: '24 hours'
                }
            });

        } catch (error) {
            console.error('❌ Get rewards stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get rewards statistics',
                code: 'STATS_ERROR'
            });
        }
    }
}

module.exports = RewardsHandler;
