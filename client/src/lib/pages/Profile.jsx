import PokemonCard from '@/components/PokimonCard';
import { Button } from '@/components/ui/8bit/button';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePokemon } from '@/contexts/PokemonContext';
import { useUser } from '@/contexts/UserContext';

const Profile = () => {
  const navigate = useNavigate();
  const { pokemonCollection, fetchNFTsForAddress } = usePokemon();
  const { username, walletAddress, clearUser, tokenBalance, balanceError } = useUser();
  
  const [noOfFriends, setNoOfFriends] = useState(69);
  const [totalBot, setTotalBot] = useState(42);
  const [kills, setKills] = useState(127);
  const [won, setWon] = useState(23);
  const [kd, setKd] = useState('2.8');

  // Fetch NFTs when component mounts or wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchNFTsForAddress(walletAddress);
    }
  }, [walletAddress, fetchNFTsForAddress]);

  const StatCard = ({ label, value, color = 'green' }) => {
    const colorClasses = {
      green: 'bg-gray-900 border-green-500 text-green-400 shadow-[0_0_5px_#10b981]',
      red: 'bg-gray-800 border-purple-500 text-purple-400 shadow-[0_0_5px_#8b5cf6]',
      blue: 'bg-black border-gray-500 text-gray-300 shadow-[0_0_5px_#6b7280]',
      yellow: 'bg-purple-900 border-green-400 text-green-300 shadow-[0_0_5px_#22c55e]'
    };

    return (
      <div className={`
        ${colorClasses[color]}
        border-2 border-solid p-3 text-center font-mono font-bold
      `}>
        <div className="text-xs uppercase tracking-wider opacity-80 mb-1">{label}</div>
        <div className="text-2xl">{value}</div>
      </div>
    );
  };

  const HandleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <div className="h-screen text-white bg-black flex flex-col">
      {/* Header Section */}
      <div className="flex gap-4 mb-6 justify-between items-center p-4">
        <div className="text-center">
          <div className="font-pixelify text-transparent bg-gray-400 bg-clip-text font-bold text-4xl mb-2 tracking-wider">
            POKIWARS
          </div>
        </div>
        <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
          username:<div>{username || 'Player1'}</div>
        </div>
        <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
          ttl friends: {noOfFriends}
        </div>
        <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
          amount: {balanceError ? 'Error' : tokenBalance !== null ? parseFloat(tokenBalance).toFixed(2) : 'Loading...'}
        </div>
      </div>

      {/* Main Content Area - Two Column Layout - Takes remaining height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 px-4 pb-4">

        {/* Left Panel - Stats */}
        <div className="h-130 w-full bg-white/10 border-4 border-white-500 p-4 shadow-[0_0_15px_#ffffff] flex flex-col">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="Total Battles" value={totalBot} color="green" />
            <StatCard label="Kills" value={kills} color="red" />
            <StatCard label="Wins" value={won} color="blue" />
            <StatCard label="K/D" value={kd} color="yellow" />
            <StatCard 
              label="Poki Tokens" 
              value={balanceError ? 'Error' : tokenBalance !== null ? parseFloat(tokenBalance).toFixed(2) : 'Loading...'} 
              color="green" 
            />
          </div>

          {/* Spacer to push button to bottom */}
          <div className="flex-1"></div>

          {/* Action Button - At bottom of left panel */}
          <div className="px-2">
            <Button
              className="text-lg bg-white/20 w-full"
              onClick={() => HandleLogout()}
            >
              Log Out
            </Button>
          </div>
        </div>

        {/* Right Panel - Pokemon Cards with Scroll */}
        <div className="h-130 w-full border-4 bg-white/10 p-4 shadow-[0_0_15px_#8b5cf6] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {pokemonCollection.length > 0 ? (
                pokemonCollection.map((pokemon, index) => (
                  <div className='scale-95' key={pokemon.tokenId || index}>
                    <PokemonCard
                      imageSrc={pokemon.img}
                      name={pokemon.name}
                      type={pokemon.type}
                      attack={pokemon.attack}
                      range={pokemon.range}
                      exp={pokemon.exp}
                      level={pokemon.level}
                    // onClick={()=>pokemonSelect(pokemon)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-400 font-pixelify text-lg py-8">
                  No Pokemon found. Connect your wallet to view your collection.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
