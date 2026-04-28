import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attractionApi, bookingApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Star, Clock, Globe, Users, Calendar, ChevronLeft, Check, Minus, Plus, X } from 'lucide-react';
import './AttractionDetail.css';

const AttractionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [attraction, setAttraction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [travelers, setTravelers] = useState<any[]>([]);
  const [bookingStep, setBookingStep] = useState(0); // 0=ver, 1=seleccionar, 2=pasajeros, 3=confirmar
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await attractionApi.getById(id);
        setAttraction(res.data.data);
      } catch (err) {
        console.error('[Detail] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!selectedProduct || !selectedDate) return;
    const loadSlots = async () => {
      try {
        const res = await attractionApi.getAvailability(selectedProduct.id, selectedDate);
        setAvailableSlots(res.data.data || []);
      } catch (err) {
        console.error('[Slots] Error:', err);
        setAvailableSlots([]);
      }
    };
    loadSlots();
  }, [selectedProduct, selectedDate]);

  const addTraveler = () => {
    if (!selectedProduct?.price_tiers?.length) return;
    setTravelers([...travelers, {
      name: '',
      document: '',
      age: '',
      priceTierId: selectedProduct.price_tiers[0].id
    }]);
  };

  const removeTraveler = (index: number) => {
    setTravelers(travelers.filter((_, i) => i !== index));
  };

  const updateTraveler = (index: number, field: string, value: string) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  };

  const getTotalPrice = () => {
    return travelers.reduce((sum, t) => {
      const tier = selectedProduct?.price_tiers?.find((p: any) => p.id === t.priceTierId);
      return sum + (tier ? Number(tier.price) : 0);
    }, 0);
  };

  const handleBooking = async () => {
    if (!selectedSlot || travelers.length === 0) return;
    setSubmitting(true);
    setBookingError('');

    try {
      const res = await bookingApi.create({
        slotId: selectedSlot.id,
        paymentMethod: 'card',
        travelers: travelers.map(t => ({
          name: t.name,
          document: t.document,
          age: t.age ? Number(t.age) : undefined,
          priceTierId: t.priceTierId
        }))
      });
      setBookingResult(res.data.data);
      setBookingStep(3);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <main className="detail-page">
        <div className="container">
          <div className="detail-skeleton">
            <div className="skeleton-line" style={{ width: '60%', height: 32 }}></div>
            <div className="skeleton-line" style={{ width: '40%', height: 20 }}></div>
            <div className="skeleton-line" style={{ width: '100%', height: 300, borderRadius: '16px', marginTop: 24 }}></div>
          </div>
        </div>
      </main>
    );
  }

  if (!attraction) {
    return (
      <main className="detail-page">
        <div className="container detail-not-found">
          <h2>Atraccion no encontrada</h2>
          <button className="btn btn-primary" onClick={() => navigate('/explore')}>Volver a Explorar</button>
        </div>
      </main>
    );
  }

  const images = attraction.media || [];
  const mainImage = images.find((m: any) => m.is_main) || images[0];
  const products = attraction.product_options || [];

  return (
    <main className="detail-page">
      <div className="container">
        {/* HEADER */}
        <div className="detail-header animate-fade-in">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Volver
          </button>

          <div className="detail-title-row">
            <div>
              <h1 className="detail-title">{attraction.name}</h1>
              <div className="detail-meta">
                <span className="detail-location">
                  <MapPin size={16} />
                  {attraction.city?.name}, {attraction.city?.country?.name}
                </span>
                <span className="detail-rating">
                  <Star size={16} />
                  {Number(attraction.rating_average || 0).toFixed(1)}
                  <span className="rating-count">({attraction.total_reviews} resenas)</span>
                </span>
                {attraction.subcategory && (
                  <span className="badge badge-primary">
                    {attraction.subcategory.category?.name} / {attraction.subcategory.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GALERIA */}
        <div className="detail-gallery animate-fade-in">
          <div className="gallery-main">
            {images.length > 0 ? (
              <img src={images[selectedImage]?.url || mainImage?.url} alt={attraction.name} className="gallery-main-img" />
            ) : (
              <div className="gallery-placeholder"><MapPin size={64} /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img: any, i: number) => (
                <button key={img.id} className={`gallery-thumb ${selectedImage === i ? 'active' : ''}`} onClick={() => setSelectedImage(i)}>
                  <img src={img.url} alt={img.description || ''} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-content">
          {/* COLUMNA INFO */}
          <div className="detail-info">
            <section className="info-section glass-light">
              <h2>Descripcion</h2>
              <p className="detail-description">{attraction.description_full || attraction.description_short}</p>
            </section>

            <section className="info-section glass-light">
              <h2>Informacion General</h2>
              <div className="info-grid">
                <div className="info-item">
                  <Clock size={18} />
                  <div>
                    <span className="info-label">Horario</span>
                    <span className="info-value">{attraction.opening_time} - {attraction.closing_time}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Users size={18} />
                  <div>
                    <span className="info-label">Capacidad</span>
                    <span className="info-value">{attraction.capacity_max} personas</span>
                  </div>
                </div>
                <div className="info-item">
                  <Globe size={18} />
                  <div>
                    <span className="info-label">Idiomas</span>
                    <span className="info-value">{attraction.languages_available?.join(', ') || 'Espanol'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <MapPin size={18} />
                  <div>
                    <span className="info-label">Direccion</span>
                    <span className="info-value">{attraction.address}</span>
                  </div>
                </div>
              </div>
            </section>

            {attraction.route_info && (
              <section className="info-section glass-light">
                <h2>Recorrido</h2>
                <p>{attraction.route_info}</p>
              </section>
            )}
          </div>

          {/* COLUMNA RESERVA */}
          <div className="detail-booking">
            <div className="booking-card glass">
              <h3 className="booking-card-title">Reservar ahora</h3>

              {bookingStep === 3 && bookingResult ? (
                <div className="booking-success">
                  <div className="success-icon"><Check size={32} /></div>
                  <h4>Reserva confirmada</h4>
                  <p className="pnr-code">Codigo PNR: <strong>{bookingResult.pnr_code}</strong></p>
                  <p className="success-detail">Total: <strong>${Number(bookingResult.total_amount).toFixed(2)}</strong></p>
                  <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>Ver mis reservas</button>
                </div>
              ) : (
                <>
                  {/* Paso 1: Seleccionar modalidad */}
                  <div className="booking-step">
                    <label className="step-label">1. Elige una modalidad</label>
                    <div className="product-list">
                      {products.map((p: any) => (
                        <button
                          key={p.id}
                          className={`product-option ${selectedProduct?.id === p.id ? 'selected' : ''}`}
                          onClick={() => { setSelectedProduct(p); setBookingStep(1); setSelectedSlot(null); setTravelers([]); }}
                        >
                          <div className="product-title">{p.title}</div>
                          <div className="product-duration">{p.duration_minutes} min</div>
                          <div className="product-prices">
                            {p.price_tiers?.map((t: any) => (
                              <span key={t.id} className="price-tag">{t.label}: ${Number(t.price).toFixed(2)}</span>
                            ))}
                          </div>
                          {p.includes && <div className="product-includes"><Check size={12} /> {p.includes}</div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paso 2: Fecha y Horario */}
                  {bookingStep >= 1 && selectedProduct && (
                    <div className="booking-step">
                      <label className="step-label">2. Selecciona fecha y horario</label>
                      <input
                        type="date"
                        className="input-field"
                        min={getMinDate()}
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                      />
                      {selectedDate && (
                        <div className="slot-list">
                          {availableSlots.length > 0 ? availableSlots.map((slot: any) => (
                            <button
                              key={slot.id}
                              className={`slot-option ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                              onClick={() => { setSelectedSlot(slot); setBookingStep(2); if (travelers.length === 0) addTraveler(); }}
                            >
                              <Calendar size={14} />
                              <span>{slot.start_time} - {slot.end_time || '...'}</span>
                              <span className="slot-capacity">{slot.capacity_available} cupos</span>
                            </button>
                          )) : (
                            <p className="no-slots">No hay horarios disponibles para esta fecha</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paso 3: Pasajeros */}
                  {bookingStep >= 2 && selectedSlot && (
                    <div className="booking-step">
                      <label className="step-label">3. Pasajeros</label>
                      {travelers.map((t, i) => (
                        <div key={i} className="traveler-form">
                          <div className="traveler-header">
                            <span>Pasajero {i + 1}</span>
                            {travelers.length > 1 && (
                              <button className="remove-traveler" onClick={() => removeTraveler(i)}><X size={14} /></button>
                            )}
                          </div>
                          <input className="input-field" placeholder="Nombre completo" value={t.name} onChange={(e) => updateTraveler(i, 'name', e.target.value)} />
                          <div className="traveler-row">
                            <input className="input-field" placeholder="Cedula" value={t.document} onChange={(e) => updateTraveler(i, 'document', e.target.value)} />
                            <input className="input-field" placeholder="Edad" type="number" value={t.age} onChange={(e) => updateTraveler(i, 'age', e.target.value)} />
                          </div>
                          <select className="input-field" value={t.priceTierId} onChange={(e) => updateTraveler(i, 'priceTierId', e.target.value)}>
                            {selectedProduct.price_tiers?.map((tier: any) => (
                              <option key={tier.id} value={tier.id}>{tier.label} - ${Number(tier.price).toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <button className="btn btn-secondary btn-sm" onClick={addTraveler}>
                        <Plus size={14} /> Agregar pasajero
                      </button>

                      {/* Resumen */}
                      <div className="booking-summary">
                        <div className="summary-row">
                          <span>Total ({travelers.length} pasajeros)</span>
                          <span className="summary-total">${getTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>

                      {bookingError && <div className="auth-error">{bookingError}</div>}

                      {isAuthenticated ? (
                        <button
                          className="btn btn-primary btn-lg booking-submit"
                          onClick={handleBooking}
                          disabled={submitting || travelers.some(t => !t.name)}
                        >
                          {submitting ? <span className="spinner"></span> : 'Confirmar Reserva'}
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-lg booking-submit" onClick={() => navigate('/login')}>
                          Iniciar sesion para reservar
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AttractionDetail;
