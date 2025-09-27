import React, { useState, useEffect } from 'react';
import { socketManager } from '../network/SocketManager';

const Leaderboard = ({ isVisible, onClose, gameEnded = false }) => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Set up socket listeners for leaderboard updates
    const setupSocketListeners = () => {
      if (!socketManager.socket) return;

      // Listen for leaderboard updates
      socketManager.socket.on('leaderboardUpdate', (data) => {
        console.log('Leaderboard update received:', data);
        setPlayers(data.players || []);
      });

      // Listen for game end with final leaderboard
      socketManager.socket.on('gameEnded', (data) => {
        console.log('Game ended with final leaderboard:', data);
        setPlayers(data.leaderboard || []);
      });
    };

    setupSocketListeners();

    // Request current leaderboard
    if (socketManager.socket) {
      socketManager.socket.emit('requestLeaderboard');
    }

    // Cleanup listeners
    return () => {
      if (socketManager.socket) {
        socketManager.socket.off('leaderboardUpdate');
        socketManager.socket.off('gameEnded');
      }
    };
  }, [isVisible]);

  // Sort players by score (kills) descending, then by K/D ratio
  const sortedPlayers = [...players].sort((a, b) => {
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">
              {gameEnded ? '🏆 Final Leaderboard' : '📊 Live Leaderboard'}
            </h2>
            {!gameEnded && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors text-2xl"
              >
                ✕
              </button>
            )}
          </div>
          {!gameEnded && (
            <p className="text-blue-100 mt-2">Real-time stats during the match</p>
          )}
        </div>

        {/* Leaderboard Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-400">Loading leaderboard...</span>
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xl">No players found</p>
              <p className="text-sm mt-2">Players will appear here once the game starts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`bg-gray-800 rounded-lg p-4 transition-all duration-200 hover:bg-gray-700 ${
                    index < 3 ? 'ring-2 ring-opacity-50' : ''
                  } ${
                    index === 0 ? 'ring-yellow-400' : 
                    index === 1 ? 'ring-gray-300' : 
                    index === 2 ? 'ring-orange-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank and Player Info */}
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl font-bold ${getRankColor(index)}`}>
                        {getRankIcon(index)}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <img
                          src={`/src/assets/characters/${player.char}.png`}
                          alt={player.char}
                          className="w-12 h-12 rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {player.name || player.char}
                          </h3>
                          <p className="text-sm text-gray-400 capitalize">
                            {player.char}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-right">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {player.kills || 0}
                        </div>
                        <div className="text-xs text-gray-400">Kills</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {player.deaths || 0}
                        </div>
                        <div className="text-xs text-gray-400">Deaths</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          (player.kdRatio || 0) >= 2 ? 'text-green-400' :
                          (player.kdRatio || 0) >= 1 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {(player.kdRatio || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">K/D</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {player.score || 0}
                        </div>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for K/D Ratio */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Performance</span>
                      <span>{((player.kdRatio || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
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
        {gameEnded && (
          <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/lobby/join'}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
