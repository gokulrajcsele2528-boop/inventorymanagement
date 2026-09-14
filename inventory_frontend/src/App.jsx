import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import StockManagement from './components/StockManagement';
import History from './components/History';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import AddProductModal from './components/AddProductModal';
import StockModal from './components/StockModal';
import { inventoryAPI } from './api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('inventory_token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('inventory_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [productsList, setProductsList] = useState([]);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockTargetProduct, setStockTargetProduct] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadAllProducts = async () => {
    if (!token) return;
    try {
      const res = await inventoryAPI.getProducts();
      if (res.success) {
        setProductsList(res.data);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
    }
  };

  useEffect(() => {
    if (token && user) {
      loadAllProducts();
    }
  }, [token, user]);

  const handleLoginSuccess = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('inventory_token', jwtToken);
    localStorage.setItem('inventory_user', JSON.stringify(userData));
    showToast(`Welcome, ${userData.fullName || userData.full_name || userData.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('inventory_token');
    localStorage.removeItem('inventory_user');
    setActiveTab('dashboard');
    setAuthView('login');
    showToast('Logged out successfully.');
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleOpenStock = (product = null) => {
    setStockTargetProduct(product);
    setIsStockModalOpen(true);
  };

  const handleProductSuccess = (msg) => {
    showToast(msg);
    loadAllProducts();
  };

  const handleStockSuccess = (msg) => {
    showToast(msg);
    loadAllProducts();
  };

  // If not logged in, show Login or Register page
  if (!token || !user) {
    return (
      <>
        {authView === 'login' ? (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <Register
            onSwitchToLogin={() => setAuthView('login')}
            notify={showToast}
          />
        )}
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-layout">
        <Header activeTab={activeTab} user={user} />

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              openAddModal={handleOpenAdd}
              openStockModal={handleOpenStock}
            />
          )}

          {activeTab === 'products' && (
            <Products
              onOpenAdd={handleOpenAdd}
              onOpenEdit={handleOpenEdit}
              onOpenStock={handleOpenStock}
              notify={showToast}
            />
          )}

          {activeTab === 'stock' && (
            <StockManagement
              notify={showToast}
            />
          )}

          {activeTab === 'history' && (
            <History />
          )}

          {activeTab === 'settings' && (
            <Settings user={user} />
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={handleProductSuccess}
        initialProduct={editingProduct}
      />

      {/* Stock Adjustment Modal */}
      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockTargetProduct(null);
        }}
        onSuccess={handleStockSuccess}
        products={productsList}
        defaultProduct={stockTargetProduct}
      />

      {/* Toast Feedback */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
