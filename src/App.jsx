import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import DynamicIslandNav from './components/DynamicIslandNav';
import ErrorBoundary from './components/ErrorBoundary'; // Imported safety boundary [13]
import Home from './pages/Home';
import MapPage from './pages/Map';
import Profile from './pages/Profile';

export default function App() {
  return (
    <ErrorBoundary> {/* Wraps the entire application stack [13] */}
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
    </ErrorBoundary>
  );
}