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
def admin_headers(client):
    # Create admin user
    admin = User(username='admin', email='admin@test.com', role='admin')
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    
    # Login as admin
    response = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def user_loan(client):
    # Create user with profile
    user = User(username='testuser', email='test@test.com', role='user')
    user.set_password('test123')
    user.profile_completed = True
    db.session.add(user)
    db.session.flush()
    
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
    db.session.add(profile)
    
    # Create loan
    loan = Loan(user_id=user.id, amount=10000, purpose='Test loan', status=Loan.PENDING)
    db.session.add(loan)
    db.session.commit()
    
    return loan.id

def test_approve_loan(client, admin_headers, user_loan):
    response = client.post(f'/api/admin/loans/{user_loan}/approve', 
                          headers=admin_headers,
                          json={'admin_notes': 'Approved for testing'})
    assert response.status_code == 200
    data = response.get_json()
    assert data['loan']['status'] == Loan.APPROVED

def test_reject_loan(client, admin_headers, user_loan):
    response = client.post(f'/api/admin/loans/{user_loan}/reject',
                          headers=admin_headers,
                          json={
                              'rejection_reason': Loan.REASON_INSUFFICIENT_INCOME,
                              'admin_notes': 'Income too low'
                          })
    assert response.status_code == 200
    data = response.get_json()
    assert data['loan']['status'] == Loan.REJECTED
    assert data['loan']['rejection_reason'] == Loan.REASON_INSUFFICIENT_INCOME

def test_reject_loan_invalid_reason(client, admin_headers, user_loan):
    response = client.post(f'/api/admin/loans/{user_loan}/reject',
                          headers=admin_headers,
                          json={
                              'rejection_reason': 'INVALID_REASON',
                              'admin_notes': 'Test'
                          })
    assert response.status_code == 400

def test_get_pending_loans(client, admin_headers, user_loan):
    response = client.get('/api/admin/loans/pending', headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['loans']) >= 1

def test_get_rejection_reasons(client, admin_headers):
    response = client.get('/api/admin/rejection-reasons', headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['reasons']) == 4

def test_non_admin_cannot_approve(client, user_loan):
    # Create regular user
    user = User(username='regular', email='regular@test.com', role='user')
    user.set_password('test123')
    db.session.add(user)
    db.session.commit()
    
    # Login as regular user
    response = client.post('/api/auth/login', json={
        'username': 'regular',
        'password': 'test123'
    })
    token = response.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Try to approve loan
    response = client.post(f'/api/admin/loans/{user_loan}/approve', headers=headers)
    assert response.status_code == 403

