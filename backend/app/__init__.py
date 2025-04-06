from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import models after db is initialized
from .models import user_model, listing_model