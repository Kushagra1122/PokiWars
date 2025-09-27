// Lobby-specific socket event handlers
const { lobbyManager } = require('./lobbyManager');

function handleLobbyConnection(io, socket) {
    console.log(`🔌 Lobby socket connected: ${socket.id}`);

    // Store current lobby ID for this socket
    let currentLobbyId = null;

    // Create a new lobby
    socket.on('createLobby', (data, callback) => {
        try {
            // Validate input data
            if (!data || (!data.name && !data.char)) {
                throw new Error('Player information is required');
            }
            
            // Check if player is already in a lobby
            if (currentLobbyId) {
                throw new Error('You are already in a lobby');
            }
            
            // Extract player info and settings from the data
            const { name, char, settings } = data;
            const playerInfo = { name, char };
            
            const lobby = lobbyManager.createLobby(socket.id, playerInfo);
            currentLobbyId = lobby.id;
            
            // Apply settings if provided
            if (settings) {
                lobby.updateSettings(socket.id, settings);
            }
            
            // Join the socket room for this lobby
            socket.join(`lobby:${lobby.id}`);
            
            const lobbyState = lobby.getLobbyState();
            console.log(`✅ Lobby created: ${lobby.id} by ${playerInfo.name || playerInfo.char}`);
            
            if (callback) {
                callback({ 
                    success: true, 
                    lobby: lobbyState 
                });
            }

            // Broadcast lobby list update to all clients in lobby list
            io.to('lobby-list').emit('lobbyListUpdate', lobbyManager.getPublicLobbies());

        } catch (error) {
            console.error('❌ Error creating lobby:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Join existing lobby
    socket.on('joinLobby', (data, callback) => {
        try {
            const { lobbyId, playerInfo, password } = data;
            
            // Validate input data
            if (!lobbyId) {
                throw new Error('Lobby ID is required');
            }
            
            if (!playerInfo || (!playerInfo.name && !playerInfo.char)) {
                throw new Error('Player information is required');
            }
            
            // Check if player is already in a lobby
            if (currentLobbyId && currentLobbyId !== lobbyId) {
                throw new Error('You are already in another lobby');
            }
            
            const playerData = lobbyManager.joinLobby(lobbyId, socket.id, playerInfo, password);
            currentLobbyId = lobbyId;
            
            // Join the socket room for this lobby
            socket.join(`lobby:${lobbyId}`);
            
            const lobby = lobbyManager.getLobby(lobbyId);
            const lobbyState = lobby.getLobbyState();
            
            console.log(`✅ Player ${playerInfo.name || playerInfo.char} joined lobby ${lobbyId}`);
            
            if (callback) {
                callback({ 
                    success: true, 
                    lobby: lobbyState 
                });
            }

            // Broadcast to all players in the lobby
            socket.to(`lobby:${lobbyId}`).emit('playerJoined', {
                player: playerData,
                lobbyState: lobbyState
            });

            // Update lobby list for other clients
            io.to('lobby-list').emit('lobbyListUpdate', lobbyManager.getPublicLobbies());

        } catch (error) {
            console.error('❌ Error joining lobby:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Leave current lobby
    socket.on('leaveLobby', (callback) => {
        try {
            if (!currentLobbyId) {
                if (callback) {
                    callback({ success: true });
                }
                return;
            }

            const result = lobbyManager.leaveLobby(currentLobbyId, socket.id);
            
            if (result) {
                // Leave the socket room
                socket.leave(`lobby:${currentLobbyId}`);
                
                console.log(`📤 Player left lobby ${currentLobbyId}`);

                // If lobby still exists, notify remaining players
                if (!result.isEmpty) {
                    const lobbyState = result.lobby.getLobbyState();
                    socket.to(`lobby:${currentLobbyId}`).emit('playerLeft', {
                        playerId: socket.id,
                        newHostId: result.newHostId,
                        lobbyState: lobbyState
                    });
                }

                currentLobbyId = null;

                // Update lobby list
                io.to('lobby-list').emit('lobbyListUpdate', lobbyManager.getPublicLobbies());
            }

            if (callback) {
                callback({ success: true });
            }

        } catch (error) {
            console.error('❌ Error leaving lobby:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Update lobby settings (host only)
    socket.on('updateLobbySettings', (settings, callback) => {
        try {
            if (!currentLobbyId) {
                throw new Error('Not in a lobby');
            }

            const lobby = lobbyManager.getLobby(currentLobbyId);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            const updatedSettings = lobby.updateSettings(socket.id, settings);
            const lobbyState = lobby.getLobbyState();

            console.log(`⚙️ Lobby ${currentLobbyId} settings updated:`, updatedSettings);

            if (callback) {
                callback({ 
                    success: true, 
                    settings: updatedSettings,
                    lobbyState: lobbyState
                });
            }

            // Broadcast to all players in the lobby
            socket.to(`lobby:${currentLobbyId}`).emit('lobbySettingsUpdated', {
                settings: updatedSettings,
                lobbyState: lobbyState
            });

            // Update lobby list if visibility changed
            io.to('lobby-list').emit('lobbyListUpdate', lobbyManager.getPublicLobbies());

        } catch (error) {
            console.error('❌ Error updating lobby settings:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Toggle ready status
    socket.on('toggleReady', (callback) => {
        try {
            if (!currentLobbyId) {
                throw new Error('Not in a lobby');
            }

            const lobby = lobbyManager.getLobby(currentLobbyId);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            const isReady = lobby.togglePlayerReady(socket.id);
            const lobbyState = lobby.getLobbyState();

            console.log(`🎯 Player ${socket.id} ready status: ${isReady}`);

            if (callback) {
                callback({ 
                    success: true, 
                    isReady: isReady,
                    lobbyState: lobbyState
                });
            }

            // Broadcast to all players in the lobby
            io.to(`lobby:${currentLobbyId}`).emit('playerReadyChanged', {
                playerId: socket.id,
                isReady: isReady,
                lobbyState: lobbyState
            });

        } catch (error) {
            console.error('❌ Error toggling ready:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Start game (host only)
    socket.on('startGame', (callback) => {
        try {
            if (!currentLobbyId) {
                throw new Error('Not in a lobby');
            }

            const lobby = lobbyManager.getLobby(currentLobbyId);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            const gameData = lobby.startGame();
            
            // Enhance game data with proper player character mapping
            const playersWithCharacters = {};
            gameData.players.forEach(player => {
                playersWithCharacters[player.id] = {
                    id: player.id,
                    name: player.name,
                    char: player.char,
                    isHost: player.isHost
                };
            });
            
            gameData.playersWithCharacters = playersWithCharacters;

            console.log(`🎮 Game starting for lobby ${currentLobbyId}`, gameData);

            if (callback) {
                callback({ 
                    success: true, 
                    gameData: gameData 
                });
            }

            // Broadcast to all players in the lobby
            io.to(`lobby:${currentLobbyId}`).emit('gameStarting', gameData);

            // Remove from public lobby list since game is starting
            io.to('lobby-list').emit('lobbyListUpdate', lobbyManager.getPublicLobbies());

        } catch (error) {
            console.error('❌ Error starting game:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Get public lobby list
    socket.on('getLobbyList', (callback) => {
        try {
            const lobbies = lobbyManager.getPublicLobbies();
            
            // Join lobby list room for updates
            socket.join('lobby-list');

            if (callback) {
                callback({ 
                    success: true, 
                    lobbies: lobbies 
                });
            }

        } catch (error) {
            console.error('❌ Error getting lobby list:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Get current lobby state
    socket.on('getLobbyState', (callback) => {
        try {
            if (!currentLobbyId) {
                if (callback) {
                    callback({ success: true, lobby: null });
                }
                return;
            }

            const lobby = lobbyManager.getLobby(currentLobbyId);
            if (!lobby) {
                currentLobbyId = null;
                if (callback) {
                    callback({ success: true, lobby: null });
                }
                return;
            }

            const lobbyState = lobby.getLobbyState();

            if (callback) {
                callback({ 
                    success: true, 
                    lobby: lobbyState 
                });
            }

        } catch (error) {
            console.error('❌ Error getting lobby state:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Get specific lobby state by ID (for viewing lobby details)
    socket.on('getLobbyById', (lobbyId, callback) => {
        try {
            const lobby = lobbyManager.getLobby(lobbyId);
            if (!lobby) {
                if (callback) {
                    callback({ 
                        success: false, 
                        error: 'Lobby not found' 
                    });
                }
                return;
            }

            const lobbyState = lobby.getLobbyState();

            if (callback) {
                callback({ 
                    success: true, 
                    lobby: lobbyState 
                });
            }

        } catch (error) {
            console.error('❌ Error getting lobby by ID:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`🔌 Lobby socket disconnected: ${socket.id}`);
        
        if (currentLobbyId) {
            try {
                const result = lobbyManager.leaveLobby(currentLobbyId, socket.id);
                
                if (result && !result.isEmpty) {
                    const lobbyState = result.lobby.getLobbyState();
                    socket.to(`lobby:${currentLobbyId}`).emit('playerLeft', {
                        playerId: socket.id,
                        newHostId: result.newHostId,
                        lobbyState: lobbyState
                    });
                }

                // Update lobby list
                io.to('lobby-list').emit('lobbyListUpdate', lobbyManager.getPublicLobbies());

            } catch (error) {
                console.error('❌ Error handling lobby disconnect:', error.message);
            }
        }
    });

    // Send lobby statistics (for monitoring)
    socket.on('getLobbyStats', (callback) => {
        try {
            const stats = lobbyManager.getStats();
            if (callback) {
                callback({ 
                    success: true, 
                    stats: stats 
                });
            }
        } catch (error) {
            console.error('❌ Error getting lobby stats:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });
}

module.exports = { handleLobbyConnection };
