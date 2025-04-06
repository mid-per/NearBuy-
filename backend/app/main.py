from flask import Flask
from flask_jwt_extended import JWTManager  # Import JWT manager
from app import db
from app.routes import bp
from app.chat_routes import bp as chat_bp
import os

def create_app():
    # 1. Initialize Flask app
    app = Flask(__name__)
    
    # 2. Database Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 'database/nearbuy.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking
    app.config['SECRET_KEY'] = os.urandom(24)  # Random secret key for session security

    # 3. JWT Configuration (NEW)
    app.config["JWT_SECRET_KEY"] = "super-secret-key-123"  # Change this in production!
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]  # Look for tokens in Authorization header
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # Token expires in 1 hour (in seconds)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400  # 24 hours for refresh tokens
    app.config["JWT_IDENTITY_CLAIM"] = "sub"  # Ensures consistent identity claim

    # 4. Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)  # Initialize JWT

    # 5. Register blueprints (route groups)
    app.register_blueprint(bp)
    app.register_blueprint(chat_bp)
    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True)  # Run in debug mode