import { ethers } from "ethers";

async function connectWallet() {
  if (typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask) {
    try {
      // Create provider using ethers v5 syntax
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Request user accounts access
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const polygonTestnetChainId = "0x13882"; // 80001 in hex for Mumbai testnet

      const network = await provider.getNetwork();
      if (!network || typeof network.chainId === "undefined") {
        throw new Error("Unable to fetch network chainId");
      }

      if (network.chainId !== 80001) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: polygonTestnetChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: polygonTestnetChainId,
                    chainName: "Amoy",
                    rpcUrls: ["https://rpc-amoy.polygon.technology"],
                    nativeCurrency: {
                      name: "MATIC",
                      symbol: "MATIC",
                      decimals: 18,
                    },
                    blockExplorerUrls: ["https://www.oklink.com/"],
                  },
                ],
              });
            } catch (addError) {
              console.error("Failed to add Polygon testnet:", addError);
              throw addError;
            }
          } else {
            console.error("Failed to switch network:", switchError);
            throw switchError;
          }
        }
      }

      const connectedAccount = accounts[0];
      console.log("Connected account:", connectedAccount);
      return { provider, connectedAccount };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  } else {
    const errMsg = "MetaMask not detected. Please install MetaMask.";
    console.error(errMsg);
    throw new Error(errMsg);
  }
}

export default connectWallet;
