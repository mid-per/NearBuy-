from flask import Flask, send_from_directory, jsonify
from flask_jwt_extended import JWTManager
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
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 'database/nearbuy.db'
    ))
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', os.urandom(24))
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-123')
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400
    app.config["JWT_IDENTITY_CLAIM"] = "sub"
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    # Initialize Socket.IO first
    socketio = init_socketio(app)
    
    # Then initialize other extensions
    db.init_app(app)
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    limiter.init_app(app)

    # Register blueprints
    app.register_blueprint(bp)
    app.register_blueprint(chat_bp)
    
    @app.route('/uploads/<filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "message": str(e) if app.debug else "Something went wrong"
        }), 500

    return app, socketio

app, socketio = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)