import React, { createContext, useContext, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import minimalNFTABI from "../consts/nftabi.json";

const POKI_NFT_ADDRESS = "0x2215a0ccaeb7949c80c9e71aaf54d8cf0993b5b7";

const PokemonContext = createContext();

export const usePokemon = () => {
  const context = useContext(PokemonContext);
  if (!context) throw new Error('usePokemon must be used within a PokemonProvider');
  return context;
};

// Helper functions to get type and images based on specialTrait
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

export const PokemonProvider = ({ children }) => {
  const [main, setMain] = useState(() => {
    // Load main Pokemon from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mainPokemon');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [pokemonCollection, setPokemonCollection] = useState([]);

  const fetchNFTsForAddress = useCallback(async (address) => {
    if (!address) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(POKI_NFT_ADDRESS, minimalNFTABI, provider);
      const balance = await contract.balanceOf(address);

      const nfts = [];
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        const tokenURI = await contract.tokenURI(tokenId);
        const attributes = await contract.getAttributes(tokenId);

        // Use tokenURI directly as image URL (since metadataURI stores image URLs directly)
        let actualImage = getImageFromTrait(parseInt(attributes.specialTrait.toString()));
        let actualMainImage = getMainImageFromTrait(parseInt(attributes.specialTrait.toString()));
        let actualName = `PokiNFT #${tokenId.toString()}`;
        let actualType = getTypeFromTrait(parseInt(attributes.specialTrait.toString()));
        
        // Check if tokenURI is a valid image URL
        if (tokenURI && (tokenURI.includes('http') || tokenURI.includes('https'))) {
          // Use tokenURI directly as the image URL
          actualImage = tokenURI;
          actualMainImage = tokenURI;
          console.log(`Using tokenURI as image for token ${tokenId}:`, tokenURI);
          
          // Map Pokemon based on the image URL pattern
          const pokemonMapping = {
            'blastoise': { name: 'Blastoise', type: 'Water' },
            'chariz': { name: 'Charizard', type: 'Fire' },
            'venu': { name: 'Venusaur', type: 'Grass' },
            'geng': { name: 'Gengar', type: 'Ghost' },
            'alak': { name: 'Alakazam', type: 'Psychic' },
            'snor': { name: 'Snorlax', type: 'Normal' }
          };
          
          // Try to match the Pokemon based on the URL
          const urlLower = tokenURI.toLowerCase();
          for (const [key, pokemon] of Object.entries(pokemonMapping)) {
            if (urlLower.includes(key)) {
              actualName = pokemon.name;
              actualType = pokemon.type;
              console.log(`Matched Pokemon: ${pokemon.name} (${pokemon.type})`);
              break;
            }
          }
        } else {
          console.warn(`Invalid tokenURI for token ${tokenId}:`, tokenURI);
        }

        const pokemonData = {
          tokenId: tokenId.toNumber(),
          name: actualName,
          type: actualType,
          attack: parseInt(attributes.attack.toString()),
          range: Math.floor(parseInt(attributes.radius.toString()) / 3),
          exp: parseInt(attributes.xp.toString()),
          level: parseInt(attributes.level.toString()),
          health: parseInt(attributes.health.toString()),
          defense: parseInt(attributes.defense.toString()),
          speed: parseInt(attributes.speed.toString()),
          img: actualImage,
          main: actualMainImage,
          metadataURI: tokenURI,
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

        nfts.push(pokemonData);
      }

      setPokemonCollection(nfts);
      // Only set main to first NFT if no main is currently selected
      if (nfts.length > 0 && !main) {
        setMain(nfts[0]);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setPokemonCollection([]);
      setMain(null);
    }
  }, []); // No dependencies needed

  const updateMainPokemon = (pokemon) => {
    setMain(pokemon);
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      if (pokemon) {
        localStorage.setItem('mainPokemon', JSON.stringify(pokemon));
      } else {
        localStorage.removeItem('mainPokemon');
      }
    }
  };

  return (
    <PokemonContext.Provider value={{ main, pokemonCollection, setMain, setPokemonCollection, fetchNFTsForAddress, updateMainPokemon }}>
      {children}
    </PokemonContext.Provider>
  );
};
