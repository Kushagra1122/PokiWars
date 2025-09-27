import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Phaser from "phaser";
import SelectScene from "../scenes/SelectScene";
import MainGameScene from "../scenes/MainGameScene";

export default function Game() {
  const gameRef = useRef(null);
  const [activeScene, setActiveScene] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    try {
    // Get game data from location state (from lobby)
    const gameData = location.state?.gameData;
    const comingFromLobby = !!gameData;

    const customSelectScene = class extends SelectScene {
      create() {
        setActiveScene("SelectScene");
        super.create();
      }
    };

    const customMainScene = class extends MainGameScene {
      create() {
        setActiveScene("MainGameScene");
        // If coming from lobby, set the player data
        if (comingFromLobby && gameData) {
          // Find the current player's character from the game data
          const currentPlayerId = gameData.playersWithCharacters && Object.keys(gameData.playersWithCharacters).find(id => 
            gameData.playersWithCharacters[id].id === gameData.currentPlayerId
          );
          
          let selectedChar = 'ALAKAZAM';
          if (currentPlayerId && gameData.playersWithCharacters[currentPlayerId]) {
            selectedChar = gameData.playersWithCharacters[currentPlayerId].char;
          } else if (gameData.playerCharacter) {
            selectedChar = gameData.playerCharacter;
          } else if (gameData.players && gameData.players.length > 0) {
            // Try to find player by some other means
            const player = gameData.players.find(p => p.char);
            if (player) selectedChar = player.char;
          }
          
          console.log(`Setting character from lobby: ${selectedChar}`);
          this.registry.set("selectedCharacter", selectedChar);
          this.registry.set("allPlayers", gameData.players);
          this.registry.set("gameSettings", gameData.settings);
          this.registry.set("gameData", gameData);
        }
        super.create();
      }
    };

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#1e293b",
      parent: "game-container",
      scene: [customSelectScene, customMainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: "100%",
        height: "100%",
      },
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
      input: { smoothFactor: 0.2, queue: true },
      render: { antialias: true, pixelArt: false, roundPixels: false },
      fps: { target: 60, forceSetTimeOut: true },
      dom: { createContainer: true },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Start the appropriate scene based on whether we came from lobby
    if (comingFromLobby) {
      // Skip character selection and go directly to main game
      game.scene.start("mainGame");
    }
    // Otherwise SelectScene will start by default

    const handleResize = () => {
      if (game && !game.isDestroyed) {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        game.scale.resize(newWidth, newHeight);

        game.scene.scenes.forEach((scene) => {
          if (scene.cameras && scene.cameras.main) {
            scene.cameras.main.setBounds(0, 0, newWidth, newHeight);
          }
        });
      }
    };

    const handleVisibilityChange = () => {
      if (game && !game.isDestroyed) {
        if (document.hidden) {
          game.sound.pauseAll();
          game.loop.sleep();
        } else {
          game.sound.resumeAll();
          game.loop.wake();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (game && !game.isDestroyed) {
        game.destroy(true, false);
      }
    };
    } catch (err) {
      console.error("Error initializing game:", err);
      setError(err.message);
    }
  }, []);

  if (error) {
    return (
      <div className="w-screen h-screen bg-red-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Reload Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-screen h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden game-ui ${
        activeScene === "MainGameScene" ? "p-24" : ""
      }`}
    >
      <div
        id="game-container"
        className="w-full h-full flex items-center justify-center rounded-lg shadow-2xl"
      />
    </div>
  );
}