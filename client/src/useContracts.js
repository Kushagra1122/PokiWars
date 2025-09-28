import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "./contracts";

export default function useContracts() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return console.warn("No wallet found");

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) throw new Error("No account connected");

        const ethProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        setProvider(ethProvider);

        const signerObj = ethProvider.getSigner();
        setSigner(signerObj);

        setAccount(accounts[0]); // ✅ always raw address

        // ✅ signer-bound contracts
        setContracts({
          marketplace: new ethers.Contract(
            CONTRACTS.pokiMarketplace.address,
            CONTRACTS.pokiMarketplace.abi,
            signerObj
          ),
          nft: new ethers.Contract(CONTRACTS.pokiNFT.address, CONTRACTS.pokiNFT.abi, signerObj),
          token: new ethers.Contract(CONTRACTS.pokiToken.address, CONTRACTS.pokiToken.abi, signerObj),
        });
      } catch (err) {
        console.error("Wallet init failed:", err);
      }
    };

    init();

    window.ethereum?.on("accountsChanged", (accounts) => setAccount(accounts[0] || null));
    window.ethereum?.on("chainChanged", () => window.location.reload());
  }, []);

  return { provider, signer, account, ...contracts };
}
