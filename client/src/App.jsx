import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./components/Game";
import "./App.css";
import NFTTestPage from "./lib/pages/NFTTest";
import CreateLobby from "./pages/lobby/CreateLobby";
import LobbyRoom from "./pages/lobby/LobbyRoom";
import JoinLobby from "./pages/lobby/JoinLobby";
import LandingPage from "./lib/pages/LandingPage";
import Dashboard from "./lib/pages/Dashboard";
import Profile from "./lib/pages/Profile";
import StarterAnimation from "./lib/pages/FirstPokemonSelect";
import { UserProvider } from "./contexts/UserContext";
import { PokemonProvider } from "./contexts/PokemonContext";
import Market from "./components/Market";

function App() {
  return (
    <>
      <UserProvider>
        <PokemonProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/first" element={<StarterAnimation />} />
            <Route path="/nft" element={<NFTTestPage />} />
            <Route path="/game" element={<Game />} />
            <Route path="/market" element={<Market />} />
            <Route path="/lobby/create" element={<CreateLobby />} />
            <Route path="/lobby/join" element={<JoinLobby />} />
            <Route path="/lobby/room/:lobbyId" element={<LobbyRoom />} />
          </Routes>
        </PokemonProvider>
      </UserProvider>
    </>
  );
}

export default App;