import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketManager } from '../../network/SocketManager';
import { usePokemon } from '@/contexts/PokemonContext'; // Import the context

export default function CreateLobby() {
  const navigate = useNavigate();
  const { pokemonCollection } = usePokemon(); // Get pokemonCollection from context
  const [playerName, setPlayerName] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [lobbySettings, setLobbySettings] = useState({
    map: { id: 'forest', name: 'Forest Map' },
    timeLimit: 15,
    isRated: false,
    stake: 10,
    maxPlayers: 4,
    isPrivate: false,
    password: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const availableMaps = [
    { id: 'forest', name: 'Forest Map' },
    { id: 'desert', name: 'Desert Map' },
    { id: 'snow', name: 'Snow Map' },
    { id: 'volcano', name: 'Volcano Map' },
    { id: 'marketplace', name: 'Marketplace' },
  ];

  const timeOptions = [5, 10, 15, 20, 30, 60];
  const stakeOptions = [10, 25, 50, 100, 250, 500, 1000];

  // Use pokemonCollection for characters, fallback to empty array
  const characters = pokemonCollection && pokemonCollection.length > 0 
    ? pokemonCollection 
    : [];

  // Set default selected character when pokemonCollection loads
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0].name);
    }
  }, [characters, selectedCharacter]);

  const handleCreateLobby = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedCharacter) {
      setError('Please select a character');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await socketManager.connect();
      
      const playerInfo = {
        name: playerName.trim(),
        char: selectedCharacter
      };

      // Create lobby with player info and settings
      const lobbyData = {
        ...playerInfo,
        settings: {
          map: lobbySettings.map,
          timeLimit: lobbySettings.timeLimit,
          isRated: lobbySettings.isRated,
          stake: lobbySettings.stake,
          maxPlayers: lobbySettings.maxPlayers,
          isPrivate: lobbySettings.isPrivate,
          password: lobbySettings.password
        }
      };

      socketManager.createLobby(lobbyData, (response) => {
        setIsCreating(false);
        
        if (response.success) {
          navigate(`/lobby/room/${response.lobby.id}`);
        } else {
          setError(response.error || 'Failed to create lobby');
        }
      });

    } catch (err) {
      setIsCreating(false);
      setError('Failed to connect to server');
      console.error('Connection error:', err);
    }
  };

  const handleMapChange = (e) => {
    const selectedMap = availableMaps.find(m => m.id === e.target.value);
    if (selectedMap) {
      setLobbySettings(prev => ({ 
        ...prev, 
        map: selectedMap 
      }));
    }
  };

  // Get image source for character
  const getCharacterImage = (character) => {
    return character.image || `/src/assets/characters/${character.name}.png`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Create Lobby</h1>

          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player Setup */}
            <div className="space-y-6">
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
                {characters.length === 0 ? (
                  <div className="text-center p-6 bg-gray-700 rounded-lg">
                    <p className="text-gray-400">No Pokémon available in your collection</p>
                    <button 
                      onClick={() => navigate('/collection')}
                      className="mt-2 text-blue-400 hover:text-blue-300"
                    >
                      Go to Collection
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {characters.map((char) => (
                      <button
                        key={char.name}
                        onClick={() => setSelectedCharacter(char.name)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedCharacter === char.name
                            ? 'border-blue-500 bg-blue-600/20'
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-center">
                          <img
                            src={getCharacterImage(char)}
                            alt={char.name}
                            className="w-16 h-16 mx-auto mb-2 object-contain"
                            onError={(e) => {
                              e.target.src = '/src/assets/characters/default.png'; // Fallback image
                            }}
                          />
                          <span className="text-sm">{char.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lobby Settings */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Map Selection</label>
                <select
                  value={lobbySettings.map.id}
                  onChange={handleMapChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {availableMaps.map((map) => (
                    <option key={map.id} value={map.id}>
                      {map.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                <select
                  value={lobbySettings.timeLimit}
                  onChange={(e) => setLobbySettings(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time} minute{time !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Players</label>
                <select
                  value={lobbySettings.maxPlayers}
                  onChange={(e) => setLobbySettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={6}>6 Players</option>
                  <option value={8}>8 Players</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={lobbySettings.isRated}
                    onChange={(e) => setLobbySettings(prev => ({ ...prev, isRated: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2">Rated Match</span>
                </label>
              </div>

              {lobbySettings.isRated && (
                <div>
                  <label className="block text-sm font-medium mb-2">Stake Amount</label>
                  <select
                    value={lobbySettings.stake}
                    onChange={(e) => setLobbySettings(prev => ({ ...prev, stake: parseInt(e.target.value) }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    {stakeOptions.map((stake) => (
                      <option key={stake} value={stake}>
                        {stake} coins
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={lobbySettings.isPrivate}
                    onChange={(e) => setLobbySettings(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2">Private Lobby</span>
                </label>
              </div>

              {lobbySettings.isPrivate && (
                <div>
                  <label className="block text-sm font-medium mb-2">Password (optional)</label>
                  <input
                    type="text"
                    value={lobbySettings.password}
                    onChange={(e) => setLobbySettings(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Leave empty for no password"
                    maxLength={20}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleCreateLobby}
              disabled={isCreating || !playerName.trim() || !selectedCharacter || characters.length === 0}
              className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors ${
                isCreating || !playerName.trim() || !selectedCharacter || characters.length === 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isCreating ? 'Creating Lobby...' : 'Create Lobby'}
            </button>
          </div>

          {characters.length === 0 && (
            <div className="mt-4 text-center text-yellow-400">
              You need at least one Pokémon in your collection to create a lobby
            </div>
          )}
        </div>
      </div>
    </div>
  );
}