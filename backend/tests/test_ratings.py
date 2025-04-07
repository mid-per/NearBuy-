import pytest
from app.main import create_app
from app import db
from app.models.user_model import User
from app.models.listing_model import Listing, Transaction
import json
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash

@pytest.fixture
def client():
    app, socketio = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'  # Required for JWT
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create test users with hashed passwords
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
            
            # Create a completed transaction
            listing = Listing(
                title="Test Item",
                price=10,
                seller_id=seller.id
            )
            transaction = Transaction(
                buyer_id=buyer.id,
                seller_id=seller.id,
                listing_id=1,
                completed=True,
                completed_at=datetime.now(timezone.utc)
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

# --- Rating Submission Tests ---
def test_rate_transaction_success(client):
    headers = get_auth_header(client, "buyer@test.com", "buyerpass")
    response = client.post(
        '/api/transactions/1/rate',
        json={"rating": 5, "feedback": "Great seller!"},
        headers=headers
    )
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data['message'] == "Rating submitted"
    
    # Verify rating saved
    with client.application.app_context():
        transaction = Transaction.query.get(1)
        assert transaction.rating == 5
        assert transaction.feedback == "Great seller!"

def test_rate_transaction_invalid_rating(client):
    headers = get_auth_header(client, "buyer@test.com", "buyerpass")
    response = client.post(
        '/api/transactions/1/rate',
        json={"rating": 6},  # Invalid
        headers=headers
    )
    assert response.status_code == 400
    assert b"1-5" in response.data

def test_rate_transaction_unauthorized(client):
    # Seller tries to rate their own transaction
    headers = get_auth_header(client, "seller@test.com", "sellerpass")
    response = client.post(
        '/api/transactions/1/rate',
        json={"rating": 5},
        headers=headers
    )
    assert response.status_code == 404  # Not eligible

# --- Seller Rating Tests ---
def test_get_seller_rating(client):
    # First submit a rating
    headers = get_auth_header(client, "buyer@test.com", "buyerpass")
    client.post('/api/transactions/1/rate', 
               json={"rating": 4}, 
               headers=headers)
    
    # Check average
    response = client.get('/api/users/1/rating')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data['average_rating'] == 4.0
    assert data['total_ratings'] == 1

def test_get_seller_rating_no_ratings(client):
    response = client.get('/api/users/1/rating')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data['average_rating'] is None
    assert data['total_ratings'] == 0