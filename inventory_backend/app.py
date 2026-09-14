import os
import socket
from urllib.parse import urlparse
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db, Product, InventoryHistory
from routes import api_bp

def check_db_connection(uri, timeout=1.5):
    try:
        if not uri or not uri.startswith('postgresql'):
            return False
        parsed = urlparse(uri)
        host = parsed.hostname or 'localhost'
        port = parsed.port or 5432
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
            'database': app.config.get('SQLALCHEMY_DATABASE_URI', '').split('@')[-1] if '@' in app.config.get('SQLALCHEMY_DATABASE_URI', '') else 'Local DB',
            'endpoints': [
                '/api/dashboard',
                '/api/products',
                '/api/stock/add',
                '/api/stock/remove',
                '/api/history'
            ]
        })

    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    
    # If PostgreSQL host is reachable, use it directly
    if check_db_connection(db_uri):
        print(f"[Database] PostgreSQL service connection verified. Using PostgreSQL.")
    else:
        # If local/remote PG is unreachable, fallback to SQLite for zero downtime
        sqlite_path = os.path.join(os.path.dirname(__file__), 'inventory.db')
        if not os.getenv('FORCE_POSTGRES'):
            print(f"[Database Notice] PostgreSQL host was unreachable. Using local SQLite: sqlite:///{sqlite_path}")
            app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'
        else:
            print(f"[Database Info] Forcing PostgreSQL connection to {db_uri}")

    db.init_app(app)
    with app.app_context():
        try:
            db.create_all()
            seed_initial_data()
        except Exception as e:
            print(f"[Database Warning during initialization]: {e}")
            sqlite_path = os.path.join(os.path.dirname(__file__), 'inventory.db')
            print(f"[Database Fallback] Switching to SQLite database: sqlite:///{sqlite_path}")
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
        print("[Database] Initial products and audit history populated.")

app = create_app()

if __name__ == '__main__':
    print("Starting Flask Backend on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
