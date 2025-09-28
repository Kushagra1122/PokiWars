import React, { useState, useEffect } from 'react';
import { Zap, Clock, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { tokenApi } from '@/lib/api/tokenApi';
import { useUser } from '@/contexts/UserContext';

const VelocityBoostCard = ({ playerId, onBoostActivated, gameSocket }) => {
  const { walletAddress } = useUser();
  const [boostStatus, setBoostStatus] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  // Fetch boost status on component mount
  useEffect(() => {
    if (playerId) {
      fetchBoostStatus();
    }
  }, [playerId]);

  // Update countdown timer for active boost
  useEffect(() => {
    if (boostStatus?.boost?.hasBoost && boostStatus.boost.remainingTime > 0) {
      const interval = setInterval(() => {
        updateCountdown();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [boostStatus]);

  // Listen for boost events from socket
  useEffect(() => {
    if (gameSocket) {
      gameSocket.on('playerBoostActivated', (data) => {
        console.log('🚀 Boost activated via socket:', data);
        if (onBoostActivated) {
          onBoostActivated(data.boost);
        }
        fetchBoostStatus(); // Refresh status
      });

      return () => {
        gameSocket.off('playerBoostActivated');
      };
    }
  }, [gameSocket, onBoostActivated]);

  const fetchBoostStatus = async () => {
    if (!playerId) return;
    
    try {
      const status = await tokenApi.getBoostStatus(playerId);
      setBoostStatus(status);
      
      if (status.boost?.hasBoost) {
        setTimeRemaining(Math.floor(status.boost.remainingTime / 1000));
      }
    } catch (error) {
      console.error('Failed to fetch boost status:', error);
    }
  };

  const updateCountdown = () => {
    setTimeRemaining(prev => {
      const newTime = Math.max(0, prev - 1);
      if (newTime === 0) {
        // Boost expired, refresh status
        fetchBoostStatus();
      }
      return newTime;
    });
  };

  const handleBoostClick = async () => {
    if (!walletAddress || !playerId) {
      alert('Wallet not connected or player ID missing');
      return;
    }

    setIsPurchasing(true);
    setShowPaymentPrompt(false);

    try {
      console.log('🚀 Attempting to use velocity boost...');
      
      // First attempt without payment (will trigger x402 if needed)
      const result = await tokenApi.useBoost(playerId, walletAddress);
      
      if (result.paymentRequired) {
        console.log('💳 Payment required, showing payment prompt');
        setPaymentRequest(result.paymentRequest);
        setShowPaymentPrompt(true);
        setIsPurchasing(false);
        return;
      }

      if (result.success) {
        console.log('✅ Boost activated successfully!');
        
        // Notify parent component
        if (onBoostActivated) {
          onBoostActivated(result.boost);
        }
        
        // Refresh status
        await fetchBoostStatus();
        
        alert(`🚀 Velocity boost activated!\n+40% speed for 30 seconds\nTransaction: ${result.payment.transactionHash}`);
      }

    } catch (error) {
      console.error('❌ Failed to use boost:', error);
      alert('Failed to activate boost: ' + error.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!paymentRequest) return;

    try {
      setIsPurchasing(true);
      
      // Simulate payment process (in real implementation, this would trigger wallet transaction)
      console.log('💰 Processing payment...');
      console.log('Payment details:', paymentRequest);
      
      // Show payment prompt to user
      const confirmPayment = window.confirm(
        `To use the velocity boost during battle, please authorize a micro-payment of 10 PKT tokens on Polygon.\n\n` +
        `This unlocks 1.4x faster movement for your character and enhances gameplay for 30 seconds.\n\n` +
        `Cost: 10 PKT tokens\n` +
        `Effect: 1.4x velocity multiplier\n` +
        `Duration: 30 seconds\n\n` +
        `Press OK to confirm payment and activate boost.`
      );

      if (!confirmPayment) {
        setShowPaymentPrompt(false);
        setIsPurchasing(false);
        return;
      }

      // In a real implementation, this would:
      // 1. Sign transaction with user's wallet
      // 2. Send transaction to Polygon
      // 3. Get transaction hash
      // 4. Retry boost request with payment headers

      // For MVP, simulate successful payment
      const mockTransactionHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
      
      console.log('📝 Simulating payment transaction...');
      console.log('Mock transaction hash:', mockTransactionHash);
      
      // Retry boost request with payment
      const result = await tokenApi.useBoost(
        playerId, 
        walletAddress, 
        paymentRequest.paymentId, 
        mockTransactionHash
      );

      if (result.success) {
        console.log('✅ Boost purchased and activated!');
        
        // Notify parent component
        if (onBoostActivated) {
          onBoostActivated(result.boost);
        }
        
        // Refresh status
        await fetchBoostStatus();
        
        alert(`🚀 Velocity boost purchased and activated!\n+40% speed for 30 seconds\nPayment: ${mockTransactionHash}`);
      } else {
        throw new Error('Boost activation failed after payment');
      }

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setIsPurchasing(false);
      setShowPaymentPrompt(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasActiveBoost = boostStatus?.boost?.hasBoost;
  const canPurchase = !hasActiveBoost && walletAddress && playerId;

  return (
    <div className="bg-black/60 backdrop-blur-md border border-purple-400/50 rounded-xl p-4 shadow-2xl w-64">
      <div className="flex items-center gap-3 mb-3">
        <Zap className="w-6 h-6 text-purple-400" />
        <h3 className="text-lg font-pixelify text-white">Velocity Boost</h3>
      </div>

      {/* Boost Description */}
      <div className="mb-4">
        <p className="text-purple-300 text-sm mb-2">
          ⚡ 1.4x speed multiplier
        </p>
        <p className="text-gray-400 text-xs">
          🕒 30 seconds duration
        </p>
        <p className="text-yellow-400 text-sm font-semibold">
          💰 Cost: 10 PKT
        </p>
      </div>

      {/* Active Boost Status */}
      {hasActiveBoost ? (
        <div className="bg-green-900/30 border border-green-400/50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Boost Active!</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-300" />
            <span className="text-green-300 font-mono">
              {formatTime(timeRemaining)}
            </span>
          </div>
          <p className="text-green-200 text-xs mt-1">
            {(boostStatus.boost.multiplier * 100 - 100).toFixed(0)}% speed bonus active
          </p>
        </div>
      ) : (
        /* Purchase Button */
        <button
          onClick={handleBoostClick}
          disabled={!canPurchase || isPurchasing}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 font-pixelify flex items-center justify-center gap-2"
        >
          {isPurchasing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Buy Boost - 10 PKT
            </>
          )}
        </button>
      )}

      {/* Payment Prompt Modal */}
      {showPaymentPrompt && paymentRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-400 rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-8 h-8 text-purple-400" />
              <h3 className="text-xl font-pixelify text-white">Payment Required</h3>
            </div>
            
            <div className="mb-4 text-gray-300">
              <p className="mb-3">
                To use the velocity boost during battle, please authorize a micro-payment of <span className="text-yellow-400 font-semibold">10 PKT tokens</span> on Polygon.
              </p>
              <p className="mb-3">
                This unlocks <span className="text-purple-400 font-semibold">1.4x faster movement</span> for your character and enhances gameplay for <span className="text-blue-400 font-semibold">30 seconds</span>.
              </p>
              
              <div className="bg-black/40 rounded-lg p-3 mb-4">
                <h4 className="text-purple-400 font-semibold mb-2">Payment Details:</h4>
                <div className="space-y-1 text-sm">
                  <p>Amount: <span className="text-yellow-400">{paymentRequest.amount} {paymentRequest.token}</span></p>
                  <p>Network: <span className="text-blue-400">{paymentRequest.network}</span></p>
                  <p>Effect: <span className="text-purple-400">1.4x velocity</span></p>
                  <p>Duration: <span className="text-green-400">30 seconds</span></p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentPrompt(false)}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={isPurchasing}
                className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors font-semibold"
              >
                {isPurchasing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* x402 Protocol Info */}
      <div className="mt-3 text-xs text-gray-500 border-t border-white/10 pt-2">
        <p>⚡ x402 Micropayments • 🟣 Polygon • 💨 Instant Activation</p>
      </div>
    </div>
  );
};

export default VelocityBoostCard;
