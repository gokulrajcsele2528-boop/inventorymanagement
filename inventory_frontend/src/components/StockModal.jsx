import React, { useState, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, Check } from 'lucide-react';
import { inventoryAPI } from '../api';

export default function StockModal({ isOpen, onClose, onSuccess, products = [], defaultProduct = null }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [actionType, setActionType] = useState('add'); // 'add' or 'remove'
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultProduct) {
      setSelectedProductId(defaultProduct.product_id);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].product_id);
    }
    setQuantity('');
    setError('');
    setActionType('add');
  }, [defaultProduct, products, isOpen]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.product_id === selectedProductId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantity, 10);
    if (!selectedProductId || !qty || qty <= 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    if (actionType === 'remove' && currentProduct && currentProduct.quantity < qty) {
      setError(`Cannot remove ${qty} units. Current stock is only ${currentProduct.quantity}.`);
      return;
    }

    try {
      setSubmitting(true);
      if (actionType === 'add') {
        await inventoryAPI.addStock(selectedProductId, qty);
        onSuccess(`Successfully added ${qty} units to ${currentProduct?.product_name || selectedProductId}!`);
      } else {
        await inventoryAPI.removeStock(selectedProductId, qty);
        onSuccess(`Successfully removed ${qty} units from ${currentProduct?.product_name || selectedProductId}!`);
      }
      onClose();
    } catch (err) {
      console.error('Stock adjustment error:', err);
      setError(err.response?.data?.message || 'Failed to adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Stock Management</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                border: '1px solid #fecdd3'
              }}>
                {error}
              </div>
            )}

            {/* Mode selection buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`btn ${actionType === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActionType('add')}
              >
                <ArrowUpCircle size={18} />
                <span>Add Stock (In)</span>
              </button>
              <button
                type="button"
                className={`btn ${actionType === 'remove' ? 'btn-primary' : 'btn-secondary'}`}
                style={actionType === 'remove' ? { backgroundColor: '#d97706', borderColor: '#d97706' } : {}}
                onClick={() => setActionType('remove')}
              >
                <ArrowDownCircle size={18} />
                <span>Remove Stock (Out)</span>
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="stock_product">Select Product</label>
              <select
                id="stock_product"
                className="form-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
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
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.15rem',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Available Stock:</span>
                  <strong>{currentProduct.quantity} units</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
              <label className="form-label" htmlFor="quantity_adj">Quantity to {actionType === 'add' ? 'Add' : 'Remove'}</label>
              <input
                id="quantity_adj"
                type="number"
                min="1"
                className="form-input"
                placeholder="Enter units count..."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Check size={16} />
              <span>{submitting ? 'Updating...' : `Confirm ${actionType === 'add' ? 'Add' : 'Remove'} Stock`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
