import re
from flask import Blueprint, request, jsonify
from models import db, User, Product, InventoryHistory
from auth import generate_token, token_required

api_bp = Blueprint('api', __name__, url_prefix='/api')

EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'

# ==================== Authentication Routes ====================

@api_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        
        full_name = (data.get('full_name') or data.get('fullName') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password', '')
        
        if not full_name:
            return jsonify({'success': False, 'message': 'Full Name is required.'}), 400
            
        if not email or not re.match(EMAIL_REGEX, email):
            return jsonify({'success': False, 'message': 'Please provide a valid email address.'}), 400
            
        if not password or len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters long.'}), 400
            
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'An account with this email already exists.'}), 400
            
        new_user = User(
            full_name=full_name,
            email=email
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully! Please sign in.',
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500


@api_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required.'}), 400
            
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401
            
        token = generate_token(user.id)
        
        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'token': token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Login error: {str(e)}'}), 500


@api_bp.route('/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'success': True,
        'user': current_user.to_dict()
    }), 200


# ==================== Protected Dashboard ====================

@api_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    try:
        products = Product.query.filter_by(user_id=current_user.id).all()
        total_products = len(products)
        total_stock = sum(p.quantity for p in products)
        inventory_value = sum(p.quantity * p.price for p in products)
        
        low_stock = sum(1 for p in products if 0 < p.quantity <= p.minimum_stock)
        out_of_stock = sum(1 for p in products if p.quantity <= 0)
        
        # Get recent 6 history entries for this user
        recent_history = InventoryHistory.query.filter_by(user_id=current_user.id)\
            .order_by(InventoryHistory.created_at.desc()).limit(6).all()
        
        return jsonify({
            'success': True,
            'data': {
                'total_products': total_products,
                'total_stock': total_stock,
                'inventory_value': round(inventory_value, 2),
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'recent_activity': [h.to_dict() for h in recent_history]
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== Protected Products ====================

@api_bp.route('/products', methods=['GET'])
@token_required
def get_products(current_user):
    try:
        search_query = request.args.get('search', '').strip().lower()
        category_filter = request.args.get('category', '').strip().lower()
        
        query = Product.query.filter_by(user_id=current_user.id)
        
        if search_query:
            query = query.filter(
                (Product.product_name.ilike(f'%{search_query}%')) |
                (Product.product_id.ilike(f'%{search_query}%')) |
                (Product.category.ilike(f'%{search_query}%')) |
                (Product.supplier.ilike(f'%{search_query}%'))
            )
            
        if category_filter and category_filter != 'all':
            query = query.filter(Product.category.ilike(category_filter))
            
        products = query.order_by(Product.created_at.desc()).all()
            
        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in products]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['GET'])
@token_required
def get_product(current_user, id):
    try:
        product = Product.query.filter_by(id=id, user_id=current_user.id).first()
        if not product:
            return jsonify({'success': False, 'message': 'Product not found.'}), 404
            
        return jsonify({
            'success': True,
            'data': product.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/products', methods=['POST'])
@token_required
def add_product(current_user):
    try:
        data = request.get_json() or {}
        
        product_name = (data.get('product_name') or data.get('productName') or '').strip()
        product_id = (data.get('product_id') or data.get('sku') or '').strip()
        category = (data.get('category') or '').strip()
        supplier = (data.get('supplier') or '').strip()
        price = data.get('price', 0)
        quantity = data.get('quantity', 0)
        minimum_stock = data.get('minimum_stock') or data.get('minimumStock') or 5
        
        if not product_name or not product_id or not category:
            return jsonify({'success': False, 'message': 'Product Name, Product ID, and Category are required.'}), 400
        
        # Check uniqueness of product_id for this user
        existing = Product.query.filter_by(user_id=current_user.id, product_id=product_id).first()
        if existing:
            return jsonify({'success': False, 'message': f'Product ID "{product_id}" already exists in your inventory.'}), 400
        
        new_product = Product(
            user_id=current_user.id,
            product_name=product_name,
            product_id=product_id,
            category=category,
            supplier=supplier,
            price=float(price),
            quantity=int(quantity),
            minimum_stock=int(minimum_stock)
        )
        db.session.add(new_product)
        
        # Add audit history log associated with user
        history_entry = InventoryHistory(
            user_id=current_user.id,
            product_id=product_id,
            action='Product Added',
            quantity=int(quantity)
        )
        db.session.add(history_entry)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product added successfully to database!',
            'data': new_product.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['PUT'])
@token_required
def update_product(current_user, id):
    try:
        product = Product.query.filter_by(id=id, user_id=current_user.id).first()
        if not product:
            return jsonify({'success': False, 'message': 'Product not found in your inventory.'}), 404
            
        data = request.get_json() or {}
        
        new_product_id = (data.get('product_id') or data.get('sku') or product.product_id).strip()
        if new_product_id != product.product_id:
            existing = Product.query.filter_by(user_id=current_user.id, product_id=new_product_id).first()
            if existing:
                return jsonify({'success': False, 'message': f'Product ID "{new_product_id}" is already used by another item.'}), 400
        
        product.product_name = (data.get('product_name') or data.get('productName') or product.product_name).strip()
        product.product_id = new_product_id
        product.category = (data.get('category') or product.category).strip()
        product.supplier = (data.get('supplier') if 'supplier' in data else product.supplier).strip()
        product.price = float(data.get('price', product.price))
        
        new_quantity = int(data.get('quantity', product.quantity))
        product.quantity = new_quantity
        product.minimum_stock = int(data.get('minimum_stock', data.get('minimumStock', product.minimum_stock)))
        
        history_entry = InventoryHistory(
            user_id=current_user.id,
            product_id=product.product_id,
            action='Product Updated',
            quantity=new_quantity
        )
        db.session.add(history_entry)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product updated successfully in database!',
            'data': product.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['DELETE'])
@token_required
def delete_product(current_user, id):
    try:
        product = Product.query.filter_by(id=id, user_id=current_user.id).first()
        if not product:
            return jsonify({'success': False, 'message': 'Product not found in your inventory.'}), 404
            
        prod_id = product.product_id
        prod_qty = product.quantity
        
        db.session.delete(product)
        
        history_entry = InventoryHistory(
            user_id=current_user.id,
            product_id=prod_id,
            action='Product Deleted',
            quantity=prod_qty
        )
        db.session.add(history_entry)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Product "{prod_id}" deleted successfully from database.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== Protected Stock Management ====================

@api_bp.route('/stock/add', methods=['POST'])
@token_required
def add_stock(current_user):
    try:
        data = request.get_json() or {}
        product_id = (data.get('product_id') or data.get('sku') or '').strip()
        quantity_to_add = int(data.get('quantity', 0))
        
        if not product_id or quantity_to_add <= 0:
            return jsonify({'success': False, 'message': 'Valid Product ID and positive quantity required.'}), 400
            
        product = Product.query.filter_by(user_id=current_user.id, product_id=product_id).first()
        if not product:
            return jsonify({'success': False, 'message': f'Product with ID "{product_id}" not found in your inventory.'}), 404
            
        product.quantity += quantity_to_add
        
        history_entry = InventoryHistory(
            user_id=current_user.id,
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
@token_required
def remove_stock(current_user):
    try:
        data = request.get_json() or {}
        product_id = (data.get('product_id') or data.get('sku') or '').strip()
        quantity_to_remove = int(data.get('quantity', 0))
        
        if not product_id or quantity_to_remove <= 0:
            return jsonify({'success': False, 'message': 'Valid Product ID and positive quantity required.'}), 400
            
        product = Product.query.filter_by(user_id=current_user.id, product_id=product_id).first()
        if not product:
            return jsonify({'success': False, 'message': f'Product with ID "{product_id}" not found in your inventory.'}), 404
            
        if product.quantity < quantity_to_remove:
            return jsonify({
                'success': False, 
                'message': f'Insufficient stock. Available: {product.quantity}, Requested: {quantity_to_remove}.'
            }), 400
            
        product.quantity -= quantity_to_remove
        
        history_entry = InventoryHistory(
            user_id=current_user.id,
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


# ==================== Protected History ====================

@api_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    try:
        history = InventoryHistory.query.filter_by(user_id=current_user.id)\
            .order_by(InventoryHistory.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [h.to_dict() for h in history]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
