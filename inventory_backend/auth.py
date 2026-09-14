import os
from datetime import datetime, timedelta
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from models import User

def generate_token(user_id):
    secret_key = current_app.config.get('SECRET_KEY', 'inventory-secret-key-2026')
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None

        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1].strip()
        elif 'x-access-token' in request.headers:
            token = request.headers['x-access-token']

        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is required.'}), 401

        try:
            secret_key = current_app.config.get('SECRET_KEY', 'inventory-secret-key-2026')
            data = jwt.decode(token, secret_key, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'success': False, 'message': 'User session is invalid or user no longer exists.'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Session expired. Please log in again.'}), 401
        except (jwt.InvalidTokenError, Exception) as e:
            return jsonify({'success': False, 'message': 'Invalid authentication token.'}), 401

        return f(current_user, *args, **kwargs)

    return decorated
