from flask import Flask, send_from_directory, jsonify
from flask_jwt_extended import JWTManager  # Import JWT manager
from app import db
from flask_migrate import Migrate
from app.routes import bp
from app.chat_routes import bp as chat_bp
from app.socket_events import init_socketio
import os
from dotenv import load_dotenv
from app.extensions import limiter

load_dotenv()

def create_app():
    # 1. Initialize Flask app
    app = Flask(__name__)
    
    # 2. Database Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 'database/nearbuy.db'
    ))
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking
    app.config['SECRET_KEY'] = os.urandom(24)  # Random secret key for session security

    # 3. JWT Configuration (NEW)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-123') # Change this in production!
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]  # Look for tokens in Authorization header
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # Token expires in 1 hour (in seconds)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400  # 24 hours for refresh tokens
    app.config["JWT_IDENTITY_CLAIM"] = "sub"  # Ensures consistent identity claim
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

    # 4. Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)  # Initialize JWT
    migrate = Migrate(app, db)
    limiter.init_app(app)  # Initialize limiter with app

    # 5. Register blueprints (route groups)
    app.register_blueprint(bp)
    app.register_blueprint(chat_bp)
    
    @app.route('/uploads/<filename>')
    def serve_uploaded_file(filename):
        print(f"Looking for file at: {os.path.abspath(os.path.join(app.config['UPLOAD_FOLDER'], filename))}")
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log the error
        app.logger.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        
        # Return consistent error format
        return jsonify({
            "error": "Internal server error",
            "message": str(e) if app.debug else "Something went wrong"
        }), 500

    socketio = init_socketio(app)
    return app, socketio

app, socketio = create_app() 

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)