import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-8">Multiplayer Game</h1>
      <Link
        to="/game"
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-xl font-semibold transition-colors"
      >
        Start Game
      </Link>
    </div>
  );
}
