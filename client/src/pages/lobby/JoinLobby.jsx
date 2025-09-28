import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketManager } from '../../network/SocketManager';
import { usePokemon } from '../../contexts/PokemonContext';
import { useUser } from '../../contexts/UserContext';

export default function JoinLobby() {
  const navigate = useNavigate();
  const { main } = usePokemon();
  const { username } = useUser();
  const [selectedCharacter, setSelectedCharacter] = useState(main ? main.name : 'ALAKAZAM');
  const [lobbies, setLobbies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [password, setPassword] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Use the main Pokemon as the selected character
  useEffect(() => {
    if (main) {
      setSelectedCharacter(main.name);
    }
  }, [main]);

  useEffect(() => {
    loadLobbies();
    
    // Set up periodic refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing lobby list...');
      loadLobbies();
    }, 10000);
    
    // Set up lobby list update listener once
    const handleLobbyListUpdate = (updatedLobbies) => {
      console.log('🔄 Lobby list updated:', updatedLobbies);
      setLobbies(updatedLobbies || []);
    };
    
    socketManager.socket?.on('lobbyListUpdate', handleLobbyListUpdate);
    
    // Cleanup interval and listeners on unmount
    return () => {
      clearInterval(refreshInterval);
      socketManager.socket?.off('lobbyListUpdate', handleLobbyListUpdate);
    };
  }, []);

  const loadLobbies = async () => {
    setIsLoading(true);
    setError('');
    console.log('🔄 Loading lobbies...');
    
    try {
      console.log('🔄 Connecting to server...');
      await socketManager.connect();
      console.log('✅ Connected to server, requesting lobby list...');
      
      // Add timeout for lobby list request
      const timeoutId = setTimeout(() => {
        console.error('❌ Lobby list request timeout');
        setIsLoading(false);
        setError('Request timeout - please try again');
        setLobbies([]);
      }, 10000);
      
      socketManager.getLobbyList((response) => {
        clearTimeout(timeoutId);
        console.log('📋 Lobby list response:', response);
        setIsLoading(false);
        
        if (response && response.success) {
          console.log('✅ Lobbies loaded:', response.lobbies);
          console.log('📊 Lobby count:', response.lobbies?.length || 0);
          if (response.lobbies && response.lobbies.length > 0) {
            console.log('📋 Available lobbies:', response.lobbies.map(l => ({
              id: l.id,
              host: l.hostName,
              status: l.status,
              players: `${l.playerCount}/${l.maxPlayers}`,
              isPrivate: l.isPrivate
            })));
          }
          setLobbies(response.lobbies || []);
          setError('');
        } else {
          console.error('❌ Failed to load lobbies:', response?.error);
          setError(response?.error || 'Failed to load lobbies');
          setLobbies([]);
        }
      });

    } catch (err) {
      console.error('❌ Connection error:', err);
      setIsLoading(false);
      setError('Failed to connect to server: ' + err.message);
      setLobbies([]);
    }
  };

  const handleJoinLobby = (lobby) => {
    if (!username) {
      setError('Please connect your wallet first');
      return;
    }

    setSelectedLobby(lobby);
    setShowJoinModal(true);
    setError('');
  };

  const confirmJoinLobby = async () => {
    if (!selectedLobby) return;

    setIsJoining(true);
    setError('');

    const playerInfo = {
      name: username,
      char: selectedCharacter
    };

    const joinData = {
      lobbyId: selectedLobby.id,
      playerInfo,
      password: password || null
    };


    socketManager.joinLobby(joinData, (response) => {
      setIsJoining(false);
      
      if (response.success) {
        navigate(`/lobby/room/${selectedLobby.id}`);
      } else {
        setError(response.error || 'Failed to join lobby');
        setShowJoinModal(false);
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-green-400';
      case 'starting': return 'text-yellow-400';
      case 'in-game': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (showJoinModal) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Lobby</h2>
          
          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Joining lobby:</p>
              <p className="font-semibold">{selectedLobby.hostName}'s Lobby</p>
              <p className="text-sm text-gray-400">{selectedLobby.map} • {selectedLobby.playerCount}/{selectedLobby.maxPlayers} players</p>
            </div>

            {/* Selected Pokemon Display */}
            <div className="bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-semibold mb-2 text-center">Your Pokemon</h4>
              {main ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-center">
                    <img
                      src={main.main || main.img}
                      alt={main.name}
                      className="w-12 h-12 mx-auto mb-1 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <h5 className="text-xs font-semibold text-white">{main.name}</h5>
                    <p className="text-xs text-gray-400 capitalize">{main.type}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-center">
                      <div className="text-red-400 font-bold">{main.attack || 0}</div>
                      <div className="text-gray-400">ATK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">{main.defense || 0}</div>
                      <div className="text-gray-400">DEF</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{main.speed || 0}</div>
                      <div className="text-gray-400">SPD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">{main.level || 1}</div>
                      <div className="text-gray-400">LVL</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="text-2xl mb-1">🎮</div>
                  <p className="text-gray-400 text-xs">No Pokemon selected</p>
                </div>
              )}
            </div>

            {selectedLobby.isPrivate && (
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter lobby password"
                />
              </div>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                setShowJoinModal(false);
                setSelectedLobby(null);
                setPassword('');
                setError('');
              }}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmJoinLobby}
              disabled={isJoining}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isJoining
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Join Lobby</h1>

          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player Setup */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Player Info</h3>
                <p className="text-gray-300">Name: <span className="text-white font-semibold">{username || 'Not connected'}</span></p>
                <p className="text-gray-300">Pokemon: <span className="text-white font-semibold">{selectedCharacter}</span></p>
                {!username && (
                  <p className="text-red-400 text-sm mt-2">Please connect your wallet to join a lobby</p>
                )}
              </div>

              {/* Character selection removed - using main Pokemon from context */}

              <button
                onClick={loadLobbies}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                🔄 Refresh Lobbies
              </button>
            </div>

            {/* Lobby List */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Available Lobbies</h2>
                <span className="text-gray-400 text-sm">
                  {lobbies.length} lobby{lobbies.length !== 1 ? 'ies' : ''} available
                </span>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2 text-gray-400">Loading lobbies...</p>
                </div>
              ) : lobbies.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No lobbies available</p>
                  <p className="text-sm mt-2">Be the first to create one!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lobbies.map((lobby) => (
                    <div
                      key={lobby.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{lobby.hostName}'s Lobby</h3>
                          <p className="text-sm text-gray-400">
                            Host: {lobby.hostName}
                            {lobby.isPrivate && <span className="ml-2">🔒 Private</span>}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(lobby.status)}`}>
                          {lobby.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-400">Map:</span> {lobby.map}
                        </div>
                        <div>
                          <span className="text-gray-400">Time:</span> {lobby.timeLimit}m
                        </div>
                        <div>
                          <span className="text-gray-400">Players:</span> {lobby.playerCount}/{lobby.maxPlayers}
                        </div>
                        <div>
                          <span className="text-gray-400">Type:</span> {lobby.isRated ? `Rated (${lobby.stake} coins)` : 'Casual'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinLobby(lobby)}
                        disabled={!username || lobby.playerCount >= lobby.maxPlayers || lobby.status !== 'waiting'}
                        className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                          !username || lobby.playerCount >= lobby.maxPlayers || lobby.status !== 'waiting'
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {lobby.playerCount >= lobby.maxPlayers ? 'Full' : 
                         lobby.status !== 'waiting' ? 'In Progress' : 'Join Lobby'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}