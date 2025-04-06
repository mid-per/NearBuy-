def test_invalid_listing_creation(client, auth_tokens):
    # Negative price
    res = client.post(
        '/api/listings',
        headers={'Authorization': f"Bearer {auth_tokens['access_token']}"},
        json={'title': 'Test', 'price': -10}
    )
    assert res.status_code == 400
    
    # Empty title
    res = client.post(
        '/api/listings',
        headers={'Authorization': f"Bearer {auth_tokens['access_token']}"},
        json={'title': '', 'price': 100}
    )
    assert res.status_code == 400

def test_duplicate_registration(client):
    res = client.post('/api/register', json={
        'email': 'dupe@test.com',
        'password': 'pass123'
    })
    assert res.status_code == 201
    
    res = client.post('/api/register', json={
        'email': 'dupe@test.com',
        'password': 'pass123'
    })
    assert res.status_code == 409