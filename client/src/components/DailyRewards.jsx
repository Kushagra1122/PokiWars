import React, { useState, useEffect } from 'react';
import { Gift, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { tokenApi } from '@/lib/api/tokenApi';
import { useUser } from '@/contexts/UserContext';

const DailyRewards = ({ onRewardStatusChange }) => {
  const { walletAddress, fetchTokenBalance } = useUser();
  const [rewardStatus, setRewardStatus] = useState(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [lastClaimResult, setLastClaimResult] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  // Fetch reward status on component mount and wallet change
  useEffect(() => {
    if (walletAddress) {
      fetchRewardStatus();
    }
  }, [walletAddress]);

  // Update countdown timer
  useEffect(() => {
    if (rewardStatus?.eligibility && !rewardStatus.eligibility.eligible) {
      const interval = setInterval(() => {
        updateCountdown();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [rewardStatus]);

  const fetchRewardStatus = async () => {
    try {
      const status = await tokenApi.getRewardStatus(walletAddress);
      setRewardStatus(status);
      console.log('💰 Reward status fetched:', status);
      
      // Notify parent component about reward availability
      if (onRewardStatusChange) {
        onRewardStatusChange(status?.eligibility?.eligible || false);
      }
    } catch (error) {
      console.error('Failed to fetch reward status:', error);
      if (onRewardStatusChange) {
        onRewardStatusChange(false);
      }
    }
  };

  const updateCountdown = () => {
    if (!rewardStatus?.eligibility?.nextClaimAvailable) return;

    const nextClaim = new Date(rewardStatus.eligibility.nextClaimAvailable);
    const now = new Date();
    const timeDiff = nextClaim - now;

    if (timeDiff <= 0) {
      setTimeUntilNext('Available now!');
      // Refresh status when reward becomes available
      fetchRewardStatus();
      return;
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
  };

  const handleClaimReward = async () => {
    if (!walletAddress) {
      alert('Wallet not connected');
      return;
    }

    setIsClaimingReward(true);
    setLastClaimResult(null);

    try {
      console.log('🎁 Claiming daily reward...');
      const result = await tokenApi.claimDailyReward(walletAddress);
      
      setLastClaimResult(result);
      
      if (result.success) {
        console.log('🎉 Daily reward claimed successfully!');
        
        // Refresh reward status
        await fetchRewardStatus();
        
        // Refresh token balance in user context
        if (fetchTokenBalance) {
          await fetchTokenBalance(walletAddress);
        }
        
        // Update parent notification
        if (onRewardStatusChange) {
          onRewardStatusChange(false); // Reward no longer available after claim
        }
        
        // Show success message
        alert(`🎉 Daily reward claimed! +10 PKT tokens\nTransaction: ${result.reward.transactionHash}`);
      } else if (result.onCooldown) {
        console.log('⏰ Daily reward on cooldown');
        alert(`⏰ Daily reward on cooldown!\nNext reward available in: ${result.details.hoursRemaining}h ${result.details.minutesRemaining}m`);
      }
    } catch (error) {
      console.error('❌ Failed to claim daily reward:', error);
      setLastClaimResult({
        success: false,
        error: error.message
      });
      alert('Failed to claim daily reward: ' + error.message);
    } finally {
      setIsClaimingReward(false);
    }
  };

  if (!walletAddress) {
    return null; // Don't show rewards if wallet not connected
  }

  const isEligible = rewardStatus?.eligibility?.eligible;
  const hasHistory = rewardStatus?.history?.hasHistory;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Gift className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-pixelify text-white">Daily Rewards</h3>
      </div>

      {/* Reward Status Display */}
      <div className="space-y-3">
        {isEligible ? (
          <div className="bg-green-900/30 border border-green-400/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Reward Available!</span>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Claim your daily 10 PKT tokens now
            </p>
            <button
              onClick={handleClaimReward}
              disabled={isClaimingReward}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 font-pixelify"
            >
              {isClaimingReward ? '⏳ Claiming...' : '🎁 Claim 10 PKT'}
            </button>
          </div>
        ) : (
          <div className="bg-orange-900/30 border border-orange-400/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-semibold">On Cooldown</span>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              Next reward available in:
            </p>
            <p className="text-orange-400 font-mono text-lg font-bold">
              {timeUntilNext || (rewardStatus?.history?.nextClaimIn || 'Loading...')}
            </p>
          </div>
        )}

        {/* User Statistics */}
        {hasHistory && (
          <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-3">
            <h4 className="text-blue-400 font-semibold mb-2">Your Stats</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Total Claims: <span className="text-white font-semibold">{rewardStatus.history.userStats.totalClaims}</span></p>
              <p>Total Earned: <span className="text-yellow-400 font-semibold">{rewardStatus.history.userStats.totalClaims * 10} PKT</span></p>
              {rewardStatus.history.userStats.lastClaimDate && (
                <p>Last Claim: <span className="text-white">{new Date(rewardStatus.history.userStats.lastClaimDate).toLocaleDateString()}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {lastClaimResult && (
          <div className={`border rounded-lg p-3 ${
            lastClaimResult.success 
              ? 'bg-green-900/30 border-green-400/50' 
              : 'bg-red-900/30 border-red-400/50'
          }`}>
            <div className="flex items-center gap-2">
              {lastClaimResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className={`font-semibold ${
                lastClaimResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {lastClaimResult.success ? 'Reward Claimed!' : 'Claim Failed'}
              </span>
            </div>
            {lastClaimResult.success && lastClaimResult.reward && (
              <p className="text-gray-300 text-sm mt-1">
                +{lastClaimResult.reward.amount} PKT added to your wallet
              </p>
            )}
          </div>
        )}

        {/* Protocol Info */}
        <div className="text-xs text-gray-400 border-t border-white/10 pt-2">
          <p>🔄 x402 Protocol • 🟣 Polygon Network • ⏰ 24h Cooldown</p>
        </div>
      </div>
    </div>
  );
};

export default DailyRewards;
