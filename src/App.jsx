import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Map from './pages/Map.jsx';
import Profile from './pages/Profile.jsx';
import DynamicIslandNav from './components/DynamicIslandNav.jsx';
import AuthModal from './components/AuthModal.jsx';

// App is the root router. It owns AuthModal visibility so any page
// can trigger it via context/useAuth rather than each page managing
// its own modal state.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <DynamicIslandNav />
      <AuthModal />
    </>
  );
}
