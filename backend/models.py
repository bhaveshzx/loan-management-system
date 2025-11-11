from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from db import db
import random
import string

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'user' or 'admin'
    profile_completed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')
    loans = db.relationship('Loan', foreign_keys='Loan.user_id', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'profile_completed': self.profile_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    employment_status = db.Column(db.String(50), nullable=True)
    annual_income = db.Column(db.Numeric(12, 2), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'address': self.address,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'employment_status': self.employment_status,
            'annual_income': float(self.annual_income) if self.annual_income else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Loan(db.Model):
    __tablename__ = 'loans'
    
    # Status options
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    
    # Rejection reason codes
    REASON_INSUFFICIENT_INCOME = 'INSUFFICIENT_INCOME'
    REASON_POOR_CREDIT_HISTORY = 'POOR_CREDIT_HISTORY'
    REASON_INCOMPLETE_DOCUMENTATION = 'INCOMPLETE_DOCUMENTATION'
    REASON_EXCEEDS_LIMIT = 'EXCEEDS_LIMIT'
    REASON_AUTO_REJECTED = 'AUTO_REJECTED'  # For automatic rejection after 5 days
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    purpose = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default=PENDING, nullable=False)
    rejection_reason = db.Column(db.String(50), nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_loans')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'purpose': self.purpose,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'reviewed_by': self.reviewed_by,
            'user': self.user.to_dict() if self.user else None
        }

class PendingRegistration(db.Model):
    """Stores pending registration data until OTP is verified"""
    __tablename__ = 'pending_registrations'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    otp_expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def generate_otp(self):
        """Generate a 6-digit OTP"""
        self.otp = ''.join(random.choices(string.digits, k=6))
        self.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)  # OTP expires in 10 minutes
        return self.otp
    
    def is_otp_valid(self, provided_otp):
        """Check if provided OTP is valid and not expired"""
        if datetime.utcnow() > self.otp_expires_at:
            return False
        return self.otp == provided_otp
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PendingLogin(db.Model):
    """Stores pending login data until OTP is verified"""
    __tablename__ = 'pending_logins'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    otp_expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='pending_logins')
    
    def generate_otp(self):
        """Generate a 6-digit OTP"""
        self.otp = ''.join(random.choices(string.digits, k=6))
        self.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)  # OTP expires in 10 minutes
        return self.otp
    
    def is_otp_valid(self, provided_otp):
        """Check if provided OTP is valid and not expired"""
        if datetime.utcnow() > self.otp_expires_at:
            return False
        return self.otp == provided_otp
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PasswordReset(db.Model):
    """Stores password reset OTP and reset token"""
    __tablename__ = 'password_resets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    otp_expires_at = db.Column(db.DateTime, nullable=False)
    otp_attempts = db.Column(db.Integer, default=0, nullable=False)
    max_otp_attempts = db.Column(db.Integer, default=5, nullable=False)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires_at = db.Column(db.DateTime, nullable=True)
    reset_token_used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='password_resets')
    
    def generate_otp(self):
        """Generate a 6-digit OTP"""
        self.otp = ''.join(random.choices(string.digits, k=6))
        self.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)  # OTP expires in 10 minutes
        self.otp_attempts = 0  # Reset attempts when generating new OTP
        return self.otp
    
    def is_otp_valid(self, provided_otp):
        """Check if provided OTP is valid, not expired, and within attempt limit"""
        if datetime.utcnow() > self.otp_expires_at:
            return False
        if self.otp_attempts >= self.max_otp_attempts:
            return False
        return self.otp == provided_otp
    
    def increment_attempts(self):
        """Increment OTP verification attempts"""
        self.otp_attempts += 1
    
    def generate_reset_token(self):
        """Generate a reset token (UUID-like string)"""
        import uuid
        self.reset_token = str(uuid.uuid4()).replace('-', '')
        self.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=15)  # Reset token expires in 15 minutes
        self.reset_token_used = False
        return self.reset_token
    
    def is_reset_token_valid(self):
        """Check if reset token is valid and not expired or used"""
        if not self.reset_token:
            return False
        if self.reset_token_used:
            return False
        if datetime.utcnow() > self.reset_token_expires_at:
            return False
        return True
    
    def mark_reset_token_used(self):
        """Mark reset token as used"""
        self.reset_token_used = True
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email': self.email,
            'otp_attempts': self.otp_attempts,
            'max_otp_attempts': self.max_otp_attempts,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

