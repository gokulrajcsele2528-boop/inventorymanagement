from flask import Blueprint, request, jsonify
from models import db, Product, InventoryHistory

api_bp = Blueprint('api', __name__, url_prefix='/api')

# ==================== Dashboard ====================
@api_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    try:
        products = Product.query.all()
        total_products = len(products)
        total_stock = sum(p.quantity for p in products)
        
        low_stock = sum(1 for p in products if 0 < p.quantity <= p.minimum_stock)
        out_of_stock = sum(1 for p in products if p.quantity <= 0)
        
        # Get recent 6 history entries
        recent_history = InventoryHistory.query.order_by(InventoryHistory.created_at.desc()).limit(6).all()
        
        return jsonify({
            'success': True,
            'data': {
                'total_products': total_products,
                'total_stock': total_stock,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'recent_activity': [h.to_dict() for h in recent_history]
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== Products ====================
@api_bp.route('/products', methods=['GET'])
def get_products():
    try:
        search_query = request.args.get('search', '').strip().lower()
        if search_query:
            products = Product.query.filter(
                (Product.product_name.ilike(f'%{search_query}%')) |
                (Product.product_id.ilike(f'%{search_query}%')) |
                (Product.category.ilike(f'%{search_query}%'))
            ).order_by(Product.created_at.desc()).all()
        else:
            products = Product.query.order_by(Product.created_at.desc()).all()
            
        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in products]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/products', methods=['POST'])
def add_product():
    try:
        data = request.get_json() or {}
        
        product_name = data.get('product_name', '').strip()
        product_id = data.get('product_id', '').strip()
        category = data.get('category', '').strip()
        price = data.get('price', 0)
        quantity = data.get('quantity', 0)
        minimum_stock = data.get('minimum_stock', 5)
        
        if not product_name or not product_id or not category:
            return jsonify({'success': False, 'message': 'Product Name, Product ID, and Category are required.'}), 400
        
        # Check uniqueness of product_id
        existing = Product.query.filter_by(product_id=product_id).first()
        if existing:
            return jsonify({'success': False, 'message': f'Product ID "{product_id}" already exists.'}), 400
        
        new_product = Product(
            product_name=product_name,
            product_id=product_id,
            category=category,
            price=float(price),
            quantity=int(quantity),
            minimum_stock=int(minimum_stock)
        )
        db.session.add(new_product)
        
        # Add history log
        history_entry = InventoryHistory(
            product_id=product_id,
            action='Product Added',
            quantity=int(quantity)
        )
        db.session.add(history_entry)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product added successfully!',
            'data': new_product.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['PUT'])
def update_product(id):
    try:
        product = Product.query.get(id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found.'}), 404
            
        data = request.get_json() or {}
        
        # Check if product_id is changing and already taken
        new_product_id = data.get('product_id', product.product_id).strip()
        if new_product_id != product.product_id:
            existing = Product.query.filter_by(product_id=new_product_id).first()
            if existing:
                return jsonify({'success': False, 'message': f'Product ID "{new_product_id}" is already used.'}), 400
        
        product.product_name = data.get('product_name', product.product_name).strip()
        product.product_id = new_product_id
        product.category = data.get('category', product.category).strip()
        product.price = float(data.get('price', product.price))
        
        old_quantity = product.quantity
        new_quantity = int(data.get('quantity', product.quantity))
        product.quantity = new_quantity
        product.minimum_stock = int(data.get('minimum_stock', product.minimum_stock))
        
        # History record for update
        history_entry = InventoryHistory(
            product_id=product.product_id,
            action='Product Updated',
            quantity=new_quantity
        )
        db.session.add(history_entry)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product updated successfully!',
            'data': product.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    try:
        product = Product.query.get(id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found.'}), 404
            
        prod_id = product.product_id
        prod_qty = product.quantity
        
        db.session.delete(product)
        
        # History log for deletion
        history_entry = InventoryHistory(
            product_id=prod_id,
            action='Product Deleted',
            quantity=prod_qty
        )
        db.session.add(history_entry)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Product "{prod_id}" deleted successfully.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== Stock Management ====================
@api_bp.route('/stock/add', methods=['POST'])
def add_stock():
    try:
        data = request.get_json() or {}
        product_id = data.get('product_id', '').strip()
        quantity_to_add = int(data.get('quantity', 0))
        
        if not product_id or quantity_to_add <= 0:
            return jsonify({'success': False, 'message': 'Valid Product ID and positive quantity required.'}), 400
            
        product = Product.query.filter_by(product_id=product_id).first()
        if not product:
            return jsonify({'success': False, 'message': f'Product with ID "{product_id}" not found.'}), 404
            
        product.quantity += quantity_to_add
        
        history_entry = InventoryHistory(
            product_id=product_id,
            action='Stock Added',
            quantity=quantity_to_add
        )
        db.session.add(history_entry)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully added {quantity_to_add} units to {product.product_name}.',
            'data': product.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/stock/remove', methods=['POST'])
def remove_stock():
    try:
        data = request.get_json() or {}
        product_id = data.get('product_id', '').strip()
        quantity_to_remove = int(data.get('quantity', 0))
        
        if not product_id or quantity_to_remove <= 0:
            return jsonify({'success': False, 'message': 'Valid Product ID and positive quantity required.'}), 400
            
        product = Product.query.filter_by(product_id=product_id).first()
        if not product:
            return jsonify({'success': False, 'message': f'Product with ID "{product_id}" not found.'}), 404
            
        if product.quantity < quantity_to_remove:
            return jsonify({
                'success': False, 
                'message': f'Insufficient stock. Available: {product.quantity}, Requested: {quantity_to_remove}.'
            }), 400
            
        product.quantity -= quantity_to_remove
        
        history_entry = InventoryHistory(
            product_id=product_id,
            action='Stock Removed',
            quantity=quantity_to_remove
        )
        db.session.add(history_entry)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully removed {quantity_to_remove} units from {product.product_name}.',
            'data': product.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== Inventory History ====================
@api_bp.route('/history', methods=['GET'])
def get_history():
    try:
        history = InventoryHistory.query.order_by(InventoryHistory.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [h.to_dict() for h in history]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
