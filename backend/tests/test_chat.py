import pytest
from app.main import create_app
from app import db
from app.models.user_model import User
from app.models.listing_model import Listing, Transaction
from app.models.chat_model import ChatRoom, ChatMessage
import json
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash

@pytest.fixture
def client():
    app, socketio = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create test users
            seller = User(
                email="seller@test.com",
                password=generate_password_hash("sellerpass")
            )
            buyer = User(
                email="buyer@test.com",
                password=generate_password_hash("buyerpass")
            )
            db.session.add_all([seller, buyer])
            db.session.commit()
            
            # Create test transaction
            listing = Listing(
                title="Test Item",
                price=100,
                seller_id=seller.id
            )
            transaction = Transaction(
                buyer_id=buyer.id,
                seller_id=seller.id,
                listing_id=1
            )
            db.session.add_all([listing, transaction])
            db.session.commit()
            
        yield client
        with app.app_context():
            db.drop_all()

def get_auth_header(client, email, password):
    response = client.post('/api/login', json={
        "email": email,
        "password": password
    })
    data = json.loads(response.data.decode('utf-8'))
    return {'Authorization': f'Bearer {data["access_token"]}'}

def test_chat_workflow(client):
    # Setup auth headers
    buyer_headers = get_auth_header(client, "buyer@test.com", "buyerpass")
    seller_headers = get_auth_header(client, "seller@test.com", "sellerpass")
    
    # Buyer starts chat
    response = client.get('/api/chats/1', headers=buyer_headers)
    assert response.status_code == 200
    room_id = json.loads(response.data.decode('utf-8'))['room_id']
    
    # Seller sends message
    response = client.post(
        f'/api/chats/{room_id}/messages',
        json={"content": "Is this available?"},
        headers=seller_headers
    )
    assert response.status_code == 201
    
    # Buyer retrieves messages
    response = client.get(f'/api/chats/{room_id}/messages', headers=buyer_headers)
    assert response.status_code == 200
    messages = json.loads(response.data.decode('utf-8'))
    assert len(messages) == 1
    assert "available" in messages[0]['content']