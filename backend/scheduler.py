from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from models import Loan
from db import db
from utils.email_service import send_loan_notification

def auto_reject_old_loans(app):
    """Automatically reject loans that have been pending for more than 5 days"""
    with app.app_context():
        try:
            # Calculate the date 5 days ago
            cutoff_date = datetime.utcnow() - timedelta(days=5)
            
            # Find all pending loans older than 5 days
            old_loans = Loan.query.filter(
                Loan.status == Loan.PENDING,
                Loan.created_at <= cutoff_date
            ).all()
            
            rejected_count = 0
            for loan in old_loans:
                loan.status = Loan.REJECTED
                loan.rejection_reason = Loan.REASON_AUTO_REJECTED
                loan.reviewed_at = datetime.utcnow()
                loan.admin_notes = 'Automatically rejected after 5 days of no action'
                
                # Send email notification
                try:
                    send_loan_notification(loan, 'rejected')
                except Exception as e:
                    print(f"Failed to send email notification for loan {loan.id}: {e}")
                
                rejected_count += 1
            
            if rejected_count > 0:
                db.session.commit()
                print(f"Auto-rejected {rejected_count} loan(s) that were pending for more than 5 days")
            else:
                print("No loans to auto-reject")
        
        except Exception as e:
            db.session.rollback()
            print(f"Error in auto_reject_old_loans: {e}")

def init_scheduler(app, db_instance):
    """Initialize and start the scheduler"""
    scheduler = BackgroundScheduler()
    
    # Schedule the auto-reject job to run every hour
    scheduler.add_job(
        func=auto_reject_old_loans,
        args=[app],
        trigger='interval',
        hours=1,
        id='auto_reject_loans',
        name='Auto-reject loans pending for more than 5 days',
        replace_existing=True
    )
    
    return scheduler

