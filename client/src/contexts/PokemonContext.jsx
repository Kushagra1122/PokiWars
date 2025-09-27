import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';
import minimalNFTABI from "../consts/nftabi.json";

const POKI_NFT_ADDRESS = "0x41b3df1beb4b8a4e07c266bc894bba7a0a1878fb";

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
  const [main, setMain] = useState(null);
  const [pokemonCollection, setPokemonCollection] = useState([]);

  async function fetchNFTsForAddress(address) {
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
          img: getImageFromTrait(parseInt(attributes.specialTrait.toString())),
          main: getMainImageFromTrait(parseInt(attributes.specialTrait.toString())),
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
      if (nfts.length > 0) setMain(nfts[0]);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setPokemonCollection([]);
      setMain(null);
    }
  }

  const updateMainPokemon = (pokemon) => setMain(pokemon);

  return (
    <PokemonContext.Provider value={{ main, pokemonCollection, setMain, setPokemonCollection, fetchNFTsForAddress, updateMainPokemon }}>
      {children}
    </PokemonContext.Provider>
  );
};
