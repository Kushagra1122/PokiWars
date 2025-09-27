// connectWallet.js
import { ethers } from "ethers";

async function connectWallet() {
  if (typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) throw new Error("No accounts found");
    const connectedAccount = accounts[0];

    const polygonAmoyChainId = "0x13882"; // Polygon Amoy testnet
    const network = await provider.getNetwork();
    if (network.chainId !== 80002) { // 80002 is Polygon Amoy
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: polygonAmoyChainId }],
        });
      } catch (switchError) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: polygonAmoyChainId,
              chainName: "Polygon Amoy Testnet",
              rpcUrls: ["https://rpc-amoy.polygon.technology"],
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              blockExplorerUrls: ["https://amoy.polygonscan.com/"],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }

    return connectedAccount; // ✅ return only the string
  } else {
    throw new Error("MetaMask not detected");
  }
}

// Manual connection function that updates UserContext
export const connectWalletManually = async (updateWalletAddress, updateUsername) => {
  try {
    const account = await connectWallet();
    updateWalletAddress(account);
    
    // You can add username logic here if needed
    // For now, we'll just set a default or fetch from Supabase
    return { success: true, account };
  } catch (error) {
    console.error("Manual wallet connection failed:", error);
    return { success: false, error: error.message };
  }
};

export default connectWallet;
