import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EightBitProfilePage from "./pages/Profile";

function App() {
  return (
    <>
      {/* <Dashboard/> */}
      <EightBitProfilePage/>
      {/* <LandingPage/> */}
      {/* <Profile/> */}
    </>
  );
}

export default App;
