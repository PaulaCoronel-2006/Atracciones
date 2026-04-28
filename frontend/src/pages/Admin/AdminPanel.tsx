import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attractionApi, countryApi, bookingApi } from '../../api';
import { LayoutDashboard, MapPin, Tag, Calendar, Users, Plus, ChevronDown, ChevronUp, Globe, Layers } from 'lucide-react';
import './AdminPanel.css';

type Tab = 'overview' | 'attractions' | 'categories' | 'bookings';

const AdminPanel: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ attractions: 0, bookings: 0, categories: 0, countries: 0 });
  const [attractions, setAttractions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showForm, setShowForm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    loadAll();
  }, [isAuthenticated, isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [attrRes, catRes, bookRes, countryRes] = await Promise.all([
        attractionApi.getAll({ page: 1, pageSize: 100 }),
        attractionApi.getCategories(),
        bookingApi.getAll({ page: 1, pageSize: 100 }),
        countryApi.getAll({ page: 1, pageSize: 100 })
      ]);

      const attrData = attrRes.data.data?.items || [];
      const catData = catRes.data.data || [];
      const bookData = bookRes.data.data?.items || [];
      const countryData = countryRes.data.data?.items || [];

      setAttractions(attrData);
      setCategories(catData);
      setBookings(bookData);
      setCountries(countryData);
      setStats({
        attractions: attrData.length,
        bookings: bookData.length,
        categories: catData.length,
        countries: countryData.length
      });
    } catch (err) {
      console.error('[Admin] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await attractionApi.createCategory({ name: formData.name, description: formData.description });
      setFormSuccess('Categoria creada exitosamente');
      setFormData({});
      setShowForm('');
      await loadAll();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al crear');
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await attractionApi.createSubcategory(formData.categoryId, { name: formData.name, description: formData.description });
      setFormSuccess('Subcategoria creada exitosamente');
      setFormData({});
      setShowForm('');
      await loadAll();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al crear');
    }
  };

  const tabItems = [
    { key: 'overview' as Tab, label: 'Resumen', icon: <LayoutDashboard size={18} /> },
    { key: 'attractions' as Tab, label: 'Atracciones', icon: <MapPin size={18} /> },
    { key: 'categories' as Tab, label: 'Categorias', icon: <Layers size={18} /> },
    { key: 'bookings' as Tab, label: 'Reservas', icon: <Calendar size={18} /> }
  ];

  return (
    <main className="admin-page">
      <div className="container">
        <div className="admin-header animate-fade-in">
          <h1><LayoutDashboard size={28} /> Panel de Administracion</h1>
        </div>

        {/* TABS */}
        <div className="admin-tabs glass-light">
          {tabItems.map(tab => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {formSuccess && <div className="form-success">{formSuccess}</div>}
        {formError && <div className="auth-error" style={{ marginBottom: '1rem' }}>{formError}</div>}

        {/* TAB: RESUMEN */}
        {activeTab === 'overview' && (
          <div className="admin-overview animate-fade-in">
            <div className="stats-grid">
              <div className="stat-card glass-light">
                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <MapPin size={24} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-number">{stats.attractions}</span>
                  <span className="stat-card-label">Atracciones</span>
                </div>
              </div>
              <div className="stat-card glass-light">
                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }}>
                  <Calendar size={24} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-number">{stats.bookings}</span>
                  <span className="stat-card-label">Reservas</span>
                </div>
              </div>
              <div className="stat-card glass-light">
                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent-violet), #7c3aed)' }}>
                  <Layers size={24} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-number">{stats.categories}</span>
                  <span className="stat-card-label">Categorias</span>
                </div>
              </div>
              <div className="stat-card glass-light">
                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)' }}>
                  <Globe size={24} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-number">{stats.countries}</span>
                  <span className="stat-card-label">Paises</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ATRACCIONES */}
        {activeTab === 'attractions' && (
          <div className="admin-section animate-fade-in">
            <div className="section-top">
              <h2>Atracciones ({attractions.length})</h2>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ciudad</th>
                    <th>Categoria</th>
                    <th>Rating</th>
                    <th>Resenas</th>
                  </tr>
                </thead>
                <tbody>
                  {attractions.map((a: any) => (
                    <tr key={a.id}>
                      <td className="td-name">{a.name}</td>
                      <td>{a.city?.name || '-'}</td>
                      <td><span className="badge badge-primary">{a.subcategory?.name || '-'}</span></td>
                      <td className="td-rating">{Number(a.rating_average || 0).toFixed(1)}</td>
                      <td>{a.total_reviews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CATEGORIAS */}
        {activeTab === 'categories' && (
          <div className="admin-section animate-fade-in">
            <div className="section-top">
              <h2>Categorias y Subcategorias</h2>
              <div className="section-actions">
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(showForm === 'category' ? '' : 'category')}>
                  <Plus size={14} /> Nueva Categoria
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(showForm === 'subcategory' ? '' : 'subcategory')}>
                  <Plus size={14} /> Nueva Subcategoria
                </button>
              </div>
            </div>

            {showForm === 'category' && (
              <form className="admin-form glass-light" onSubmit={handleCreateCategory}>
                <h3>Crear Categoria</h3>
                <input className="input-field" placeholder="Nombre" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <input className="input-field" placeholder="Descripcion" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                <button type="submit" className="btn btn-primary btn-sm">Crear</button>
              </form>
            )}

            {showForm === 'subcategory' && (
              <form className="admin-form glass-light" onSubmit={handleCreateSubcategory}>
                <h3>Crear Subcategoria</h3>
                <select className="input-field" value={formData.categoryId || ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                  <option value="">Seleccionar categoria padre</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="input-field" placeholder="Nombre" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <input className="input-field" placeholder="Descripcion" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                <button type="submit" className="btn btn-primary btn-sm">Crear</button>
              </form>
            )}

            <div className="categories-admin-grid">
              {categories.map((cat: any) => (
                <div key={cat.id} className="category-admin-card glass-light">
                  <h3>{cat.name}</h3>
                  {cat.description && <p className="cat-desc">{cat.description}</p>}
                  <div className="subcats-list">
                    {cat.subcategories?.length > 0 ? cat.subcategories.map((sub: any) => (
                      <span key={sub.id} className="badge badge-primary">{sub.name}</span>
                    )) : <span className="no-subs">Sin subcategorias</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: RESERVAS */}
        {activeTab === 'bookings' && (
          <div className="admin-section animate-fade-in">
            <div className="section-top">
              <h2>Reservas ({bookings.length})</h2>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>PNR</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Creada</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => {
                    const st = (b.status as string) || 'pending';
                    return (
                      <tr key={b.id}>
                        <td className="td-pnr">{b.pnr_code}</td>
                        <td><span className={`badge ${st === 'confirmed' ? 'badge-success' : st === 'cancelled' ? 'badge-danger' : st === 'completed' ? 'badge-primary' : 'badge-warning'}`}>{st}</span></td>
                        <td>{b.slot?.slot_date || '-'}</td>
                        <td>${Number(b.total_amount || 0).toFixed(2)}</td>
                        <td>${Number(b.total_paid || 0).toFixed(2)}</td>
                        <td>{new Date(b.created_at).toLocaleDateString('es')}</td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No hay reservas registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminPanel;
