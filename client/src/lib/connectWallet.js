// connectWallet.js
import { ethers } from "ethers";

async function connectWallet() {
  if (typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) throw new Error("No accounts found");
    const connectedAccount = accounts[0];

    const polygonTestnetChainId = "0x13882"; // Mumbai testnet
    const network = await provider.getNetwork();
    if (network.chainId !== 80001) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonTestnetChainId }],
      });
    }

    return connectedAccount; // ✅ return only the string
  } else {
    throw new Error("MetaMask not detected");
  }
}

export default connectWallet;
