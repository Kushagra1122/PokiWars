import { Routes, Route } from "react-router-dom";
import Home from "./lib/pages/Home";
import LandingPage from "./lib/pages/LandingPage";
import "./App.css";
import Dashboard from "./lib/pages/Dashboard";
import Profile from "./lib/pages/Profile";
import StarterAnimation from "./lib/pages/FirstPokemonSelect";

function App() {
  return (
    <>
        
        <Profile/>
        {/* <LandingPage/> */}
        {/* <Dashboard/> */}
        {/* <StarterAnimation/> */}

        {/* <Routes>  
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes> */}
    </>
  );
}

export default App;
