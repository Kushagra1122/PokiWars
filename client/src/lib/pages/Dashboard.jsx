import TokenBalance from '@/components/BalanceTokens';
import { Bell, User, Users, LogOut } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/8bit/drawer";
import { Button } from '@/components/ui/8bit/button';
import PokemonCard from '@/components/PokimonCard';
import { usePokemon } from '@/contexts/PokemonContext';
import { useUser } from '@/contexts/UserContext';

function Dashboard() {
  const navigate = useNavigate();
  const { main, pokemonCollection, updateMainPokemon, fetchNFTsForAddress } = usePokemon();
  const { walletAddress, unlinkWallet } = useUser();

  const [hoveredNav, setHoveredNav] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Check if wallet is connected, redirect if not
  useEffect(() => {
    if (!walletAddress) {
      navigate('/'); // Not connected, redirect to landing page
    }
  }, [walletAddress, navigate]);

  // Fetch NFTs once walletAddress determined
  useEffect(() => {
    if (walletAddress) {
      fetchNFTsForAddress(walletAddress);
    }
  }, [walletAddress, fetchNFTsForAddress]);

  const handleMarketplaceClick = () => {
    navigate('/market');
  };

  const handleBattleClick = () => {
    navigate('/battle')
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
    // Add notification logic here
  };

  const handleUsersClick = () => {
    console.log('Open Users/Friends');
    // Add friends logic here
  };

  const handleBuyNFTClick = () => {
    navigate('/first');
  };

  const handleUnlinkWallet = async () => {
    const result = await unlinkWallet();
    if (result.success) {
      setShowProfileDropdown(false);
      navigate('/'); // Redirect to landing page after unlinking
    } else {
      alert('Failed to unlink wallet: ' + result.message);
    }
  };

  const pokemonSelect = (pokemon) => {
    updateMainPokemon(pokemon);
    // Optional: Add a brief confirmation message
    console.log(`Selected ${pokemon.name} as main Pokemon!`);
  };

  // Helper function to truncate wallet address
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}xxx${address.slice(-4)}`;
  };

  return (
    <div className="bg-black h-screen w-full flex justify-center overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full">
        <img
          src="./dashboard_bg.png"
          alt="bg-img"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Enhanced title with better styling */}
      <div className='font-pixelify pointer-events-none absolute m-5 top-4 left-4 text-lime-100 text-6xl drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse'>
        POKIWARS
      </div>

      {/* Enhanced Navbar with better glassmorphism */}
      <div className="flex justify-center items-center absolute right-0 m-6 gap-8 border border-white/20 max-w-2xl h-20 px-8 bg-black/20 backdrop-blur-md rounded-xl shadow-2xl">
        {/* Profile Icon */}
        <div
          className="relative nav-button cursor-pointer transform transition-all duration-200 hover:scale-110"
          onMouseEnter={() => setHoveredNav('profile')}
          onMouseLeave={() => setHoveredNav(null)}
          onClick={handleProfileClick}
        >
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
            <User className='size-8 text-white drop-shadow-lg' />
          </div>
          {showProfileDropdown && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-black bg-opacity-90 border border-white/50 rounded-lg p-4 text-white z-20">
              <p className="break-words mb-2"><strong>Wallet:</strong> {walletAddress}</p>
              <button
                onClick={handleMyProfileClick}
                className="w-full px-2 py-1 bg-lime-600 hover:bg-lime-700 rounded mb-2"
              >
                My Profile
              </button>
              <button
                onClick={handleUnlinkWallet}
                className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Unlink Wallet
              </button>
              <TokenBalance walletAddress={walletAddress} />
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div
          className="relative nav-button cursor-pointer transform transition-all duration-200 hover:scale-110"
          onMouseEnter={() => setHoveredNav('notifications')}
          onMouseLeave={() => setHoveredNav(null)}
          onClick={handleNotificationsClick}
        >
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 relative">
            <Bell className='size-8 text-white drop-shadow-lg' />
            {/* Notification badge */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Friends Icon */}
        <div
          className="relative nav-button cursor-pointer transform transition-all duration-200 hover:scale-110"
          onMouseEnter={() => setHoveredNav('friends')}
          onMouseLeave={() => setHoveredNav(null)}
          onClick={handleUsersClick}
        >
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
            <Users className='size-8 text-white drop-shadow-lg' />
          </div>
        </div>
      </div>

      {/* Enhanced bottom buttons with better styling */}
      <button
        onClick={handleMarketplaceClick}
        className='group m-6 flex justify-center items-center text-3xl font-pixelify border border-white/30 absolute left-0 bottom-0 h-40 w-80 text-white bg-black/30 backdrop-blur-md rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-black/50 hover:border-lime-400/50 shadow-2xl'
      >
        <span className="drop-shadow-lg group-hover:text-lime-400 transition-colors duration-300">
          GO TO MARKETPLACE
        </span>
      </button>

      <button
        onClick={handleBattleClick}
        className='group m-6 flex justify-center items-center text-5xl font-pixelify border border-white/30 absolute right-0 bottom-0 h-40 w-80 text-white bg-black/30 backdrop-blur-md rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-black/50 hover:border-red-400/50 shadow-2xl'
      >
        <span className="drop-shadow-lg group-hover:text-red-400 transition-colors duration-300">
          Battle
        </span>
      </button>

      {/* Enhanced bouncing character with glow effect */}
      <div className='max-h-96 z-10 bounce-animation mt-22 flex items-center justify-center'>
        {main && (
          <div className="relative">
            <img
              src={main.main}
              alt="Character"
              className="max-w-md max-h-96 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 rounded-lg"></div>
          </div>
        )}
      </div>

      {/* Conditional rendering based on NFT count */}
      {pokemonCollection.length === 0 ? (
        <button
          onClick={handleBuyNFTClick}
          className="group font-pixelify px-10 py-5 m-4 text-white text-3xl border border-white/30 absolute bottom-0 bg-black/30 backdrop-blur-md rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-black/50 hover:border-green-400/50 shadow-2xl"
        >
          <span className="drop-shadow-lg group-hover:text-green-400 transition-colors duration-300">
            Buy NFT
          </span>
        </button>
      ) : (
        <Drawer>
          <DrawerTrigger className="group font-pixelify px-10 py-5 m-4 text-white text-3xl border border-white/30 absolute bottom-0 bg-black/30 backdrop-blur-md rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-black/50 hover:border-blue-400/50 shadow-2xl">
            <span className="drop-shadow-lg group-hover:text-blue-400 transition-colors duration-300">
              Swap
            </span>
          </DrawerTrigger>

          <DrawerContent className="h-110 bg-black/90 backdrop-blur-md border-t border-white/20">
            <DrawerHeader className="text-center">
              <DrawerTitle className="text-3xl font-pixelify text-white drop-shadow-lg">
                SELECT YOUR MAIN
              </DrawerTitle>
              <DrawerDescription className="text-gray-300 text-lg">
                You'll take this Pokimon to battle
              </DrawerDescription>
              {main && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-yellow-400/30">
                  <p className="text-yellow-400 font-semibold">Currently Selected:</p>
                  <p className="text-white">{main.name} - Level {main.level}</p>
                </div>
              )}
            </DrawerHeader>

            <div className='flex justify-center items-center gap-10 h-70 left-4 top-30 w-full absolute'>
              <div className="flex justify-center gap-4 items-center flex-wrap max-w-6xl">
                {pokemonCollection.map((pokemon, index) => {
                  const isSelected = main && main.tokenId === pokemon.tokenId;
                  return (
                    <div 
                      key={index} 
                      className={`relative transform transition-all duration-200 hover:scale-105 ${
                        isSelected ? 'ring-4 ring-yellow-400 ring-opacity-60 scale-105' : ''
                      }`}
                    >
                      <div className={`${isSelected ? 'bg-yellow-400/10 rounded-lg p-2' : ''}`}>
                        <PokemonCard
                          imageSrc={pokemon.img}
                          name={pokemon.name}
                          type={pokemon.type}
                          attack={pokemon.attack}
                          range={pokemon.range}
                          exp={pokemon.exp}
                          level={pokemon.level}
                          onClick={() => pokemonSelect(pokemon)}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                          MAIN
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <DrawerClose className="absolute m-6 top-0 right-0">
              <Button variant="outline" className="bg-black/50 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      )}

      {/* Add some CSS for animations */}
      <style jsx>{`
        .bounce-animation {
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;