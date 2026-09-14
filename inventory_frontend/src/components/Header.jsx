import React from 'react';
import { User, Bell } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: {
    title: 'Inventory Dashboard',
    subtitle: 'Overview of stock levels, inventory statistics, and recent activity'
  },
  products: {
    title: 'Product Catalog',
    subtitle: 'Manage your products, pricing, categories, and inventory statuses'
  },
  stock: {
    title: 'Stock Management',
    subtitle: 'Quickly receive incoming stock or dispatch items out of inventory'
  },
  history: {
    title: 'Inventory History Log',
    subtitle: 'Audit trail tracking all product creations, modifications, and stock adjustments'
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Database configuration, user profile, and system status'
  }
};

export default function Header({ activeTab, user }) {
  const currentInfo = PAGE_TITLES[activeTab] || { title: 'Inventory Management', subtitle: '' };

  return (
    <header className="top-header">
      <div className="header-title">
        <h1>{currentInfo.title}</h1>
        <p>{currentInfo.subtitle}</p>
      </div>

      <div className="header-right">
        <div className="user-badge">
          <div className="user-avatar">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Administrator'}</span>
            <span className="user-role">{user?.email || 'admin@inventory.com'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
