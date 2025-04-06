def test_invalid_login(client):
    res = client.post('/api/login', json={
        'email': 'wrong@email.com',
        'password': 'wrong'
    })
    assert res.status_code == 401

def test_protected_route_without_token(client):
    res = client.post('/api/listings', json={
        'title': 'Hack Attempt',
        'price': 100
    })
    assert res.status_code == 401

def test_admin_access_control(client, auth_tokens):
    res = client.delete(
        '/api/admin/users/1',
        headers={'Authorization': f"Bearer {auth_tokens['access_token']}"}
    )
    assert res.status_code == 403  # Regular user can't access admin endpoint