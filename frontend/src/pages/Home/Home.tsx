import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, Shield, Globe, ChevronRight, Sparkles } from 'lucide-react';
import { attractionApi, countryApi } from '../../api';
import './Home.css';

const Home: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredAttractions, setFeaturedAttractions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, attrRes] = await Promise.all([
          attractionApi.getCategories(),
          attractionApi.getAll({ page: 1, pageSize: 6 })
        ]);
        setCategories(catRes.data.data || []);
        setFeaturedAttractions(attrRes.data.data?.items || []);
      } catch (err) {
        console.error('[Home] Error cargando datos:', err);
      }
    };
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/explore?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <main className="home-page">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient-orb orb-1"></div>
          <div className="hero-gradient-orb orb-2"></div>
          <div className="hero-gradient-orb orb-3"></div>
        </div>

        <div className="hero-content container animate-slide-up">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Descubre experiencias unicas</span>
          </div>

          <h1 className="hero-title">
            Encuentra las mejores
            <br />
            <span className="gradient-text">atracciones turisticas</span>
          </h1>

          <p className="hero-subtitle">
            Reserva actividades, tours y experiencias en los destinos mas increibles.
            Todo en un solo lugar, con la mejor tarifa garantizada.
          </p>

          <form className="hero-search glass" onSubmit={handleSearch}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar atracciones, ciudades o actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
          </form>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Atracciones</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Ciudades</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">10k+</span>
              <span className="stat-label">Resenas</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="section-categories container">
        <div className="section-header">
          <h2 className="section-title">Explora por categoria</h2>
          <p className="section-desc">Encuentra la aventura perfecta para ti</p>
        </div>

        <div className="categories-grid">
          {categories.length > 0 ? categories.map((cat: any, index: number) => (
            <Link
              to={`/explore?category=${cat.id}`}
              key={cat.id}
              className="category-card glass-light"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="category-icon-wrapper">
                <Globe size={28} />
              </div>
              <h3 className="category-name">{cat.name}</h3>
              <span className="category-count">
                {cat.subcategories?.length || 0} subcategorias
              </span>
              <ChevronRight size={16} className="category-arrow" />
            </Link>
          )) : (
            ['Naturaleza', 'Cultura', 'Gastronomia', 'Entretenimiento', 'Bienestar'].map((name, i) => (
              <div key={i} className="category-card glass-light" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="category-icon-wrapper"><Globe size={28} /></div>
                <h3 className="category-name">{name}</h3>
                <span className="category-count">Explorando...</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ATRACCIONES DESTACADAS */}
      <section className="section-featured container">
        <div className="section-header">
          <h2 className="section-title">Atracciones destacadas</h2>
          <Link to="/explore" className="section-link">
            Ver todas <ChevronRight size={16} />
          </Link>
        </div>

        <div className="attractions-grid">
          {featuredAttractions.length > 0 ? featuredAttractions.map((attr: any, index: number) => (
            <Link
              to={`/attraction/${attr.id}`}
              key={attr.id}
              className="attraction-card card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="attraction-img-wrapper">
                <div className="attraction-img-placeholder">
                  <MapPin size={32} />
                </div>
                <div className="attraction-badge-overlay">
                  <span className="badge badge-primary">
                    {attr.subcategory?.category?.name || 'Tour'}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <h3 className="attraction-name">{attr.name}</h3>
                <div className="attraction-meta">
                  <span className="attraction-location">
                    <MapPin size={14} />
                    {attr.city?.name || 'Ubicacion'}
                  </span>
                  <span className="attraction-rating">
                    <Star size={14} />
                    {Number(attr.rating_average || 0).toFixed(1)}
                  </span>
                </div>
                <p className="attraction-desc">{attr.description_short || 'Descubre esta increible experiencia'}</p>
              </div>
            </Link>
          )) : (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="attraction-card card skeleton-card">
                <div className="attraction-img-wrapper">
                  <div className="attraction-img-placeholder skeleton-bg">
                    <MapPin size={32} />
                  </div>
                </div>
                <div className="card-body">
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-text"></div>
                  <div className="skeleton-line skeleton-text-short"></div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="section-benefits">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Por que elegirnos</h2>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card glass-light animate-fade-in">
              <div className="benefit-icon gradient-bg">
                <Shield size={28} />
              </div>
              <h3>Reserva Segura</h3>
              <p>Todas tus transacciones estan protegidas con encriptacion de grado bancario</p>
            </div>
            <div className="benefit-card glass-light animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="benefit-icon" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }}>
                <Calendar size={28} />
              </div>
              <h3>Cancelacion Flexible</h3>
              <p>Cancela hasta 24 horas antes sin cargo y recibe reembolso completo</p>
            </div>
            <div className="benefit-card glass-light animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="benefit-icon" style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)' }}>
                <Star size={28} />
              </div>
              <h3>Mejores Precios</h3>
              <p>Garantizamos los mejores precios con tarifas exclusivas en linea</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
