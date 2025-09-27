import React, { createContext, useContext, useState, useEffect } from 'react'

const PokemonContext = createContext()

export const usePokemon = () => {
  const context = useContext(PokemonContext)
  if (!context) {
    throw new Error('usePokemon must be used within a PokemonProvider')
  }
  return context
}

export const PokemonProvider = ({ children }) => {
  // Default main Pokemon state
  const [main, setMain] = useState({ 
    name: "Venusaur", 
    type: "Grass", 
    attack: 85, 
    range: 4, 
    exp: 30, 
    level: 16, 
    img: './venu-thumbnail.png', 
    main: './venu.png' 
  })

  // Sample Pokemon collection
  const [pokemonCollection, setPokemonCollection] = useState([
    { name: "Pikachu", type: "Electric", attack: 75, range: 4, exp: 85, level: 12, img: './venu-thumbnail.png', main: './venu.png' },
    { name: "Charizard", type: "Fire", attack: 95, range: 5, exp: 45, level: 18, img: './blastoise-thumbnail.png', main: './blast.png' },
    { name: "Blastoise", type: "Water", attack: 80, range: 3, exp: 90, level: 15, img: './chariz-thumbnail.png', main: './chariz.png' },
    { name: "Venusaur", type: "Grass", attack: 85, range: 4, exp: 30, level: 16, img: './venu-thumbnail.png', main: './venu.png' },
    { name: "Alakazam", type: "Psychic", attack: 70, range: 6, exp: 65, level: 20, img: './blastoise-thumbnail.png', main: './blast.png' },
    { name: "Machamp", type: "Fighting", attack: 100, range: 2, exp: 10, level: 14, img: './chariz-thumbnail.png', main: './chariz.png' }
  ])

  // Load main Pokemon from localStorage on mount
  useEffect(() => {
    const savedMain = localStorage.getItem('mainPokemon')
    if (savedMain) {
      try {
        setMain(JSON.parse(savedMain))
      } catch (error) {
        console.error('Error parsing saved main Pokemon:', error)
      }
    }
  }, [])

  // Save main Pokemon to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mainPokemon', JSON.stringify(main))
  }, [main])

  // Update main Pokemon
  const updateMainPokemon = (pokemon) => {
    setMain(pokemon)
  }

  // Add new Pokemon to collection
  const addPokemonToCollection = (pokemon) => {
    setPokemonCollection(prev => {
      // Check if Pokemon already exists
      const exists = prev.some(p => p.name === pokemon.name)
      if (!exists) {
        return [...prev, pokemon]
      }
      return prev
    })
  }

  // Remove Pokemon from collection
  const removePokemonFromCollection = (pokemonName) => {
    setPokemonCollection(prev => prev.filter(p => p.name !== pokemonName))
  }

  // Update Pokemon in collection
  const updatePokemonInCollection = (pokemonName, updatedPokemon) => {
    setPokemonCollection(prev => 
      prev.map(p => p.name === pokemonName ? updatedPokemon : p)
    )
  }

  // Get Pokemon by name
  const getPokemonByName = (name) => {
    return pokemonCollection.find(p => p.name === name)
  }

  // Clear all Pokemon data
  const clearPokemonData = () => {
    setMain({ 
      name: "Venusaur", 
      type: "Grass", 
      attack: 85, 
      range: 4, 
      exp: 30, 
      level: 16, 
      img: './venu-thumbnail.png', 
      main: './venu.png' 
    })
    setPokemonCollection([
      { name: "Pikachu", type: "Electric", attack: 75, range: 4, exp: 85, level: 12, img: './venu-thumbnail.png', main: './venu.png' },
      { name: "Charizard", type: "Fire", attack: 95, range: 5, exp: 45, level: 18, img: './blastoise-thumbnail.png', main: './blast.png' },
      { name: "Blastoise", type: "Water", attack: 80, range: 3, exp: 90, level: 15, img: './chariz-thumbnail.png', main: './chariz.png' },
      { name: "Venusaur", type: "Grass", attack: 85, range: 4, exp: 30, level: 16, img: './venu-thumbnail.png', main: './venu.png' },
      { name: "Alakazam", type: "Psychic", attack: 70, range: 6, exp: 65, level: 20, img: './blastoise-thumbnail.png', main: './blast.png' },
      { name: "Machamp", type: "Fighting", attack: 100, range: 2, exp: 10, level: 14, img: './chariz-thumbnail.png', main: './chariz.png' }
    ])
    localStorage.removeItem('mainPokemon')
  }

  const value = {
    main,
    pokemonCollection,
    updateMainPokemon,
    addPokemonToCollection,
    removePokemonFromCollection,
    updatePokemonInCollection,
    getPokemonByName,
    clearPokemonData
  }

  return (
    <PokemonContext.Provider value={value}>
      {children}
    </PokemonContext.Provider>
  )
}
