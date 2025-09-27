import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socketManager } from '../../network/SocketManager';

export default function LobbyRoom() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  
  const [lobby, setLobby] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  const availableMaps = [
    { id: 'forest', name: 'Forest Map' },
    { id: 'desert', name: 'Desert Map' },
    { id: 'snow', name: 'Snow Map' },
    { id: 'volcano', name: 'Volcano Map' },
    { id: 'marketplace', name: 'Marketplace' },
    { id: 'lobby', name: 'Lobby Map' }
  ];

  const timeOptions = [5, 10, 15, 20, 30, 60];
  const stakeOptions = [10, 25, 50, 100, 250, 500, 1000];

  useEffect(() => {
    loadLobbyState();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [lobbyId]);

  const loadLobbyState = async () => {
    try {
      
      if (!lobbyId) {
        setError('Invalid lobby ID');
        setIsLoading(false);
        return;
      }
      
      await socketManager.connect();
      setCurrentPlayerId(socketManager.socket.id);
      
      // First check if we're already in a lobby
      socketManager.getLobbyState((response) => {
        if (response.success && response.lobby && response.lobby.id === lobbyId) {
          // We're already in this lobby
          setLobby(response.lobby);
          setIsHost(response.lobby.hostId === socketManager.socket.id);
          setIsLoading(false);
        } else {
          // We need to join this lobby
          const playerInfo = {
            name: 'Player', // This should come from user input or storage
            char: 'ALAKAZAM' // This should come from user input or storage
          };
          
          const joinData = {
            lobbyId: lobbyId,
            playerInfo: playerInfo,
            password: null
          };
          
          
          socketManager.joinLobby(joinData, (joinResponse) => {
            setIsLoading(false);
            if (joinResponse.success && joinResponse.lobby) {
              setLobby(joinResponse.lobby);
              setIsHost(joinResponse.lobby.hostId === socketManager.socket.id);
            } else {
              setError('Failed to join lobby: ' + (joinResponse.error || 'Unknown error'));
              setTimeout(() => navigate('/'), 2000);
            }
          });
        }
      });
    } catch (err) {
      setIsLoading(false);
      setError('Failed to connect to server');
      console.error('Connection error:', err);
    }
  };

  const setupSocketListeners = () => {
    if (!socketManager.socket) return;

    socketManager.socket.on('playerJoined', (data) => {
      console.log('Player joined:', data);
      setLobby(data.lobbyState);
    });

    socketManager.socket.on('playerLeft', (data) => {
      console.log('Player left:', data);
      setLobby(data.lobbyState);
      setIsHost(data.newHostId === socketManager.socket.id);
    });

    socketManager.socket.on('lobbySettingsUpdated', (data) => {
      console.log('Lobby settings updated:', data);
      setLobby(data.lobbyState);
    });

    socketManager.socket.on('playerReadyChanged', (data) => {
      console.log('Player ready changed:', data);
      setLobby(data.lobbyState);
    });

    socketManager.socket.on('gameStarting', (gameData) => {
      console.log('Game starting with data:', gameData);
      navigate('/game', { state: { gameData } });
    });

    // Handle lobby list updates
    socketManager.socket.on('lobbyListUpdate', (lobbies) => {
      console.log('Lobby list updated:', lobbies);
    });
  };

  const cleanupSocketListeners = () => {
    if (!socketManager.socket) return;

    socketManager.socket.off('playerJoined');
    socketManager.socket.off('playerLeft');
    socketManager.socket.off('lobbySettingsUpdated');
    socketManager.socket.off('playerReadyChanged');
    socketManager.socket.off('gameStarting');
    socketManager.socket.off('lobbyListUpdate');
  };

  const handleLeaveLobby = () => {
    socketManager.leaveLobby(() => {
      navigate('/');
    });
  };

  const handleSettingsChange = (newSettings) => {
    if (!isHost) {
      setError('Only the host can modify lobby settings');
      return;
    }

    if (!lobby || lobby.status !== 'waiting') {
      setError('Cannot modify settings - game has already started');
      return;
    }

    socketManager.updateLobbySettings(newSettings, (response) => {
      if (!response.success) {
        setError(response.error || 'Failed to update settings');
      } else {
        setError(''); // Clear any previous errors
      }
    });
  };

  const handleToggleReady = () => {
    if (!lobby || lobby.status !== 'waiting') {
      setError('Cannot change ready status - game has already started');
      return;
    }

    socketManager.toggleReady((response) => {
      if (!response.success) {
        setError(response.error || 'Failed to toggle ready status');
      } else {
        setError(''); // Clear any previous errors
      }
    });
  };

  const handleStartGame = () => {
    if (!isHost) {
      setError('Only the host can start the game');
      return;
    }

    if (!lobby || lobby.status !== 'waiting') {
      setError('Cannot start game - game has already started');
      return;
    }

    if (!lobby.allReady) {
      setError('All players must be ready before starting the game');
      return;
    }

    if (lobby.players.length < 2) {
      setError('Need at least 2 players to start the game');
      return;
    }

    socketManager.startGame((response) => {
      if (!response.success) {
        setError(response.error || 'Failed to start game');
      } else {
        setError(''); // Clear any previous errors
      }
    });
  };

  const getCurrentPlayer = () => {
    if (!lobby || !currentPlayerId) return null;
    return lobby.players.find(p => p.id === currentPlayerId);
  };

  const currentPlayer = getCurrentPlayer();

  // Debug logging
  console.log('LobbyRoom Debug:', {
    lobby: lobby,
    isHost: isHost,
    currentPlayerId: currentPlayerId,
    currentPlayer: currentPlayer,
    allReady: lobby?.allReady,
    players: lobby?.players
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading lobby...</p>
        </div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error || 'Lobby not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={handleLeaveLobby}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Leave Lobby
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-400">Lobby ID: {lobby.id}</p>
            <p className="text-sm text-gray-400">
              Status: <span className="text-green-400">{lobby.status}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lobby Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Lobby Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Map</label>
                  {isHost ? (
                    <select
                      value={lobby.settings.map.id}
                      onChange={(e) => {
                        const map = availableMaps.find(m => m.id === e.target.value);
                        handleSettingsChange({ map });
                      }}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                    >
                      {availableMaps.map((map) => (
                        <option key={map.id} value={map.id}>
                          {map.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="p-2 bg-gray-700 rounded text-gray-300">
                      {lobby.settings.map.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time Limit</label>
                  {isHost ? (
                    <select
                      value={lobby.settings.timeLimit}
                      onChange={(e) => handleSettingsChange({ timeLimit: parseInt(e.target.value) })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time} minute{time !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="p-2 bg-gray-700 rounded text-gray-300">
                      {lobby.settings.timeLimit} minutes
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Players</label>
                  {isHost ? (
                    <select
                      value={lobby.settings.maxPlayers}
                      onChange={(e) => handleSettingsChange({ maxPlayers: parseInt(e.target.value) })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={6}>6 Players</option>
                      <option value={8}>8 Players</option>
                    </select>
                  ) : (
                    <p className="p-2 bg-gray-700 rounded text-gray-300">
                      {lobby.settings.maxPlayers} players
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rated"
                    checked={lobby.settings.isRated}
                    onChange={(e) => isHost && handleSettingsChange({ isRated: e.target.checked })}
                    disabled={!isHost}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="rated" className="ml-2 text-sm">
                    Rated Match
                  </label>
                </div>

                {lobby.settings.isRated && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Stake Amount</label>
                    {isHost ? (
                      <select
                        value={lobby.settings.stake}
                        onChange={(e) => handleSettingsChange({ stake: parseInt(e.target.value) })}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                      >
                        {stakeOptions.map((stake) => (
                          <option key={stake} value={stake}>
                            {stake} coins
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="p-2 bg-gray-700 rounded text-gray-300">
                        {lobby.settings.stake} coins
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="private"
                    checked={lobby.settings.isPrivate}
                    onChange={(e) => isHost && handleSettingsChange({ isPrivate: e.target.checked })}
                    disabled={!isHost}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="private" className="ml-2 text-sm">
                    Private Lobby
                  </label>
                </div>
              </div>

              {isHost && (
                <p className="text-xs text-gray-400 mt-4">
                  💡 You are the host and can modify these settings
                </p>
              )}
            </div>
          </div>

          {/* Players Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Players ({lobby.players.length}/{lobby.settings.maxPlayers})
                </h2>
                {lobby.allReady && isHost ? (
                  <button
                    onClick={handleStartGame}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                  >
                    🚀 Start Game
                  </button>
                ) : (
                  <div className="text-sm text-gray-400">
                    {!isHost ? 'Only host can start game' : !lobby.allReady ? 'All players must be ready' : 'Cannot start game'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {lobby.players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border-2 ${
                      player.isReady 
                        ? 'border-green-500 bg-green-600/10' 
                        : 'border-gray-600 bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={`/src/assets/characters/${player.char}.png`}
                        alt={player.char}
                        className="w-12 h-12"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {player.name || player.char}
                          </h3>
                          {player.isHost && (
                            <span className="px-2 py-1 bg-yellow-600 text-xs rounded">
                              HOST
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{player.char}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          player.isReady ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {player.isReady ? '✅ Ready' : '⏳ Not Ready'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleToggleReady}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    currentPlayer?.isReady
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {currentPlayer?.isReady ? 'Not Ready' : 'Ready Up'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-600 text-white rounded-lg">
                  {error}
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Game Rules</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• All players must be ready to start the game</li>
                  <li>• Only the host can modify lobby settings</li>
                  <li>• {lobby.settings.isRated ? `Rated match with ${lobby.settings.stake} coin stake` : 'Casual match - no coins at stake'}</li>
                  <li>• Game duration: {lobby.settings.timeLimit} minutes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
