// src/components/Market.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Phaser from "phaser";
import MarketScene from "../scenes/MarketScene";
import ShopDialog from "./BuySellCard";  // ✅ React overlay
import useContracts from "../useContracts";

export default function Market() {
  const gameRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ control shop dialog
  const [shopOpen, setShopOpen] = useState(false);

  const location = useLocation();


  useEffect(() => {
    let game = null;

    try {
      if (!gameRef.current) {
        const config = {
          type: Phaser.AUTO,
          width: window.innerWidth,
          height: window.innerHeight,
          parent: "phaser-container",
          backgroundColor: "#1a1a2e",
          physics: {
            default: "arcade",
            arcade: { debug: false, gravity: { y: 0 } },
          },
          scene: [MarketScene],
          scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        };

        game = new Phaser.Game(config);
        gameRef.current = game;

        // Pass data to Phaser scene
        game.registry.set("gameData", { fromRoute: "/market", timestamp: Date.now() });

        // Wait for scene ready
        game.events.once("ready", () => {
          setTimeout(() => setLoading(false), 1000);
        });

        // Listen for Phaser events to open/close React overlay
        game.events.on("openShop", () => setShopOpen(true));
        game.events.on("closeShop", () => setShopOpen(false));

        // Listen for ENTER / ESC keys globally
        const handleKey = (e) => {
          if (e.key === "Enter") setShopOpen(true);
          if (e.key === "Escape") setShopOpen(false);
        };
        window.addEventListener("keydown", handleKey);

        // Handle window resize
        const handleResize = () => {
          if (game && !game.isDestroyed) game.scale.resize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        // Cleanup listeners
        return () => {
          window.removeEventListener("resize", handleResize);
          window.removeEventListener("keydown", handleKey);
          if (gameRef.current) {
            gameRef.current.destroy(true);
            gameRef.current = null;
          }
        };
      }
    } catch (err) {
      console.error("Error initializing market:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4 text-red-400">Market Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-x-4">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">Retry</button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-gray-900 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Marketplace</h2>
            <p className="text-lg text-gray-300 mb-4">Preparing your shopping experience...</p>
            <div className="flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation header */}
      <div className="absolute top-4 left-4 z-40 flex items-center space-x-4">
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors">← Back to Dashboard</button>
        <div className="text-white font-bold text-lg">PokiWars Marketplace</div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 z-40 text-white bg-black bg-opacity-70 p-4 rounded-lg border border-gray-600">
        <h3 className="text-sm font-bold mb-2">Controls:</h3>
        <div className="text-xs space-y-1">
          <p>• Arrow Keys or WASD: Move camera</p>
          <p>• Click: Pan to location</p>
          <p>• ESC: Reset view</p>
          <p>• Click shops to interact</p>
        </div>
      </div>

      {/* Mini map / info */}
      <div className="absolute top-4 right-4 z-40 text-white bg-black bg-opacity-70 p-3 rounded-lg border border-gray-600">
        <h3 className="text-sm font-bold">Marketplace</h3>
        <p className="text-xs text-gray-300">Explore shops and trade items</p>
      </div>

      {/* Phaser container */}
      <div id="phaser-container" className="w-full h-full" style={{ width: "100%", height: "100vh" }} />

      {/* React Shop overlay */}
      <ShopDialog
        open={shopOpen}
        onClose={() => setShopOpen(false)}
      />
    </div>
  );
}
