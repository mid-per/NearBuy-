import pytest
import time
from app.main import create_app
from app import db
from app.models.user_model import User
from werkzeug.security import generate_password_hash

@pytest.fixture
def app():
    app, socketio = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    with app.app_context():
        db.create_all()
        user = User(
            email="test@test.com",
            password=generate_password_hash("testpass")
        )
        db.session.add(user)
        db.session.commit()
    yield app, socketio  # Now yields both
    with app.app_context():
        db.drop_all()

@pytest.fixture
def socketio_client(app):
    app, socketio = app  # Unpack the fixture
    client = socketio.test_client(app, flask_test_client=app.test_client())
    client.connect()
    # Join a test room
    client.emit('join', {'room_id': 1})
    time.sleep(0.1)  # Allow time for joining
    yield client
    client.disconnect()

def test_basic_connection(socketio_client):
    assert socketio_client.is_connected()

def test_message_exchange(socketio_client):
    # Send test message
    socketio_client.emit('send_message', {
        'room_id': 1,
        'user_id': 1,
        'content': 'Hello test'
    })
    
    # Increased delay and multiple checks
    received = []
    for _ in range(5):  # Try multiple times
        time.sleep(0.2)
        received = socketio_client.get_received()
        if received:
            break
    
    print(f"Debug - Received messages: {received}")  # Debug output
    
    # Verify response
    assert len(received) == 1
    assert received[0]['name'] == 'new_message'
    assert received[0]['args'][0]['content'] == 'Hello test'