import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Phaser from "phaser";
import MarketScene from "../scenes/MarketScene";
import MainGameScene from "../scenes/MainGameScene";

export default function Marketplace() {
  const gameRef = useRef(null);
  const [activeScene, setActiveScene] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    try {
      // Optional data passed from main game
      const gameData = location.state?.gameData;
      const comingFromGame = !!gameData;

      const customMarketScene = class extends MarketScene {
        create() {
          setActiveScene("MarketScene");
          if (gameData) {
            this.registry.set("gameData", gameData);
          }
          super.create();
        }
      };

      const customMainScene = class extends MainGameScene {
        create() {
          setActiveScene("MainGameScene");
          super.create();
        }
      };

      const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#0f172a",
        parent: "marketplace-container",
        scene: [customMarketScene, customMainScene],
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

      // Always start with marketplace
      game.scene.start("MarketScene");

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
      console.error("Error initializing marketplace:", err);
      setError(err.message);
    }
  }, []);

  if (error) {
    return (
      <div className="w-screen h-screen bg-red-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Marketplace Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Reload Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-screen h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 overflow-hidden ${
        activeScene === "MainGameScene" ? "p-24" : ""
      }`}
    >
      <div
        id="marketplace-container"
        className="w-full h-full flex items-center justify-center rounded-lg shadow-2xl"
      />
    </div>
  );
}
