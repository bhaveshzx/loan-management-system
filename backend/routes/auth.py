from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User, PendingRegistration, PendingLogin, PasswordReset
from db import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from utils.email_service import send_otp_email, send_password_reset_otp
from sqlalchemy import func
import uuid

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

@auth_bp.route('/login', methods=['POST'])
def login():
    """Unified login - Handles both admin and user authentication"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Admin users login directly without OTP
        if user.role == 'admin':
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': user.to_dict(),
                'requires_otp': False
            }), 200
        
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

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin login - Alias for unified login endpoint (backward compatibility)"""
    # Forward to unified login endpoint
    return login()

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

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset OTP"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email'].strip().lower()
        
        # Find user by email (case-insensitive search)
        # For cross-database compatibility, use filter with func.lower
        user = User.query.filter(func.lower(User.email) == email).first()
        
        # Always return success message to prevent email enumeration
        # Only send OTP if user exists
        if user:
            # Check if there's already a pending password reset for this user
            existing_reset = PasswordReset.query.filter_by(user_id=user.id).first()
            if existing_reset:
                # Delete old password reset request
                db.session.delete(existing_reset)
                db.session.commit()
            
            # Create password reset request
            password_reset = PasswordReset(
                user_id=user.id,
                email=user.email
            )
            
            # Generate OTP
            otp = password_reset.generate_otp()
            
            db.session.add(password_reset)
            db.session.commit()
            
            # Send OTP email
            email_sent = send_password_reset_otp(password_reset.email, otp, user.username)
            
            if not email_sent:
                # If email fails, log OTP to console for development/testing
                print("\n" + "="*60)
                print("[WARNING] EMAIL SENDING FAILED - DEVELOPMENT MODE")
                print("="*60)
                print(f"PASSWORD RESET OTP for {password_reset.email}: {otp}")
                print(f"Password Reset ID: {password_reset.id}")
                print("="*60)
                print("You can use this OTP to test the password reset flow.")
                print("Fix email configuration to receive OTPs via email.")
                print("="*60 + "\n")
            
            # Return success with reset_id (for security, use reset_id not user_id)
            return jsonify({
                'success': True,
                'reset_id': str(password_reset.id),
                'message': 'If this email exists in our system, we have sent an OTP to your email.'
            }), 200
        else:
            # User doesn't exist, but return same message for security
            return jsonify({
                'success': True,
                'message': 'If this email exists in our system, we have sent an OTP to your email.'
            }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in forgot_password: {str(e)}")
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

@auth_bp.route('/forgot-password/verify', methods=['POST'])
def verify_password_reset_otp():
    """Verify password reset OTP and return reset token"""
    try:
        data = request.get_json()
        
        if not data or not data.get('reset_id') or not data.get('otp'):
            return jsonify({'error': 'Reset ID and OTP are required'}), 400
        
        reset_id = data.get('reset_id')
        provided_otp = data.get('otp')
        
        # Find password reset request (convert reset_id to int if it's a string)
        try:
            reset_id_int = int(reset_id) if reset_id else None
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid reset ID'}), 400
        
        password_reset = PasswordReset.query.get(reset_id_int)
        
        if not password_reset:
            return jsonify({'error': 'Invalid or expired reset request'}), 400
        
        # Check if OTP is valid
        if not password_reset.is_otp_valid(provided_otp):
            # Increment attempts
            password_reset.increment_attempts()
            db.session.commit()
            
            attempts_left = password_reset.max_otp_attempts - password_reset.otp_attempts
            
            if attempts_left <= 0:
                return jsonify({
                    'error': 'Maximum OTP attempts exceeded. Please request a new OTP.',
                    'attempts_left': 0
                }), 400
            
            return jsonify({
                'error': 'Invalid or expired OTP',
                'attempts_left': attempts_left
            }), 400
        
        # OTP is valid, generate reset token
        reset_token = password_reset.generate_reset_token()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'reset_token': reset_token,
            'message': 'OTP verified successfully. You can now reset your password.'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in verify_password_reset_otp: {str(e)}")
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

@auth_bp.route('/forgot-password/reset', methods=['POST'])
def reset_password():
    """Reset password using reset token"""
    try:
        data = request.get_json()
        
        if not data or not data.get('reset_token') or not data.get('new_password'):
            return jsonify({'error': 'Reset token and new password are required'}), 400
        
        reset_token = data.get('reset_token')
        new_password = data.get('new_password')
        
        # Validate password strength (same as registration)
        if len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Find password reset request by token
        password_reset = PasswordReset.query.filter_by(reset_token=reset_token).first()
        
        if not password_reset:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Check if reset token is valid
        if not password_reset.is_reset_token_valid():
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Get user
        user = User.query.get(password_reset.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update password
        user.set_password(new_password)
        
        # Mark reset token as used
        password_reset.mark_reset_token_used()
        
        # Delete all other password reset requests for this user
        other_resets = PasswordReset.query.filter_by(user_id=user.id).filter(PasswordReset.id != password_reset.id).all()
        for reset in other_resets:
            db.session.delete(reset)
        
        db.session.commit()
        
        # Create access token (same as login)
        access_token = create_access_token(identity=str(user.id))
        
        # Return same auth response as login
        return jsonify({
            'success': True,
            'message': 'Password reset successfully. You are now logged in.',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in reset_password: {str(e)}")
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

