from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Loan
from db import db
from datetime import datetime
from utils.email_service import send_loan_notification

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Decorator to require admin role"""
    user_id = get_jwt_identity()
    # Convert string ID back to integer for database query
    user = User.query.get(int(user_id))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return None

@admin_bp.route('/loans/<int:loan_id>/approve', methods=['POST'])
@jwt_required()
def approve_loan(loan_id):
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        loan = Loan.query.get(loan_id)
        
        if not loan:
            return jsonify({'error': 'Loan not found'}), 404
        
        if loan.status != Loan.PENDING:
            return jsonify({'error': 'Loan is not pending'}), 400
        
        data = request.get_json() or {}
        
        # Update loan status
        loan.status = Loan.APPROVED
        loan.reviewed_at = datetime.utcnow()
        loan.reviewed_by = int(user_id)
        loan.admin_notes = data.get('admin_notes', '')
        loan.rejection_reason = None
        
        db.session.commit()
        
        # Send email notification to user
        try:
            send_loan_notification(loan, 'approved')
            print(f"Approval email sent successfully to {loan.user.email}")
        except Exception as e:
            print(f"Failed to send approval email notification: {e}")
            # Don't fail the request if email fails, just log the error
        
        return jsonify({
            'message': 'Loan approved successfully. Email notification sent to user.',
            'loan': loan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/loans/<int:loan_id>/reject', methods=['POST'])
@jwt_required()
def reject_loan(loan_id):
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        loan = Loan.query.get(loan_id)
        
        if not loan:
            return jsonify({'error': 'Loan not found'}), 404
        
        if loan.status != Loan.PENDING:
            return jsonify({'error': 'Loan is not pending'}), 400
        
        data = request.get_json()
        
        if not data or not data.get('rejection_reason'):
            return jsonify({'error': 'Rejection reason is required'}), 400
        
        # Validate rejection reason code
        valid_reasons = [
            Loan.REASON_INSUFFICIENT_INCOME,
            Loan.REASON_POOR_CREDIT_HISTORY,
            Loan.REASON_INCOMPLETE_DOCUMENTATION,
            Loan.REASON_EXCEEDS_LIMIT
        ]
        
        if data['rejection_reason'] not in valid_reasons:
            return jsonify({'error': 'Invalid rejection reason code'}), 400
        
        # Update loan status
        loan.status = Loan.REJECTED
        loan.reviewed_at = datetime.utcnow()
        loan.reviewed_by = user_id
        loan.rejection_reason = data['rejection_reason']
        loan.admin_notes = data.get('admin_notes', '')
        
        db.session.commit()
        
        # Send email notification to user with rejection reason
        try:
            send_loan_notification(loan, 'rejected')
            print(f"Rejection email sent successfully to {loan.user.email} with reason: {loan.rejection_reason}")
        except Exception as e:
            print(f"Failed to send rejection email notification: {e}")
            # Don't fail the request if email fails, just log the error
        
        return jsonify({
            'message': 'Loan rejected successfully. Email notification sent to user with rejection reason.',
            'loan': loan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/loans/pending', methods=['GET'])
@jwt_required()
def get_pending_loans():
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        loans = Loan.query.filter_by(status=Loan.PENDING).order_by(Loan.created_at.asc()).all()
        
        return jsonify({
            'loans': [loan.to_dict() for loan in loans]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/rejection-reasons', methods=['GET'])
@jwt_required()
def get_rejection_reasons():
    try:
        user_id = get_jwt_identity()
        # Convert string ID back to integer for database query
        user = User.query.get(int(user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        reasons = [
            {
                'code': Loan.REASON_INSUFFICIENT_INCOME,
                'label': 'Insufficient Income'
            },
            {
                'code': Loan.REASON_POOR_CREDIT_HISTORY,
                'label': 'Poor Credit History'
            },
            {
                'code': Loan.REASON_INCOMPLETE_DOCUMENTATION,
                'label': 'Incomplete Documentation'
            },
            {
                'code': Loan.REASON_EXCEEDS_LIMIT,
                'label': 'Exceeds Maximum Limit'
            }
        ]
        
        return jsonify({'reasons': reasons}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

