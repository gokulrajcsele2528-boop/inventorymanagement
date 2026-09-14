import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, RefreshCw, ArrowUp, ArrowDown, PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { inventoryAPI } from '../api';

export default function History() {
  const [historyList, setHistoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryAPI.getHistory();
      if (res.success) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
      setError('Unable to load history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getActionDetails = (action) => {
    if (action.includes('Stock Added')) {
      return {
        icon: <ArrowUp size={15} color="#059669" />,
        bg: '#ecfdf5',
        color: '#059669',
        border: '#a7f3d0'
      };
    }
    if (action.includes('Stock Removed')) {
      return {
        icon: <ArrowDown size={15} color="#d97706" />,
        bg: '#fffbeb',
        color: '#d97706',
        border: '#fde68a'
      };
    }
    if (action.includes('Product Added')) {
      return {
        icon: <PlusCircle size={15} color="#7c3aed" />,
        bg: '#f5f3ff',
        color: '#7c3aed',
        border: '#ddd6fe'
      };
    }
    if (action.includes('Product Updated')) {
      return {
        icon: <Edit3 size={15} color="#2563eb" />,
        bg: '#eff6ff',
        color: '#2563eb',
        border: '#bfdbfe'
      };
    }
    if (action.includes('Product Deleted')) {
      return {
        icon: <Trash2 size={15} color="#e11d48" />,
        bg: '#fef2f2',
        color: '#e11d48',
        border: '#fecdd3'
      };
    }
    return {
      icon: <HistoryIcon size={15} color="#64748b" />,
      bg: '#f1f5f9',
      color: '#475569',
      border: '#cbd5e1'
    };
  };

  const filteredHistory = historyList.filter((item) =>
    item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.created_at.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Top Filter & Refresh Bar */}
      <div className="panel-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Search history by Product ID, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fetchHistory}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh History</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecdd3',
          padding: '1rem',
          borderRadius: '10px',
          color: '#991b1b',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {/* History Table */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Record #</th>
                <th>Product ID</th>
                <th>Action</th>
                <th>Quantity Affected</th>
                <th>Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Loading inventory history logs...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <HistoryIcon size={44} className="empty-icon" />
                      <h4>No History Records Found</h4>
                      <p>When stock changes or products are created/edited/deleted, entries will be recorded here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, idx) => {
                  const style = getActionDetails(item.action);
                  return (
                    <tr key={item.id || idx}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        #{item.id}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {item.product_id}
                        </strong>
                      </td>
                      <td>
                        <span 
                          className="badge"
                          style={{
                            backgroundColor: style.bg,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                            padding: '0.35rem 0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          {style.icon}
                          <span>{item.action}</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{item.quantity} units</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {item.created_at}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
