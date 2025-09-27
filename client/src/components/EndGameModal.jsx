import React, { useState, useEffect } from 'react';
import { socketManager } from '../network/SocketManager';

const EndGameModal = ({ isVisible, onClose, gameData }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Set up socket listeners for final leaderboard
    const setupSocketListeners = () => {
      if (!socketManager.socket) return;

      // Listen for game end with final leaderboard
      socketManager.socket.on('gameEnded', (data) => {
        console.log('Game ended with final leaderboard:', data);
        setLeaderboard(data.leaderboard || []);
        setIsLoading(false);
      });
    };

    setupSocketListeners();

    // If we have game data, use it
    if (gameData && gameData.leaderboard) {
      setLeaderboard(gameData.leaderboard);
    } else {
      // Request final leaderboard
      setIsLoading(true);
      if (socketManager.socket) {
        socketManager.socket.emit('requestFinalLeaderboard');
      }
    }

    // Cleanup listeners
    return () => {
      if (socketManager.socket) {
        socketManager.socket.off('gameEnded');
      }
    };
  }, [isVisible, gameData]);

  // Sort players by kills descending, then by K/D ratio
  const sortedPlayers = [...leaderboard].sort((a, b) => {
    if (b.kills !== a.kills) {
      return b.kills - a.kills;
    }
    return b.kdRatio - a.kdRatio;
  });

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return 'text-yellow-400';
      case 1: return 'text-gray-300';
      case 2: return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getPerformanceMessage = (player, index) => {
    if (index === 0) {
      return "🏆 CHAMPION! Outstanding performance!";
    } else if (index === 1) {
      return "🥈 Great job! Second place!";
    } else if (index === 2) {
      return "🥉 Nice work! Third place!";
    } else if (player.kdRatio >= 2) {
      return "💪 Excellent K/D ratio!";
    } else if (player.kdRatio >= 1) {
      return "👍 Good performance!";
    } else {
      return "🎯 Keep practicing!";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
          <h1 className="text-4xl font-bold mb-2">🏆 GAME OVER 🏆</h1>
          <p className="text-xl text-blue-100">Final Results</p>
        </div>

        {/* Leaderboard Content */}
        <div className="p-8 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-400 text-xl">Loading final results...</span>
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-2xl">No results available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`bg-gray-800 rounded-xl p-6 transition-all duration-300 hover:bg-gray-700 ${
                    index < 3 ? 'ring-4 ring-opacity-60 shadow-2xl' : 'shadow-lg'
                  } ${
                    index === 0 ? 'ring-yellow-400 bg-gradient-to-r from-yellow-900/20 to-gray-800' : 
                    index === 1 ? 'ring-gray-300 bg-gradient-to-r from-gray-700/20 to-gray-800' : 
                    index === 2 ? 'ring-orange-400 bg-gradient-to-r from-orange-900/20 to-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank and Player Info */}
                    <div className="flex items-center space-x-6">
                      <div className={`text-4xl font-bold ${getRankColor(index)}`}>
                        {getRankIcon(index)}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <img
                          src={`/src/assets/characters/${player.char}.png`}
                          alt={player.char}
                          className="w-16 h-16 rounded-xl"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            {player.name || player.char}
                          </h3>
                          <p className="text-lg text-gray-400 capitalize">
                            {player.char}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {getPerformanceMessage(player, index)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-8 text-right">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-400">
                          {player.kills || 0}
                        </div>
                        <div className="text-sm text-gray-400">Kills</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400">
                          {player.deaths || 0}
                        </div>
                        <div className="text-sm text-gray-400">Deaths</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${
                          (player.kdRatio || 0) >= 2 ? 'text-green-400' :
                          (player.kdRatio || 0) >= 1 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {(player.kdRatio || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">K/D Ratio</div>
                      </div>

                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400">
                          {player.score || 0}
                        </div>
                        <div className="text-sm text-gray-400">Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Overall Performance</span>
                      <span>{((player.kdRatio || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          (player.kdRatio || 0) >= 2 ? 'bg-green-400' :
                          (player.kdRatio || 0) >= 1 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{
                          width: `${Math.min((player.kdRatio || 0) * 50, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-8 py-6 border-t border-gray-700">
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-lg"
            >
              🏠 Back to Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/lobby/join'}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold text-lg"
            >
              🎮 Play Again
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold text-lg"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndGameModal;
