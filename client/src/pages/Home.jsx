import { Link } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-8">Multiplayer Game</h1>
      
      {!showOptions ? (
        <button
          onClick={() => setShowOptions(true)}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl font-semibold transition-colors"
        >
          Play Game
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-2xl mb-4">Choose Game Mode</h2>
          
          <div className="flex flex-col space-y-4 w-80">
            <Link
              to="/lobby/create"
              className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
            >
              🏠 Host Lobby
            </Link>
            
            <Link
              to="/lobby/join"
              className="bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
            >
              🚪 Join Lobby
            </Link>
          </div>
          
          <button
            onClick={() => setShowOptions(false)}
            className="mt-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
