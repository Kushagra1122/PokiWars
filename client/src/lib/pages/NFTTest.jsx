import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const POKI_NFT_ADDRESS = "0x41b3df1beb4b8a4e07c266bc894bba7a0a1878fb";
const POKI_TOKEN_ADDRESS = "0x5b2df7670561258b41339d464fa277396102802a";

// Updated ABI with proper function definitions
const minimalNFTABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_pokiTokenAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "xpToAdd",
        "type": "uint256"
      }
    ],
    "name": "increaseXP",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "instantLevelUp",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "level",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "xp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "health",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "attack",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "defense",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "speed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "radius",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "specialTrait",
        "type": "uint256"
      }
    ],
    "name": "mintNFT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newLevel",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newXP",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "level",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "xp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "health",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "attack",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "defense",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "speed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "radius",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "specialTrait",
            "type": "uint256"
          }
        ],
        "indexed": false,
        "internalType": "struct PokiNFT.NFTAttributes",
        "name": "newAttributes",
        "type": "tuple"
      }
    ],
    "name": "NFTLeveledUp",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "NFTMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "newThresholds",
        "type": "uint256[]"
      }
    ],
    "name": "setLevelThresholds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newCost",
        "type": "uint256"
      }
    ],
    "name": "setLevelUpCost",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newCost",
        "type": "uint256"
      }
    ],
    "name": "setMintCost",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "uri",
        "type": "string"
      }
    ],
    "name": "setTokenURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getAttributes",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "level",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "xp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "health",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "attack",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "defense",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "speed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "radius",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "specialTrait",
            "type": "uint256"
          }
        ],
        "internalType": "struct PokiNFT.NFTAttributes",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getCurrentLevel",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextTokenId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getXPForNextLevel",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "levelThresholds",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "levelUpCost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintCost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pokiToken",
    "outputs": [
      {
        "internalType": "contract IPokiToken",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const minimalTokenABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

const pokemonModel = {
  metadataURI: "https://rcnriqjoemehwjjrmcwt.supabase.co/storage/v1/object/public/poki/images/BLASTOISE%20(1).png",
  level: 1,
  xp: 0,
  health: 78,
  attack: 84,
  defense: 78,
  speed: 100,
  radius: 15,
  specialTrait: 1,
};

export default function NFTTestPage() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pokiTokenBalance, setPokiTokenBalance] = useState("0");
  const [mintCost, setMintCost] = useState("0");
  const [status, setStatus] = useState("Connect your wallet");
  const [allowance, setAllowance] = useState("0");

  // Connect wallet with better error handling
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    setLoading(true);
    setStatus("Connecting to wallet...");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Request account access
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      // Check network and switch if needed
      const network = await provider.getNetwork();
      if (network.chainId !== 80002) {
        setStatus("Switching to Polygon Amoy...");
        await switchToAmoy();
      }

      await loadContractData(provider, address);
      setStatus("✅ Connected to Polygon Amoy");

    } catch (error) {
      console.error("Connection failed:", error);
      setStatus(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  }

  // Switch to Polygon Amoy
  async function switchToAmoy() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13882',
            chainName: 'Polygon Amoy Testnet',
            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            },
            blockExplorerUrls: ['https://amoy.polygonscan.com/']
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Load contract data
  async function loadContractData(provider, address) {
    try {
      const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);
      const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, provider);

      // Get mint cost
      const cost = await nftContract.mintCost();
      setMintCost(ethers.utils.formatUnits(cost, 18));

      // Get token balance
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      setPokiTokenBalance(ethers.utils.formatUnits(balance, decimals));

      // Get current allowance
      const currentAllowance = await tokenContract.allowance(address, POKI_NFT_ADDRESS);
      setAllowance(ethers.utils.formatUnits(currentAllowance, decimals));

      // Load NFTs
      await fetchNFTs(provider, address);

    } catch (error) {
      console.error("Error loading contract data:", error);
      setStatus("❌ Error loading contract data");
    }
  }

  // Fetch NFTs with better error handling
  async function fetchNFTs(provider, address) {
    try {
      const contract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);
      const balance = await contract.balanceOf(address);

      const nfts = [];
      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          const tokenURI = await contract.tokenURI(tokenId);
          const attributes = await contract.getAttributes(tokenId);

          nfts.push({
            tokenId: tokenId.toNumber(),
            tokenURI,
            attributes: {
              level: attributes.level.toString(),
              xp: attributes.xp.toString(),
              health: attributes.health.toString(),
              attack: attributes.attack.toString(),
              defense: attributes.defense.toString(),
              speed: attributes.speed.toString(),
              radius: attributes.radius.toString(),
              specialTrait: attributes.specialTrait.toString(),
            }
          });
        } catch (nftError) {
          console.error(`Error loading NFT ${i}:`, nftError);
        }
      }
      setOwnedNFTs(nfts);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setOwnedNFTs([]);
    }
  }

  // Check allowance before minting
  async function checkAllowance() {
    if (!walletAddress) return false;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, provider);

      const currentAllowance = await tokenContract.allowance(walletAddress, POKI_NFT_ADDRESS);
      const costWei = ethers.utils.parseUnits(mintCost, 18);

      return currentAllowance.gte(costWei);
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  }

  // Approve tokens with better error handling
  async function approveTokens() {
    if (!walletAddress) {
      alert("Please connect wallet first");
      return;
    }

    setLoading(true);
    setStatus("Approving tokens...");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, signer);

      const costWei = ethers.utils.parseUnits(mintCost, 18);

      // Estimate gas with fallback
      let gasLimit;
      try {
        const gasEstimate = await tokenContract.estimateGas.approve(POKI_NFT_ADDRESS, costWei);
        gasLimit = gasEstimate.mul(120).div(100); // 20% buffer
      } catch (gasError) {
        console.warn("Gas estimation failed, using default:", gasError);
        gasLimit = ethers.BigNumber.from(100000); // Fallback gas limit
      }

      const tx = await tokenContract.approve(POKI_NFT_ADDRESS, costWei, {
        gasLimit: gasLimit.toString()
      });

      setStatus("⏳ Approval pending...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setStatus("✅ Tokens approved! Ready to mint.");
        // Update allowance
        const newAllowance = await tokenContract.allowance(walletAddress, POKI_NFT_ADDRESS);
        const decimals = await tokenContract.decimals();
        setAllowance(ethers.utils.formatUnits(newAllowance, decimals));
      } else {
        setStatus("❌ Approval transaction failed");
      }

    } catch (error) {
      console.error("Approval failed:", error);

      if (error.code === 4001 || error.message.includes("user rejected")) {
        setStatus("❌ Approval cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatus("❌ Insufficient MATIC for gas fees");
      } else {
        setStatus(`❌ Approval failed: ${error.message}`);
      }
    }
    setLoading(false);
  }
  async function debugContractState() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);

    try {
      // Check the token address stored in contract
      const tokenAddress = await nftContract.pokiToken();
      console.log("Contract's token address:", tokenAddress);
      console.log("Should be:", POKI_TOKEN_ADDRESS);
      console.log("Match:", tokenAddress.toLowerCase() === POKI_TOKEN_ADDRESS.toLowerCase());

      // Check mint cost
      const cost = await nftContract.mintCost();
      console.log("Mint cost:", ethers.utils.formatUnits(cost, 18));

    } catch (error) {
      console.error("Debug error:", error);
    }
  }
  // Add this temporary mint function
  async function testMintWithoutPayment() {
    if (!walletAddress) {
      alert("Please connect wallet first");
      return;
    }

    setLoading(true);
    setStatus("Testing mint without payment...");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Use a simple transaction to call the contract
      const tx = await signer.sendTransaction({
        to: POKI_NFT_ADDRESS,
        data: createMintCallData(),
        gasLimit: 300000
      });

      setStatus("⏳ Test mint pending...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setStatus("✅ Test mint successful! Payment logic needs fix.");
        await loadContractData(provider, walletAddress);
      } else {
        setStatus("❌ Test mint failed");
      }

    } catch (error) {
      console.error("Test mint error:", error);
      setStatus(`❌ Test mint failed: ${error.message}`);
    }
    setLoading(false);
  }

  // Helper function to create mint call data
  function createMintCallData() {
    const iface = new ethers.utils.Interface(minimalNFTABI);
    return iface.encodeFunctionData("mintNFT", [
      walletAddress,
      pokemonModel.metadataURI,
      pokemonModel.level,
      pokemonModel.xp,
      pokemonModel.health,
      pokemonModel.attack,
      pokemonModel.defense,
      pokemonModel.speed,
      pokemonModel.radius,
      pokemonModel.specialTrait
    ]);
  }
  // Mint NFT with comprehensive error handling
  async function mintNFT() {
    if (!walletAddress) {
      alert("Please connect wallet first");
      return;
    }

    setLoading(true);
    setStatus("Preparing mint transaction...");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);


      const signer = provider.getSigner();
      // const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, signer);

      // ✅ CORRECT - Use the full ABI
      const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, signer);
      const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, provider);
      const tokenAddress = await nftContract.pokiToken();
      console.log('Current token address in contract:', tokenAddress);
      // Check allowance first
      const hasAllowance = await checkAllowance();
      if (!hasAllowance) {
        setStatus("❌ Please approve tokens first");
        setLoading(false);
        return;
      }

      setStatus("⏳ Minting NFT...");

      // Use a more reasonable gas limit
      const gasOptions = { gasLimit: 500000 };

      const tx = await nftContract.mintNFT(
        walletAddress,                    // to
        pokemonModel.metadataURI,        // metadataURI
        pokemonModel.level,              // level
        pokemonModel.xp,                 // xp
        pokemonModel.health,             // health
        pokemonModel.attack,             // attack
        pokemonModel.defense,            // defense
        pokemonModel.speed,              // speed
        pokemonModel.radius,             // radius
        pokemonModel.specialTrait,       // specialTrait
        gasOptions
      );

      setStatus("⏳ Waiting for transaction confirmation...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setStatus("🎉 NFT minted successfully!");
        // Refresh data
        await loadContractData(provider, walletAddress);
      } else {
        setStatus("❌ Mint transaction failed");
      }

    } catch (error) {
      console.error("Mint failed:", error);

      if (error.code === 4001 || error.message.includes("user rejected")) {
        setStatus("❌ Mint cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatus("❌ Insufficient MATIC for gas fees");
      } else if (error.message.includes("allowance") || error.message.includes("transfer")) {
        setStatus("❌ Token transfer failed. Please approve tokens again.");
      } else {
        setStatus(`❌ Mint failed: ${error.message}`);
      }
    }
    setLoading(false);
  }

  // Reset MetaMask account
  async function resetMetaMask() {
    if (window.ethereum && window.ethereum.request) {
      try {
        setStatus("Resetting MetaMask...");
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        setStatus("MetaMask reset. Please reconnect.");
        setWalletAddress(null);
        setOwnedNFTs([]);
      } catch (error) {
        console.error("Reset failed:", error);
        setStatus("❌ Reset failed");
      }
    }
  }

  // Format address for display
  function formatAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Refresh data
  async function refreshData() {
    if (!walletAddress) return;

    setLoading(true);
    setStatus("Refreshing data...");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await loadContractData(provider, walletAddress);
      setStatus("✅ Data refreshed");
    } catch (error) {
      console.error("Refresh failed:", error);
      setStatus("❌ Refresh failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-white bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">PokiNFT Dashboard</h1>

        {/* Status Panel */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <strong>Status:</strong>
                <span className={status.includes("✅") ? "text-green-400" : status.includes("❌") ? "text-red-400" : "text-yellow-400"}>
                  {status}
                </span>
              </div>
              {walletAddress && (
                <div className="text-sm space-y-1">
                  <div className="text-green-400">
                    Balance: {pokiTokenBalance} PKT | Mint Cost: {mintCost} PKT
                  </div>
                  <div className="text-blue-400">
                    Allowance: {allowance} PKT | Network: Polygon Amoy
                  </div>
                  <div className="text-gray-400">
                    Connected: {formatAddress(walletAddress)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshData}
                disabled={loading || !walletAddress}
                className="bg-blue-600 px-3 py-1 rounded text-sm disabled:bg-gray-600"
              >
                Refresh
              </button>
              <button
                onClick={resetMetaMask}
                className="bg-red-600 px-3 py-1 rounded text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Connection Section */}
        {!walletAddress ? (
          <div className="text-center">
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg disabled:bg-gray-600 transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </div>
              ) : (
                "Connect Wallet"
              )}
            </button>
            <div className="mt-4 text-sm text-gray-400">
              Make sure you're on Polygon Amoy testnet and have test MATIC for gas fees.
            </div>
          </div>
        ) : (
          <div>
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={approveTokens}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 p-3 rounded disabled:bg-gray-600 transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Approving...
                  </div>
                ) : (
                  `Approve ${mintCost} PKT`
                )}
              </button>

              <button
                onClick={mintNFT}
                disabled={loading || parseFloat(allowance) < parseFloat(mintCost)}
                className="bg-green-600 hover:bg-green-700 p-3 rounded disabled:bg-gray-600 transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Minting...
                  </div>
                ) : (
                  "Mint NFT"
                )}
              </button>
            </div>

            {/* NFTs Display */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your NFTs ({ownedNFTs.length})</h2>
                <div className="text-sm text-gray-400">
                  {ownedNFTs.length > 0 && `Total: ${ownedNFTs.length} NFT${ownedNFTs.length !== 1 ? 's' : ''}`}
                </div>
              </div>

              {ownedNFTs.length === 0 ? (
                <div className="text-center p-8 bg-gray-800 rounded-lg">
                  <div className="text-4xl mb-4">🎮</div>
                  <h3 className="text-xl font-semibold mb-2">No NFTs Yet</h3>
                  <p className="text-gray-400">Mint your first PokiNFT to start your adventure!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownedNFTs.map((nft) => (
                    <div key={nft.tokenId} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-colors">
                      <div className="font-bold text-lg mb-2">Token #{nft.tokenId}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Level: <span className="text-yellow-400">{nft.attributes.level}</span></div>
                        <div>XP: <span className="text-blue-400">{nft.attributes.xp}</span></div>
                        <div>HP: <span className="text-green-400">{nft.attributes.health}</span></div>
                        <div>ATK: <span className="text-red-400">{nft.attributes.attack}</span></div>
                        <div>DEF: <span className="text-purple-400">{nft.attributes.defense}</span></div>
                        <div>SPD: <span className="text-cyan-400">{nft.attributes.speed}</span></div>
                      </div>
                      <a
                        href={nft.tokenURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Metadata ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}