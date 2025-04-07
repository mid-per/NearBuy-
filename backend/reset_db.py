from app.main import create_app
from app import db

app, socketio = create_app()

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating fresh tables...")
    db.create_all()
    print("Database reset complete!")