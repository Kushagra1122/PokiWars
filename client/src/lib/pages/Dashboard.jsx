import TokenBalance from '@/components/BalanceTokens';
import { Bell, User, Users } from 'lucide-react';
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

function Dashboard() {
  const navigate = useNavigate();
  const { main, pokemonCollection, updateMainPokemon, fetchNFTsForAddress } = usePokemon();

  const [hoveredNav, setHoveredNav] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Check MetaMask connection on mount
  useEffect(() => {
    async function checkWalletConnection() {
      if (window.ethereum && window.ethereum.isMetaMask) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            navigate('/'); // Not connected, redirect
          } else {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
          navigate('/');
        }
      } else {
        navigate('/'); // MetaMask not installed
      }
    }
    checkWalletConnection();
  }, [navigate]);

  // Fetch NFTs once walletAddress determined
  useEffect(() => {
    if (walletAddress) {
      fetchNFTsForAddress(walletAddress);
    }
  }, [walletAddress, fetchNFTsForAddress]);

  const handleMarketplaceClick = () => {
    console.log('Navigate to Marketplace');
    // Add navigation logic here
  };

  const handleBattleClick = () => {
    console.log('Start Battle');
    // Add battle logic here
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

  const pokemonSelect = (pokemon) => {
    updateMainPokemon(pokemon);
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
            <div className="absolute top-full mt-3 right-0 w-72 bg-black/90 backdrop-blur-md border border-white/30 rounded-xl p-5 text-white z-20 shadow-2xl font-pixelify">
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-1">Wallet Address:</p>
                <p className="text-sm bg-gray-800/50 p-2 rounded-lg border border-gray-600">
                  {truncateAddress(walletAddress)}
                </p>
              </div>
              <button
                onClick={handleMyProfileClick}
                className="w-full px-4 py-3 bg-gradient-to-r from-lime-600 to-lime-700 hover:from-lime-700 hover:to-lime-800 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                My Profile
              </button>
              <div className="mt-3">
                <TokenBalance walletAddress={walletAddress} />
              </div>
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

      {/* Enhanced Swap button */}
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
          </DrawerHeader>

          <div className='flex justify-center items-center gap-10 h-70 left-4 top-30 w-full absolute'>
            <div className="flex justify-center gap-4 items-center flex-wrap max-w-6xl">
              {pokemonCollection.map((pokemon, index) => (
                <div key={index} className="transform transition-all duration-200 hover:scale-105">
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
              ))}
            </div>
          </div>

          <DrawerClose className="absolute m-6 top-0 right-0">
            <Button variant="outline" className="bg-black/50 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>

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