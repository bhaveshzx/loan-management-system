from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User, PendingRegistration, PendingLogin
from db import db
from datetime import datetime
from werkzeug.security import generate_password_hash
from utils.email_service import send_otp_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Check if there's already a pending registration for this email
        existing_pending = PendingRegistration.query.filter_by(email=data['email']).first()
        if existing_pending:
            # Delete old pending registration
            db.session.delete(existing_pending)
            db.session.commit()
        
        # Create pending registration
        pending_reg = PendingRegistration(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            role=data.get('role', 'user')
        )
        
        # Generate OTP
        otp = pending_reg.generate_otp()
        
        db.session.add(pending_reg)
        db.session.commit()
        
        # Send OTP email
        email_sent = send_otp_email(pending_reg.email, otp, pending_reg.username)
        
        if not email_sent:
            # If email fails, log OTP to console for development/testing
            print("\n" + "="*60)
            print("[WARNING] EMAIL SENDING FAILED - DEVELOPMENT MODE")
            print("="*60)
            print(f"OTP for {pending_reg.email}: {otp}")
            print(f"Pending Registration ID: {pending_reg.id}")
            print("="*60)
            print("You can use this OTP to test the registration flow.")
            print("Fix email configuration to receive OTPs via email.")
            print("="*60 + "\n")
        
        return jsonify({
            'message': 'OTP sent to your email. Please verify to complete registration.',
            'pending_registration_id': pending_reg.id,
            'email': pending_reg.email
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and complete registration"""
    try:
        data = request.get_json()
        
        if not data or not data.get('pending_registration_id') or not data.get('otp'):
            return jsonify({'error': 'Pending registration ID and OTP are required'}), 400
        
        pending_reg_id = data['pending_registration_id']
        provided_otp = data['otp']
        
        # Find pending registration
        pending_reg = PendingRegistration.query.get(pending_reg_id)
        
        if not pending_reg:
            return jsonify({'error': 'Invalid or expired registration request'}), 400
        
        # Verify OTP
        if not pending_reg.is_otp_valid(provided_otp):
            return jsonify({'error': 'Invalid or expired OTP'}), 400
        
        # Check if user already exists (double-check)
        if User.query.filter_by(username=pending_reg.username).first():
            db.session.delete(pending_reg)
            db.session.commit()
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=pending_reg.email).first():
            db.session.delete(pending_reg)
            db.session.commit()
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create the actual user
        user = User(
            username=pending_reg.username,
            email=pending_reg.email,
            password_hash=pending_reg.password_hash,
            role=pending_reg.role
        )
        
        db.session.add(user)
        db.session.delete(pending_reg)  # Remove pending registration
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Registration completed successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP for pending registration"""
    try:
        data = request.get_json()
        
        if not data or not data.get('pending_registration_id'):
            return jsonify({'error': 'Pending registration ID is required'}), 400
        
        pending_reg_id = data['pending_registration_id']
        
        # Find pending registration
        pending_reg = PendingRegistration.query.get(pending_reg_id)
        
        if not pending_reg:
            return jsonify({'error': 'Invalid or expired registration request'}), 400
        
        # Generate new OTP
        otp = pending_reg.generate_otp()
        
        db.session.commit()
        
        # Send OTP email
        email_sent = send_otp_email(pending_reg.email, otp, pending_reg.username)
        
        if not email_sent:
            # If email fails, log OTP to console for development/testing
            print("\n" + "="*60)
            print("[WARNING] EMAIL SENDING FAILED - DEVELOPMENT MODE")
            print("="*60)
            print(f"RESENT OTP for {pending_reg.email}: {otp}")
            print(f"Pending Registration ID: {pending_reg.id}")
            print("="*60)
            print("You can use this OTP to test the registration flow.")
            print("Fix email configuration to receive OTPs via email.")
            print("="*60 + "\n")
        
        return jsonify({
            'message': 'OTP resent to your email',
            'pending_registration_id': pending_reg.id,
            'email': pending_reg.email
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin login - No OTP required, direct login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Only allow admin users to login via this endpoint
        if user.role != 'admin':
            return jsonify({'error': 'Access denied. This endpoint is for administrators only.'}), 403
        
        # Admin users login directly without OTP
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Admin login successful',
            'access_token': access_token,
            'user': user.to_dict(),
            'requires_otp': False
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Regular user login - Requires OTP verification"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Prevent admin users from using regular login endpoint
        if user.role == 'admin':
            return jsonify({
                'error': 'Admins must use the admin login endpoint at /api/auth/admin/login'
            }), 403
        
        # Regular users require OTP verification
        # Check if there's already a pending login for this user
        existing_pending = PendingLogin.query.filter_by(user_id=user.id).first()
        if existing_pending:
            # Delete old pending login
            db.session.delete(existing_pending)
            db.session.commit()
        
        # Create pending login
        pending_login = PendingLogin(
            user_id=user.id,
            email=user.email
        )
        
        # Generate OTP
        otp = pending_login.generate_otp()
        
        db.session.add(pending_login)
        db.session.commit()
        
        # Send OTP email
        email_sent = send_otp_email(pending_login.email, otp, user.username, is_login=True)
        
        if not email_sent:
            # If email fails, log OTP to console for development/testing
            print("\n" + "="*60)
            print("[WARNING] EMAIL SENDING FAILED - DEVELOPMENT MODE")
            print("="*60)
            print(f"LOGIN OTP for {pending_login.email}: {otp}")
            print(f"Pending Login ID: {pending_login.id}")
            print("="*60)
            print("You can use this OTP to test the login flow.")
            print("Fix email configuration to receive OTPs via email.")
            print("="*60 + "\n")
        
        return jsonify({
            'message': 'OTP sent to your email. Please verify to complete login.',
            'pending_login_id': pending_login.id,
            'email': pending_login.email,
            'requires_otp': True
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-login-otp', methods=['POST'])
def verify_login_otp():
    """Verify OTP and complete login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('pending_login_id') or not data.get('otp'):
            return jsonify({'error': 'Pending login ID and OTP are required'}), 400
        
        pending_login_id = data['pending_login_id']
        provided_otp = data['otp']
        
        # Find pending login
        pending_login = PendingLogin.query.get(pending_login_id)
        
        if not pending_login:
            return jsonify({'error': 'Invalid or expired login request'}), 400
        
        # Verify OTP
        if not pending_login.is_otp_valid(provided_otp):
            return jsonify({'error': 'Invalid or expired OTP'}), 400
        
        # Get the user
        user = User.query.get(pending_login.user_id)
        
        if not user:
            db.session.delete(pending_login)
            db.session.commit()
            return jsonify({'error': 'User not found'}), 404
        
        # Delete pending login
        db.session.delete(pending_login)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/resend-login-otp', methods=['POST'])
def resend_login_otp():
    """Resend OTP for pending login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('pending_login_id'):
            return jsonify({'error': 'Pending login ID is required'}), 400
        
        pending_login_id = data['pending_login_id']
        
        # Find pending login
        pending_login = PendingLogin.query.get(pending_login_id)
        
        if not pending_login:
            return jsonify({'error': 'Invalid or expired login request'}), 400
        
        # Get the user
        user = User.query.get(pending_login.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate new OTP
        otp = pending_login.generate_otp()
        
        db.session.commit()
        
        # Send OTP email
        email_sent = send_otp_email(pending_login.email, otp, user.username, is_login=True)
        
        if not email_sent:
            # If email fails, log OTP to console for development/testing
            print("\n" + "="*60)
            print("[WARNING] EMAIL SENDING FAILED - DEVELOPMENT MODE")
            print("="*60)
            print(f"RESENT LOGIN OTP for {pending_login.email}: {otp}")
            print(f"Pending Login ID: {pending_login.id}")
            print("="*60)
            print("You can use this OTP to test the login flow.")
            print("Fix email configuration to receive OTPs via email.")
            print("="*60 + "\n")
        
        return jsonify({
            'message': 'OTP resent to your email',
            'pending_login_id': pending_login.id,
            'email': pending_login.email
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/test-email', methods=['POST'])
def test_email():
    """Test email configuration - sends a test email"""
    try:
        from flask import current_app
        from utils.email_service import send_otp_email
        
        data = request.get_json()
        test_email = data.get('email') if data else None
        
        if not test_email:
            return jsonify({'error': 'Email address is required'}), 400
        
        # Check if email is configured
        if not current_app.config.get('MAIL_USERNAME'):
            return jsonify({
                'error': 'Email not configured',
                'message': 'Please set MAIL_USERNAME and MAIL_PASSWORD in your .env file'
            }), 400
        
        # Send test OTP
        test_otp = '123456'  # Test OTP
        email_sent = send_otp_email(test_email, test_otp, 'Test User')
        
        if email_sent:
            return jsonify({
                'message': f'Test email sent successfully to {test_email}',
                'success': True
            }), 200
        else:
            return jsonify({
                'error': 'Failed to send test email',
                'message': 'Check your email configuration and Gmail App Password',
                'success': False
            }), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

