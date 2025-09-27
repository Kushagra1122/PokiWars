import PokemonCard from '@/components/PokimonCard';
import { Button } from '@/components/ui/8bit/button';
import React, { useState } from 'react';

const Profile = () => {
  const [username, setUsername] = useState('Player1');
  const [noOfFriends, setNoOfFriends] = useState(69);
  const [amount, setAmount] = useState(11999);
  const [totalBot, setTotalBot] = useState(42);
  const [kills, setKills] = useState(127);
  const [won, setWon] = useState(23);
  const [kd, setKd] = useState('2.8');

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
      <div className={`
        ${colorClasses[color]}
        border-2 border-solid p-3 text-center font-mono font-bold
      `}>
        <div className="text-xs uppercase tracking-wider opacity-80 mb-1">{label}</div>
        <div className="text-2xl">{value}</div>
      </div>
    );
  };

  return (
    <div className="h-screen text-white bg-black">
      <div className="">
        {/* Header Section */}
        <div className="flex gap-4 mb-6 justify-between items-center ">
          <div className="mt-3 text-center">
            <div className="font-pixelify text-transparent bg-gray-400 bg-clip-text font-bold text-4xl mb-2 tracking-wider">
              POKIWARS
            </div>
          </div>
          <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
            username:<div>{username}</div>
          </div>
          <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
            ttl friends: {noOfFriends}
          </div>
          <div className="flex gap-2 justify-center items-center font-pixelify text-xl">
            amount: {amount}
          </div>

        </div>

        {/* Main Content Area - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Panel - Stats */}
          <div className="bg-white/10 border-2 border-white-500 p-4 shadow-[0_0_15px_#ffffff] ">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard label="Total Battles" value={totalBot} color="green" />
              <StatCard label="Kills" value={kills} color="red" />
              <StatCard label="Wins" value={won} color="blue" />
              <StatCard label="K/D" value={kd} color="yellow" />
            </div>

            {/* Action Button */}

            <div className="mt-4  px-2 absolute bottom-18">
              <Button
                className="text-lg bg-white/20"
                onClick={() => HandleLogout()}
              >
                Log Out
              </Button>
            </div>

          </div>

          {/* Right Panel -  */}
          <div className="border-5 bg-white/10 p-4 shadow-[0_0_15px_#8b5cf6]">
            <div className="flex justify-center gap-5 items-center gap flex-wrap">
              {samplePokemon.map((pokemon, index) => (
                <PokemonCard
                  imageSrc={pokemon.img}
                  key={index}
                  name={pokemon.name}
                  type={pokemon.type}
                  attack={pokemon.attack}
                  range={pokemon.range}
                  exp={pokemon.exp}
                  level={pokemon.level}
                // onClick={()=>pokemonSelect(pokemon)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
