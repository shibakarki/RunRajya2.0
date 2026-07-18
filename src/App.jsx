import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DynamicIslandNav from './components/DynamicIslandNav';
import Home from './pages/Home';
import MapPage from './pages/Map';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Persistent Navigation Header */}
        <DynamicIslandNav />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}