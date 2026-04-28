import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <MapPin size={28} className="logo-icon" />
          <span className="logo-text">
            <span className="gradient-text">Atracciones</span>
          </span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/explore" className="nav-link" onClick={() => setMenuOpen(false)}>Explorar</Link>

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="nav-link nav-admin" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard size={16} />
                  Panel Admin
                </Link>
              )}
              <Link to="/my-bookings" className="nav-link" onClick={() => setMenuOpen(false)}>Mis Reservas</Link>
              <div className="nav-user-menu">
                <button className="nav-user-btn">
                  <User size={16} />
                  <span>{user?.fullName?.split(' ')[0] || user?.email}</span>
                </button>
                <div className="nav-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <User size={14} />
                    Mi Perfil
                  </Link>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={14} />
                    Cerrar Sesion
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="nav-auth-btns">
              <Link to="/login" className="btn btn-secondary btn-sm" onClick={() => setMenuOpen(false)}>
                Iniciar Sesion
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                Registrarse
              </Link>
            </div>
          )}
        </div>

        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
