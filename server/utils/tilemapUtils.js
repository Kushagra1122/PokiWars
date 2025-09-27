const fs = require('fs');
const path = require('path');

// Load the tilemap JSON data
let mapData = null;
let tileWidth = 32;
let tileHeight = 32;
let mapWidth = 0;
let mapHeight = 0;
let collisionLayers = [];

function loadTilemapData() {
    if (mapData) return mapData;
    
    try {
        const mapPath = path.join(__dirname, '../../client/src/assets/maps/snowMap.json');
        const rawData = fs.readFileSync(mapPath, 'utf8');
        mapData = JSON.parse(rawData);
        
        tileWidth = mapData.tilewidth;
        tileHeight = mapData.tileheight;
        mapWidth = mapData.width;
        mapHeight = mapData.height;
        
        // Find layers with collision property
        collisionLayers = mapData.layers.filter(layer => {
            if (layer.type === 'tilelayer') {
                // Check if layer has collision property set to true
                const hasCollisionProp = layer.properties && 
                    layer.properties.some(prop => prop.name === 'collision' && prop.value === true);
                
                // Also check specific layer names that are known to have collision
                const isKnownCollisionLayer = ['Trees', 'Stones'].includes(layer.name);
                
                return hasCollisionProp || isKnownCollisionLayer;
            }
            return false;
        });
        
        console.log(`📋 Loaded tilemap: ${mapWidth}x${mapHeight} tiles, collision layers: ${collisionLayers.map(l => l.name).join(', ')}`);
        return mapData;
    } catch (error) {
        console.error('Error loading tilemap data:', error);
        return null;
    }
}

function worldToTileX(worldX, scaleX = 1) {
    return Math.floor((worldX / scaleX) / tileWidth);
}

function worldToTileY(worldY, scaleY = 1) {
    return Math.floor((worldY / scaleY) / tileHeight);
}

function hasTileAt(layer, tileX, tileY) {
    if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight) {
        return false;
    }
    
    const index = tileY * mapWidth + tileX;
    return layer.data && layer.data[index] && layer.data[index] !== 0;
}

function isValidSpawnPosition(worldX, worldY, screenWidth, screenHeight, minDistance = 32) {
    if (!mapData) {
        loadTilemapData();
    }
    
    if (!mapData) {
        console.warn('⚠️  No tilemap data loaded, allowing spawn at any position');
        return true;
    }
    
    // Calculate scale factors EXACTLY like client-side
    const mapWidthInPixels = mapWidth * tileWidth;
    const mapHeightInPixels = mapHeight * tileHeight;
    // screenWidth/Height already have the 190 subtracted by the client
    const scaleX = screenWidth / mapWidthInPixels;
    const scaleY = screenHeight / mapHeightInPixels;

    // Convert world coordinates to unscaled coordinates, then to tile coordinates
    const unscaledX = worldX / scaleX;
    const unscaledY = worldY / scaleY;
    const tileX = worldToTileX(unscaledX, 1);
    const tileY = worldToTileY(unscaledY, 1);
    
    console.log(`🔍 Server checking: world (${worldX}, ${worldY}) -> unscaled (${unscaledX.toFixed(1)}, ${unscaledY.toFixed(1)}) -> tile (${tileX}, ${tileY})`);
    console.log(`📏 Server scale: (${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}), screen: ${screenWidth}x${screenHeight}`);
    console.log(`🗺️  Map: ${mapWidth}x${mapHeight} tiles, ${mapWidthInPixels}x${mapHeightInPixels}px`);
    
    // Radius in tile units - ensure minimum of 1 tile
    const radiusInTiles = Math.max(1, Math.ceil(minDistance / Math.min(tileWidth, tileHeight)));

    // Check surrounding tiles within radius
    for (const layer of collisionLayers) {
        for (let offsetY = -radiusInTiles; offsetY <= radiusInTiles; offsetY++) {
            for (let offsetX = -radiusInTiles; offsetX <= radiusInTiles; offsetX++) {
                const checkX = tileX + offsetX;
                const checkY = tileY + offsetY;

                // Check bounds
                if (checkX < 0 || checkX >= mapWidth || checkY < 0 || checkY >= mapHeight) {
                    continue;
                }

                if (hasTileAt(layer, checkX, checkY)) {
                    // Convert this tile back to world center for precise distance check
                    const tileWorldX = (checkX + 0.5) * tileWidth * scaleX;
                    const tileWorldY = (checkY + 0.5) * tileHeight * scaleY;

                    const dist = Math.sqrt(
                        Math.pow(worldX - tileWorldX, 2) +
                        Math.pow(worldY - tileWorldY, 2)
                    );

                    if (dist < minDistance) {
                        console.log(`🚫 Server: Too close to ${layer.name} at tile (${checkX}, ${checkY}) distance=${dist.toFixed(1)} < ${minDistance}`);
                        return false;
                    }
                }
            }
        }
    }
    
    console.log(`✅ Server: Valid spawn position at tile (${tileX}, ${tileY}) world (${worldX}, ${worldY})`);
    return true;
}


function getTilemapBounds(screenWidth, screenHeight) {
    if (!mapData) {
        loadTilemapData();
    }
    
    if (!mapData) {
        return { width: screenWidth, height: screenHeight };
    }
    
    return {
        width: mapWidth * tileWidth,
        height: mapHeight * tileHeight
    };
}

module.exports = {
    loadTilemapData,
    isValidSpawnPosition,
    getTilemapBounds,
    worldToTileX,
    worldToTileY,
    hasTileAt
};