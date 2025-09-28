import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import stakingService from '../lib/services/stakingService';

const StakingPanel = ({ userAddress, onStakeSuccess, onStakeError, stakeAmount = 10 }) => {
  const [stakingStatus, setStakingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    if (userAddress) {
      checkNetwork();
      loadStakingStatus();
    }
  }, [userAddress]);

  const checkNetwork = async () => {
    try {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setIsCorrectNetwork(chainId === '0x89'); // Polygon Mainnet
      }
    } catch (error) {
      console.error('Error checking network:', error);
      setIsCorrectNetwork(false);
    }
  };

  const switchToPolygon = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }],
      });
      setIsCorrectNetwork(true);
      // Reload staking status after network switch
      loadStakingStatus();
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Network doesn't exist, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              rpcUrls: ['https://polygon-rpc.com/'],
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              blockExplorerUrls: ['https://polygonscan.com/'],
            }],
          });
          setIsCorrectNetwork(true);
          loadStakingStatus();
        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
        }
      }
    }
  };

  const loadStakingStatus = async () => {
    try {
      setIsLoading(true);
      setError('');
      const status = await stakingService.getStakingStatus(userAddress, stakeAmount);
      setStakingStatus(status);
      
      // If there's an error in the status, show it
      if (status.error) {
        setError(status.error);
      }
    } catch (err) {
      console.error('Failed to load staking status:', err);
      setError('Failed to load staking status: ' + err.message);
      
      // Set fallback status to prevent component from breaking
      setStakingStatus({
        hasEnoughTokens: false,
        currentBalance: 0,
        requiredAmount: stakeAmount,
        shortfall: stakeAmount,
        poolBalance: 0,
        hasStaked: false,
        stakingAddress: '0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127',
        stakeAmount: stakeAmount
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setIsStaking(true);
    setError('');
    setSuccess('');

    try {
      const result = await stakingService.stakeTokens();
      
      setSuccess(`Successfully staked ${result.amount} PKT! Transaction: ${result.transactionHash}`);
      
      // Reload status
      await loadStakingStatus();
      
      // Notify parent component
      if (onStakeSuccess) {
        onStakeSuccess(result);
      }
    } catch (err) {
      const errorMessage = err.message || 'Staking failed';
      setError(errorMessage);
      
      if (onStakeError) {
        onStakeError(err);
      }
    } finally {
      setIsStaking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Loading staking status...</span>
        </div>
      </div>
    );
  }

  if (!stakingStatus) {
    return (
      <div className="bg-red-800 p-4 rounded-lg mb-4">
        <p className="text-red-200">Failed to load staking information</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-xl font-bold mb-4 text-white">🎯 Staking Pool</h3>
      
      {/* Network Warning */}
      {!isCorrectNetwork && userAddress && (
        <div className="bg-red-900 border border-red-600 p-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 font-bold">⚠️ Wrong Network</p>
              <p className="text-red-300 text-sm">Please switch to Polygon Mainnet to use staking features</p>
            </div>
            <button
              onClick={switchToPolygon}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}
      
      {/* Pool Information */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Pool Balance:</span>
          <span className="text-green-400 font-bold">{stakingStatus.poolBalance.toFixed(2)} PKT</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Stake Amount:</span>
          <span className="text-yellow-400 font-bold">{stakingStatus.stakeAmount} PKT</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Your Balance:</span>
          <span className={`font-bold ${stakingStatus.hasEnoughTokens ? 'text-green-400' : 'text-red-400'}`}>
            {stakingStatus.currentBalance.toFixed(2)} PKT
          </span>
        </div>
      </div>

      {/* Prize Distribution */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <h4 className="text-sm font-bold text-gray-300 mb-2">Prize Distribution:</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div>🥇 1st Place: 50% of pool</div>
          <div>🥈 2nd Place: 30% of pool</div>
          <div>🥉 3rd Place: 20% of pool</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-800 p-3 rounded mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-800 p-3 rounded mb-4">
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Staking Button */}
      {stakingStatus.hasStaked ? (
        <div className="bg-green-800 p-3 rounded text-center">
          <p className="text-green-200 font-bold">✅ You have staked {stakingStatus.stakeAmount} PKT</p>
          <p className="text-green-300 text-sm">Good luck in the game!</p>
        </div>
      ) : (
        <button
          onClick={handleStake}
          disabled={!stakingStatus.hasEnoughTokens || isStaking || !isCorrectNetwork}
          className={`w-full py-3 px-4 rounded font-bold transition-colors ${
            stakingStatus.hasEnoughTokens && !isStaking && isCorrectNetwork
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isStaking ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Staking...
            </div>
          ) : !isCorrectNetwork ? (
            'Switch to Polygon Network'
          ) : stakingStatus.hasEnoughTokens ? (
            `Stake ${stakingStatus.stakeAmount} PKT`
          ) : (
            `Need ${stakingStatus.shortfall.toFixed(2)} more PKT`
          )}
        </button>
      )}

      {/* Insufficient Balance Warning */}
      {!stakingStatus.hasEnoughTokens && isCorrectNetwork && (
        <div className="mt-3 p-2 bg-red-900 rounded text-center">
          <p className="text-red-200 text-sm">
            ⚠️ You need {stakingStatus.stakeAmount} PKT to stake. 
            You have {stakingStatus.currentBalance.toFixed(2)} PKT.
          </p>
        </div>
      )}
      
      {/* Network Requirement Warning */}
      {!isCorrectNetwork && (
        <div className="mt-3 p-2 bg-yellow-900 rounded text-center">
          <p className="text-yellow-200 text-sm">
            🌐 Staking requires Polygon Mainnet. Click "Switch Network" above to continue.
          </p>
        </div>
      )}

      {/* Staking Address Info */}
      <div className="mt-4 p-2 bg-gray-700 rounded text-center">
        <p className="text-xs text-gray-400">
          Staking Address: {stakingStatus.stakingAddress.slice(0, 6)}...{stakingStatus.stakingAddress.slice(-4)}
        </p>
      </div>
    </div>
  );
};

export default StakingPanel;
