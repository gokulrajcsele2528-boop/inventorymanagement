import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'inventory-secret-key-2026')
    
    # Custom DATABASE_URL or individual PG credentials
    raw_db_url = os.getenv('DATABASE_URL')
    
    if raw_db_url:
        # Standardize postgres:// and postgresql:// for psycopg 3
        if raw_db_url.startswith('postgres://'):
            SQLALCHEMY_DATABASE_URI = raw_db_url.replace('postgres://', 'postgresql+psycopg://', 1)
        elif raw_db_url.startswith('postgresql://'):
            SQLALCHEMY_DATABASE_URI = raw_db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
        else:
            SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_NAME = os.getenv('DB_NAME', 'inventory_db')
        SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
