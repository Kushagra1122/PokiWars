// x402 Boost Handler for Velocity Micropayments
// Implements x402 protocol for pay-per-use velocity boosts during battle

class BoostHandler {
    constructor(boostService) {
        this.boostService = boostService;
    }

    // x402 middleware for boost micropayments
    async handleBoostX402Flow(req, res, next) {
        console.log('\n=== X402 BOOST MICROPAYMENT FLOW ===');
        console.log('Request method:', req.method);
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);

        try {
            const { playerId, userAddress } = req.body;
            
            if (!playerId || !userAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Player ID and user address are required',
                    code: 'MISSING_PARAMETERS'
                });
            }

            // Check if payment information is provided
            const paymentId = req.headers['x-payment-id'];
            const transactionHash = req.headers['x-transaction-hash'];

            if (!paymentId || !transactionHash) {
                // No payment provided, return 402 Payment Required with payment details
                const paymentRequest = this.boostService.generatePaymentRequest(playerId);
                
                return res.status(402).json({
                    success: false,
                    error: 'Payment required for velocity boost',
                    code: 'PAYMENT_REQUIRED',
                    x402: {
                        type: 'boost_payment_required',
                        message: 'To use the velocity boost during battle, please authorize a micro-payment of 10 PKT tokens on Polygon. This unlocks 1.4x faster movement for your character and enhances gameplay for 30 seconds. Press confirm in your wallet to pay and activate the boost instantly.',
                        paymentRequest: {
                            paymentId: paymentRequest.paymentId,
                            amount: paymentRequest.amount,
                            token: paymentRequest.token,
                            contract: paymentRequest.contract,
                            network: paymentRequest.network,
                            recipient: paymentRequest.recipient,
                            description: paymentRequest.description
                        },
                        boostDetails: {
                            effect: '1.4x velocity multiplier',
                            duration: '30 seconds',
                            cost: '10 PKT tokens'
                        }
                    }
                });
            }

            // Payment provided, validate it
            console.log('🔍 Validating payment...');
            const validation = await this.boostService.validatePayment(paymentId, transactionHash, userAddress);
            
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid payment: ' + validation.error,
                    code: 'INVALID_PAYMENT'
                });
            }

            // Payment is valid, proceed to boost activation
            req.paymentId = paymentId;
            req.transactionHash = transactionHash;
            req.paymentValidation = validation;
            next();

        } catch (error) {
            console.error('❌ X402 boost flow error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error in x402 boost flow',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Process boost activation after payment validation
    async processBoostActivation(req, res) {
        console.log('\n=== PROCESSING BOOST ACTIVATION ===');
        console.log('Player ID:', req.body.playerId);
        console.log('Payment ID:', req.paymentId);
        console.log('Transaction Hash:', req.transactionHash);

        try {
            const { playerId, userAddress } = req.body;
            
            const purchaseResult = await this.boostService.purchaseBoost(
                playerId, 
                userAddress, 
                req.paymentId, 
                req.transactionHash
            );

            if (purchaseResult.success) {
                console.log('✅ Boost activated successfully');
                
                // Emit boost activation to all clients via socket
                if (global.gameIO) {
                    global.gameIO.emit('boostActivated', {
                        playerId,
                        boost: purchaseResult.boost,
                        message: `${playerId} activated velocity boost!`
                    });
                    
                    // Send specific boost data to the player
                    global.gameIO.to(playerId).emit('playerBoostActivated', {
                        boost: purchaseResult.boost,
                        multiplier: purchaseResult.boost.multiplier,
                        duration: purchaseResult.boost.duration,
                        endTime: purchaseResult.boost.endTime
                    });
                }
                
                res.status(200).json({
                    success: true,
                    message: 'Velocity boost activated successfully!',
                    x402: {
                        type: 'boost_activated',
                        paymentType: 'micropayment',
                        amount: '10 PKT',
                        network: 'polygon',
                        transactionHash: req.transactionHash,
                        boostEffect: '1.4x velocity for 30 seconds'
                    },
                    boost: purchaseResult.boost,
                    payment: purchaseResult.payment
                });
            } else {
                console.log('❌ Boost activation failed');
                res.status(400).json(purchaseResult);
            }

        } catch (error) {
            console.error('❌ Process boost activation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process boost activation',
                code: 'BOOST_ACTIVATION_ERROR'
            });
        }
    }

    // Get player's current boost status
    async getPlayerBoostStatus(req, res) {
        console.log('\n=== GET PLAYER BOOST STATUS ===');
        
        try {
            const playerId = req.params.playerId || req.body.playerId;
            
            if (!playerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Player ID is required',
                    code: 'MISSING_PLAYER_ID'
                });
            }

            const boostStatus = this.boostService.getActiveBoost(playerId);

            res.json({
                success: true,
                playerId,
                boost: boostStatus,
                x402: {
                    canPurchase: !boostStatus.hasBoost,
                    boostCost: '10 PKT',
                    boostEffect: '1.4x velocity',
                    duration: '30 seconds',
                    purchaseEndpoint: '/use-boost'
                }
            });

        } catch (error) {
            console.error('❌ Get player boost status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get boost status',
                code: 'STATUS_ERROR'
            });
        }
    }

    // Get boost system statistics
    async getBoostStats(req, res) {
        console.log('\n=== GET BOOST STATS ===');
        
        try {
            const stats = this.boostService.getSystemStats();
            
            res.json({
                success: true,
                stats: stats.stats,
                x402: {
                    protocol: 'boost_micropayments',
                    paymentType: 'per_use',
                    cost: '10 PKT',
                    effect: '1.4x velocity',
                    duration: '30 seconds',
                    network: 'polygon'
                }
            });

        } catch (error) {
            console.error('❌ Get boost stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get boost statistics',
                code: 'STATS_ERROR'
            });
        }
    }

    // Cleanup expired boosts endpoint
    async cleanupExpiredBoosts(req, res) {
        try {
            const removedCount = this.boostService.cleanupExpiredBoosts();
            
            res.json({
                success: true,
                message: `Cleaned up ${removedCount} expired boosts`,
                removedCount
            });

        } catch (error) {
            console.error('❌ Cleanup expired boosts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cleanup expired boosts'
            });
        }
    }
}

module.exports = BoostHandler;
