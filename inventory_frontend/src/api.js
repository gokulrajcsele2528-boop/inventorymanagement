// Pure Static Frontend Storage Engine (LocalStorage)
// 100% Client-Side with zero backend / network dependencies

const USERS_KEY = 'inventoryUsers';
const CURRENT_USER_KEY = 'inventory_user';
const TOKEN_KEY = 'inventory_token';

// Helper to get currently logged-in user ID
function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (userStr) {
      const u = JSON.parse(userStr);
      return u.id || 'default';
    }
  } catch {
    // fallback
  }
  return 'default';
}

function getProductsKey() {
  return `inventoryProducts_${getCurrentUserId()}`;
}

function getHistoryKey() {
  return `inventoryHistory_${getCurrentUserId()}`;
}

// Helpers for localStorage
function getStoredUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredProducts() {
  try {
    const data = localStorage.getItem(getProductsKey());
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredProducts(products) {
  localStorage.setItem(getProductsKey(), JSON.stringify(products));
}

function getStoredHistory() {
  try {
    const data = localStorage.getItem(getHistoryKey());
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredHistory(history) {
  localStorage.setItem(getHistoryKey(), JSON.stringify(history));
}

function logHistory(productId, action, quantity) {
  const history = getStoredHistory();
  const now = new Date();
  const dateStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  const entry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    product_id: productId,
    action,
    quantity: Number(quantity),
    created_at: dateStr,
    createdAt: dateStr
  };
  history.unshift(entry);
  saveStoredHistory(history);
}

function calculateStatus(quantity, minimumStock) {
  const q = Number(quantity);
  const min = Number(minimumStock) || 5;
  if (q <= 0) return 'Out of Stock';
  if (q <= min) return 'Low Stock';
  return 'In Stock';
}

// ==================== Authentication API (LocalStorage) ====================
export const authAPI = {
  register: async (fullName, email, password) => {
    // Validate
    if (!fullName || !fullName.trim()) {
      throw { response: { data: { message: 'Full Name is required.' } } };
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw { response: { data: { message: 'Please enter a valid email address.' } } };
    }
    if (!password || password.length < 6) {
      throw { response: { data: { message: 'Password must be at least 6 characters long.' } } };
    }

    const users = getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw { response: { data: { message: 'An account with this email already exists.' } } };
    }

    const newUser = {
      id: Date.now(),
      fullName: fullName.trim(),
      email: cleanEmail,
      password: password, // Stored in browser localStorage
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveStoredUsers(users);

    return {
      success: true,
      message: 'Account created successfully! Please sign in.',
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email
      }
    };
  },

  login: async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw { response: { data: { message: 'Please provide both email and password.' } } };
    }

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

    if (!user) {
      throw { response: { data: { message: 'Invalid email or password.' } } };
    }

    const token = `local_token_${user.id}_${Date.now()}`;
    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email
    };

    return {
      success: true,
      message: 'Login successful!',
      token,
      user: userData
    };
  },

  getMe: async () => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) {
      throw { response: { status: 401, data: { message: 'Not authenticated.' } } };
    }
    return { success: true, user: JSON.parse(userStr) };
  }
};

