import pytest
from app.main import create_app
from app import db
import warnings
from sqlalchemy.exc import SAWarning

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_tokens(client):
    # Setup test user
    client.post('/api/register', json={
        'email': 'test@user.com',
        'password': 'pass123'
    })
    
    # Get tokens
    res = client.post('/api/login', json={
        'email': 'test@user.com',
        'password': 'pass123'
    })
    return res.json

@pytest.fixture(autouse=True)
def suppress_sqlalchemy_warnings():
    warnings.filterwarnings(
        "ignore",
        category=SAWarning,
        message="The Query.get() method is considered legacy"
    )
    warnings.filterwarnings(
        "ignore",
        category=DeprecationWarning,
        message="datetime.datetime.now(timezone.utc)"
    )