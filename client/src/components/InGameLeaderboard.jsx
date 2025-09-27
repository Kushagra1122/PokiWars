import React, { useState, useEffect } from 'react';
import { socketManager } from '../network/SocketManager';

const InGameLeaderboard = ({ isVisible, onToggle }) => {
  const [players, setPlayers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Set up socket listeners for leaderboard updates
    const setupSocketListeners = () => {
      if (!socketManager.socket) return;

      // Listen for leaderboard updates
      socketManager.socket.on('leaderboardUpdate', (data) => {
        console.log('In-game leaderboard update:', data);
        setPlayers(data.players || []);
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
      }
    };
  }, [isVisible]);

  // Sort players by kills descending
  const sortedPlayers = [...players].sort((a, b) => (b.kills || 0) - (a.kills || 0));

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
      >
        <span className="text-lg">📊</span>
        <span className="text-sm font-medium">Leaderboard</span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Leaderboard Panel */}
      {isExpanded && (
        <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700 min-w-[300px] max-w-[400px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-t-lg">
            <h3 className="text-white font-bold text-sm">Live Stats</h3>
          </div>

          {/* Player List */}
          <div className="max-h-[400px] overflow-y-auto">
            {sortedPlayers.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No players found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {sortedPlayers.slice(0, 8).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded transition-colors ${
                      index < 3 ? 'bg-gray-800' : 'hover:bg-gray-800'
                    }`}
                  >
                    {/* Rank and Name */}
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="text-sm font-bold text-gray-300 w-6">
                        {getRankIcon(index)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-sm font-medium truncate">
                          {player.name || player.char}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {player.char}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="text-center">
                        <div className="text-red-400 font-bold">
                          {player.kills || 0}
                        </div>
                        <div className="text-gray-500">K</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">
                          {player.deaths || 0}
                        </div>
                        <div className="text-gray-500">D</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${
                          (player.kdRatio || 0) >= 2 ? 'text-green-400' :
                          (player.kdRatio || 0) >= 1 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {(player.kdRatio || 0).toFixed(1)}
                        </div>
                        <div className="text-gray-500">K/D</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-800 rounded-b-lg border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Real-time updates</span>
              <button
                onClick={() => setIsExpanded(false)}
                className="hover:text-white transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InGameLeaderboard;
