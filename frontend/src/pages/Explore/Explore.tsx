import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { attractionApi } from '../../api';
import { Search, MapPin, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import './Explore.css';

const Explore: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [attractions, setAttractions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const subcategoryId = searchParams.get('subcategoryId') || '';

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await attractionApi.getCategories();
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('[Explore] Error cargando categorias:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadAttractions = async () => {
      setLoading(true);
      try {
        const res = await attractionApi.getAll({
          page,
          pageSize: 12,
          search: search || undefined,
          subcategoryId: subcategoryId || undefined
        });
        const data = res.data.data;
        setAttractions(data?.items || []);
        setTotalPages(data?.totalPages || 0);
        setTotalCount(data?.totalCount || 0);
      } catch (err) {
        console.error('[Explore] Error cargando atracciones:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAttractions();
  }, [page, search, subcategoryId]);

  const [localSearch, setLocalSearch] = useState(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      params.set('search', localSearch);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="explore-page">
      <section className="explore-hero">
        <div className="container">
          <h1 className="explore-title">Explorar Atracciones</h1>
          <p className="explore-subtitle">{totalCount} experiencias disponibles</p>

          <form className="explore-search glass" onSubmit={handleSearch}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, ciudad..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Buscar</button>
          </form>
        </div>
      </section>

      <div className="explore-content container">
        {/* SIDEBAR DE FILTROS */}
        <aside className="explore-sidebar">
          <div className="filter-section glass-light">
            <h3 className="filter-title"><Filter size={16} /> Categorias</h3>
            <div className="filter-list">
              <button
                className={`filter-item ${!subcategoryId ? 'active' : ''}`}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('subcategoryId');
                  params.set('page', '1');
                  setSearchParams(params);
                }}
              >
                Todas
              </button>
              {categories.map((cat: any) => (
                <div key={cat.id} className="filter-group">
                  <span className="filter-group-label">{cat.name}</span>
                  {cat.subcategories?.map((sub: any) => (
                    <button
                      key={sub.id}
                      className={`filter-item ${subcategoryId === sub.id ? 'active' : ''}`}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('subcategoryId', sub.id);
                        params.set('page', '1');
                        setSearchParams(params);
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* GRID DE RESULTADOS */}
        <section className="explore-results">
          {loading ? (
            <div className="explore-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="attraction-card card skeleton-card">
                  <div className="attraction-img-wrapper">
                    <div className="attraction-img-placeholder skeleton-bg"><MapPin size={32} /></div>
                  </div>
                  <div className="card-body">
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-text"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : attractions.length > 0 ? (
            <>
              <div className="explore-grid">
                {attractions.map((attr: any) => (
                  <Link to={`/attraction/${attr.id}`} key={attr.id} className="attraction-card card">
                    <div className="attraction-img-wrapper">
                      {attr.media?.find((m: any) => m.is_main)?.url ? (
                        <img src={attr.media.find((m: any) => m.is_main)?.url} alt={attr.name} className="attraction-img" />
                      ) : (
                        <div className="attraction-img-placeholder">
                          <MapPin size={32} />
                        </div>
                      )}
                      <div className="attraction-badge-overlay">
                        <span className="badge badge-primary">
                          {attr.subcategory?.category?.name || 'Tour'}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h3 className="attraction-name">{attr.name}</h3>
                      <div className="attraction-meta">
                        <span className="attraction-location"><MapPin size={14} />{attr.city?.name || ''}</span>
                        <span className="attraction-rating"><Star size={14} />{Number(attr.rating_average || 0).toFixed(1)}</span>
                      </div>
                      <p className="attraction-desc">{attr.description_short || ''}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* PAGINACION */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => changePage(page - 1)}>
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <span className="pagination-info">Pagina {page} de {totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="explore-empty">
              <MapPin size={48} />
              <h3>No se encontraron atracciones</h3>
              <p>Intenta con otros filtros o terminos de busqueda</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Explore;
