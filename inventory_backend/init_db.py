import os
import sys
from app import create_app
from models import db, Product, InventoryHistory

def init_database():
    app = create_app()
    with app.app_context():
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        print("\n=======================================================")
        print(f" Connecting to Database: {db_uri.split('@')[-1] if '@' in db_uri else db_uri}")
        print("=======================================================")
        
        try:
            db.create_all()
            print("[OK] Tables 'products' and 'inventory_history' verified/created.")
            
            product_count = Product.query.count()
            history_count = InventoryHistory.query.count()
            
            print(f"[OK] Current Products in Database: {product_count}")
            print(f"[OK] Current History Logs: {history_count}")
            print("[OK] Database is connected and fully operational!")
            print("=======================================================\n")
            return True
        except Exception as e:
            print(f"[ERROR] Database connection error: {e}")
            print("=======================================================\n")
            return False

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)
