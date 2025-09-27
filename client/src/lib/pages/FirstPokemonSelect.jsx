import { useEffect, useState } from "react";
import { ethers } from "ethers";
import minimalNFTABI from '../../consts/nftabi.json';
import minimalTokenABI from '../../consts/tokenabi.json';
import PokemonCard from "@/components/PokimonCard";

const POKI_NFT_ADDRESS = "0x41b3df1beb4b8a4e07c266bc894bba7a0a1878fb";
const POKI_TOKEN_ADDRESS = "0x5b2df7670561258b41339d464fa277396102802a";

const AMOY_CONFIG = {
  chainId: '0x13882',
  chainName: 'Polygon Amoy Testnet',
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
};

const pokemonList = [
  {
    id: 1,
    name: "Blastoise",
    type: "Water",
    attack: 84,
    range: 2,
    exp: 0,
    level: 1,
    img: "https://rcnriqjoemehwjjrmcwt.supabase.co/storage/v1/object/public/poki/images/BLASTOISE%20(1).png",
    metadataURI: "https://rcnriqjoemehwjjrmcwt.supabase.co/storage/v1/object/public/poki/images/BLASTOISE%20(1).png",
    xp: 0,
    health: 79,
    defense: 100,
    speed: 78,
    radius: 15,
    specialTrait: 1,
  },
  {
    id: 2,
    name: "Gengar",
    type: "Ghost",
    attack: 65,
    range: 3,
    exp: 0,
    level: 1,
    img: "https://rcnriqjoemehwjjrmcwt.supabase.co/storage/v1/object/public/poki/images/GENGAR%20(1).png",
    metadataURI: "https://rcnriqjoemehwjjrmcwt.supabase.co/storage/v1/object/public/poki/images/GENGAR%20(1).png",
    xp: 0,
    health: 60,
    defense: 60,
    speed: 110,
    radius: 14,
    specialTrait: 2,
  },
  {
    id: 3,
    name: "Alakazam",
    type: "Psychic",
    attack: 50,
    range: 3,
    exp: 0,
    level: 1,
    img: "https://rcnriqjoemehwjjrmcwt.supabase.co/storage/v1/object/public/poki/images/ALAKAZAM%20(1).png",
    metadataURI: "https://rcnriqjoemehwjjrmcwt.supabase.co/storage/v1/object/public/poki/images/ALAKAZAM%20(1).png",
    xp: 0,
    health: 55,
    defense: 45,
    speed: 120,
    radius: 13,
    specialTrait: 3,
  },
];

