import os
import socket
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db, Product, InventoryHistory
from routes import api_bp

def is_postgres_available(host='localhost', port=5432, timeout=1.0):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, int(port)))
        sock.close()
        return result == 0
    except Exception:
        return False

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API blueprint
    app.register_blueprint(api_bp)

    # Health check endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'status': 'online',
            'system': 'Inventory Management System Backend API',
            'endpoints': [
                '/api/dashboard',
                '/api/products',
                '/api/stock/add',
                '/api/stock/remove',
                '/api/history'
            ]
        })

    # Check if PostgreSQL is available
    pg_host = app.config.get('DB_HOST', 'localhost')
    pg_port = app.config.get('DB_PORT', 5432)
    
    if is_postgres_available(pg_host, pg_port):
        print(f"[Database] PostgreSQL service detected on {pg_host}:{pg_port}. Connecting to PostgreSQL...")
    else:
        sqlite_path = os.path.join(os.path.dirname(__file__), 'inventory.db')
        print(f"[Database Notice] PostgreSQL is not running on {pg_host}:{pg_port}.")
        print(f"[Database Notice] Using local SQLite database at: {sqlite_path}")
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'

    db.init_app(app)
    with app.app_context():
        try:
            db.create_all()
            seed_initial_data()
        except Exception as e:
            print(f"[Database Error during create_all]: {e}")
            sqlite_path = os.path.join(os.path.dirname(__file__), 'inventory.db')
            print(f"[Database Fallback] Switching to SQLite: sqlite:///{sqlite_path}")
            app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'
            db.init_app(app)
            db.create_all()
            seed_initial_data()

    return app

def seed_initial_data():
    if Product.query.count() == 0:
        sample_products = [
            {
                'product_name': 'MacBook Pro 16"',
                'product_id': 'TECH-001',
                'category': 'Electronics',
                'price': 2499.99,
                'quantity': 12,
                'minimum_stock': 5
            },
            {
                'product_name': 'Logitech MX Master 3S',
                'product_id': 'TECH-002',
                'category': 'Accessories',
                'price': 99.99,
                'quantity': 28,
                'minimum_stock': 10
            },
            {
                'product_name': 'Dell UltraSharp 27" 4K',
                'product_id': 'TECH-003',
                'category': 'Monitors',
                'price': 599.50,
                'quantity': 4,
                'minimum_stock': 6
            },
            {
                'product_name': 'Keychron Q1 Pro Keyboard',
                'product_id': 'TECH-004',
                'category': 'Accessories',
                'price': 199.00,
                'quantity': 0,
                'minimum_stock': 5
            },
            {
                'product_name': 'Sony WH-1000XM5 Headphones',
                'product_id': 'TECH-005',
                'category': 'Audio',
                'price': 399.99,
                'quantity': 15,
                'minimum_stock': 5
            },
            {
                'product_name': 'Anker 100W USB-C Fast Charger',
                'product_id': 'TECH-006',
                'category': 'Cables & Power',
                'price': 49.99,
                'quantity': 42,
                'minimum_stock': 15
            }
        ]

        for p_data in sample_products:
            p = Product(**p_data)
            db.session.add(p)
            history = InventoryHistory(
                product_id=p.product_id,
                action='Product Added',
                quantity=p.quantity
            )
            db.session.add(history)

        db.session.commit()
        print("[Database] Seeded initial demo products successfully.")

app = create_app()

if __name__ == '__main__':
    print("Starting Flask Backend on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
