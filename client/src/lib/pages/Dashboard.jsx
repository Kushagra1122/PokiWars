import TokenBalance from '@/components/BalanceTokens';
import { Bell, User, Users, AlertCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/8bit/drawer"
import { Button } from '@/components/ui/8bit/button';
import PokemonCard from '@/components/PokimonCard';
import { usePokemon } from '@/contexts/PokemonContext';
import { ethers } from 'ethers';

import minimalNFTABI from "../../consts/nftabi.json";
import minimalTokenABI from "../../consts/tokenabi.json";

const POKI_NFT_ADDRESS = "0x41b3df1beb4b8a4e07c266bc894bba7a0a1878fb";
const POKI_TOKEN_ADDRESS = "0x5b2df7670561258b41339d464fa277396102802a";


// Polygon Amoy testnet configuration
const AMOY_CONFIG = {
    chainId: '0x13882',
    chainName: 'Polygon Amoy Testnet',
    rpcUrls: ['https://rpc-amoy.polygon.technology/'],
    nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
    },
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
};

function Dashboard() {
    const navigate = useNavigate();
    const { main, pokemonCollection, updateMainPokemon: setMain } = usePokemon();
    // const { main, pokemonCollection, updateMainPokemon } = usePokemon();
    const [hoveredNav, setHoveredNav] = useState(null);
    // const [main, setMain] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [ownedNFTs, setOwnedNFTs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [networkError, setNetworkError] = useState('');
    const [currentNetwork, setCurrentNetwork] = useState('');

    
    // Check network and wallet connection on mount
    useEffect(() => {
        checkWalletConnection();

        // Listen for network changes
        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    const handleChainChanged = (chainId) => {
        window.location.reload();
    };

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            navigate('/');
        } else {
            setWalletAddress(accounts[0]);
            checkWalletConnection();
        }
    };

    // Switch to Amoy testnet
    async function switchToAmoy() {
        setLoading(true);
        setNetworkError('Switching to Polygon Amoy...');

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: AMOY_CONFIG.chainId }],
            });
            setNetworkError('');
            return true;
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [AMOY_CONFIG],
                    });
                    setNetworkError('');
                    return true;
                } catch (addError) {
                    setNetworkError('Failed to add Polygon Amoy network');
                    console.error('Failed to add network:', addError);
                    return false;
                }
            } else {
                setNetworkError('Failed to switch to Polygon Amoy');
                console.error('Failed to switch network:', switchError);
                return false;
            }
        } finally {
            setLoading(false);
        }
    }

    // Check if connected to correct network
    async function checkNetwork() {
        if (!window.ethereum) return false;

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const isAmoy = chainId === AMOY_CONFIG.chainId;

            if (isAmoy) {
                setCurrentNetwork('Polygon Amoy');
                setNetworkError('');
                return true;
            } else {
                setCurrentNetwork('Wrong Network');
                setNetworkError(`Please switch to Polygon Amoy Testnet`);
                return false;
            }
        } catch (error) {
            console.error('Error checking network:', error);
            setNetworkError('Error checking network');
            return false;
        }
    }

    // Check wallet connection and network
    async function checkWalletConnection() {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            setNetworkError('MetaMask not installed');
            navigate('/');
            return;
        }

        setLoading(true);
        try {
            // Check network first
            const isCorrectNetwork = await checkNetwork();
            if (!isCorrectNetwork) {
                setLoading(false);
                return;
            }

            // Check accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
                navigate('/');
            } else {
                setWalletAddress(accounts[0]);
                await fetchNFTs(accounts[0]);
            }
        } catch (err) {
            console.error('Error checking wallet connection:', err);
            setNetworkError('Connection error');
            navigate('/');
        }
        setLoading(false);
    }

    // Connect wallet with network check
    async function connectWallet() {
        if (!window.ethereum) {
            setNetworkError('Please install MetaMask');
            return;
        }

        setLoading(true);
        try {
            // Request accounts first
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Check and switch network if needed
            const isCorrectNetwork = await checkNetwork();
            if (!isCorrectNetwork) {
                const switched = await switchToAmoy();
                if (!switched) {
                    setLoading(false);
                    return;
                }
            }

            setWalletAddress(accounts[0]);
            await fetchNFTs(accounts[0]);

        } catch (error) {
            console.error('Connection failed:', error);
            setNetworkError(error.message);
        }
        setLoading(false);
    }

    // Fetch NFTs from blockchain
    async function fetchNFTs(address) {
        console.log('Fetching NFTs for address:', address);
        if (!address) return;

        setLoading(true);
        try {
            // Double-check network
            const isCorrectNetwork = await checkNetwork();
            if (!isCorrectNetwork) {
                setNetworkError('Wrong network detected during NFT fetch');
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);
            const balance = await contract.balanceOf(address);
            console.log(provider, contract, balance);
            const nfts = [];
            for (let i = 0; i < balance.toNumber(); i++) {
                console.log('Fetching NFT index:', i);
                try {
                    const tokenId = await contract.tokenOfOwnerByIndex(address, i);
                    const tokenURI = await contract.tokenURI(tokenId);
                    const attributes = await contract.getAttributes(tokenId);
                    console.log('Fetched tokenId:', tokenId.toString(), 'tokenURI:', tokenURI, 'attributes:', attributes);
                    const pokemonData = {
                        tokenId: tokenId.toNumber(),
                        name: `PokiNFT #${tokenId.toString()}`,
                        type: getTypeFromTrait(parseInt(attributes.specialTrait.toString())),
                        attack: parseInt(attributes.attack.toString()),
                        range: Math.floor(parseInt(attributes.radius.toString()) / 3),
                        exp: parseInt(attributes.xp.toString()),
                        level: parseInt(attributes.level.toString()),
                        health: parseInt(attributes.health.toString()),
                        defense: parseInt(attributes.defense.toString()),
                        speed: parseInt(attributes.speed.toString()),
                        img: tokenURI,
                        main: tokenURI,
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
                    };
                    console.log('Parsed NFT data:', pokemonData);
                    nfts.push(pokemonData);

                    if (i === 0 && !main) {
                        setMain(pokemonData);
                    }
                } catch (nftError) {
                    console.error(`Error loading NFT ${i}:`, nftError);
                }
            }
            setOwnedNFTs(nfts);
        } catch (error) {
            console.error("Error fetching NFTs:", error);
            setNetworkError('Failed to fetch NFTs. Check contract address.');
            setOwnedNFTs([]);
        }
        setLoading(false);
    }

    // Helper functions (keep the same as before)
    function getTypeFromTrait(specialTrait) {
        const types = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison"];
        return types[specialTrait % types.length] || "Normal";
    }

    function getImageFromTrait(specialTrait) {
        const images = ['./venu-thumbnail.png', './chariz-thumbnail.png', './blastoise-thumbnail.png'];
        return images[specialTrait % images.length] || './venu-thumbnail.png';
    }

    function getMainImageFromTrait(specialTrait) {
        const images = ['./venu.png', './chariz.png', './blast.png'];
        return images[specialTrait % images.length] || './venu.png';
    }

    const handleMarketplaceClick = () => {
        console.log('Navigate to Marketplace');
    };

    const handleBattleClick = () => {
        if (!main) {
            alert('Please select a Pokemon first!');
            return;
        }
        console.log('Start Battle with:', main.name);
    };

    const handleProfileClick = () => {
        setShowProfileDropdown(prev => !prev);
    };

    const handleMyProfileClick = () => {
        navigate('/profile');
        setShowProfileDropdown(false);
    };

    const handleNotificationsClick = () => {
        console.log('Open Notifications');
        // Add your notifications logic here
    };

    const handleUsersClick = () => {
        console.log('Open Users/Friends');
        // Add your users logic here
    };

    // Pokemon selection handler
    const pokemonSelect = (pokemon) => {
        updateMainPokemon(pokemon)
        const pokemonSelect = (pokemon) => {
            setMain(pokemon);
        }

        const formatAddress = (address) => {
            if (!address) return "";
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        };

        return (
            <div className="bg-black h-screen w-full flex justify-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <img
                        src="./dashboard_bg.png"
                        alt="bg-img"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className='font-pixelify pointer-events-none absolute m-5 top-4 left-4 text-lime-100 text-6xl'>POKIWARS</div>

                {/* Network Error Banner */}
                {networkError && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-3 rounded-lg flex items-center gap-2 z-50">
                        <AlertCircle size={20} />
                        <span>{networkError}</span>
                        <Button
                            onClick={switchToAmoy}
                            className="ml-2 bg-red-800 hover:bg-red-700 text-sm"
                        >
                            Switch to Amoy
                        </Button>
                    </div>
                )}

                {/* Navbar */}
                <div className="flex justify-center items-center absolute right-0 m-6 gap-6 border-2 border-white/50 max-w-2xl h-20 px-6 bg-white/30 backdrop-blur-sm rounded-lg">
                    <div className="text-white text-sm absolute -top-8 right-0">
                        Network: {currentNetwork}
                    </div>

                    <div
                        className="relative nav-button"
                        onMouseEnter={() => setHoveredNav('profile')}
                        onMouseLeave={() => setHoveredNav(null)}
                        onClick={handleProfileClick}
                    >
                        <User className='font-extrabold size-11 text-white' />
                        <div className={`tooltip ${hoveredNav === 'profile' ? 'show' : ''}`}>
                            Profile
                        </div>
                        {showProfileDropdown && (
                            <div className="absolute top-full mt-2 right-0 w-56 bg-black bg-opacity-90 border border-white/50 rounded-lg p-4 text-white z-20">
                                <p className="break-words mb-2"><strong>Wallet:</strong> {formatAddress(walletAddress)}</p>
                                <p className="mb-2"><strong>NFTs Owned:</strong> {ownedNFTs.length}</p>
                                <p className="mb-2"><strong>Network:</strong> {currentNetwork}</p>
                                <button
                                    onClick={handleMyProfileClick}
                                    className="w-full px-2 py-1 bg-lime-600 hover:bg-lime-700 rounded mb-2"
                                >
                                    My Profile
                                </button>
                                <TokenBalance walletAddress={walletAddress} />
                            </div>
                        )}
                    </div>

                    {/* Other nav buttons remain the same */}
                </div>

                {/* Bottom buttons */}
                <button
                    onClick={handleMarketplaceClick}
                    className='glow-button m-6 flex justify-center items-center text-4xl font-pixelify border-2 border-white/70 absolute left-0 bottom-0 h-40 w-80 text-white bg-black/50 backdrop-blur-sm rounded-lg cursor-pointer'
                    disabled={!!networkError}
                >
                    GO TO MARKETPLACE
                </button>

                <button
                    onClick={handleBattleClick}
                    className='glow-button m-6 flex justify-center items-center text-6xl font-pixelify border-2 border-white/70 absolute right-0 bottom-0 h-40 w-80 text-white bg-black/50 backdrop-blur-sm rounded-lg cursor-pointer'
                    disabled={!!networkError || !main}
                >
                    Battle
                </button>

                {/* Main character display */}
                {main ? (
                    <div className='max-h-96 z-10 bounce-animation mt-22 flex items-center justify-center'>
                        <img src={main.main} alt="Character" className="max-w-md max-h-96 object-contain" />
                        <div className="absolute bottom-10 bg-black/70 text-white p-2 rounded text-sm">
                            {main.name} - Lvl {main.level}
                        </div>
                    </div>
                ) : (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                        <div className="text-4xl mb-4">🎮</div>
                        <h3 className="text-2xl font-semibold mb-2">Welcome to PokiWars!</h3>
                        <p className="text-gray-400">Select a Pokemon from your collection to begin</p>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p>Loading...</p>
                    </div>
                )}

                {/* Swap Drawer */}
                <Drawer>
                    <DrawerTrigger
                        className="font-pixelify glow-button px-8 py-4 m-4 text-white text-4xl border-2 border-white/70 absolute bottom-0 bg-black/50 backdrop-blur-sm rounded-lg cursor-pointer"
                        disabled={!!networkError}
                    >
                        Swap
                    </DrawerTrigger>

                    <DrawerContent className="h-110">
                        <DrawerHeader>
                            <DrawerTitle className="text-2xl">SELECT YOUR MAIN POKIMON</DrawerTitle>
                            <DrawerDescription>
                                {ownedNFTs.length > 0
                                    ? `You own ${ownedNFTs.length} PokiNFT${ownedNFTs.length !== 1 ? 's' : ''}`
                                    : 'No PokiNFTs found'}
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className='flex justify-center items-center gap-10 h-70 left-4 top-30 w-full absolute'>
                            {ownedNFTs.length === 0 ? (
                                <div className="text-center p-8">
                                    <div className="text-4xl mb-4">🎮</div>
                                    <h3 className="text-xl font-semibold mb-2">No PokiNFTs Yet</h3>
                                    <p className="text-gray-400">Mint your first PokiNFT to start your adventure!</p>
                                </div>
                            ) : (
                                <div className="flex justify-center gap-2 items-center flex-wrap">
                                    {ownedNFTs.map((pokemon) => (
                                        <PokemonCard
                                            imageSrc={pokemon.img}
                                            key={pokemon.tokenId}
                                            name={pokemon.name}
                                            type={pokemon.type}
                                            attack={pokemon.attack}
                                            range={pokemon.range}
                                            exp={pokemon.exp}
                                            level={pokemon.level}
                                            onClick={() => pokemonSelect(pokemon)}
                                            isSelected={main && main.tokenId === pokemon.tokenId}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <DrawerClose className="absolute m-4 top-0 right-0">
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerContent>
                </Drawer>

                {/* Custom CSS remains the same */}
                <style jsx>{`
                /* ... your existing CSS ... */
            `}</style>
            </div>
        )
    }
}

export default Dashboard