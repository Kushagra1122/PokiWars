# PokiWars Networking Guide

## Problem: Can't Find Lobbies on Same Network

If you and your friend are on the same network but can't see each other's lobbies, follow this guide to fix the networking issues.

## Quick Fix

1. **Find the Server Machine's IP Address**
   - On the machine running the game server, open Command Prompt (Windows) or Terminal (Mac/Linux)
   - Run: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Look for your local IP address (usually starts with 192.168.x.x or 10.0.x.x)

2. **Configure the Client**
   - Open the game in your browser
   - Go to "Join Lobby"
   - Click "Server Config" button
   - Enter the server's IP address: `http://[SERVER_IP]:3001`
   - Click "Connect"

## Detailed Steps

### Step 1: Start the Server
1. On the machine that will host the game:
   ```bash
   cd server
   npm start
   ```
2. Note the IP address shown in the console (e.g., "Server running on port 3001")

### Step 2: Find the Server's IP Address
- **Windows**: Run `ipconfig` and look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` and look for "inet" address
- **Common IP ranges**: 192.168.1.x, 192.168.0.x, 10.0.0.x

### Step 3: Configure Clients
1. Open the game in browser on other devices
2. Go to "Join Lobby" page
3. Click "Server Config" button
4. Enter: `http://[SERVER_IP]:3001` (replace [SERVER_IP] with actual IP)
5. Click "Connect"
6. You should now see the server's lobbies

## Troubleshooting

### Auto Discovery
- Click "Auto Discover" in Server Config to automatically find servers
- This scans common IP ranges for running game servers

### Common Issues

1. **Firewall Blocking**
   - Make sure port 3001 is open on the server machine
   - Windows: Add exception for Node.js in Windows Firewall
   - Mac: Allow incoming connections in System Preferences

2. **Wrong IP Address**
   - Make sure you're using the correct IP address
   - Try both IPv4 and localhost if on same machine

3. **Server Not Running**
   - Ensure the server is actually running on port 3001
   - Check console for any error messages

4. **Network Issues**
   - Make sure both devices are on the same network
   - Try disabling VPN if active
   - Check if your router blocks local connections

### Testing Connection
1. Open browser on client machine
2. Go to: `http://[SERVER_IP]:3001/health`
3. Should see: `{"status":"OK","timestamp":"..."}`

## Advanced Configuration

### Custom Server URL
You can manually set the server URL in the code:
```javascript
// In client/src/network/SocketManager.js
socketManager.setCustomServerUrl("http://192.168.1.100:3001");
```

### Network Discovery
The app now includes automatic network discovery that scans for game servers on common IP ranges.

## Still Having Issues?

1. Check the browser console for connection errors
2. Verify the server is running and accessible
3. Try using the "Auto Discover" feature
4. Make sure both devices are on the same local network
5. Check firewall settings on both machines

## Example IP Addresses

- **Home Router (192.168.1.x)**: `http://192.168.1.100:3001`
- **Home Router (192.168.0.x)**: `http://192.168.0.100:3001`
- **Corporate Network (10.0.0.x)**: `http://10.0.0.100:3001`
- **Same Machine**: `http://localhost:3001` or `http://127.0.0.1:3001`
