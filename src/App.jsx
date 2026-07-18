import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import DynamicIslandNav from './components/DynamicIslandNav';
import Home from './pages/Home';
import MapPage from './pages/Map';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          {/* 
            Mounting the navigation menu globally ensures the header (on desktop) 
            and the Dynamic Island pill (on mobile) persist across pages
            without re-rendering or interrupting active sensor/run states.
          */}
          <DynamicIslandNav />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Router>
      </SessionProvider>
    </AuthProvider>
  );
}