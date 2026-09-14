import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'inventory-secret-key-2026')
    
    # PostgreSQL Database URI
    # Format: postgresql+psycopg://username:password@localhost:5432/database_name
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'inventory_db')
    
    # Check if custom DATABASE_URL was provided
    custom_uri = os.getenv('DATABASE_URL')
    if custom_uri:
        if custom_uri.startswith('postgresql://'):
            SQLALCHEMY_DATABASE_URI = custom_uri.replace('postgresql://', 'postgresql+psycopg://', 1)
        else:
            SQLALCHEMY_DATABASE_URI = custom_uri
    else:
        SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
