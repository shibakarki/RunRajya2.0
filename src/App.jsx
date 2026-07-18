import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import DynamicIslandNav from './components/DynamicIslandNav.jsx';
import Home from './pages/Home.jsx';
import MapPage from './pages/Map.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          {/* Persistent Navigation Header */}
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