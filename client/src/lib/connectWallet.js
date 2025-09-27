// connectWallet.js
import { ethers } from "ethers";

async function connectWallet() {
  if (typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) throw new Error("No accounts found");
    const connectedAccount = accounts[0];

    const polygonChainId = "0x89"; // Polygon Mainnet
    const network = await provider.getNetwork();
    if (network.chainId !== 137) { // 137 is Polygon Mainnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: polygonChainId }],
        });
      } catch (switchError) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: polygonChainId,
              chainName: "Polygon Mainnet",
              rpcUrls: ["https://polygon-rpc.com/"],
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              blockExplorerUrls: ["https://polygonscan.com/"],
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
