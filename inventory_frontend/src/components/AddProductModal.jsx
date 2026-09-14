import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { inventoryAPI } from '../api';

export default function AddProductModal({ isOpen, onClose, onSuccess, initialProduct = null }) {
  const [formData, setFormData] = useState({
    product_name: '',
    product_id: '',
    category: '',
    supplier: '',
    price: '',
    quantity: '',
    minimum_stock: '5',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        product_name: initialProduct.product_name || initialProduct.productName || '',
        product_id: initialProduct.product_id || initialProduct.sku || '',
        category: initialProduct.category || '',
        supplier: initialProduct.supplier || '',
        price: initialProduct.price !== undefined ? initialProduct.price : '',
        quantity: initialProduct.quantity !== undefined ? initialProduct.quantity : '',
        minimum_stock: initialProduct.minimum_stock !== undefined ? initialProduct.minimum_stock : '5',
      });
    } else {
      setFormData({
        product_name: '',
        product_id: '',
        category: '',
        supplier: '',
        price: '',
        quantity: '',
        minimum_stock: '5',
      });
    }
    setError('');
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.product_name.trim() || !formData.product_id.trim() || !formData.category.trim()) {
      setError('Please fill in Product Name, Product ID, and Category.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        product_name: formData.product_name.trim(),
        product_id: formData.product_id.trim(),
        category: formData.category.trim(),
        supplier: formData.supplier.trim(),
        price: parseFloat(formData.price) || 0,
        quantity: parseInt(formData.quantity, 10) || 0,
        minimum_stock: parseInt(formData.minimum_stock, 10) || 5,
      };

      if (initialProduct && initialProduct.id) {
        // Edit mode
        await inventoryAPI.updateProduct(initialProduct.id, payload);
        onSuccess('Product updated successfully in the database!');
      } else {
        // Add mode
        await inventoryAPI.addProduct(payload);
        onSuccess('Product added successfully to the database!');
      }
      onClose();
    } catch (err) {
      console.error('Save product error:', err);
      setError(err.response?.data?.message || 'Database error: Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialProduct ? 'Edit Product' : 'Add New Product'}</h3>
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

            <div className="form-group">
              <label className="form-label" htmlFor="product_name">Product Name *</label>
              <input
                id="product_name"
                name="product_name"
                type="text"
                className="form-input"
                placeholder="e.g. Wireless Keyboard"
                value={formData.product_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="product_id">Product ID (SKU) *</label>
                <input
                  id="product_id"
                  name="product_id"
                  type="text"
                  className="form-input"
                  placeholder="e.g. TECH-101"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Category *</label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Electronics"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="supplier">Supplier (Optional)</label>
              <input
                id="supplier"
                name="supplier"
                type="text"
                className="form-input"
                placeholder="e.g. Acme Tech Distributors"
                value={formData.supplier}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="price">Price ($) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="quantity">Quantity In Stock *</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="minimum_stock">Minimum Stock Alert Threshold</label>
              <input
                id="minimum_stock"
                name="minimum_stock"
                type="number"
                min="0"
                className="form-input"
                placeholder="5"
                value={formData.minimum_stock}
                onChange={handleChange}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                When quantity drops below this level, product status changes to "Low Stock".
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Check size={16} />
              <span>{submitting ? 'Saving to Database...' : initialProduct ? 'Update Product' : 'Add Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
