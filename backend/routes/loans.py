from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Loan
from db import db
from datetime import datetime

loans_bp = Blueprint('loans', __name__)

@loans_bp.route('', methods=['GET'])
@jwt_required()
def get_loans():
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Admin can see all loans, users see only their own
        if user.role == 'admin':
            loans = Loan.query.order_by(Loan.created_at.desc()).all()
        else:
            # Check if profile is completed for regular users
            if not user.profile_completed:
                return jsonify({'error': 'Please complete your profile first'}), 400
            loans = Loan.query.filter_by(user_id=int(user_id)).order_by(Loan.created_at.desc()).all()
        
        return jsonify({
            'loans': [loan.to_dict() for loan in loans]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@loans_bp.route('', methods=['POST'])
@jwt_required()
def create_loan():
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if profile is completed
        if not user.profile_completed:
            return jsonify({'error': 'Please complete your profile first'}), 400
        
        data = request.get_json()
        
        if not data or not data.get('amount') or not data.get('purpose'):
            return jsonify({'error': 'Amount and purpose are required'}), 400
        
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        # Create new loan
        loan = Loan(
            user_id=int(user_id),
            amount=amount,
            purpose=data['purpose'],
            status=Loan.PENDING
        )
        
        db.session.add(loan)
        db.session.commit()
        
        return jsonify({
            'message': 'Loan application created successfully',
            'loan': loan.to_dict()
        }), 201
    
    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@loans_bp.route('/<int:loan_id>', methods=['GET'])
@jwt_required()
def get_loan(loan_id):
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        loan = Loan.query.get(loan_id)
        
        if not loan:
            return jsonify({'error': 'Loan not found'}), 404
        
        # Users can only see their own loans, admins can see all
        if user.role != 'admin' and loan.user_id != int(user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'loan': loan.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

