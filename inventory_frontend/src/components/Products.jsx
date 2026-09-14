import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Package, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { inventoryAPI } from '../api';

export default function Products({ onOpenAdd, onOpenEdit, onOpenStock, notify }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryAPI.getProducts(query);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Unable to load products. Check Flask backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      await inventoryAPI.deleteProduct(deleteCandidate.id);
      notify(`Product ${deleteCandidate.product_name} deleted successfully!`);
      setDeleteCandidate(null);
      fetchProducts(searchTerm);
    } catch (err) {
      console.error('Delete error:', err);
      notify(err.response?.data?.message || 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Out of Stock') {
      return <span className="badge badge-out-of-stock">Out of Stock</span>;
    }
    if (status === 'Low Stock') {
      return <span className="badge badge-low-stock">Low Stock</span>;
    }
    return <span className="badge badge-in-stock">In Stock</span>;
  };

  return (
    <div>
      {/* Top Header & Search Bar */}
      <div className="panel-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search Box */}
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, ID, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => fetchProducts(searchTerm)} title="Refresh list">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenAdd}>
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          </div>
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

      {/* Products Table Card */}
      <div className="panel-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Product ID</th>
                <th>Category</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading products from database...</div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <Package size={44} className="empty-icon" />
                      <h4>No products found</h4>
                      <p>{searchTerm ? `No matching products for "${searchTerm}"` : 'Get started by adding your first product!'}</p>
                      {!searchTerm && (
                        <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={onOpenAdd}>
                          <Plus size={15} />
                          <span>Add New Product</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min stock alert: {p.minimum_stock}</div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--bg-muted)', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--primary-text)' }}>
                        {p.product_id}
                      </code>
                    </td>
                    <td>
                      <span className="badge-category">{p.category}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${p.price.toFixed(2)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.quantity}</span>
                    </td>
                    <td>
                      {getStatusBadge(p.status)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                        <button
                          className="btn-icon"
                          title="Quick Stock Adjustment"
                          onClick={() => onOpenStock(p)}
                        >
                          <ArrowUpDown size={15} style={{ color: 'var(--primary)' }} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Edit Product"
                          onClick={() => onOpenEdit(p)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Delete Product"
                          onClick={() => setDeleteCandidate(p)}
                        >
                          <Trash2 size={15} style={{ color: '#e11d48' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="modal-overlay" onClick={() => setDeleteCandidate(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#fef2f2', padding: '0.65rem', borderRadius: '10px', color: '#e11d48' }}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    Delete {deleteCandidate.product_name}?
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    This will remove <strong>{deleteCandidate.product_id}</strong> from the database and record this deletion in inventory history.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
