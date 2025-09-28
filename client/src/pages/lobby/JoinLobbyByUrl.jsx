import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socketManager } from '../../network/SocketManager';
import { usePokemon } from '../../contexts/PokemonContext';
import { useUser } from '../../contexts/UserContext';

export default function JoinLobbyByUrl() {
  const navigate = useNavigate();
  const { lobbyId } = useParams();
  const { main } = usePokemon();
  const { username } = useUser();
  const [selectedCharacter, setSelectedCharacter] = useState(main ? main.name : 'ALAKAZAM');
  const [lobbyInfo, setLobbyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  // Use the main Pokemon as the selected character
  useEffect(() => {
    if (main) {
      setSelectedCharacter(main.name);
    }
  }, [main]);

  useEffect(() => {
    if (lobbyId) {
      loadLobbyInfo();
    }
  }, [lobbyId]);

  const loadLobbyInfo = async () => {
    setIsLoading(true);
    setError('');
    console.log('🔗 Loading lobby info for URL join:', lobbyId);
    
    try {
      await socketManager.connect();
      
      socketManager.getLobbyForUrlJoin(lobbyId, (response) => {
        setIsLoading(false);
        
        if (response && response.success) {
          console.log('✅ Lobby info loaded:', response.lobbyInfo);
          setLobbyInfo(response.lobbyInfo);
          setError('');
        } else {
          console.error('❌ Failed to load lobby info:', response?.error);
          setError(response?.error || 'Lobby not found or no longer available');
        }
      });

    } catch (err) {
      console.error('❌ Connection error:', err);
      setIsLoading(false);
      setError('Failed to connect to server: ' + err.message);
    }
  };

  const handleJoinLobby = async () => {
    if (!username) {
      setError('Please connect your wallet first');
      return;
    }

    if (!lobbyInfo) {
      setError('Lobby information not available');
      return;
    }

    setIsJoining(true);
    setError('');

    const playerInfo = {
      name: username,
      char: selectedCharacter
    };

    const joinData = {
      lobbyId: lobbyInfo.lobby.id,
      playerInfo,
      password: password || null
    };

    socketManager.joinLobby(joinData, (response) => {
      setIsJoining(false);
      
      if (response.success) {
        navigate(`/lobby/room/${lobbyInfo.lobby.id}`);
      } else {
        setError(response.error || 'Failed to join lobby');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading lobby...</p>
          <p className="text-gray-400 mt-2">Lobby ID: {lobbyId}</p>
        </div>
      </div>
    );
  }

  if (error && !lobbyInfo) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Lobby Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/lobby/join')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Browse Available Lobbies
            </button>
            <button
              onClick={() => navigate('/lobby/create')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Create New Lobby
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/lobby/join')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Lobby List
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Join Lobby</h1>

          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lobby Info */}
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Lobby Details</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Host:</span>
                    <span className="font-semibold">{lobbyInfo?.publicInfo.hostName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Map:</span>
                    <span>{lobbyInfo?.publicInfo.map}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Players:</span>
                    <span>{lobbyInfo?.publicInfo.playerCount}/{lobbyInfo?.publicInfo.maxPlayers}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Limit:</span>
                    <span>{lobbyInfo?.publicInfo.timeLimit} minutes</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span>{lobbyInfo?.publicInfo.isRated ? `Rated (${lobbyInfo?.publicInfo.stake} coins)` : 'Casual'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${getStatusColor(lobbyInfo?.publicInfo.status)}`}>
                      {lobbyInfo?.publicInfo.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  {lobbyInfo?.publicInfo.isPrivate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Privacy:</span>
                      <span className="text-yellow-400">🔒 Private Lobby</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Player Info */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Your Info</h3>
                <p className="text-gray-300">Name: <span className="text-white font-semibold">{username || 'Not connected'}</span></p>
                <p className="text-gray-300">Pokemon: <span className="text-white font-semibold">{selectedCharacter}</span></p>
                {!username && (
                  <p className="text-red-400 text-sm mt-2">Please connect your wallet to join a lobby</p>
                )}
              </div>
            </div>

            {/* Join Form */}
            <div className="space-y-6">
              {/* Pokemon Display */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-center">Your Pokemon</h3>
                {main ? (
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <img
                        src={main.main || main.img}
                        alt={main.name}
                        className="w-16 h-16 mx-auto mb-2 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <h4 className="text-sm font-semibold text-white">{main.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">{main.type}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
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
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🎮</div>
                    <p className="text-gray-400">No Pokemon selected</p>
                  </div>
                )}
              </div>

              {/* Password Input */}
              {lobbyInfo?.publicInfo.isPrivate && (
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter lobby password"
                  />
                </div>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoinLobby}
                disabled={!username || isJoining || lobbyInfo?.publicInfo.status !== 'waiting'}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  !username || isJoining || lobbyInfo?.publicInfo.status !== 'waiting'
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isJoining ? 'Joining...' : 
                 lobbyInfo?.publicInfo.status !== 'waiting' ? 'Lobby Not Available' :
                 'Join Lobby'}
              </button>

              {/* Status Messages */}
              {lobbyInfo?.publicInfo.status !== 'waiting' && (
                <div className="text-center text-yellow-400 text-sm">
                  This lobby is currently {lobbyInfo?.publicInfo.status} and cannot be joined.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
