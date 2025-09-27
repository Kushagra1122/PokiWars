import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import minimalNFTABI from "../../consts/nftabi.json";
import minimalTokenABI from "../../consts/tokenabi.json";

const POKI_NFT_ADDRESS = "0x41b3df1beb4b8a4e07c266bc894bba7a0a1878fb";
const POKI_TOKEN_ADDRESS = "0x5b2df7670561258b41339d464fa277396102802a";

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

// Updated Polygon Amoy configuration with POL
const AMOY_CONFIG = {
    chainId: '0x13882',
    chainName: 'Polygon Amoy Testnet',
    rpcUrls: ['https://rpc-amoy.polygon.technology/'],
    nativeCurrency: {
        name: 'POL',
        symbol: 'POL',
        decimals: 18
    },
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
};

export default function NFTTestPage() {
    const [walletAddress, setWalletAddress] = useState(null);
    const [ownedNFTs, setOwnedNFTs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pokiTokenBalance, setPokiTokenBalance] = useState("0");
    const [mintCost, setMintCost] = useState("0");
    const [status, setStatus] = useState("Connect your wallet");
    const [allowance, setAllowance] = useState("0");
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [polBalance, setPolBalance] = useState("0");

    // Check network on component mount
    useEffect(() => {
        if (window.ethereum) {
            checkNetwork();
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const handleChainChanged = (chainId) => {
        window.location.reload();
    };

    // Check if connected to correct network
    async function checkNetwork() {
        if (!window.ethereum) return false;

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const isAmoy = chainId === AMOY_CONFIG.chainId;
            setIsCorrectNetwork(isAmoy);
            return isAmoy;
        } catch (error) {
            console.error('Error checking network:', error);
            return false;
        }
    }

    // Get POL balance
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

    // Switch to Polygon Amoy
    async function switchToAmoy() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: AMOY_CONFIG.chainId }],
            });
            return true;
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [AMOY_CONFIG],
                    });
                    return true;
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    setStatus("❌ Failed to add Polygon Amoy network");
                    return false;
                }
            } else {
                console.error('Failed to switch network:', switchError);
                setStatus("❌ Failed to switch to Polygon Amoy");
                return false;
            }
        }
    }

    // Connect wallet with better error handling
    async function connectWallet() {
        if (!window.ethereum) {
            alert("Please install MetaMask");
            return;
        }

        setLoading(true);
        setStatus("Connecting to wallet...");

        try {
            // Check network first
            const isCorrectNetwork = await checkNetwork();
            if (!isCorrectNetwork) {
                setStatus("Switching to Polygon Amoy...");
                const switched = await switchToAmoy();
                if (!switched) {
                    setLoading(false);
                    return;
                }
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);

            // Get POL balance
            await getPolBalance(address);

            await loadContractData(provider, address);
            setStatus("✅ Connected to Polygon Amoy");

        } catch (error) {
            console.error("Connection failed:", error);
            setStatus(`❌ Error: ${error.message}`);
        }
        setLoading(false);
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
            setStatus("❌ Error loading contract data. Check contract addresses.");
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
            setStatus("❌ Error fetching NFTs. Contract may not be deployed.");
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

        // Check network first
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) {
            setStatus("❌ Please switch to Polygon Amoy first");
            return;
        }

        // Check POL balance for gas
        if (parseFloat(polBalance) < 0.01) {
            setStatus("❌ Insufficient POL for gas fees");
            return;
        }

        setLoading(true);
        setStatus("Approving tokens...");

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, signer);

            const costWei = ethers.utils.parseUnits(mintCost, 18);

            const tx = await tokenContract.approve(POKI_NFT_ADDRESS, costWei, {
                gasLimit: 100000
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

            if (error.code === 4001) {
                setStatus("❌ Approval cancelled by user");
            } else if (error.message?.includes("insufficient funds")) {
                setStatus("❌ Insufficient POL for gas fees");
            } else {
                setStatus(`❌ Approval failed: ${error.message}`);
            }
        }
        setLoading(false);
    }

    async function debugABI() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);

            // Check the function signature from ABI
            const functionFragment = nftContract.interface.getFunction('mintNFT');
            console.log("ABI Function Parameters:", functionFragment.inputs);

            // Expected parameters should be:
            // [
            //   { name: "to", type: "address" },
            //   { name: "metadataURI", type: "string" },
            //   { name: "level", type: "uint256" },
            //   ... etc
            // ]

        } catch (error) {
            console.error("ABI Debug error:", error);
        }
    }



    // Mint NFT with comprehensive error handling
    // Updated mintNFT function with better error handling
    // Add this debug function to check contract state
    async function debugContractState() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);
            const tokenContract = new ethers.Contract(POKI_TOKEN_ADDRESS, minimalTokenABI, provider);

            console.log("=== CONTRACT DEBUG INFO ===");

            // Check NFT contract
            const mintCostWei = await nftContract.mintCost();
            console.log("Mint cost:", ethers.utils.formatUnits(mintCostWei, 18));

            const nextTokenId = await nftContract.getNextTokenId();
            console.log("Next token ID:", nextTokenId.toString());

            const tokenAddressInContract = await nftContract.pokiToken();
            console.log("Token address in contract:", tokenAddressInContract);
            console.log("Expected token address:", POKI_TOKEN_ADDRESS);
            console.log("Address match:", tokenAddressInContract.toLowerCase() === POKI_TOKEN_ADDRESS.toLowerCase());

            // Check token contract
            const tokenBalance = await tokenContract.balanceOf(walletAddress);
            console.log("Your PKT balance:", ethers.utils.formatUnits(tokenBalance, 18));

            const allowance = await tokenContract.allowance(walletAddress, POKI_NFT_ADDRESS);
            console.log("Allowance:", ethers.utils.formatUnits(allowance, 18));

            console.log("=== END DEBUG ===");

        } catch (error) {
            console.error("Debug error:", error);
        }
    }

   
    async function mintNFT() {
        // Call this before minting
        await debugABI();
        await debugContractState();
        if (!walletAddress) {
            alert("Please connect wallet first");
            return;
        }

        setLoading(true);
        setStatus("Preparing mint transaction...");

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const nftContract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, signer);

            // Use explicit parameter encoding
            const tx = await nftContract.mintNFT(
                walletAddress,                    // address
                pokemonModel.metadataURI,        // string
                pokemonModel.level,              // uint256
                pokemonModel.xp,                 // uint256
                pokemonModel.health,             // uint256
                pokemonModel.attack,             // uint256
                pokemonModel.defense,            // uint256
                pokemonModel.speed,              // uint256
                pokemonModel.radius,             // uint256
                pokemonModel.specialTrait,       // uint256
                { gasLimit: 500000 }
            );

            setStatus("⏳ Waiting for transaction confirmation...");
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                setStatus("🎉 NFT minted successfully!");
                await loadContractData(provider, walletAddress);
                await getPolBalance(walletAddress);
            } else {
                setStatus("❌ Mint transaction failed");
            }

        } catch (error) {
            console.error("Mint failed:", error);
            // More detailed error handling
            if (error.code === 4001) {
                setStatus("❌ Mint cancelled by user");
            } else {
                setStatus(`❌ Mint failed: ${error.message}`);
            }
        }
        setLoading(false);
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
            await getPolBalance(walletAddress);
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

                {/* Network Warning */}
                {!isCorrectNetwork && walletAddress && (
                    <div className="bg-yellow-600 p-4 rounded-lg mb-4">
                        <strong>⚠️ Wrong Network:</strong> Please switch to Polygon Amoy Testnet
                    </div>
                )}

                {/* POL Balance Warning */}
                {walletAddress && parseFloat(polBalance) < 0.01 && (
                    <div className="bg-red-600 p-4 rounded-lg mb-4">
                        <strong>⚠️ Low POL Balance:</strong> You need POL for gas fees. Get test POL from a faucet.
                    </div>
                )}

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
                                        PKT Balance: {pokiTokenBalance} PKT | Mint Cost: {mintCost} PKT
                                    </div>
                                    <div className="text-blue-400">
                                        Allowance: {allowance} PKT | POL Balance: {polBalance} POL
                                    </div>
                                    <div className="text-purple-400">
                                        Network: {isCorrectNetwork ? "Polygon Amoy ✅" : "Wrong Network ⚠️"}
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
                            {!isCorrectNetwork && walletAddress && (
                                <button
                                    onClick={switchToAmoy}
                                    className="bg-yellow-600 px-3 py-1 rounded text-sm"
                                >
                                    Switch to Amoy
                                </button>
                            )}
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
                            Make sure you're on Polygon Amoy testnet and have test POL for gas fees.
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={approveTokens}
                                disabled={loading || parseFloat(polBalance) < 0.01}
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
                                disabled={loading || parseFloat(allowance) < parseFloat(mintCost) || parseFloat(polBalance) < 0.01}
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