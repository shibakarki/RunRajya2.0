import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // Handles high-safety runtime catches
import DynamicIslandNav from './components/DynamicIslandNav';
import Home from './pages/Home';
import MapPage from './pages/Map';
import Profile from './pages/Profile';

export default function App() {
  return (
    <ErrorBoundary>
      {/* 
        Persistent Navigation Header:
        Because App is nested inside BrowserRouter in main.jsx, 
        DynamicIslandNav and Routes have full, clean access to router context.
      */}
      <DynamicIslandNav />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </ErrorBoundary>
  );
}