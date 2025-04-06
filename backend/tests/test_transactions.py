from app.models.listing_model import Transaction, Listing
from app.models.user_model import User
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from app import db

def test_qr_transaction_flow(client, auth_tokens):
    # Create listing
    res = client.post(
        '/api/listings',
        headers={'Authorization': f"Bearer {auth_tokens['access_token']}"},
        json={'title': 'Test Item', 'price': 100}
    )
    listing_id = res.json['id']
    
    # Generate QR
    res = client.post(
        '/api/transactions/qr',
        headers={'Authorization': f"Bearer {auth_tokens['access_token']}"},
        json={'buyer_id': 1, 'listing_id': listing_id}
    )
    assert res.status_code == 201
    assert 'qr_code' in res.json

def test_transaction_confirmation(client, auth_tokens):
    # Setup test data
    seller = User.query.get(1)  # From auth fixture
    
    # Register and login buyer properly
    buyer_data = {
        'email': 'buyer@test.com',
        'password': 'pass123'
    }
    
    # Register buyer first
    client.post('/api/register', json=buyer_data)
    
    # Then login
    login_res = client.post('/api/login', json=buyer_data)
    buyer_token = login_res.json['access_token']  # This should now work

    # Create listing
    listing = Listing(
        title='Test Item',
        price=100,
        seller_id=seller.id
    )
    db.session.add(listing)
    db.session.commit()

    # Create transaction
    transaction = Transaction(
        qr_code=f"nearbuy:{uuid4().hex}",
        seller_id=seller.id,
        buyer_id=User.query.filter_by(email='buyer@test.com').first().id,
        listing_id=listing.id
    )
    db.session.add(transaction)
    db.session.commit()

    # Test confirmation with buyer's token
    res = client.post(
        '/api/transactions/confirm',
        headers={'Authorization': f"Bearer {buyer_token}"},
        json={'qr_code': transaction.qr_code}
    )
    assert res.status_code == 200

def test_transaction_history(client, auth_tokens):
    # Setup test data
    seller = User.query.get(1)  # From auth fixture
    buyer = User(email='buyer2@test.com', password='pass123')
    db.session.add(buyer)
    db.session.commit()
    
    listing = Listing(
        title='History Test Item',
        price=150,
        seller_id=seller.id
    )
    db.session.add(listing)
    db.session.commit()
    
    # Create completed transaction
    transaction = Transaction(
        qr_code=f"nearbuy:{uuid4().hex}",
        seller_id=seller.id,
        buyer_id=buyer.id,
        listing_id=listing.id,
        completed=True,
        completed_at= datetime.now(timezone.utc)
    )
    db.session.add(transaction)
    db.session.commit()

    # Test history (as seller)
    res = client.get(
        '/api/transactions/history',
        headers={'Authorization': f"Bearer {auth_tokens['access_token']}"}
    )
    assert res.status_code == 200
    assert len(res.json['sold']) == 1
    assert res.json['sold'][0]['item'] == 'History Test Item'
    assert res.json['sold'][0]['price'] == 150