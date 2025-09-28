// Network discovery utilities for finding the game server
import { io } from "socket.io-client";

// Common local network IP ranges to scan
const COMMON_IP_RANGES = [
  "192.168.1",    // Most home routers
  "192.168.0",    // Alternative home router range
  "192.168.2",    // Some routers use this
  "10.0.0",       // Some corporate networks
  "172.16.0",     // Some corporate networks
  "172.18.128"    // Your current range
];

const SERVER_PORT = 3001;
const CONNECTION_TIMEOUT = 3000; // 3 seconds per attempt

/**
 * Test connection to a specific IP address
 */
async function testConnection(ip) {
  return new Promise((resolve) => {
    const socket = io(`http://${ip}:${SERVER_PORT}`, {
      transports: ["websocket", "polling"],
      timeout: CONNECTION_TIMEOUT,
      forceNew: true,
      autoConnect: true,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      resolve({ ip, success: false, error: "Connection timeout" });
    }, CONNECTION_TIMEOUT);

    socket.on("connect", () => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve({ ip, success: true });
    });

    socket.on("connect_error", (error) => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve({ ip, success: false, error: error.message });
    });
  });
}

/**
 * Scan a specific IP range for the game server
 */
async function scanIpRange(baseIp) {
  console.log(`🔍 Scanning IP range: ${baseIp}.x`);
  const promises = [];
  
  // Scan IPs 1-254 in the range
  for (let i = 1; i <= 254; i++) {
    const ip = `${baseIp}.${i}`;
    promises.push(testConnection(ip));
  }
  
  const results = await Promise.all(promises);
  return results.filter(result => result.success);
}

/**
 * Discover available game servers on the local network
 */
export async function discoverGameServers() {
  console.log("🔍 Starting network discovery for game servers...");
  const allResults = [];
  
  // Test localhost first
  console.log("🔄 Testing localhost...");
  const localhostResult = await testConnection("localhost");
  if (localhostResult.success) {
    allResults.push(localhostResult);
  }
  
  // Test 127.0.0.1
  const localhostIpResult = await testConnection("127.0.0.1");
  if (localhostIpResult.success) {
    allResults.push(localhostIpResult);
  }
  
  // Scan common IP ranges
  for (const baseIp of COMMON_IP_RANGES) {
    const rangeResults = await scanIpRange(baseIp);
    allResults.push(...rangeResults);
  }
  
  console.log(`✅ Network discovery complete. Found ${allResults.length} server(s):`, allResults);
  return allResults;
}

/**
 * Get the best server URL from discovered servers
 */
export function getBestServerUrl(discoveredServers) {
  if (discoveredServers.length === 0) {
    return null;
  }
  
  // Prefer localhost for local development
  const localhost = discoveredServers.find(s => s.ip === "localhost" || s.ip === "127.0.0.1");
  if (localhost) {
    return `http://${localhost.ip}:${SERVER_PORT}`;
  }
  
  // Otherwise return the first discovered server
  return `http://${discoveredServers[0].ip}:${SERVER_PORT}`;
}

/**
 * Quick connection test to a specific URL
 */
export async function quickConnectionTest(url) {
  return new Promise((resolve) => {
    const socket = io(url, {
      transports: ["websocket", "polling"],
      timeout: 5000,
      forceNew: true,
      autoConnect: true,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      resolve(false);
    }, 5000);

    socket.on("connect", () => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });

    socket.on("connect_error", () => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve(false);
    });
  });
}
