import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ====================== AUTH ======================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  getProfile: () =>
    api.get('/auth/profile'),
};

// ====================== COUNTRIES ======================
export const countryApi = {
  getAll: (params?: any) =>
    api.get('/countries', { params }),
  getById: (id: string) =>
    api.get(`/countries/${id}`),
  getCities: (countryId: string) =>
    api.get(`/countries/${countryId}/cities`),
  create: (data: any) =>
    api.post('/countries', data),
  update: (id: string, data: any) =>
    api.put(`/countries/${id}`, data),
  deleteCountry: (id: string) =>
    api.delete(`/countries/${id}`),
  createCity: (countryId: string, data: any) =>
    api.post(`/countries/${countryId}/cities`, data),
};

// ====================== ATTRACTIONS ======================
export const attractionApi = {
  getAll: (params?: any) =>
    api.get('/attractions', { params }),
  getById: (id: string) =>
    api.get(`/attractions/${id}`),
  create: (data: any) =>
    api.post('/attractions', data),
  update: (id: string, data: any) =>
    api.put(`/attractions/${id}`, data),
  deleteAttraction: (id: string) =>
    api.delete(`/attractions/${id}`),
  // Categorias
  getCategories: () =>
    api.get('/attractions/categories'),
  createCategory: (data: any) =>
    api.post('/attractions/categories', data),
  createSubcategory: (categoryId: string, data: any) =>
    api.post(`/attractions/categories/${categoryId}/subcategories`, data),
  // Media
  addMedia: (attractionId: string, data: any) =>
    api.post(`/attractions/${attractionId}/media`, data),
  // Products
  getProducts: (attractionId: string) =>
    api.get(`/attractions/${attractionId}/products`),
  createProduct: (attractionId: string, data: any) =>
    api.post(`/attractions/${attractionId}/products`, data),
  // Prices
  createPriceTier: (productId: string, data: any) =>
    api.post(`/attractions/products/${productId}/prices`, data),
  // Availability
  getAvailability: (productId: string, date: string) =>
    api.get(`/attractions/products/${productId}/availability`, { params: { date } }),
  createSlot: (productId: string, data: any) =>
    api.post(`/attractions/products/${productId}/availability`, data),
};

// ====================== BOOKINGS ======================
export const bookingApi = {
  getAll: (params?: any) =>
    api.get('/bookings', { params }),
  getById: (id: string) =>
    api.get(`/bookings/${id}`),
  searchByPnr: (pnr: string) =>
    api.get(`/bookings/search/${pnr}`),
  create: (data: any) =>
    api.post('/bookings', data),
  cancel: (id: string, reason?: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),
  registerPayment: (id: string, data: any) =>
    api.post(`/bookings/${id}/payment`, data),
  createReview: (bookingId: string, data: any) =>
    api.post(`/bookings/${bookingId}/review`, data),
};

export default api;
