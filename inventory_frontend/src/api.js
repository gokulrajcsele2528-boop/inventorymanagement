import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const inventoryAPI = {
  // Dashboard
  getDashboard: async () => {
    const res = await api.get('/dashboard');
    return res.data;
  },

  // Products
  getProducts: async (search = '') => {
    const res = await api.get('/products', {
      params: search ? { search } : {},
    });
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

  // Stock Management
  addStock: async (product_id, quantity) => {
    const res = await api.post('/stock/add', { product_id, quantity: Number(quantity) });
    return res.data;
  },

  removeStock: async (product_id, quantity) => {
    const res = await api.post('/stock/remove', { product_id, quantity: Number(quantity) });
    return res.data;
  },

  // History
  getHistory: async () => {
    const res = await api.get('/history');
    return res.data;
  },
};

export default api;
