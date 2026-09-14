import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Fallback Local Storage Manager for GitHub Pages / Offline mode
const INITIAL_DEMO_PRODUCTS = [
  { id: 1, product_name: 'MacBook Pro 16"', product_id: 'TECH-001', category: 'Electronics', price: 2499.99, quantity: 12, minimum_stock: 5, status: 'In Stock', created_at: '2026-09-14 10:00:00' },
  { id: 2, product_name: 'Logitech MX Master 3S', product_id: 'TECH-002', category: 'Accessories', price: 99.99, quantity: 28, minimum_stock: 10, status: 'In Stock', created_at: '2026-09-14 10:05:00' },
  { id: 3, product_name: 'Dell UltraSharp 27" 4K', product_id: 'TECH-003', category: 'Monitors', price: 599.50, quantity: 4, minimum_stock: 6, status: 'Low Stock', created_at: '2026-09-14 10:10:00' },
  { id: 4, product_name: 'Keychron Q1 Pro Keyboard', product_id: 'TECH-004', category: 'Accessories', price: 199.00, quantity: 0, minimum_stock: 5, status: 'Out of Stock', created_at: '2026-09-14 10:15:00' },
  { id: 5, product_name: 'Sony WH-1000XM5 Headphones', product_id: 'TECH-005', category: 'Audio', price: 399.99, quantity: 15, minimum_stock: 5, status: 'In Stock', created_at: '2026-09-14 10:20:00' },
  { id: 6, product_name: 'Anker 100W USB-C Fast Charger', product_id: 'TECH-006', category: 'Cables & Power', price: 49.99, quantity: 42, minimum_stock: 15, status: 'In Stock', created_at: '2026-09-14 10:25:00' }
];

const INITIAL_DEMO_HISTORY = [
  { id: 6, product_id: 'TECH-006', action: 'Product Added', quantity: 42, created_at: '2026-09-14 10:25:00' },
  { id: 5, product_id: 'TECH-005', action: 'Product Added', quantity: 15, created_at: '2026-09-14 10:20:00' },
  { id: 4, product_id: 'TECH-004', action: 'Product Added', quantity: 0, created_at: '2026-09-14 10:15:00' },
  { id: 3, product_id: 'TECH-003', action: 'Product Added', quantity: 4, created_at: '2026-09-14 10:10:00' },
  { id: 2, product_id: 'TECH-002', action: 'Product Added', quantity: 28, created_at: '2026-09-14 10:05:00' },
  { id: 1, product_id: 'TECH-001', action: 'Product Added', quantity: 12, created_at: '2026-09-14 10:00:00' }
];

function getLocalProducts() {
  const data = localStorage.getItem('inventory_products_store');
  if (!data) {
    localStorage.setItem('inventory_products_store', JSON.stringify(INITIAL_DEMO_PRODUCTS));
    return INITIAL_DEMO_PRODUCTS;
  }
  return JSON.parse(data);
}

function saveLocalProducts(products) {
  localStorage.setItem('inventory_products_store', JSON.stringify(products));
}

function getLocalHistory() {
  const data = localStorage.getItem('inventory_history_store');
  if (!data) {
    localStorage.setItem('inventory_history_store', JSON.stringify(INITIAL_DEMO_HISTORY));
    return INITIAL_DEMO_HISTORY;
  }
  return JSON.parse(data);
}

function addLocalHistory(product_id, action, quantity) {
  const history = getLocalHistory();
  const newEntry = {
    id: history.length + 1,
    product_id,
    action,
    quantity,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  history.unshift(newEntry);
  localStorage.setItem('inventory_history_store', JSON.stringify(history));
}

function computeStatus(quantity, minimum_stock) {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= minimum_stock) return 'Low Stock';
  return 'In Stock';
}

