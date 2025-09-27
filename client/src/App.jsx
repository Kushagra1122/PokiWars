import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./components/Game";
import "./App.css";
import CreateLobby from "./pages/lobby/CreateLobby";
import LobbyRoom from "./pages/lobby/LobbyRoom";
import JoinLobby from "./pages/lobby/JoinLobby";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/lobby/create"element={<CreateLobby/>}/>
      <Route path="/lobby/join"element={<JoinLobby/>}/>
      <Route path="/lobby/room/:lobbyId"element={<LobbyRoom/>}/>
    </Routes>
  );
}

export default App;
