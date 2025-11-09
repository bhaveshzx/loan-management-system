from app import app
from db import db
from models import User, Profile, Loan
from datetime import datetime, date, timedelta

def seed_database():
    """Seed the database with initial data"""
    with app.app_context():
        # Clear existing data (optional - comment out if you want to keep existing data)
        # db.drop_all()
        # db.create_all()
        
        # Create admin user
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@loanmanagement.com',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Created admin user: admin / admin123")
        
        # Create test users
        test_users = [
            {
                'username': 'john_doe',
                'email': 'john@example.com',
                'password': 'password123',
                'profile': {
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'phone': '+1234567890',
                    'address': '123 Main St, City, State 12345',
                    'date_of_birth': date(1990, 1, 15),
                    'employment_status': 'Employed',
                    'annual_income': 50000.00
                }
            },
            {
                'username': 'jane_smith',
                'email': 'jane@example.com',
                'password': 'password123',
                'profile': {
                    'first_name': 'Jane',
                    'last_name': 'Smith',
                    'phone': '+1234567891',
                    'address': '456 Oak Ave, City, State 12346',
                    'date_of_birth': date(1985, 5, 20),
                    'employment_status': 'Self-Employed',
                    'annual_income': 75000.00
                }
            }
        ]
        
        for user_data in test_users:
            user = User.query.filter_by(username=user_data['username']).first()
            if not user:
                user = User(
                    username=user_data['username'],
                    email=user_data['email'],
                    role='user'
                )
                user.set_password(user_data['password'])
                user.profile_completed = True
                db.session.add(user)
                db.session.flush()  # Get user ID
                
                # Create profile
                profile = Profile(
                    user_id=user.id,
                    **user_data['profile']
                )
                db.session.add(profile)
                
                # Create some loan applications
                loans = [
                    {
                        'amount': 10000.00,
                        'purpose': 'Home renovation',
                        'status': Loan.PENDING,
                        'created_at': datetime.utcnow() - timedelta(days=2)
                    },
                    {
                        'amount': 5000.00,
                        'purpose': 'Car purchase',
                        'status': Loan.APPROVED,
                        'created_at': datetime.utcnow() - timedelta(days=10),
                        'reviewed_at': datetime.utcnow() - timedelta(days=8),
                        'reviewed_by': admin.id
                    },
                    {
                        'amount': 15000.00,
                        'purpose': 'Debt consolidation',
                        'status': Loan.REJECTED,
                        'rejection_reason': Loan.REASON_INSUFFICIENT_INCOME,
                        'created_at': datetime.utcnow() - timedelta(days=15),
                        'reviewed_at': datetime.utcnow() - timedelta(days=13),
                        'reviewed_by': admin.id,
                        'admin_notes': 'Income does not meet requirements for this loan amount'
                    }
                ]
                
                for loan_data in loans:
                    loan = Loan(
                        user_id=user.id,
                        **loan_data
                    )
                    db.session.add(loan)
                
                print(f"Created user: {user_data['username']} / {user_data['password']}")
        
        # Create a loan that will be auto-rejected (older than 5 days)
        old_user = User.query.filter_by(username='john_doe').first()
        if old_user:
            old_loan = Loan.query.filter(
                Loan.user_id == old_user.id,
                Loan.status == Loan.PENDING,
                Loan.created_at <= datetime.utcnow() - timedelta(days=6)
            ).first()
            
            if not old_loan:
                old_loan = Loan(
                    user_id=old_user.id,
                    amount=20000.00,
                    purpose='Business expansion',
                    status=Loan.PENDING,
                    created_at=datetime.utcnow() - timedelta(days=6)
                )
                db.session.add(old_loan)
                print("Created old pending loan for testing auto-rejection")
        
        db.session.commit()
        print("\nDatabase seeded successfully!")
        print("\nTest Accounts:")
        print("Admin: admin / admin123")
        print("User 1: john_doe / password123")
        print("User 2: jane_smith / password123")

if __name__ == '__main__':
    seed_database()

