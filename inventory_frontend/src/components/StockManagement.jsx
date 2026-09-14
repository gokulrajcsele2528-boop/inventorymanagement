import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Boxes, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import { inventoryAPI } from '../api';

export default function StockManagement({ notify }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [actionType, setActionType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getProducts();
      if (res.success) {
        setProducts(res.data);
        if (res.data.length > 0 && !selectedProductId) {
          setSelectedProductId(res.data[0].product_id);
        }
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const currentProduct = products.find((p) => p.product_id === selectedProductId);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!selectedProductId || !qty || qty <= 0) {
      notify('Please enter a valid positive quantity.', 'error');
      return;
    }

    if (actionType === 'remove' && currentProduct && currentProduct.quantity < qty) {
      notify(`Cannot remove ${qty} units. Current stock is ${currentProduct.quantity}.`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (actionType === 'add') {
        await inventoryAPI.addStock(selectedProductId, qty);
        notify(`Added +${qty} units to ${currentProduct?.product_name || selectedProductId}!`);
      } else {
        await inventoryAPI.removeStock(selectedProductId, qty);
        notify(`Removed -${qty} units from ${currentProduct?.product_name || selectedProductId}!`);
      }
      setQuantity('');
      await fetchProducts();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update stock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Quick Adjust Form */}
        <div className="panel-card">
          <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
            <ArrowUpDown size={20} style={{ color: 'var(--primary)' }} />
            <span>Stock In / Out Controller</span>
          </div>

          <form onSubmit={handleAdjustStock}>
            {/* Operation switcher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`btn ${actionType === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActionType('add')}
              >
                <ArrowUpCircle size={18} />
                <span>Add Stock (IN)</span>
              </button>
              <button
                type="button"
                className={`btn ${actionType === 'remove' ? 'btn-primary' : 'btn-secondary'}`}
                style={actionType === 'remove' ? { backgroundColor: '#d97706', borderColor: '#d97706' } : {}}
                onClick={() => setActionType('remove')}
              >
                <ArrowDownCircle size={18} />
                <span>Remove (OUT)</span>
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="product_select">Choose Product</label>
              <select
                id="product_select"
                className="form-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.product_id}>
                    {p.product_name} ({p.product_id}) — Stock: {p.quantity}
                  </option>
                ))}
              </select>
            </div>

            {currentProduct && (
              <div style={{
                background: 'var(--bg-muted)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Selected Item:</span>
                  <strong>{currentProduct.product_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Stock:</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
                    {currentProduct.quantity} units
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                  <span className={`badge ${
                    currentProduct.quantity <= 0 ? 'badge-out-of-stock' :
                    currentProduct.quantity <= currentProduct.minimum_stock ? 'badge-low-stock' : 'badge-in-stock'
                  }`}>
                    {currentProduct.status}
                  </span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="qty_input">
                Quantity to {actionType === 'add' ? 'Receive (Add)' : 'Dispatch (Remove)'}
              </label>
              <input
                id="qty_input"
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={submitting || !products.length}
            >
              {submitting ? 'Updating Database...' : (
                <>
                  <CheckCircle2 size={17} />
                  <span>Execute {actionType === 'add' ? 'Stock In' : 'Stock Out'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Stock Summary Table */}
        <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="search-box" style={{ maxWidth: '260px' }}>
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Filter stock table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchProducts}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU / ID</th>
                  <th>Current Stock</th>
                  <th>Min Alert</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} style={selectedProductId === p.product_id ? { backgroundColor: '#f5f3ff' } : {}}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category}</div>
                    </td>
                    <td>
                      <code>{p.product_id}</code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: p.quantity <= p.minimum_stock ? '#d97706' : 'inherit' }}>
                        {p.quantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {p.minimum_stock}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.quantity <= 0 ? 'badge-out-of-stock' :
                        p.quantity <= p.minimum_stock ? 'badge-low-stock' : 'badge-in-stock'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedProductId(p.product_id)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
