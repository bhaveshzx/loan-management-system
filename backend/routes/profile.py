from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Profile
from db import db
from datetime import datetime

profile_bp = Blueprint('profile', __name__)

# Add middleware to log all requests
@profile_bp.before_request
def log_request():
    if request.method != 'OPTIONS':
        print(f"Profile route - {request.method} {request.path}")
        auth_header = request.headers.get('Authorization')
        print(f"Profile route - Authorization: {auth_header[:50] if auth_header else 'None'}...")

@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        # Debug logging
        from flask import request
        auth_header = request.headers.get('Authorization')
        print(f"Profile GET - Authorization header: {auth_header[:50] if auth_header else 'None'}...")
        
        user_id = get_jwt_identity()
        print(f"Profile GET - User ID from token: {user_id}")
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.profile:
            return jsonify({'profile': None, 'profile_completed': False}), 200
        
        return jsonify({
            'profile': user.profile.to_dict(),
            'profile_completed': user.profile_completed
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profile_bp.route('', methods=['POST', 'PUT'])
@jwt_required()
def create_or_update_profile():
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Debug logging
        print(f"Profile save request - User ID: {user_id}")
        print(f"Request data: {data}")
        print(f"Request content type: {request.content_type}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields for profile completion
        required_fields = ['first_name', 'last_name', 'phone', 'address', 'date_of_birth', 'employment_status', 'annual_income']
        missing_fields = [field for field in required_fields if not data.get(field) or (isinstance(data.get(field), str) and not data.get(field).strip())]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Create or update profile
        if user.profile:
            profile = user.profile
            profile.updated_at = datetime.utcnow()
        else:
            profile = Profile(user_id=user.id)
            db.session.add(profile)
        
        profile.first_name = data.get('first_name')
        profile.last_name = data.get('last_name')
        profile.phone = data.get('phone')
        profile.address = data.get('address')
        
        # Parse date of birth
        if data.get('date_of_birth'):
            try:
                profile.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError as e:
                return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
        
        profile.employment_status = data.get('employment_status')
        
        # Convert annual_income to numeric
        annual_income = data.get('annual_income')
        if annual_income is not None and annual_income != '':
            try:
                profile.annual_income = float(annual_income)
            except (ValueError, TypeError):
                return jsonify({'error': 'Annual income must be a valid number'}), 400
        else:
            return jsonify({'error': 'Annual income is required'}), 400
        
        # Mark profile as completed
        user.profile_completed = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile saved successfully',
            'profile': profile.to_dict(),
            'profile_completed': True
        }), 200
    
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Profile save error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Failed to save profile: {str(e)}'}), 500