export const inventoryAPI = {
  // Dashboard
  getDashboard: async () => {
    try {
      const res = await api.get('/dashboard');
      return res.data;
    } catch {
      // Fallback calculation for GitHub Pages
      const products = getLocalProducts();
      const history = getLocalHistory();
      return {
        success: true,
        data: {
          total_products: products.length,
          total_stock: products.reduce((acc, p) => acc + (p.quantity || 0), 0),
          low_stock: products.filter(p => p.quantity > 0 && p.quantity <= p.minimum_stock).length,
          out_of_stock: products.filter(p => p.quantity <= 0).length,
          recent_activity: history.slice(0, 6)
        }
      };
    }
  },

  // Products
  getProducts: async (search = '') => {
    try {
      const res = await api.get('/products', {
        params: search ? { search } : {},
      });
      return res.data;
    } catch {
      let products = getLocalProducts();
      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p => 
          p.product_name.toLowerCase().includes(q) ||
          p.product_id.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return { success: true, data: products };
    }
  },

  addProduct: async (productData) => {
    try {
      const res = await api.post('/products', productData);
      return res.data;
    } catch {
      const products = getLocalProducts();
      const newProduct = {
        id: Date.now(),
        product_name: productData.product_name,
        product_id: productData.product_id,
        category: productData.category,
        price: parseFloat(productData.price) || 0,
        quantity: parseInt(productData.quantity, 10) || 0,
        minimum_stock: parseInt(productData.minimum_stock, 10) || 5,
        status: computeStatus(parseInt(productData.quantity, 10) || 0, parseInt(productData.minimum_stock, 10) || 5),
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      products.unshift(newProduct);
      saveLocalProducts(products);
      addLocalHistory(newProduct.product_id, 'Product Added', newProduct.quantity);
      return { success: true, data: newProduct, message: 'Product added successfully!' };
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const res = await api.put(`/products/${id}`, productData);
      return res.data;
    } catch {
      const products = getLocalProducts();
      const index = products.findIndex(p => p.id === id);
      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...productData,
          price: parseFloat(productData.price),
          quantity: parseInt(productData.quantity, 10),
          minimum_stock: parseInt(productData.minimum_stock, 10),
          status: computeStatus(parseInt(productData.quantity, 10), parseInt(productData.minimum_stock, 10))
        };
        saveLocalProducts(products);
        addLocalHistory(products[index].product_id, 'Product Updated', products[index].quantity);
      }
      return { success: true, message: 'Product updated successfully!' };
    }
  },

  deleteProduct: async (id) => {
    try {
      const res = await api.delete(`/products/${id}`);
      return res.data;
    } catch {
      let products = getLocalProducts();
      const target = products.find(p => p.id === id);
      if (target) {
        products = products.filter(p => p.id !== id);
        saveLocalProducts(products);
        addLocalHistory(target.product_id, 'Product Deleted', target.quantity);
      }
      return { success: true, message: 'Product deleted successfully!' };
    }
  },

  // Stock Management
  addStock: async (product_id, quantity) => {
    try {
      const res = await api.post('/stock/add', { product_id, quantity: Number(quantity) });
      return res.data;
    } catch {
      const products = getLocalProducts();
      const target = products.find(p => p.product_id === product_id);
      if (target) {
        target.quantity += Number(quantity);
        target.status = computeStatus(target.quantity, target.minimum_stock);
        saveLocalProducts(products);
        addLocalHistory(product_id, 'Stock Added', Number(quantity));
      }
      return { success: true, message: `Successfully added ${quantity} units!` };
    }
  },

  removeStock: async (product_id, quantity) => {
    try {
      const res = await api.post('/stock/remove', { product_id, quantity: Number(quantity) });
      return res.data;
    } catch {
      const products = getLocalProducts();
      const target = products.find(p => p.product_id === product_id);
      if (target) {
        target.quantity -= Number(quantity);
        target.status = computeStatus(target.quantity, target.minimum_stock);
        saveLocalProducts(products);
        addLocalHistory(product_id, 'Stock Removed', Number(quantity));
      }
      return { success: true, message: `Successfully removed ${quantity} units!` };
    }
  },

  // History
  getHistory: async () => {
    try {
      const res = await api.get('/history');
      return res.data;
    } catch {
      return { success: true, data: getLocalHistory() };
    }
  },
};

export default api;
