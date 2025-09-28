// Lobby-specific socket event handlers
const { lobbyManager } = require('./lobbyManager');

function handleLobbyConnection(io, socket) {
    console.log(`🔌 Lobby socket connected: ${socket.id}`);

    // Store current lobby ID for this socket
    let currentLobbyId = null;

    // Create a new lobby
    socket.on('createLobby', (data, callback) => {
        try {
            console.log(`🏠 Creating lobby request from ${socket.id}:`, data);
            
            // Validate input data
            if (!data || (!data.name && !data.char)) {
                console.log(`❌ Invalid lobby creation data from ${socket.id}:`, data);
                throw new Error('Player information is required');
            }
            
            // Check if player is already in a lobby
            if (currentLobbyId) {
                console.log(`❌ Player ${socket.id} already in lobby ${currentLobbyId}`);
                throw new Error('You are already in a lobby');
            }
            
            // Extract player info and settings from the data
            const { name, char, settings } = data;
            const playerInfo = { name, char };
            
            console.log(`👤 Creating lobby for player: ${playerInfo.name || playerInfo.char} (${socket.id})`);
            const lobby = lobbyManager.createLobby(socket.id, playerInfo);
            currentLobbyId = lobby.id;
            
            console.log(`🏠 Lobby ${lobby.id} created successfully`);
            
            // Apply settings if provided
            if (settings) {
                console.log(`⚙️ Applying settings to lobby ${lobby.id}:`, settings);
                lobby.updateSettings(socket.id, settings);
            }
            
            // Join the socket room for this lobby
            socket.join(`lobby:${lobby.id}`);
            console.log(`🔗 Player ${socket.id} joined lobby room: lobby:${lobby.id}`);
            
            const lobbyState = lobby.getLobbyState();
            console.log(`✅ Lobby created successfully: ${lobby.id} by ${playerInfo.name || playerInfo.char}`);
            console.log(`📊 Lobby state:`, {
                id: lobbyState.id,
                hostId: lobbyState.hostId,
                playerCount: lobbyState.players.length,
                maxPlayers: lobbyState.settings.maxPlayers,
                status: lobbyState.status,
                isPrivate: lobbyState.settings.isPrivate
            });
            
            if (callback) {
                callback({ 
                    success: true, 
                    lobby: lobbyState 
                });
            }

            // Broadcast lobby list update to all clients in lobby list
            const updatedLobbies = lobbyManager.getPublicLobbies();
            console.log(`📢 Broadcasting lobby list update to lobby-list room: ${updatedLobbies.length} lobbies`);
            console.log(`📢 Broadcasting to ${io.sockets.adapter.rooms.get('lobby-list')?.size || 0} clients in lobby-list room`);
            console.log('📋 Updated lobbies being broadcast:', updatedLobbies.map(l => ({ 
                id: l.id, 
                host: l.hostName, 
                status: l.status, 
                players: `${l.playerCount}/${l.maxPlayers}`,
                isPrivate: l.isPrivate
            })));
            io.to('lobby-list').emit('lobbyListUpdate', updatedLobbies);

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
            console.log(`🚪 Join lobby request from ${socket.id}:`, data);
            const { lobbyId, playerInfo, password } = data;
            
            // Validate input data
            if (!lobbyId) {
                console.log(`❌ No lobby ID provided by ${socket.id}`);
                throw new Error('Lobby ID is required');
            }
            
            if (!playerInfo || (!playerInfo.name && !playerInfo.char)) {
                console.log(`❌ Invalid player info from ${socket.id}:`, playerInfo);
                throw new Error('Player information is required');
            }
            
            // Check if player is already in a lobby
            if (currentLobbyId && currentLobbyId !== lobbyId) {
                console.log(`❌ Player ${socket.id} already in lobby ${currentLobbyId}, trying to join ${lobbyId}`);
                throw new Error('You are already in another lobby');
            }
            
            console.log(`👤 Player ${playerInfo.name || playerInfo.char} (${socket.id}) attempting to join lobby ${lobbyId}`);
            const playerData = lobbyManager.joinLobby(lobbyId, socket.id, playerInfo, password);
            currentLobbyId = lobbyId;
            
            // Join the socket room for this lobby
            socket.join(`lobby:${lobbyId}`);
            console.log(`🔗 Player ${socket.id} joined lobby room: lobby:${lobbyId}`);
            
            const lobby = lobbyManager.getLobby(lobbyId);
            const lobbyState = lobby.getLobbyState();
            
            console.log(`✅ Player ${playerInfo.name || playerInfo.char} successfully joined lobby ${lobbyId}`);
            console.log(`📊 Updated lobby state:`, {
                id: lobbyState.id,
                playerCount: lobbyState.players.length,
                maxPlayers: lobbyState.settings.maxPlayers,
                status: lobbyState.status
            });
            
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
            const updatedLobbies = lobbyManager.getPublicLobbies();
            console.log(`📢 Broadcasting lobby list update after join: ${updatedLobbies.length} lobbies`);
            io.to('lobby-list').emit('lobbyListUpdate', updatedLobbies);

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
                console.log(`📤 Player ${socket.id} tried to leave but not in any lobby`);
                if (callback) {
                    callback({ success: true });
                }
                return;
            }

            console.log(`📤 Player ${socket.id} leaving lobby ${currentLobbyId}`);
            const result = lobbyManager.leaveLobby(currentLobbyId, socket.id);
            
            if (result) {
                // Leave the socket room
                socket.leave(`lobby:${currentLobbyId}`);
                
                console.log(`📤 Player ${socket.id} left lobby ${currentLobbyId}`);

                // If lobby was deleted by host, notify all players
                if (result.lobbyDeleted && result.allPlayerIds) {
                    console.log(`🗑️ Lobby ${currentLobbyId} was deleted by host - notifying all players`);
                    
                    // Notify all players in the lobby that it was deleted
                    result.allPlayerIds.forEach(playerId => {
                        const playerSocket = io.sockets.sockets.get(playerId);
                        if (playerSocket) {
                            playerSocket.emit('lobbyDeleted', {
                                reason: 'Host left the lobby',
                                lobbyId: currentLobbyId
                            });
                            console.log(`📤 Notified player ${playerId} about lobby deletion`);
                        }
                    });
                }
                // If lobby still exists, notify remaining players
                else if (!result.isEmpty && result.lobby) {
                    const lobbyState = result.lobby.getLobbyState();
                    socket.to(`lobby:${currentLobbyId}`).emit('playerLeft', {
                        playerId: socket.id,
                        newHostId: result.newHostId,
                        lobbyState: lobbyState
                    });
                    console.log(`📤 Notified remaining players in lobby ${currentLobbyId} about player leaving`);
                }

                currentLobbyId = null;

                // Update lobby list
                const updatedLobbies = lobbyManager.getPublicLobbies();
                console.log(`📢 Broadcasting lobby list update after leave: ${updatedLobbies.length} lobbies`);
                io.to('lobby-list').emit('lobbyListUpdate', updatedLobbies);
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
            const updatedLobbies = lobbyManager.getPublicLobbies();
            console.log(`📢 Broadcasting lobby list update after settings change: ${updatedLobbies.length} lobbies`);
            io.to('lobby-list').emit('lobbyListUpdate', updatedLobbies);

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
            const updatedLobbies = lobbyManager.getPublicLobbies();
            console.log(`📢 Broadcasting lobby list update after game start: ${updatedLobbies.length} lobbies`);
            io.to('lobby-list').emit('lobbyListUpdate', updatedLobbies);

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

            console.log(`📋 Lobby list requested by ${socket.id}, returning ${lobbies.length} lobbies`);
            console.log(`📋 Client ${socket.id} joined lobby-list room (${io.sockets.adapter.rooms.get('lobby-list')?.size || 0} total clients)`);
            console.log('📋 Available lobbies:', lobbies.map(l => ({ 
                id: l.id, 
                host: l.hostName, 
                status: l.status, 
                players: `${l.playerCount}/${l.maxPlayers}`,
                isPrivate: l.isPrivate,
                map: l.map
            })));

            // Also log the creator mappings for debugging
            const mappings = lobbyManager.getAllCreatorMappings();
            console.log('📊 Current creator mappings:', Object.keys(mappings).length > 0 ? mappings : 'No mappings found');

            if (callback) {
                callback({ 
                    success: true, 
                    lobbies: lobbies 
                });
            }

        } catch (error) {
            console.error('❌ Error getting lobby list:', error.message);
            console.error('Error stack:', error.stack);
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
                console.log(`📤 Player ${socket.id} disconnected from lobby ${currentLobbyId}`);
                const result = lobbyManager.leaveLobby(currentLobbyId, socket.id);
                
                if (result) {
                    // If lobby was deleted by host disconnect, notify all players
                    if (result.lobbyDeleted && result.allPlayerIds) {
                        console.log(`🗑️ Lobby ${currentLobbyId} was deleted due to host disconnect - notifying all players`);
                        
                        // Notify all players in the lobby that it was deleted
                        result.allPlayerIds.forEach(playerId => {
                            const playerSocket = io.sockets.sockets.get(playerId);
                            if (playerSocket) {
                                playerSocket.emit('lobbyDeleted', {
                                    reason: 'Host disconnected',
                                    lobbyId: currentLobbyId
                                });
                                console.log(`📤 Notified player ${playerId} about lobby deletion due to disconnect`);
                            }
                        });
                    }
                    // If lobby still exists, notify remaining players
                    else if (!result.isEmpty && result.lobby) {
                        const lobbyState = result.lobby.getLobbyState();
                        socket.to(`lobby:${currentLobbyId}`).emit('playerLeft', {
                            playerId: socket.id,
                            newHostId: result.newHostId,
                            lobbyState: lobbyState
                        });
                        console.log(`📤 Notified remaining players in lobby ${currentLobbyId} about player disconnect`);
                    }

                    // Update lobby list
                    const updatedLobbies = lobbyManager.getPublicLobbies();
                    console.log(`📢 Broadcasting lobby list update after disconnect: ${updatedLobbies.length} lobbies`);
                    io.to('lobby-list').emit('lobbyListUpdate', updatedLobbies);
                }

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

    // Get lobby by creator username
    socket.on('getLobbyByCreator', (username, callback) => {
        try {
            const lobby = lobbyManager.getLobbyByCreator(username);
            if (callback) {
                callback({ 
                    success: true, 
                    lobby: lobby ? lobby.getLobbyState() : null 
                });
            }
        } catch (error) {
            console.error('❌ Error getting lobby by creator:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Get all creator mappings (for debugging)
    socket.on('getAllCreatorMappings', (callback) => {
        try {
            const mappings = lobbyManager.getAllCreatorMappings();
            if (callback) {
                callback({ 
                    success: true, 
                    mappings: mappings 
                });
            }
        } catch (error) {
            console.error('❌ Error getting creator mappings:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Force refresh lobby list for all clients
    socket.on('forceLobbyListRefresh', (callback) => {
        try {
            const updatedLobbies = lobbyManager.getPublicLobbies();
            console.log(`🔄 Force refreshing lobby list: ${updatedLobbies.length} lobbies`);
            
            // Broadcast to all clients in lobby-list room
            io.to('lobby-list').emit('lobbyListUpdate', updatedLobbies);
            
            if (callback) {
                callback({ 
                    success: true, 
                    lobbies: updatedLobbies 
                });
            }
        } catch (error) {
            console.error('❌ Error force refreshing lobby list:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Debug endpoint to check lobby manager state
    socket.on('debugLobbyManager', (callback) => {
        try {
            const stats = lobbyManager.getStats();
            const mappings = lobbyManager.getAllCreatorMappings();
            const allLobbies = Array.from(lobbyManager.lobbies.values()).map(l => ({
                id: l.id,
                hostName: l.hostInfo.name || l.hostInfo.char,
                status: l.status,
                playerCount: l.players.size,
                maxPlayers: l.settings.maxPlayers,
                isPrivate: l.settings.isPrivate,
                createdAt: l.createdAt
            }));
            
            console.log('🔍 Debug lobby manager state:');
            console.log('📊 Stats:', stats);
            console.log('🗺️ Mappings:', mappings);
            console.log('🏠 All lobbies:', allLobbies);
            
            if (callback) {
                callback({ 
                    success: true, 
                    stats: stats,
                    mappings: mappings,
                    allLobbies: allLobbies
                });
            }
        } catch (error) {
            console.error('❌ Error debugging lobby manager:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Get lobby info for URL-based joining
    socket.on('getLobbyForUrlJoin', (lobbyId, callback) => {
        try {
            const lobbyInfo = lobbyManager.getLobbyForUrlJoin(lobbyId);
            
            if (lobbyInfo) {
                console.log(`🔗 Lobby info requested for URL join: ${lobbyId}`);
                if (callback) {
                    callback({ 
                        success: true, 
                        lobbyInfo: lobbyInfo 
                    });
                }
            } else {
                console.log(`❌ Lobby not found for URL join: ${lobbyId}`);
                if (callback) {
                    callback({ 
                        success: false, 
                        error: 'Lobby not found' 
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error getting lobby for URL join:', error.message);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    // Generate shareable lobby URL
    socket.on('generateLobbyUrl', (lobbyId, callback) => {
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

            // Get the client's IP or use a default
            const clientIP = socket.handshake.address;
            const baseUrl = `http://${clientIP.split(':')[0]}:3000`; // Assuming client runs on port 3000
            const shareableUrl = lobbyManager.generateLobbyUrl(lobbyId, baseUrl);
            
            console.log(`🔗 Generated shareable URL for lobby ${lobbyId}: ${shareableUrl}`);
            
            if (callback) {
                callback({ 
                    success: true, 
                    url: shareableUrl,
                    lobbyId: lobbyId
                });
            }
        } catch (error) {
            console.error('❌ Error generating lobby URL:', error.message);
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
