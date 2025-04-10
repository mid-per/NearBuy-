import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app
from app import db
import time

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    if not file or not allowed_file(file.filename):
        return None
    
    # Create uploads directory if it doesn't exist
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Generate filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"listing_{int(time.time()*1000)}.{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    print(f"File saved to: {os.path.abspath(filepath)}")  # Debug logging
    return f"/uploads/{filename}"  # Return consistent URL path