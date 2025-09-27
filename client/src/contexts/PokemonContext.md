# PokemonContext

A global React context for managing Pokemon data across the application.

## Features

- **Main Pokemon Management**: Store and update the selected main Pokemon
- **Pokemon Collection**: Manage a collection of Pokemon
- **Local Storage Persistence**: Automatically saves main Pokemon to localStorage
- **Collection Management**: Add, remove, and update Pokemon in collection
- **Search Functionality**: Find Pokemon by name

## Usage

### 1. Import the hook
```jsx
import { usePokemon } from '@/contexts/PokemonContext'
```

### 2. Use in any component
```jsx
function MyComponent() {
  const { 
    main, 
    pokemonCollection, 
    updateMainPokemon, 
    addPokemonToCollection 
  } = usePokemon()
  
  return (
    <div>
      <h2>Main Pokemon: {main.name}</h2>
      <p>Collection: {pokemonCollection.length} Pokemon</p>
    </div>
  )
}
```

## Available Properties

- `main`: Current main Pokemon object
- `pokemonCollection`: Array of all Pokemon in collection

## Available Methods

- `updateMainPokemon(pokemon)`: Set a new main Pokemon
- `addPokemonToCollection(pokemon)`: Add Pokemon to collection (prevents duplicates)
- `removePokemonFromCollection(pokemonName)`: Remove Pokemon from collection
- `updatePokemonInCollection(pokemonName, updatedPokemon)`: Update specific Pokemon
- `getPokemonByName(name)`: Find Pokemon by name
- `clearPokemonData()`: Reset all Pokemon data to defaults

## Pokemon Object Structure

```jsx
{
  name: "Pikachu",
  type: "Electric", 
  attack: 75,
  range: 4,
  exp: 85,
  level: 12,
  img: './venu-thumbnail.png',    // Thumbnail image
  main: './venu.png'              // Main display image
}
```

## Auto-save Features

- **Main Pokemon**: Automatically saved to localStorage when changed
- **Collection**: Managed in memory (can be extended to persist if needed)
- **Persistence**: Main Pokemon persists across page refreshes and app restarts

## Context Provider

The `PokemonProvider` is already set up in `App.jsx` and wraps the entire application, so you can use the `usePokemon` hook in any component within the app.

## Example: Switching Main Pokemon

```jsx
function PokemonSelector() {
  const { main, pokemonCollection, updateMainPokemon } = usePokemon()
  
  const handleSelect = (pokemon) => {
    updateMainPokemon(pokemon)
    console.log(`Selected ${pokemon.name} as main Pokemon!`)
  }
  
  return (
    <div>
      <h3>Current Main: {main.name}</h3>
      <div className="pokemon-grid">
        {pokemonCollection.map(pokemon => (
          <button 
            key={pokemon.name}
            onClick={() => handleSelect(pokemon)}
            className={main.name === pokemon.name ? 'selected' : ''}
          >
            {pokemon.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```
