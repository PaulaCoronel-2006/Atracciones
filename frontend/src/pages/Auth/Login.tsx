import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff, MapPin } from 'lucide-react';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-bg">
        <div className="hero-gradient-orb orb-1"></div>
        <div className="hero-gradient-orb orb-2"></div>
      </div>

      <div className="auth-container animate-slide-up">
        <div className="auth-card glass">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <MapPin size={32} className="logo-icon" />
            </Link>
            <h1>Bienvenido de vuelta</h1>
            <p>Inicia sesion para acceder a tus reservas</p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="login-email">Correo electronico</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Contrasena</label>
              <div className="password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <LogIn size={18} />
                  Iniciar Sesion
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              No tienes cuenta?{' '}
              <Link to="/register" className="auth-link">Registrate aqui</Link>
            </p>
          </div>

          <div className="auth-demo">
            <p className="auth-demo-label">Credenciales de prueba:</p>
            <code>admin@atracciones.com / Admin123!</code>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
