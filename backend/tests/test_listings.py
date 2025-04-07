import pytest
from app.main import create_app
from app import db
from app.models.user_model import User
from app.models.listing_model import Listing
import json
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash

@pytest.fixture
def client():
    app, socketio = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'  # Needed for JWT
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create test users with hashed passwords
            admin = User(
                email="admin@test.com",
                password=generate_password_hash("adminpass"),
                is_admin=True
            )
            seller = User(
                email="seller@test.com",
                password=generate_password_hash("sellerpass")
            )
            buyer = User(
                email="buyer@test.com",
                password=generate_password_hash("buyerpass")
            )
            db.session.add_all([admin, seller, buyer])
            db.session.commit()
            
            # Create test listings
            listing1 = Listing(
                title="Test Bike",
                description="Mountain bike",
                price=100,
                category="sports",
                seller_id=seller.id,
                created_at=datetime.now(timezone.utc) - timedelta(days=2)
            )
            listing2 = Listing(
                title="Test Book",
                description="Programming book",
                price=20,
                category="books",
                seller_id=seller.id,
                status="removed"
            )
            db.session.add_all([listing1, listing2])
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

# Test data
valid_listing_data = {
    "title": "New Listing",
    "description": "Test description",
    "price": 50,
    "category": "electronics"
}

# --- Create Listing Tests ---
def test_create_listing_success(client):
    headers = get_auth_header(client, "seller@test.com", "sellerpass")
    response = client.post('/api/listings', 
                         json=valid_listing_data,
                         headers=headers)
    assert response.status_code == 201
    data = json.loads(response.data.decode('utf-8'))
    assert data['title'] == "New Listing"
    assert data['status'] == "active"
    assert data['seller_id'] == 2  # seller's ID

def test_create_listing_missing_fields(client):
    headers = get_auth_header(client, "seller@test.com", "sellerpass")
    response = client.post('/api/listings', 
                         json={"title": "Only title"},
                         headers=headers)
    assert response.status_code == 400
    assert b"price" in response.data

def test_create_listing_unauthorized(client):
    response = client.post('/api/listings', json=valid_listing_data)
    assert response.status_code == 401

# --- Update Listing Tests ---
def test_update_listing_success(client):
    headers = get_auth_header(client, "seller@test.com", "sellerpass")
    update_data = {
        "title": "Updated Bike",
        "price": 90,
        "description": "New description"
    }
    response = client.put('/api/listings/1', 
                         json=update_data,
                         headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data['title'] == "Updated Bike"
    assert data['price'] == 90
    assert 'updated_at' in data

def test_update_listing_not_owner(client):
    headers = get_auth_header(client, "buyer@test.com", "buyerpass")
    response = client.put('/api/listings/1', 
                         json={"title": "Hacked"},
                         headers=headers)
    assert response.status_code == 403

def test_update_listing_admin(client):
    headers = get_auth_header(client, "admin@test.com", "adminpass")
    response = client.put('/api/listings/1', 
                         json={"status": "flagged"},
                         headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data['status'] == "flagged"

# --- Delete Listing Tests ---
def test_delete_listing_success(client):
    headers = get_auth_header(client, "seller@test.com", "sellerpass")
    response = client.delete('/api/listings/1', headers=headers)
    assert response.status_code == 200
    
    # Verify soft delete
    with client.application.app_context():
        listing = Listing.query.get(1)
        assert listing.status == "removed"

def test_admin_hard_delete(client):
    headers = get_auth_header(client, "admin@test.com", "adminpass")
    response = client.delete('/api/listings/2', headers=headers)
    assert response.status_code == 200
    
    # Verify hard delete
    with client.application.app_context():
        listing = Listing.query.get(2)
        assert listing is None

# --- Admin Removal Tests ---
def test_admin_remove_listing(client):
    headers = get_auth_header(client, "admin@test.com", "adminpass")
    response = client.post('/api/admin/listings/1/remove', 
                         json={"reason": "Test removal"},
                         headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data['status'] == "removed"
    
    with client.application.app_context():
        listing = Listing.query.get(1)
        assert listing.removal_reason == "Test removal"
        assert listing.moderator_id == 1  # admin's ID

def test_admin_remove_missing_reason(client):
    headers = get_auth_header(client, "admin@test.com", "adminpass")
    response = client.post('/api/admin/listings/1/remove', 
                         json={},
                         headers=headers)
    assert response.status_code == 400

# --- Search Tests ---
def test_search_listings(client):
    # Add more listings for better search tests
    with client.application.app_context():
        listing3 = Listing(
            title="Road Bike",
            price=200,
            category="sports",
            seller_id=2,
            status="active"
        )
        db.session.add(listing3)
        db.session.commit()
    
    # Test search by query
    response = client.get('/api/listings/search?q=bike')
    data = json.loads(response.data.decode('utf-8'))
    assert response.status_code == 200
    assert data['count'] == 2  # Test Bike and Road Bike
    
    # Test category filter
    response = client.get('/api/listings/search?category=books')
    data = json.loads(response.data.decode('utf-8'))
    assert data['count'] == 0  # Only book listing is removed
    
    # Test price range
    response = client.get('/api/listings/search?min_price=150&max_price=250')
    data = json.loads(response.data.decode('utf-8'))
    assert data['count'] == 1  # Only Road Bike in this range
    
    # Test status filter
    response = client.get('/api/listings/search?status=removed')
    data = json.loads(response.data.decode('utf-8'))
    assert data['count'] == 1  # Only Test Book is removed

def test_search_invalid_price(client):
    response = client.get('/api/listings/search?min_price=abc')
    assert response.status_code == 400