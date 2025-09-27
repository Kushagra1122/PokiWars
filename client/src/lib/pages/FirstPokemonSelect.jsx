import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
import { ethers } from "ethers";
import PokiNFTABI from '../../consts/tokenabi.json'
import PokemonCard from "@/components/PokimonCard";

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";

export default function StarterAnimation({ userAddress, provider, pythRNG }) {

  const [main, setMain] = useState({ name: "Venusaur", type: "Grass", attack: 85, range: 4, exp: 30, level: 16, img: './venu-thumbnail.png', main: './venu.png' })
  const [loading, setLoading] = useState(false);

  const pokemonList = [
    { id: 1, species: "Blastoise", nickname: "Blastoise", type: "Water", attack: 25, range: 2, exp: 0, level: 1, img: './blastoise-thumbnail.png', main: './blast.png' },
    { id: 2, species: "Charizard", nickname: "Charizard", type: "Fire", attack: 25, range: 2, exp: 0, level: 1, img: './chariz-thumbnail.png', main: './chariz.png' },
    { id: 3, species: "Venusaur", nickname: "Venusaur", type: "Grass", attack: 25, range: 2, exp: 0, level: 1, img: './venu-thumbnail.png', main: './venu.png' },
  ];

  // Handle user selection
  const handleSelect = async (pokemon) => {
    if (!provider) return alert("Connect wallet first!");
    setLoading(true);
    let chosenModelId = pokemon.id;

    // If random, call Pyth RNG for modelId (1-3)
    if (chosenModelId === 0) {
      chosenModelId = await pythRNG(); // Returns 1, 2, or 3
      const { data } = await supabase
        .from("pokemon_models")
        .select("*")
        .eq("modelId", chosenModelId)
        .single();
      pokemon = data;
    }

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PokiNFTABI, signer);
      const tokenId = Math.floor(Date.now() / 1000);
      const tx = await contract.mintNFT(userAddress, tokenId, chosenModelId);
      await tx.wait();
      setSelected(chosenModelId);
      alert(`${pokemon.name} minted to your wallet!`);
    } catch (err) {
      console.error(err);
      alert("Mint failed");
    }
    setLoading(false);
  };

  return (
    <div className="bg-black h-screen w-full flex flex-col justify-center items-center font-pixelify text-white ">
      <div className="absolute  top-0 left-0 w-full h-full ">
        <img className="w-full h-full object-cover" src="./pokimonChoose.png" alt="" />
      </div>
      <h2 className="text-4xl mt-10 z-10 text-black">Choose your starter Pokémon!</h2>
      <div className="flex h-screen w-full justify-center items-center gap-20">
        {pokemonList.map((pokemon, index) => (
          <PokemonCard
            imageSrc={pokemon.img}
            key={index}
            name={pokemon.name}
            type={pokemon.type}
            attack={pokemon.attack}
            range={pokemon.range}
            exp={pokemon.exp}
            level={pokemon.level}
            onClick={() => handleSelect(pokemon)}
          />
        ))}
      </div>

      {loading && <p>Minting your Pokémon NFT...</p>}
    </div>
  );
}
