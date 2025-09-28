// Lobby management system with data models and core functionality
const { v4: uuidv4 } = require('uuid');

// Available maps
const AVAILABLE_MAPS = [
    { id: 'forest', name: 'Forest Map', file: 'forestMap.json' },
    { id: 'desert', name: 'Desert Map', file: 'desertMap.json' },
    { id: 'snow', name: 'Snow Map', file: 'snowMap.json' },
    { id: 'volcano', name: 'Volcano Map', file: 'volcanoMap.json' },
    { id: 'marketplace', name: 'Marketplace', file: 'marketplace.json' },
    { id: 'lobby', name: 'Lobby Map', file: 'lobby.json' }
];

// Time options (in minutes)
const TIME_OPTIONS = [5, 10, 15, 20, 30, 60];

// Stake options for rated games
const STAKE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];

class Lobby {
    constructor(hostId, hostInfo) {
        this.id = uuidv4();
        this.hostId = hostId;
        this.hostInfo = hostInfo;
        this.players = new Map();
        this.players.set(hostId, {
            id: hostId,
            ...hostInfo,
            isHost: true,
            isReady: false
        });
        
        // Lobby settings
        this.settings = {
            map: AVAILABLE_MAPS[0], // Default to forest map
            timeLimit: 15, // Default 15 minutes
            isRated: false,
            stake: 0, // Only relevant for rated games
            maxPlayers: 4,
            isPrivate: false,
            password: null
        };
        
        this.status = 'waiting'; // waiting, starting, in-game, finished
        this.createdAt = Date.now();
        this.gameStartTime = null;
    }

    // Add player to lobby
    addPlayer(playerId, playerInfo) {
        if (this.players.has(playerId)) {
            throw new Error('Player is already in this lobby');
        }

        if (this.players.size >= this.settings.maxPlayers) {
            throw new Error('Lobby is full');
        }

        if (this.status !== 'waiting') {
            throw new Error('Cannot join lobby - game already started');
        }

        // Validate player info
        if (!playerInfo || (!playerInfo.name && !playerInfo.char)) {
            throw new Error('Invalid player information');
        }

        this.players.set(playerId, {
            id: playerId,
            name: playerInfo.name || 'Anonymous',
            char: playerInfo.char || 'ALAKAZAM',
            isHost: false,
            isReady: false
        });

        return this.getPlayerData(playerId);
    }

    // Remove player from lobby
    removePlayer(playerId) {
        const wasHost = this.players.get(playerId)?.isHost;
        this.players.delete(playerId);

        // If host left and there are other players, assign new host
        if (wasHost && this.players.size > 0) {
            const newHost = this.players.values().next().value;
            newHost.isHost = true;
            this.hostId = newHost.id;
        }

        return {
            wasHost,
            newHostId: wasHost ? this.hostId : null,
            isEmpty: this.players.size === 0
        };
    }

    // Update lobby settings (only host can do this)
    updateSettings(playerId, newSettings) {
        if (playerId !== this.hostId) {
            throw new Error('Only host can update lobby settings');
        }

        if (this.status !== 'waiting') {
            throw new Error('Cannot update settings - game already started');
        }

        // Validate settings
        if (newSettings.map) {
            const validMap = AVAILABLE_MAPS.find(m => m.id === newSettings.map.id);
            if (!validMap) {
                throw new Error('Invalid map selection');
            }
            this.settings.map = validMap;
        }

        if (newSettings.timeLimit !== undefined) {
            if (!TIME_OPTIONS.includes(newSettings.timeLimit)) {
                throw new Error('Invalid time limit');
            }
            this.settings.timeLimit = newSettings.timeLimit;
        }

        if (newSettings.isRated !== undefined) {
            this.settings.isRated = newSettings.isRated;
        }

        if (newSettings.stake !== undefined) {
            if (newSettings.isRated && !STAKE_OPTIONS.includes(newSettings.stake)) {
                throw new Error('Invalid stake amount');
            }
            this.settings.stake = newSettings.stake;
        }

        if (newSettings.maxPlayers !== undefined) {
            if (newSettings.maxPlayers < 2 || newSettings.maxPlayers > 8) {
                throw new Error('Invalid max players (must be between 2-8)');
            }
            this.settings.maxPlayers = newSettings.maxPlayers;
        }

        if (newSettings.isPrivate !== undefined) {
            this.settings.isPrivate = newSettings.isPrivate;
        }

        if (newSettings.password !== undefined) {
            this.settings.password = newSettings.password || null;
        }

        return this.settings;
    }

    // Toggle player ready status
    togglePlayerReady(playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            throw new Error('Player not found in lobby');
        }

        player.isReady = !player.isReady;
        return player.isReady;
    }

    // Check if all players are ready
    areAllPlayersReady() {
        if (this.players.size < 2) {
            return false; // Need at least 2 players
        }

        for (const player of this.players.values()) {
            if (!player.isReady) {
                return false;
            }
        }
        return true;
    }

    // Start the game
    startGame() {
        if (this.status !== 'waiting') {
            throw new Error('Game has already started');
        }

        if (this.players.size < 2) {
            throw new Error('Need at least 2 players to start the game');
        }

        if (!this.areAllPlayersReady()) {
            throw new Error('Not all players are ready');
        }

        this.status = 'starting';
        this.gameStartTime = Date.now();
        
        // Reset all ready status for the game
        for (const player of this.players.values()) {
            player.isReady = false;
        }

        return {
            lobbyId: this.id,
            settings: this.settings,
            players: Array.from(this.players.values()),
            startTime: this.gameStartTime
        };
    }

    // Get player data
    getPlayerData(playerId) {
        return this.players.get(playerId);
    }

    // Get lobby state for clients
    getLobbyState() {
        return {
            id: this.id,
            hostId: this.hostId,
            players: Array.from(this.players.values()),
            settings: this.settings,
            status: this.status,
            createdAt: this.createdAt,
            allReady: this.areAllPlayersReady()
        };
    }

    // Get public lobby info (for lobby list)
    getPublicInfo() {
        return {
            id: this.id,
            hostName: this.hostInfo.name || this.hostInfo.char || 'Anonymous',
            playerCount: this.players.size,
            maxPlayers: this.settings.maxPlayers,
            map: this.settings.map.name,
            timeLimit: this.settings.timeLimit,
            isRated: this.settings.isRated,
            stake: this.settings.stake,
            status: this.status,
            isPrivate: this.settings.isPrivate
        };
    }
}

