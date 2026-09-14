import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpDown, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  LogOut,
  Boxes
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'stock', label: 'Stock', icon: ArrowUpDown },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Boxes size={22} />
        </div>
        <div className="brand-text">
          <h2>StockFlow</h2>
          <span>Inventory v1.0</span>
        </div>
      </div>

      <ul className="nav-links">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                style={{ width: '100%', background: 'none', textAlign: 'left', border: 'none' }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
