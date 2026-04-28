import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Eye, EyeOff, MapPin } from 'lucide-react';
import './Auth.css';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    email: '', password: '', fullName: '',
    firstName: '', lastName: '', phone: '', documentId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
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
            <h1>Crea tu cuenta</h1>
            <p>Registrate para empezar a reservar experiencias</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="reg-firstName">Nombre</label>
                <input id="reg-firstName" name="firstName" className="input-field" placeholder="Juan" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label htmlFor="reg-lastName">Apellido</label>
                <input id="reg-lastName" name="lastName" className="input-field" placeholder="Perez" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-fullName">Nombre completo</label>
              <input id="reg-fullName" name="fullName" className="input-field" placeholder="Juan Perez" value={form.fullName} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">Correo electronico</label>
              <input id="reg-email" name="email" type="email" className="input-field" placeholder="tu@correo.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="reg-password">Contrasena</label>
              <div className="password-wrapper">
                <input id="reg-password" name="password" type={showPassword ? 'text' : 'password'} className="input-field" placeholder="Minimo 6 caracteres" value={form.password} onChange={handleChange} required />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="reg-phone">Telefono</label>
                <input id="reg-phone" name="phone" className="input-field" placeholder="+593991234567" value={form.phone} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label htmlFor="reg-documentId">Cedula / ID</label>
                <input id="reg-documentId" name="documentId" className="input-field" placeholder="1712345678" value={form.documentId} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : <><UserPlus size={18} /> Registrarse</>}
            </button>
          </form>

          <div className="auth-footer">
            <p>Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesion</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
