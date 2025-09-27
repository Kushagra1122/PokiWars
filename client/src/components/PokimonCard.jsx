import React from 'react';

const PokemonCard = ({ 
  name = "Pokemon", 
  type = "Normal", 
  attack = 50, 
  range = 3, 
  exp = 60, 
  level = 5, 
  imageSrc = "",
  onClick 
}) => {
  const expPercentage = Math.min((exp / 100) * 100, 100);
  
  return (
    <div 
      className="h-70 w-50 relative overflow-hidden rounded-lg border-2 border-white/30 cursor-pointer hover:border-white/50 transition-all duration-200 hover:scale-102"
      onClick={onClick}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-gray-700"
        style={{
          backgroundImage: imageSrc ? `url(${imageSrc})` : 'none'
        }}
      />
      
      {/* Overlay gradient for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Stats Container - Bottom Half */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/60 backdrop-blur-sm p-3 text-white">
        <div className="flex flex-col h-full justify-between text-sm">
          {/* Top row: Name and Type */}
          <div className="flex justify-between items-start mb-2">
            <div className="bg-black/40 px-2 py-1 rounded border border-white/30 text-xs font-bold">
              {name}
            </div>
            <div className="bg-black/40 px-2 py-1 rounded border border-white/30 text-xs">
              {type}
            </div>
          </div>
          
          {/* Middle row: Attack and Range */}
          <div className="flex justify-between mb-2">
            <div className="bg-black/40 px-2 py-1 rounded border border-white/30 text-xs">
              ATK: {attack}
            </div>
            <div className="bg-black/40 px-2 py-1 rounded border border-white/30 text-xs">
              RNG: {range}
            </div>
          </div>
          
          {/* Bottom row: EXP bar and Level */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-xs text-blue-300 mb-1">EXP</div>
              <div className="w-full bg-gray-600 rounded-full h-2 border border-white/20">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${expPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-300 mt-1">{exp}/100</div>
            </div>
            
            <div className="bg-black/40 px-2 py-1 rounded border border-white/30 text-xs font-bold">
              Lv.{level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default PokemonCard;