import PokemonCard from '@/components/PokimonCard';
import { Button } from '@/components/ui/8bit/button';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';     // ✅ Supabase client
import { ethers } from 'ethers';                     // ✅ for reading current wallet

const Profile = () => {
  // --- user stats from DB ---
  const [username, setUsername] = useState('');
  const [noOfFriends, setNoOfFriends] = useState(0); // adjust if you add a friends table
  const [amount, setAmount] = useState(0);           // adjust if you track balance
  const [totalBot, setTotalBot] = useState(0);
  const [kills, setKills] = useState(0);
  const [won, setWon] = useState(0);
  const [kd, setKd] = useState('0');

  // --- fetch user info once on mount ---
  useEffect(() => {
    async function loadUser() {
      try {
        // 1. Get connected wallet
        if (!window.ethereum) {
          console.error('MetaMask not found');
          return;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (!accounts || accounts.length === 0) return;
        const wallet = accounts[0];

        // 2. Query Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', wallet)
          .single();

        if (error) {
          console.error('Supabase fetch error:', error);
          return;
        }
        if (!data) return;

        // 3. Update UI state
        setUsername(data.name);
        setTotalBot(data.matches);
        setKills(data.kills);
        const deaths = data.deaths || 0;
        setKd(deaths === 0 ? `${data.kills}` : (data.kills / deaths).toFixed(2));
        // you can set amount/noOfFriends from other tables if you have them
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }

    loadUser();
  }, []);

  const samplePokemon = [
    { name: "Pikachu", type: "Electric", attack: 75, range: 4, exp: 85, level: 12, img: './venu-thumbnail.png', main: './venu.png' },
    { name: "Charizard", type: "Fire", attack: 95, range: 5, exp: 45, level: 18, img: './blastoise-thumbnail.png', main: './blast.png' },
    { name: "Blastoise", type: "Water", attack: 80, range: 3, exp: 90, level: 15, img: './chariz-thumbnail.png', main: './chariz.png' },
    { name: "Venusaur", type: "Grass", attack: 85, range: 4, exp: 30, level: 16, img: './venu-thumbnail.png', main: './venu.png' },
    { name: "Alakazam", type: "Psychic", attack: 70, range: 6, exp: 65, level: 20, img: './blastoise-thumbnail.png', main: './blast.png' },
    { name: "Machamp", type: "Fighting", attack: 100, range: 2, exp: 10, level: 14, img: './chariz-thumbnail.png', main: './chariz.png' }
  ];

  const StatCard = ({ label, value, color = 'green' }) => {
    const colorClasses = {
      green: 'bg-gray-900 border-green-500 text-green-400 shadow-[0_0_5px_#10b981]',
      red: 'bg-gray-800 border-purple-500 text-purple-400 shadow-[0_0_5px_#8b5cf6]',
      blue: 'bg-black border-gray-500 text-gray-300 shadow-[0_0_5px_#6b7280]',
      yellow: 'bg-purple-900 border-green-400 text-green-300 shadow-[0_0_5px_#22c55e]'
    };

    return (
      <div className={`${colorClasses[color]} border-2 border-solid p-3 text-center font-mono font-bold`}>
        <div className="text-xs uppercase tracking-wider opacity-80 mb-1">{label}</div>
        <div className="text-2xl">{value}</div>
      </div>
    );
  };

  const HandleLogout = () => {
    // add wallet disconnect / sign-out logic if needed
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
          username:<div>{username || '...'}</div>
        </div>
        <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
          ttl friends: {noOfFriends}
        </div>
        <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
          amount: {amount}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 px-4 pb-4">
        {/* Left Panel */}
        <div className="h-130 w-full bg-white/10 border-4 border-white-500 p-4 shadow-[0_0_15px_#ffffff] flex flex-col">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="Total Battles" value={totalBot} color="green" />
            <StatCard label="Kills" value={kills} color="red" />
            <StatCard label="Wins" value={won} color="blue" />
            <StatCard label="K/D" value={kd} color="yellow" />
          </div>

          <div className="flex-1"></div>
          <div className="px-2">
            <Button className="text-lg bg-white/20 w-full" onClick={HandleLogout}>
              Log Out
            </Button>
          </div>
        </div>

        {/* Right Panel - Pokemon Cards */}
        <div className="h-130 w-full border-4 bg-white/10 p-4 shadow-[0_0_15px_#8b5cf6] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {samplePokemon.map((pokemon, index) => (
                <div key={index} className="scale-95">
                  <PokemonCard
                    imageSrc={pokemon.img}
                    name={pokemon.name}
                    type={pokemon.type}
                    attack={pokemon.attack}
                    range={pokemon.range}
                    exp={pokemon.exp}
                    level={pokemon.level}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;