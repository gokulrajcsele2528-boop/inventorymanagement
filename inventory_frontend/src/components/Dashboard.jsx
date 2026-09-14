import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  AlertCircle, 
  Plus, 
  ArrowUpDown, 
  History, 
  RefreshCw,
  TrendingUp,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { inventoryAPI } from '../api';

export default function Dashboard({ onNavigate, openAddModal, openStockModal }) {
  const [dashboardData, setDashboardData] = useState({
    total_products: 0,
    total_stock: 0,
    inventory_value: 0,
    low_stock: 0,
    out_of_stock: 0,
    recent_activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryAPI.getDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Database connection error. Unable to load real inventory statistics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getActionBadgeColor = (action) => {
    if (action.includes('Added')) return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    if (action.includes('Removed')) return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
    if (action.includes('Deleted')) return { bg: '#fef2f2', color: '#e11d48', border: '#fecdd3' };
    return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Overview & Metrics</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Live real-time statistics calculated from PostgreSQL database</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboard} title="Refresh data from database">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => openStockModal()}>
            <ArrowUpDown size={15} />
            <span>Adjust Stock</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openAddModal()}>
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecdd3',
          padding: '1.25rem',
          borderRadius: '10px',
          color: '#991b1b',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong>Database Error:</strong> {error}
          </div>
          <button className="btn btn-sm btn-danger" onClick={fetchDashboard}>Retry Connection</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-icon-box metric-icon-purple">
            <Package size={26} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Products</span>
            <span className="metric-value">{loading ? '...' : dashboardData.total_products}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-blue">
            <Boxes size={26} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Stock Quantity</span>
            <span className="metric-value">{loading ? '...' : dashboardData.total_stock}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            <DollarSign size={26} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Inventory Value</span>
            <span className="metric-value">
              {loading ? '...' : `$${(dashboardData.inventory_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-amber">
            <AlertTriangle size={26} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Low Stock Items</span>
            <span className="metric-value" style={{ color: dashboardData.low_stock > 0 ? '#d97706' : 'inherit' }}>
              {loading ? '...' : dashboardData.low_stock}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-red">
            <AlertCircle size={26} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Out of Stock Items</span>
            <span className="metric-value" style={{ color: dashboardData.out_of_stock > 0 ? '#e11d48' : 'inherit' }}>
              {loading ? '...' : dashboardData.out_of_stock}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <History size={20} style={{ color: 'var(--primary)' }} />
            <span>Recent Inventory Activity</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('history')}
          >
            <span>View Full History</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            Loading live activity from database...
          </div>
        ) : dashboardData.recent_activity.length === 0 ? (
          <div className="empty-state">
            <History size={40} className="empty-icon" />
            <h4>No recent activity in database</h4>
            <p>Inventory events such as additions, updates, and stock changes will appear here.</p>
          </div>
        ) : (
          <div className="activity-list">
            {dashboardData.recent_activity.map((item) => {
              const badgeStyle = getActionBadgeColor(item.action);
              return (
                <div key={item.id} className="activity-item">
                  <div className="activity-info">
                    <div 
                      className="activity-icon-badge"
                      style={{
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`
                      }}
                    >
                      <TrendingUp size={16} />
                    </div>
                    <div className="activity-meta">
                      <span className="activity-title">
                        {item.action} — Product <strong style={{ color: 'var(--primary)' }}>{item.product_id}</strong>
                      </span>
                      <span className="activity-subtitle">
                        Quantity affected: <strong>{item.quantity} units</strong>
                      </span>
                    </div>
                  </div>
                  <div className="activity-time">
                    {item.created_at || item.createdAt}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
