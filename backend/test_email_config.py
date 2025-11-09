"""
Test Email Configuration Script
Run this script to verify your email configuration is correct.
"""
import os
from dotenv import load_dotenv
from flask import Flask
from flask_mail import Mail, Message

# Load environment variables
load_dotenv()

# Create a minimal Flask app for testing
app = Flask(__name__)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')

mail = Mail(app)

def test_email_config():
    """Test email configuration"""
    print("="*60)
    print("EMAIL CONFIGURATION TEST")
    print("="*60)
    
    # Check if .env file exists
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        print("[OK] .env file found at: " + env_path)
    else:
        print("[ERROR] .env file NOT found at: " + env_path)
        print("  Please create a .env file in the backend directory")
        return False
    
    # Display configuration (mask password)
    print("\nCurrent Configuration:")
    print(f"  MAIL_SERVER: {app.config['MAIL_SERVER']}")
    print(f"  MAIL_PORT: {app.config['MAIL_PORT']}")
    print(f"  MAIL_USE_TLS: {app.config['MAIL_USE_TLS']}")
    print(f"  MAIL_USERNAME: {app.config['MAIL_USERNAME'] or '(NOT SET)'}")
    
    password = app.config['MAIL_PASSWORD']
    if password:
        masked_password = password[:4] + '*' * (len(password) - 4) if len(password) > 4 else '****'
        print(f"  MAIL_PASSWORD: {masked_password} ({len(password)} characters)")
    else:
        print(f"  MAIL_PASSWORD: (NOT SET)")
    
    # Validate configuration
    print("\nValidation:")
    issues = []
    
    if not app.config['MAIL_USERNAME']:
        issues.append("[ERROR] MAIL_USERNAME is not set")
    else:
        print("[OK] MAIL_USERNAME is set")
    
    if not app.config['MAIL_PASSWORD']:
        issues.append("[ERROR] MAIL_PASSWORD is not set")
    else:
        print("[OK] MAIL_PASSWORD is set")
        if len(password) != 16:
            issues.append(f"[WARNING] MAIL_PASSWORD length is {len(password)} (should be 16 for Gmail App Password)")
        else:
            print("[OK] MAIL_PASSWORD length is correct (16 characters)")
    
    if password and ' ' in password:
        issues.append("[WARNING] MAIL_PASSWORD contains spaces (remove them)")
    elif password:
        print("[OK] MAIL_PASSWORD has no spaces")
    
    if issues:
        print("\nIssues Found:")
        for issue in issues:
            print(f"  {issue}")
        return False
    
    # Test sending email
    print("\n" + "="*60)
    print("TESTING EMAIL SEND...")
    print("="*60)
    
    test_email = input("\nEnter your email address to receive test email: ").strip()
    if not test_email:
        print("No email provided. Skipping send test.")
        return True
    
    try:
        with app.app_context():
            # Get sender email from config
            sender_email = app.config.get('MAIL_USERNAME', 'noreply@loanmanagement.com')
            
            msg = Message(
                subject="Test Email - Loan Management System",
                recipients=[test_email],
                body=f"""
This is a test email from your Loan Management System.

If you received this email, your email configuration is working correctly!

Configuration:
- Server: {app.config['MAIL_SERVER']}
- Port: {app.config['MAIL_PORT']}
- TLS: {app.config['MAIL_USE_TLS']}
- From: {app.config['MAIL_USERNAME']}

Best regards,
Loan Management System
""",
                sender=sender_email
            )
            mail.send(msg)
            print(f"\n[SUCCESS] Test email sent successfully to {test_email}!")
            print("  Please check your inbox (and spam folder).")
            return True
    except Exception as e:
        error_msg = str(e)
        print(f"\n[ERROR] Failed to send test email: {error_msg}")
        
        if "BadCredentials" in error_msg or "Username and Password not accepted" in error_msg:
            print("\n" + "="*60)
            print("GMAIL AUTHENTICATION ERROR")
            print("="*60)
            print("Common causes:")
            print("1. Using regular Gmail password instead of App Password")
            print("2. 2-Step Verification not enabled")
            print("3. App Password has spaces (remove them)")
            print("4. Wrong email address in MAIL_USERNAME")
            print("\nSteps to fix:")
            print("1. Enable 2-Step Verification: https://myaccount.google.com/security")
            print("2. Generate App Password: https://myaccount.google.com/apppasswords")
            print("3. Copy the 16-character password (no spaces)")
            print("4. Update backend/.env file:")
            print("   MAIL_USERNAME=your-email@gmail.com")
            print("   MAIL_PASSWORD=your-16-char-app-password")
            print("5. Restart Flask server")
            print("="*60)
        return False

if __name__ == '__main__':
    success = test_email_config()
    if success:
        print("\n[SUCCESS] Email configuration is working!")
    else:
        print("\n[ERROR] Email configuration needs to be fixed.")
        print("  Follow the instructions above to fix the issues.")

