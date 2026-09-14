import axios from 'axios';

// Backend API Base URL (configurable via VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const inventoryAPI = {
  // Dashboard real statistics
  getDashboard: async () => {
    const res = await api.get('/dashboard');
    return res.data;
  },

  // Products CRUD from Database
  getProducts: async (search = '', category = '') => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'all') params.category = category;

    const res = await api.get('/products', { params });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  addProduct: async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
  },

  updateProduct: async (id, productData) => {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  // Stock In / Out Operations
  addStock: async (product_id, quantity) => {
    const res = await api.post('/stock/add', { product_id, quantity: Number(quantity) });
    return res.data;
  },

  removeStock: async (product_id, quantity) => {
    const res = await api.post('/stock/remove', { product_id, quantity: Number(quantity) });
    return res.data;
  },

  // Audit History Logs
  getHistory: async () => {
    const res = await api.get('/history');
    return res.data;
  },
};

export default api;