export default function StarterAnimation() {
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [polBalance, setPolBalance] = useState("0");
  const [pokiTokenBalance, setPokiTokenBalance] = useState("0");
  const [mintCost, setMintCost] = useState("0");
  const [allowance, setAllowance] = useState("0");

  useEffect(() => {
    async function checkWallet() {
      if (window.ethereum && window.ethereum.isMetaMask) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            await checkNetwork();
            await getPolBalance(accounts[0]);
            await loadContractData(accounts[0]);
          }
        } catch (err) {
          console.error("Error checking wallet:", err);
        }
      } else {
        alert("Please install MetaMask!");
      }
    }
    checkWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          await checkNetwork();
          await getPolBalance(accounts[0]);
          await loadContractData(accounts[0]);
        } else {
          setUserAddress("");
          setPolBalance("0");
          setPokiTokenBalance("0");
          setAllowance("0");
          setMintCost("0");
          setIsCorrectNetwork(false);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  async function checkNetwork() {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isAmoy = chainId === AMOY_CONFIG.chainId;
      setIsCorrectNetwork(isAmoy);
      return isAmoy;
    } catch (error) {
      console.error('Error checking network:', error);
      setIsCorrectNetwork(false);
      return false;
    }
  }

  async function getPolBalance(address) {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      setPolBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error getting POL balance:', error);
    }
  }

  async function loadContractData(address) {
    if (!address) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);
      const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, provider);

      // Get mint cost
      const cost = await nftContract.mintCost();
      setMintCost(ethers.utils.formatUnits(cost, 18));

      // Get token balance and decimals
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      setPokiTokenBalance(ethers.utils.formatUnits(balance, decimals));

      // Get token allowance
      const currentAllowance = await tokenContract.allowance(address, POKI_NFT_ADDRESS);
      setAllowance(ethers.utils.formatUnits(currentAllowance, decimals));
    } catch (error) {
      console.error("Error loading contract data:", error);
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed!");
      return;
    }
    setLoading(true);
    setStatus("Connecting wallet...");
    try {
      const isCorrectNet = await checkNetwork();
      if (!isCorrectNet) {
        setStatus("Switching to Polygon Amoy...");
        const switched = await switchToPolygonAmoy();
        if (!switched) {
          setLoading(false);
          return;
        }
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        await getPolBalance(accounts[0]);
        await loadContractData(accounts[0]);
        setStatus("✅ Wallet connected on Polygon Amoy");
      }
    } catch (err) {
      console.error("User rejected connection", err);
      setStatus("❌ Connection rejected");
    }
    setLoading(false);
  };

  const switchToPolygonAmoy = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_CONFIG.chainId }],
      });
      setStatus("✅ Switched to Polygon Amoy");
      setIsCorrectNetwork(true);
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AMOY_CONFIG],
          });
          setStatus("✅ Added and switched to Polygon Amoy");
          setIsCorrectNetwork(true);
          return true;
        } catch (addError) {
          setStatus("❌ Failed to add Polygon Amoy network");
          return false;
        }
      } else {
        setStatus("❌ Failed to switch network");
        return false;
      }
    }
  };

  const approveTokens = async () => {
    if (!userAddress) {
      alert("Please connect wallet first");
      return;
    }
    if (!isCorrectNetwork) {
      setStatus("❌ Please switch to Polygon Amoy first");
      return;
    }
    if (parseFloat(polBalance) < 0.01) {
      setStatus("❌ Insufficient MATIC for gas fees");
      return;
    }
    setLoading(true);
    setStatus("Approving tokens...");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, signer);

      const mintCostWei = ethers.utils.parseUnits(mintCost, 18);

      const currentAllowance = await tokenContract.allowance(userAddress, POKI_NFT_ADDRESS);
      if (currentAllowance.gte(mintCostWei)) {
        setStatus("✅ Allowance already sufficient");
        setLoading(false);
        return;
      }

      const tx = await tokenContract.approve(POKI_NFT_ADDRESS, mintCostWei, { gasLimit: 150000 });
      setStatus("⏳ Approval pending...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setStatus("✅ Tokens approved! Ready to mint.");
        const newAllowance = await tokenContract.allowance(userAddress, POKI_NFT_ADDRESS);
        const decimals = await tokenContract.decimals();
        setAllowance(ethers.utils.formatUnits(newAllowance, decimals));
      } else {
        setStatus("❌ Approval transaction failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      if (error.code === 4001) {
        setStatus("❌ Approval cancelled by user");
      } else if (error.message?.includes("insufficient funds")) {
        setStatus("❌ Insufficient MATIC for gas fees");
      } else {
        setStatus(`❌ Approval failed: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const handleSelect = async (pokemon) => {
    if (!userAddress) {
      alert("Please connect wallet first");
      return;
    }
    if (!isCorrectNetwork) {
      setStatus("❌ Please switch to Polygon Amoy Testnet");
      return;
    }
    if (parseFloat(polBalance) < 0.01) {
      setStatus("❌ Insufficient MATIC for gas fees");
      return;
    }
    const mintCostWei = ethers.utils.parseUnits(mintCost, 18);
    const allowanceWei = ethers.utils.parseUnits(allowance, 18);

    if (allowanceWei.lt(mintCostWei)) {
      setStatus("❌ Insufficient token allowance. Please approve tokens first.");
      return;
    }
    setLoading(true);
    setStatus(`Minting ${pokemon.name}...`);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, signer);

      // Estimate gas and add buffer
      setStatus("Estimating gas...");
      const gasEstimate = await nftContract.estimateGas.mintNFT(
        userAddress,
        pokemon.metadataURI,
        pokemon.level,
        pokemon.xp,
        pokemon.health,
        pokemon.attack,
        pokemon.defense,
        pokemon.speed,
        pokemon.radius,
        pokemon.specialTrait
      );
      const gasLimit = gasEstimate.mul(120).div(100);

      setStatus("Sending mint transaction...");
      const tx = await nftContract.mintNFT(
        userAddress,
        pokemon.metadataURI,
        pokemon.level,
        pokemon.xp,
        pokemon.health,
        pokemon.attack,
        pokemon.defense,
        pokemon.speed,
        pokemon.radius,
        pokemon.specialTrait,
        { gasLimit }
      );

      setStatus("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setStatus(`🎉 ${pokemon.name} minted successfully!`);
        // Optionally reload contract data to update balances/allowances
        await loadContractData(userAddress);
      } else {
        setStatus("❌ Mint transaction failed.");
      }
    } catch (error) {
      console.error("Mint failed:", error);
      if (error.code === 4001) {
        setStatus("❌ Mint cancelled by user");
      } else if (error.message?.includes("insufficient funds")) {
        setStatus("❌ Insufficient MATIC for gas fees");
      } else if (error.message?.includes("revert")) {
        setStatus("❌ Transaction reverted. Check if you have enough tokens.");
      } else if (error.message?.includes("allowance")) {
        setStatus("❌ Insufficient token allowance. Please approve first.");
      } else {
        setStatus(`❌ Mint failed: ${error.reason || error.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-black min-h-screen w-full flex flex-col justify-center items-center font-pixelify text-white p-4">
      {!userAddress ? (
        <button
          className="mb-6 bg-green-600 px-6 py-3 rounded font-bold hover:bg-green-700 transition-colors"
          onClick={connectWallet}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <div className="mb-6 text-center space-y-2">
          <div className="font-bold">
            Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </div>
          <div className="text-sm text-green-400">
            PKT Balance: {pokiTokenBalance} | Allowance: {allowance} | MATIC: {polBalance}
          </div>
          <div className="text-sm">
            Mint Cost: {mintCost} PKT | Network: {isCorrectNetwork ? "Polygon Amoy ✅" : "Wrong Network ⚠️"}
          </div>
          {!isCorrectNetwork && (
            <button
              onClick={switchToPolygonAmoy}
              className="bg-yellow-600 px-4 py-2 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Switch to Polygon Amoy
            </button>
          )}
        </div>
      )}

      {/* Network warning */}
      {!isCorrectNetwork && userAddress && (
        <div className="bg-yellow-600 p-3 rounded-lg mb-4 text-center">
          <strong>⚠️ Wrong Network:</strong> Please switch to Polygon Amoy Testnet
        </div>
      )}

      {/* MATIC Balance warning */}
      {userAddress && parseFloat(polBalance) < 0.01 && (
        <div className="bg-red-600 p-3 rounded-lg mb-4 text-center">
          <strong>⚠️ Low MATIC Balance:</strong> You need MATIC for gas fees.
        </div>
      )}

      {/* Approve button */}
      {userAddress && parseFloat(allowance) < parseFloat(mintCost) && (
        <button
          onClick={approveTokens}
          disabled={loading || parseFloat(polBalance) < 0.01}
          className="mb-4 bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded disabled:bg-gray-600 transition-colors"
        >
          {loading ? "Approving..." : `Approve ${mintCost} PKT`}
        </button>
      )}

      <h2 className="text-4xl mt-2 mb-8 text-center">Choose your starter Pokémon!</h2>

      {/* Status message */}
      {status && (
        <div
          className={`mb-4 p-3 rounded text-center ${
            status.includes("✅") || status.includes("🎉")
              ? "bg-green-800"
              : status.includes("❌")
              ? "bg-red-800"
              : "bg-blue-800"
          }`}
        >
          {status}
        </div>
      )}

      <div className="flex flex-wrap justify-center items-center gap-8 max-w-6xl">
        {pokemonList.map((pokemon, index) => (
          <PokemonCard
            key={index}
            imageSrc={pokemon.img}
            name={pokemon.name}
            type={pokemon.type}
            attack={pokemon.attack}
            range={pokemon.range}
            exp={pokemon.exp}
            level={pokemon.level}
            onClick={() => handleSelect(pokemon)}
            disabled={loading || !userAddress || parseFloat(allowance) < parseFloat(mintCost) || parseFloat(polBalance) < 0.01}
          />
        ))}
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p>Processing transaction...</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 text-center text-sm text-gray-400 max-w-2xl">
        <p>Make sure you're on Polygon Amoy Testnet and have test MATIC for gas fees.</p>
        <p>You'll need PKT tokens and approval before minting Pokémon NFTs.</p>
      </div>
    </div>
  );
}
