import pytest
from app import app
from db import db
from models import User, Loan, Profile
from datetime import date

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def user_with_profile(client):
    # Register user
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    })
    token = response.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Create profile
    user_id = response.get_json()['user']['id']
    user = User.query.get(user_id)
    profile = Profile(
        user_id=user.id,
        first_name='Test',
        last_name='User',
        phone='1234567890',
        address='123 Test St',
        date_of_birth=date(1990, 1, 1),
        employment_status='Employed',
        annual_income=50000.00
    )
    user.profile_completed = True
    db.session.add(profile)
    db.session.commit()
    
    return headers, user_id

def test_create_loan_without_profile(client):
    # Register user without profile
    response = client.post('/api/auth/register', json={
        'username': 'noprofile',
        'email': 'noprofile@example.com',
        'password': 'testpass123'
    })
    token = response.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Try to create loan
    response = client.post('/api/loans', headers=headers, json={
        'amount': 10000,
        'purpose': 'Test loan'
    })
    assert response.status_code == 400
    assert 'profile' in response.get_json()['error'].lower()

def test_create_loan(client, user_with_profile):
    headers, user_id = user_with_profile
    
    response = client.post('/api/loans', headers=headers, json={
        'amount': 10000,
        'purpose': 'Home renovation'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['loan']['amount'] == 10000.0
    assert data['loan']['status'] == Loan.PENDING

def test_get_loans(client, user_with_profile):
    headers, user_id = user_with_profile
    
    # Create a loan
    client.post('/api/loans', headers=headers, json={
        'amount': 10000,
        'purpose': 'Test loan'
    })
    
    # Get loans
    response = client.get('/api/loans', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['loans']) == 1
    assert data['loans'][0]['purpose'] == 'Test loan'

def test_get_loan_by_id(client, user_with_profile):
    headers, user_id = user_with_profile
    
    # Create a loan
    create_response = client.post('/api/loans', headers=headers, json={
        'amount': 10000,
        'purpose': 'Test loan'
    })
    loan_id = create_response.get_json()['loan']['id']
    
    # Get specific loan
    response = client.get(f'/api/loans/{loan_id}', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['loan']['id'] == loan_id