// ==================== Inventory API (LocalStorage) ====================
export const inventoryAPI = {
  getDashboard: async () => {
    const products = getStoredProducts();
    const history = getStoredHistory();

    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const inventoryValue = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.price) || 0)), 0);
    const lowStock = products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) <= (Number(p.minimum_stock) || 5)).length;
    const outOfStock = products.filter(p => Number(p.quantity) <= 0).length;

    return {
      success: true,
      data: {
        total_products: totalProducts,
        total_stock: totalStock,
        inventory_value: Math.round(inventoryValue * 100) / 100,
        low_stock: lowStock,
        out_of_stock: outOfStock,
        recent_activity: history.slice(0, 6)
      }
    };
  },

  getProducts: async (search = '', category = '') => {
    let products = getStoredProducts();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      products = products.filter(p =>
        (p.product_name && p.product_name.toLowerCase().includes(q)) ||
        (p.productName && p.productName.toLowerCase().includes(q)) ||
        (p.product_id && p.product_id.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'all') {
      const cat = category.toLowerCase();
      products = products.filter(p => p.category && p.category.toLowerCase() === cat);
    }

    return {
      success: true,
      data: products
    };
  },

  getProductById: async (id) => {
    const products = getStoredProducts();
    const product = products.find(p => p.id === Number(id) || p.id === id);
    if (!product) {
      throw { response: { data: { message: 'Product not found.' } } };
    }
    return { success: true, data: product };
  },

  addProduct: async (productData) => {
    const products = getStoredProducts();
    const pId = (productData.product_id || productData.sku || '').trim();

    // Check duplicate product ID
    if (products.some(p => p.product_id.toLowerCase() === pId.toLowerCase())) {
      throw { response: { data: { message: `Product ID "${pId}" already exists in your inventory.` } } };
    }

    const now = new Date();
    const dateStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    const qty = parseInt(productData.quantity, 10) || 0;
    const minStock = parseInt(productData.minimum_stock || productData.minimumStock, 10) || 5;

    const newProduct = {
      id: Date.now(),
      product_name: productData.product_name || productData.productName,
      productName: productData.product_name || productData.productName,
      product_id: pId,
      sku: pId,
      category: productData.category,
      supplier: productData.supplier || '',
      price: parseFloat(productData.price) || 0,
      quantity: qty,
      minimum_stock: minStock,
      minimumStock: minStock,
      status: calculateStatus(qty, minStock),
      stockStatus: calculateStatus(qty, minStock),
      created_at: dateStr,
      createdAt: dateStr
    };

    products.unshift(newProduct);
    saveStoredProducts(products);
    logHistory(newProduct.product_id, 'Product Added', qty);

    return {
      success: true,
      message: 'Product added successfully!',
      data: newProduct
    };
  },

  updateProduct: async (id, productData) => {
    const products = getStoredProducts();
    const index = products.findIndex(p => p.id === Number(id) || p.id === id);

    if (index === -1) {
      throw { response: { data: { message: 'Product not found.' } } };
    }

    const pId = (productData.product_id || productData.sku || products[index].product_id).trim();
    if (pId.toLowerCase() !== products[index].product_id.toLowerCase()) {
      if (products.some((p, i) => i !== index && p.product_id.toLowerCase() === pId.toLowerCase())) {
        throw { response: { data: { message: `Product ID "${pId}" already exists.` } } };
      }
    }

    const qty = parseInt(productData.quantity, 10);
    const minStock = parseInt(productData.minimum_stock || productData.minimumStock, 10) || 5;

    products[index] = {
      ...products[index],
      product_name: productData.product_name || productData.productName || products[index].product_name,
      productName: productData.product_name || productData.productName || products[index].product_name,
      product_id: pId,
      sku: pId,
      category: productData.category || products[index].category,
      supplier: productData.supplier !== undefined ? productData.supplier : products[index].supplier,
      price: parseFloat(productData.price),
      quantity: qty,
      minimum_stock: minStock,
      minimumStock: minStock,
      status: calculateStatus(qty, minStock),
      stockStatus: calculateStatus(qty, minStock),
    };

    saveStoredProducts(products);
    logHistory(pId, 'Product Updated', qty);

    return {
      success: true,
      message: 'Product updated successfully!',
      data: products[index]
    };
  },

  deleteProduct: async (id) => {
    let products = getStoredProducts();
    const target = products.find(p => p.id === Number(id) || p.id === id);

    if (!target) {
      throw { response: { data: { message: 'Product not found.' } } };
    }

    products = products.filter(p => p.id !== Number(id) && p.id !== id);
    saveStoredProducts(products);
    logHistory(target.product_id, 'Product Deleted', target.quantity);

    return {
      success: true,
      message: `Product "${target.product_id}" deleted successfully.`
    };
  },

  addStock: async (productId, quantity) => {
    const products = getStoredProducts();
    const target = products.find(p => p.product_id.toLowerCase() === (productId || '').toLowerCase());

    if (!target) {
      throw { response: { data: { message: `Product "${productId}" not found.` } } };
    }

    const addQty = Number(quantity);
    if (addQty <= 0) {
      throw { response: { data: { message: 'Quantity must be positive.' } } };
    }

    target.quantity = (Number(target.quantity) || 0) + addQty;
    target.status = calculateStatus(target.quantity, target.minimum_stock);
    target.stockStatus = target.status;

    saveStoredProducts(products);
    logHistory(target.product_id, 'Stock Added', addQty);

    return {
      success: true,
      message: `Successfully added ${addQty} units to ${target.product_name}!`,
      data: target
    };
  },

  removeStock: async (productId, quantity) => {
    const products = getStoredProducts();
    const target = products.find(p => p.product_id.toLowerCase() === (productId || '').toLowerCase());

    if (!target) {
      throw { response: { data: { message: `Product "${productId}" not found.` } } };
    }

    const remQty = Number(quantity);
    if (remQty <= 0) {
      throw { response: { data: { message: 'Quantity must be positive.' } } };
    }

    if (target.quantity < remQty) {
      throw { response: { data: { message: `Insufficient stock. Available: ${target.quantity}, Requested: ${remQty}.` } } };
    }

    target.quantity = target.quantity - remQty;
    target.status = calculateStatus(target.quantity, target.minimum_stock);
    target.stockStatus = target.status;

    saveStoredProducts(products);
    logHistory(target.product_id, 'Stock Removed', remQty);

    return {
      success: true,
      message: `Successfully removed ${remQty} units from ${target.product_name}!`,
      data: target
    };
  },

  getHistory: async () => {
    const history = getStoredHistory();
    return {
      success: true,
      data: history
    };
  }
};

export default { authAPI, inventoryAPI };
