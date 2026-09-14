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

    # Enable CORS for React frontend (supports custom FRONTEND_URL or all origins)
    frontend_origin = os.getenv('FRONTEND_URL', '*')
    CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

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
                '/api/products/<id>',
                '/api/stock/add',
                '/api/stock/remove',
                '/api/history'
            ]
        })

    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    
    # If PostgreSQL host is reachable, use it directly
    if check_db_connection(db_uri):
        print(f"[Database] Connected to PostgreSQL: {db_uri.split('@')[-1] if '@' in db_uri else db_uri}")
    else:
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
            print("[Database] Verified tables 'products' and 'inventory_history'. Ready for real data.")
        except Exception as e:
            print(f"[Database Warning during initialization]: {e}")
            sqlite_path = os.path.join(os.path.dirname(__file__), 'inventory.db')
            print(f"[Database Fallback] Switching to SQLite database: sqlite:///{sqlite_path}")
            app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'
            db.init_app(app)
            db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"Starting Flask Backend on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
