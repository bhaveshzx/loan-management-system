from flask_mail import Message
from flask import current_app

def send_loan_notification(loan, action):
    """Send email notification for loan approval/rejection"""
    if not current_app.config.get('MAIL_USERNAME'):
        print("Email not configured. Skipping email notification.")
        return
    
    # Get mail instance from current_app
    mail = current_app.extensions.get('mail')
    if not mail:
        print("Mail extension not found. Skipping email notification.")
        return
    
    user = loan.user
    subject = f"Loan Application {action.capitalize()}"
    
    if action == 'approved':
        body = f"""
Dear {user.username},

Congratulations! Your loan application has been approved.

Loan Application Details:
- Loan Amount: ${loan.amount:,.2f}
- Purpose: {loan.purpose}
- Application Date: {loan.created_at.strftime('%Y-%m-%d %H:%M:%S')}
- Approved Date: {loan.reviewed_at.strftime('%Y-%m-%d %H:%M:%S') if loan.reviewed_at else 'N/A'}
"""
        
        if loan.admin_notes:
            body += f"- Admin Notes: {loan.admin_notes}\n"
        
        body += """
We will contact you shortly regarding the next steps for your loan disbursement.

Thank you for choosing our loan service.

Best regards,
Loan Management System
"""
    else:  # rejected
        reason_labels = {
            'INSUFFICIENT_INCOME': 'Insufficient Income',
            'POOR_CREDIT_HISTORY': 'Poor Credit History',
            'INCOMPLETE_DOCUMENTATION': 'Incomplete Documentation',
            'EXCEEDS_LIMIT': 'Exceeds Maximum Limit',
            'AUTO_REJECTED': 'Automatic Rejection (No response within 5 days)'
        }
        
        reason_label = reason_labels.get(loan.rejection_reason, loan.rejection_reason)
        
        body = f"""
Dear {user.username},

We regret to inform you that your loan application has been rejected.

Loan Application Details:
- Loan Amount: ${loan.amount:,.2f}
- Purpose: {loan.purpose}
- Application Date: {loan.created_at.strftime('%Y-%m-%d %H:%M:%S')}
- Rejection Date: {loan.reviewed_at.strftime('%Y-%m-%d %H:%M:%S') if loan.reviewed_at else 'N/A'}
- Rejection Reason: {reason_label}
"""
        
        if loan.admin_notes:
            body += f"\nAdditional Notes: {loan.admin_notes}\n"
        
        body += """
If you have any questions or would like to discuss this decision, please contact our support team.

You may submit a new loan application in the future if your circumstances change.

Best regards,
Loan Management System
"""
    
    try:
        # Get sender email from config
        sender_email = current_app.config.get('MAIL_USERNAME', 'noreply@loanmanagement.com')
        print(f"DEBUG: Sending loan notification from: {sender_email} to: {user.email}")
        
        msg = Message(
            subject=subject,
            recipients=[user.email],
            body=body,
            sender=sender_email
        )
        mail.send(msg)
        print(f"Email notification sent to {user.email} from {sender_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise

def send_otp_email(email, otp, username, is_login=False):
    """Send OTP email for registration or login verification"""
    if not current_app.config.get('MAIL_USERNAME'):
        print("Email not configured. Skipping OTP email.")
        return False
    
    # Get mail instance from current_app
    mail = current_app.extensions.get('mail')
    if not mail:
        print("Mail extension not found. Skipping OTP email.")
        return False
    
    if is_login:
        subject = "Login Verification - OTP Code"
        body = f"""
Dear {username},

You have requested to login to your Loan Management System account.

Your OTP (One-Time Password) for login verification is:

{otp}

This OTP will expire in 10 minutes.

If you did not request this login, please ignore this email and secure your account.

Best regards,
Loan Management System
"""
    else:
        subject = "Email Verification - OTP Code"
        body = f"""
Dear {username},

Thank you for registering with our Loan Management System!

Your OTP (One-Time Password) for email verification is:

{otp}

This OTP will expire in 10 minutes.

If you did not request this registration, please ignore this email.

Best regards,
Loan Management System
"""
    
    try:
        # Get sender email from config
        sender_email = current_app.config.get('MAIL_USERNAME', 'noreply@loanmanagement.com')
        mail_username = current_app.config.get('MAIL_USERNAME', '')
        mail_password = current_app.config.get('MAIL_PASSWORD', '')
        
        print(f"DEBUG: MAIL_USERNAME from config: {mail_username}")
        print(f"DEBUG: Sender email being used: {sender_email}")
        print(f"DEBUG: MAIL_PASSWORD length: {len(mail_password) if mail_password else 0}")
        print(f"DEBUG: Sending OTP email to: {email}")
        
        # For Gmail, the sender MUST match the authenticated account
        # Use the authenticated email as both sender and reply-to
        msg = Message(
            subject=subject,
            recipients=[email],
            body=body,
            sender=sender_email,
            reply_to=sender_email
        )
        
        # Print message details before sending
        print(f"DEBUG: Message sender set to: {msg.sender}")
        print(f"DEBUG: Message reply_to set to: {msg.reply_to}")
        
        mail.send(msg)
        print(f"SUCCESS: OTP email sent to {email} from {sender_email}")
        return True
    except Exception as e:
        error_msg = str(e)
        print(f"Failed to send OTP email: {e}")
        
        # Provide helpful error messages for common Gmail issues
        if "BadCredentials" in error_msg or "Username and Password not accepted" in error_msg:
            print("\n" + "="*60)
            print("GMAIL AUTHENTICATION ERROR - Troubleshooting Steps:")
            print("="*60)
            print("1. Make sure 2-Step Verification is enabled on your Google Account")
            print("2. Generate an App Password (not your regular password):")
            print("   https://myaccount.google.com/apppasswords")
            print("3. Use the 16-character App Password (remove spaces if any)")
            print("4. Update MAIL_USERNAME and MAIL_PASSWORD in backend/.env file")
            print("5. Restart the Flask server after updating .env")
            print("="*60 + "\n")
        
        return False

