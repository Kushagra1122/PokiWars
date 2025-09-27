import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketManager } from '../../network/SocketManager';

export default function JoinLobby() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('ALAKAZAM');
  const [lobbies, setLobbies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [password, setPassword] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const characters = ['ALAKAZAM', 'BLASTOISE', 'CHARIZARD'];

  useEffect(() => {
    loadLobbies();
  }, []);

  const loadLobbies = async () => {
    setIsLoading(true);
    try {
      await socketManager.connect();
      
      socketManager.getLobbyList((response) => {
        setIsLoading(false);
        if (response.success) {
          setLobbies(response.lobbies);
        } else {
          setError('Failed to load lobbies');
        }
      });

      // Listen for lobby list updates
      socketManager.socket.on('lobbyListUpdate', (updatedLobbies) => {
        setLobbies(updatedLobbies);
      });

    } catch (err) {
      setIsLoading(false);
      setError('Failed to connect to server');
      console.error('Connection error:', err);
    }
  };

  const handleJoinLobby = (lobby) => {
    if (!playerName.trim()) {
      setError('Please enter your name');
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
      name: playerName.trim(),
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
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your name"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Choose Character</label>
                <div className="space-y-2">
                  {characters.map((char) => (
                    <button
                      key={char}
                      onClick={() => setSelectedCharacter(char)}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                        selectedCharacter === char
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <img
                        src={`/src/assets/characters/${char}.png`}
                        alt={char}
                        className="w-10 h-10"
                      />
                      <span>{char}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                        disabled={!playerName.trim() || lobby.playerCount >= lobby.maxPlayers || lobby.status !== 'waiting'}
                        className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                          !playerName.trim() || lobby.playerCount >= lobby.maxPlayers || lobby.status !== 'waiting'
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