# backend/app/services/auth_service.py
from werkzeug.security import check_password_hash
from app.models.user_model import User
from app import db

def authenticate_user(email: str, password: str) -> User:
    """Verify user credentials and return the User object if valid."""
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return user
    return None  # Authentication failed