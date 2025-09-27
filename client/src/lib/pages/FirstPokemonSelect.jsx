import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { ethers } from "ethers";
import PokiNFTABI from "../abis/PokiNFT.json";

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";

export default function StarterAnimation({ userAddress, provider, pythRNG }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [showAnimation, setShowAnimation] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch base data from Supabase
  useEffect(() => {
    async function fetchPokemon() {
      const { data, error } = await supabase
        .from("pokemon_models")
        .select("*")
        .in("modelId", [1, 2, 3]); // Charizard, Venusaur, Blastoise

      if (error) console.error(error);
      else {
        // Add a "random" placeholder; stats will be set after RNG
        setPokemonList([...data, { name: "Random", modelId: 0, spriteUrl: "/placeholder.png" }]);
      }
    }
    fetchPokemon();
  }, []);

  // Handle user selection
  const handleSelect = async (pokemon) => {
    if (!provider) return alert("Connect wallet first!");
    setLoading(true);

    let chosenModelId = pokemon.modelId;

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
    <div className="starter-container">
      {showAnimation && <h2 className="animated-text">Choose your starter Pokémon!</h2>}

      <div className="pokemon-row">
        {pokemonList.map((pokemon, idx) => (
          <motion.div
            key={idx}
            className="pokemon-card"
            initial={{ y: -200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.3, type: "spring", stiffness: 500 }}
            onClick={() => handleSelect(pokemon)}
          >
            <img src={pokemon.spriteUrl} alt={pokemon.name} width={96} height={96} />
            <p>{pokemon.name}</p>
          </motion.div>
        ))}
      </div>

      {loading && <p>Minting your Pokémon NFT...</p>}

      <style jsx>{`
        .starter-container {
          text-align: center;
          padding: 2rem;
        }
        .animated-text {
          font-family: "Press Start 2P", monospace;
          font-size: 1.5rem;
          margin-bottom: 2rem;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0; }
        }
        .pokemon-row {
          display: flex;
          justify-content: center;
          gap: 2rem;
        }
        .pokemon-card {
          cursor: pointer;
          border: 2px solid gray;
          border-radius: 8px;
          padding: 0.5rem;
          background-color: #f8f8f8;
          transition: transform 0.2s, border-color 0.2s;
        }
        .pokemon-card:hover {
          transform: scale(1.1);
          border-color: gold;
        }
      `}</style>
    </div>
  );
}
