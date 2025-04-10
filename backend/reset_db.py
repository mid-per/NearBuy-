import os
import shutil
import requests
from app.main import create_app
from app import db

app, socketio = create_app()

# Corrected path to the uploads folder
uploads_folder = os.path.abspath(os.path.join(os.getcwd(), 'app', 'uploads'))

# Function to clear the uploads folder
def clear_uploads_folder(folder_path):
    if os.path.exists(folder_path):
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)  # Remove file
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)  # Remove directory and its contents
            except Exception as e:
                print(f"Error removing {file_path}: {e}")
    else:
        print(f"Uploads folder not found at {folder_path}")

with app.app_context():
    print("Clearing uploads folder...")
    clear_uploads_folder(uploads_folder)
    print("Uploads folder cleared.")

    print("Dropping all tables...")
    db.drop_all()

    print("Creating fresh tables...")
    db.create_all()

    print("Database reset complete!")

    # Send a POST request to the '/create-test-users' route
    print("Creating test users...")
    try:
        response = requests.post('http://192.168.1.159:5000/create-test-users')  # Adjust the URL if necessary
        if response.status_code == 201:
            print("Test users created successfully!")
        else:
            print(f"Failed to create test users: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error calling the create-test-users route: {e}")