class LobbyManager {
    constructor() {
        this.lobbies = new Map();
        this.userLobbyMap = new Map(); // Maps username to lobby ID
        this.lobbyCreatorMap = new Map(); // Maps lobby ID to creator info
    }

    // Create new lobby
    createLobby(hostId, hostInfo) {
        const lobby = new Lobby(hostId, hostInfo);
        this.lobbies.set(lobby.id, lobby);
        
        // Track lobby creator
        const creatorName = hostInfo.name || hostInfo.char || 'Anonymous';
        this.userLobbyMap.set(creatorName, lobby.id);
        this.lobbyCreatorMap.set(lobby.id, {
            username: creatorName,
            hostId: hostId,
            createdAt: Date.now()
        });
        
        console.log(`🏠 Lobby ${lobby.id} created by ${creatorName}`);
        console.log(`📊 User lobby map updated: ${creatorName} -> ${lobby.id}`);
        return lobby;
    }

    // Get lobby by ID
    getLobby(lobbyId) {
        return this.lobbies.get(lobbyId);
    }

    // Join existing lobby
    joinLobby(lobbyId, playerId, playerInfo, password = null) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            throw new Error('Lobby not found');
        }

        if (lobby.settings.isPrivate && lobby.settings.password !== password) {
            throw new Error('Invalid password');
        }

        return lobby.addPlayer(playerId, playerInfo);
    }

    // Leave lobby
    leaveLobby(lobbyId, playerId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            return null;
        }

        const result = lobby.removePlayer(playerId);
        
        // If lobby is empty, remove it and clean up mappings
        if (result.isEmpty) {
            this.lobbies.delete(lobbyId);
            
            // Clean up creator mappings
            const creatorInfo = this.lobbyCreatorMap.get(lobbyId);
            if (creatorInfo) {
                this.userLobbyMap.delete(creatorInfo.username);
                this.lobbyCreatorMap.delete(lobbyId);
                console.log(`🗑️ Cleaned up mappings for lobby ${lobbyId} (creator: ${creatorInfo.username})`);
            }
            
            console.log(`🗑️ Empty lobby ${lobbyId} deleted`);
        }

        return { lobby, ...result };
    }

    // Get all public lobbies
    getPublicLobbies() {
        const publicLobbies = [];
        for (const lobby of this.lobbies.values()) {
            // Show all lobbies that are not in-game (including private ones)
            if (lobby.status !== 'in-game') {
                publicLobbies.push(lobby.getPublicInfo());
            }
        }
        return publicLobbies.sort((a, b) => {
            // Sort by status first (waiting > starting > finished), then by player count
            const statusOrder = { 'waiting': 3, 'starting': 2, 'finished': 1 };
            const statusDiff = (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
            if (statusDiff !== 0) return statusDiff;
            return b.playerCount - a.playerCount;
        });
    }

    // Clean up old lobbies
    cleanup() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            if (now - lobby.createdAt > maxAge && lobby.status !== 'in-game') {
                this.lobbies.delete(lobbyId);
                console.log(`🧹 Cleaned up old lobby ${lobbyId}`);
            }
        }
    }

    // Get lobby by creator username
    getLobbyByCreator(username) {
        const lobbyId = this.userLobbyMap.get(username);
        if (lobbyId) {
            return this.lobbies.get(lobbyId);
        }
        return null;
    }

    // Get all lobbies created by a specific user
    getUserLobbies(username) {
        const lobbyId = this.userLobbyMap.get(username);
        if (lobbyId) {
            const lobby = this.lobbies.get(lobbyId);
            return lobby ? [lobby] : [];
        }
        return [];
    }

    // Get creator info for a lobby
    getLobbyCreator(lobbyId) {
        return this.lobbyCreatorMap.get(lobbyId);
    }

    // Get all creator mappings (for debugging)
    getAllCreatorMappings() {
        const mappings = {};
        for (const [username, lobbyId] of this.userLobbyMap.entries()) {
            mappings[username] = {
                lobbyId: lobbyId,
                lobby: this.lobbies.get(lobbyId)?.getPublicInfo() || null
            };
        }
        return mappings;
    }

    // Get lobby statistics
    getStats() {
        const stats = {
            totalLobbies: this.lobbies.size,
            waitingLobbies: 0,
            inGameLobbies: 0,
            totalPlayers: 0,
            activeCreators: this.userLobbyMap.size
        };

        for (const lobby of this.lobbies.values()) {
            stats.totalPlayers += lobby.players.size;
            if (lobby.status === 'waiting') {
                stats.waitingLobbies++;
            } else if (lobby.status === 'in-game') {
                stats.inGameLobbies++;
            }
        }

        return stats;
    }
}

// Export singleton instance
const lobbyManager = new LobbyManager();

// Clean up old lobbies every 30 minutes
setInterval(() => {
    lobbyManager.cleanup();
}, 30 * 60 * 1000);

module.exports = {
    LobbyManager,
    lobbyManager,
    AVAILABLE_MAPS,
    TIME_OPTIONS,
    STAKE_OPTIONS
};