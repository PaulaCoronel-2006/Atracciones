import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Explore from './pages/Explore/Explore';
import AttractionDetail from './pages/AttractionDetail/AttractionDetail';
import MyBookings from './pages/MyBookings/MyBookings';
import AdminPanel from './pages/Admin/AdminPanel';
import './index.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/attraction/:id" element={<AttractionDetail />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
