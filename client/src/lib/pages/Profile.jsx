import React, { useState } from 'react';

const EightBitProfilePage = () => {
  const [username, setUsername] = useState('Player1');
  const [totalBot, setTotalBot] = useState(42);
  const [kills, setKills] = useState(127);
  const [won, setWon] = useState(23);
  const [kd, setKd] = useState('2.8');
  const [hoveredPokemon, setHoveredPokemon] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Pokemon data with stats
  const pokemonData = {
    '🎮': {
      name: 'Pixelchu',
      level: 25,
      hp: 85,
      attack: 92,
      defense: 65,
      speed: 78,
      type: 'Electric/Digital'
    },
    '⚡': {
      name: 'Voltbyte',
      level: 18,
      hp: 72,
      attack: 110,
      defense: 55,
      speed: 95,
      type: 'Electric'
    },
    '🏆': {
      name: 'Champmon',
      level: 35,
      hp: 120,
      attack: 88,
      defense: 95,
      speed: 72,
      type: 'Fighting/Steel'
    }
  };

  // 8-bit style button component with grey/green/purple theme
  const PixelButton = ({ children, onClick, variant = 'primary', className = '' }) => {
    const baseClasses = `
      font-mono text-sm font-bold uppercase tracking-wider
      border-2 border-solid transition-all duration-75
      active:translate-x-1 active:translate-y-1
      hover:brightness-110 cursor-pointer select-none
      px-4 py-2 min-w-[80px] text-center
    `;
    
    const variants = {
      primary: 'bg-gray-900 border-green-500 text-green-400 shadow-[0_0_10px_#10b981,0_0_20px_#10b981] hover:shadow-[0_0_15px_#10b981,0_0_25px_#10b981]',
      secondary: 'bg-gray-800 border-purple-500 text-purple-400 shadow-[0_0_10px_#8b5cf6] hover:shadow-[0_0_15px_#8b5cf6,0_0_25px_#8b5cf6]',
      accent: 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_#a855f7] hover:shadow-[0_0_15px_#a855f7,0_0_25px_#a855f7]'
    };

    return (
      <div 
        className={`${baseClasses} ${variants[variant]} ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  };

  // 8-bit style input component
  const PixelInput = ({ value, onChange, placeholder, className = '' }) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        font-mono text-lg font-bold bg-black text-green-400
        border-2 border-gray-600 px-4 py-3 w-full
        focus:border-green-500 focus:outline-none focus:shadow-[0_0_10px_#10b981]
        placeholder-gray-500 ${className}
      `}
    />
  );

  // 8-bit style stat card with different color combinations
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

  // Pokemon stats tooltip component
  const PokemonTooltip = ({ pokemon, isVisible, position }) => {
    if (!isVisible || !pokemon) return null;

    return (
      <div 
        className="fixed z-[9999] bg-black border-2 border-green-500 p-4 shadow-[0_0_20px_#10b981] 
                   min-w-[220px] pointer-events-none font-mono"
        style={{
          left: position.x + 10,
          top: position.y - 150,
        }}
      >
        <div className="text-green-400 font-bold text-lg mb-2">{pokemon.name}</div>
        <div className="text-purple-400 text-sm mb-2">Level {pokemon.level} • {pokemon.type}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">HP:</span>
            <span className="text-green-400">{pokemon.hp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Attack:</span>
            <span className="text-purple-400">{pokemon.attack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Defense:</span>
            <span className="text-gray-300">{pokemon.defense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Speed:</span>
            <span className="text-green-300">{pokemon.speed}</span>
          </div>
        </div>
      </div>
    );
  };

  // 8-bit style grid item - circular with mixed colors and hover stats
  const GridItem = ({ children, isEmpty = false, pokemonKey = null }) => {
    const handleMouseEnter = (e) => {
      if (pokemonKey) {
        setHoveredPokemon(pokemonData[pokemonKey]);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseMove = (e) => {
      if (pokemonKey && hoveredPokemon) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseLeave = () => {
      setHoveredPokemon(null);
    };

    return (
      <div 
        className={`
          aspect-square rounded-full border-2 border-solid flex items-center justify-center
          font-mono font-bold text-lg transition-all duration-300 relative
          w-32 h-32 cursor-pointer
          ${isEmpty 
            ? 'border-gray-700 bg-gray-900 text-gray-600' 
            : 'border-green-500 bg-gray-800 text-green-400 shadow-[0_0_10px_#10b981] hover:shadow-[0_0_15px_#10b981,0_0_25px_#10b981] hover:scale-105'
          }
        `}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      <style jsx>{`
        @keyframes multi-neon-pulse {
          0% {
            box-shadow: 0 0 5px #8b5cf6, 0 0 10px #10b981, 0 0 20px #6b7280;
          }
          50% {
            box-shadow: 0 0 10px #10b981, 0 0 20px #8b5cf6, 0 0 30px #6b7280;
          }
          100% {
            box-shadow: 0 0 15px #6b7280, 0 0 25px #8b5cf6, 0 0 35px #10b981;
          }
        }
        
        .multi-neon-border {
          animation: multi-neon-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Main container with multi-color neon border */}
      <div className="">
        

        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="mt-3 text-center">
          <div className="font-pixelify text-transparent bg-gray-400 bg-clip-text font-bold text-4xl mb-2 font-mono tracking-wider">
            POKIWARS
          </div>
                  </div>
          {/* Username Input */}
          <div className="flex-1">
            <PixelInput
              value={username}
              onChange={setUsername}
              placeholder="Enter username..."
            />
          </div>
          
          {/* TTL Friends Button */}
          <PixelButton variant="secondary">
             Friends
          </PixelButton>
          
          {/* EUR Button */}
          <PixelButton variant="accent" className="px-8">
            euros
          </PixelButton>
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
            <div className="mt-4">
              <PixelButton 
                variant="primary" 
                className="w-[50px] ml-[540px] py-4 text-lg mt-60"
                onClick={() => alert('Game started!')}
              >
                Log Out
              </PixelButton>
            </div>
          </div>

          {/* Right Panel - 3x2 Circular Grid */}
          <div className="bg-gray-800 border-2 bg-white/10 p-4 shadow-[0_0_15px_#8b5cf6]">
            <div className="grid grid-cols-2 grid-rows-3 gap-10 ml-30 ">
              <GridItem pokemonKey="🎮">🎮</GridItem>
              <GridItem isEmpty />
              <GridItem pokemonKey="⚡">⚡</GridItem>
              <GridItem isEmpty />
              <GridItem pokemonKey="🏆">🏆</GridItem>
              <GridItem isEmpty />
            </div>
          </div>
        </div>

        {/* Tooltip rendered at document level */}
        <PokemonTooltip 
          pokemon={hoveredPokemon} 
          isVisible={!!hoveredPokemon} 
          position={mousePosition}
        />

        {/* POKIWARS Title */}
        
      </div>
    </div>
  );
};

export default EightBitProfilePage;