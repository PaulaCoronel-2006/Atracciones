import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookingApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MapPin, Clock, Tag, Search, ChevronRight, X } from 'lucide-react';
import './MyBookings.css';

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: 'Pendiente', className: 'badge-warning' },
  confirmed: { text: 'Confirmada', className: 'badge-success' },
  completed: { text: 'Completada', className: 'badge-primary' },
  cancelled: { text: 'Cancelada', className: 'badge-danger' }
};

const MyBookings: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pnrSearch, setPnrSearch] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadBookings();
  }, [isAuthenticated]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAll({ page: 1, pageSize: 50 });
      setBookings(res.data.data?.items || []);
    } catch (err) {
      console.error('[Bookings] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    if (!pnrSearch.trim()) return;

    try {
      const res = await bookingApi.searchByPnr(pnrSearch.trim());
      setSearchResult(res.data.data);
    } catch (err: any) {
      setSearchError(err.response?.data?.message || 'No se encontro la reserva');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Seguro que deseas cancelar esta reserva?')) return;
    setCancellingId(id);
    try {
      await bookingApi.cancel(id, 'Cancelado por el usuario');
      await loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="bookings-page">
      <div className="container">
        <div className="bookings-header animate-fade-in">
          <h1>Mis Reservas</h1>
          <p>Gestiona y consulta todas tus reservaciones</p>
        </div>

        {/* BUSCAR POR PNR */}
        <div className="pnr-search-section glass-light animate-fade-in">
          <h3>Buscar por codigo PNR</h3>
          <form className="pnr-search-form" onSubmit={handlePnrSearch}>
            <input
              className="input-field"
              placeholder="Ej: AB12CD34"
              value={pnrSearch}
              onChange={(e) => setPnrSearch(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <button type="submit" className="btn btn-primary">
              <Search size={16} /> Buscar
            </button>
          </form>
          {searchError && <p className="search-error">{searchError}</p>}
          {searchResult && (
            <div className="search-result card">
              <div className="card-body">
                <div className="booking-row">
                  <div>
                    <span className="booking-pnr">{searchResult.pnr_code}</span>
                    <span className={`badge ${statusLabels[searchResult.status]?.className}`}>
                      {statusLabels[searchResult.status]?.text}
                    </span>
                  </div>
                  <span className="booking-total">${Number(searchResult.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LISTA DE RESERVAS */}
        <div className="bookings-list">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="card booking-card-skeleton">
                <div className="card-body">
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-text"></div>
                </div>
              </div>
            ))
          ) : bookings.length > 0 ? (
            bookings.map((booking: any) => (
              <div key={booking.id} className="card booking-list-card animate-fade-in">
                <div className="card-body">
                  <div className="booking-card-header">
                    <div className="booking-card-left">
                      <span className="booking-pnr">{booking.pnr_code}</span>
                      <span className={`badge ${statusLabels[booking.status]?.className}`}>
                        {statusLabels[booking.status]?.text}
                      </span>
                    </div>
                    <span className="booking-total">${Number(booking.total_amount).toFixed(2)}</span>
                  </div>

                  <div className="booking-card-details">
                    {booking.slot?.product?.attraction && (
                      <div className="booking-detail-row">
                        <MapPin size={14} />
                        <span>{booking.slot.product.attraction.name}</span>
                      </div>
                    )}
                    {booking.slot?.product && (
                      <div className="booking-detail-row">
                        <Tag size={14} />
                        <span>{booking.slot.product.title}</span>
                      </div>
                    )}
                    {booking.slot && (
                      <div className="booking-detail-row">
                        <Calendar size={14} />
                        <span>{booking.slot.slot_date} a las {booking.slot.start_time}</span>
                      </div>
                    )}
                    <div className="booking-detail-row">
                      <Clock size={14} />
                      <span>Creada: {new Date(booking.created_at).toLocaleDateString('es')}</span>
                    </div>
                  </div>

                  <div className="booking-card-actions">
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? <span className="spinner"></span> : <><X size={14} /> Cancelar</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bookings-empty">
              <Calendar size={48} />
              <h3>No tienes reservas aun</h3>
              <p>Explora nuestras atracciones y haz tu primera reserva</p>
              <Link to="/explore" className="btn btn-primary">
                Explorar atracciones <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MyBookings;
