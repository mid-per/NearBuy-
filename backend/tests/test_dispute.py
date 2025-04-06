import pytest
from app.main import create_app
from app import db
from app.models.user_model import User
from app.models.listing_model import Listing, Transaction
import json
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create test users
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
            
            # Create test transaction
            listing = Listing(
                title="Test Item",
                price=100,
                seller_id=seller.id
            )
            transaction = Transaction(
                buyer_id=buyer.id,
                seller_id=seller.id,
                listing_id=1,
                status="completed",
                completed_at=datetime.now(timezone.utc)
            )
            db.session.add_all([listing, transaction])
            db.session.commit()
            
        yield client
        with app.app_context():
            db.drop_all()

def get_auth_header(client, email, password):
    """Helper to get JWT token for tests"""
    response = client.post('/api/login', json={
        "email": email,
        "password": password
    })
    data = json.loads(response.data.decode('utf-8'))
    return {'Authorization': f'Bearer {data["access_token"]}'}

# --- Dispute Tests ---
def test_buyer_can_dispute(client):
    headers = get_auth_header(client, "buyer@test.com", "buyerpass")
    response = client.post(
        '/api/transactions/1/dispute',
        json={"reason": "Item damaged"},
        headers=headers
    )
    assert response.status_code == 200
    assert b"Dispute filed" in response.data
    
    # Verify status changed
    with client.application.app_context():
        tx = Transaction.query.get(1)
        assert tx.status == "disputed"
        assert "damaged" in tx.dispute_reason

def test_dispute_time_window(client):
    # Make transaction older than 3 days
    with client.application.app_context():
        tx = Transaction.query.get(1)
        tx.created_at = datetime.now(timezone.utc) - timedelta(days=4)
        db.session.commit()
    
    headers = get_auth_header(client, "buyer@test.com", "buyerpass")
    response = client.post(
        '/api/transactions/1/dispute',
        json={"reason": "Too late"},
        headers=headers
    )
    assert response.status_code == 400
    assert b"not eligible" in response.data

# --- Admin Resolution Tests ---
def test_admin_resolve_dispute(client):
    # First create a dispute
    with client.application.app_context():
        tx = Transaction.query.get(1)
        tx.status = "disputed"
        db.session.commit()
    
    admin_headers = get_auth_header(client, "admin@test.com", "adminpass")
    response = client.post(
        '/api/admin/transactions/1/resolve',
        json={"action": "refund"},
        headers=admin_headers
    )
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data["new_status"] == "refunded"