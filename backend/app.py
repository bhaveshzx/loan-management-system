from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from apscheduler.schedulers.background import BackgroundScheduler
import os
from dotenv import load_dotenv
from db import db

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire for simplicity
# Use SQLite for development if DATABASE_URL is not set
# Railway provides PostgreSQL via DATABASE_URL (postgres://...)
# For MySQL, use mysql+pymysql://... format
default_db = 'sqlite:///loan_management.db'
database_url = os.getenv('DATABASE_URL', default_db)

# Handle Railway's PostgreSQL URL (postgres:// -> postgresql://)
# SQLAlchemy requires postgresql:// but Railway provides postgres://
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')

# Print email configuration on startup (for debugging)
if app.config['MAIL_USERNAME']:
    print(f"Email configured: Sender = {app.config['MAIL_USERNAME']}")
else:
    print("Warning: Email not configured (MAIL_USERNAME not set)")

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
# CORS configuration
# In production, replace "*" with your frontend URL for better security
cors_origins = os.getenv('CORS_ORIGINS', '*').split(',')
CORS(app, resources={r"/api/*": {
    "origins": cors_origins,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})
mail = Mail(app)

# Set default sender for Flask-Mail (optional, but ensures consistency)
if app.config['MAIL_USERNAME']:
    app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']
    print(f"Flask-Mail default sender set to: {app.config['MAIL_DEFAULT_SENDER']}")

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("JWT Error: Token has expired")
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"JWT Error: Invalid token - {str(error)}")
    from flask import request
    auth_header = request.headers.get('Authorization')
    print(f"JWT Error - Authorization header: {auth_header[:50] if auth_header else 'None'}...")
    return jsonify({'error': f'Invalid token: {str(error)}'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"JWT Error: Authorization token is missing - {str(error)}")
    from flask import request
    print(f"JWT Error - All headers: {dict(request.headers)}")
    return jsonify({'error': 'Authorization token is missing'}), 401

# Import models after db is initialized
from models import User, Loan, Profile, PendingRegistration, PendingLogin

# Import routes
from routes.auth import auth_bp
from routes.loans import loans_bp
from routes.profile import profile_bp
from routes.admin import admin_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(loans_bp, url_prefix='/api/loans')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Import scheduler tasks
from scheduler import init_scheduler

# Initialize scheduler
scheduler = init_scheduler(app, db)

# Root route - API information
@app.route('/')
def index():
    """Root endpoint - shows available API endpoints"""
    return jsonify({
        'message': 'Loan Management System API',
        'version': '1.0.0',
        'endpoints': {
            'authentication': {
                'POST /api/auth/register': 'Register new user (sends OTP)',
                'POST /api/auth/verify-otp': 'Verify OTP and complete registration',
                'POST /api/auth/resend-otp': 'Resend OTP for registration',
                'POST /api/auth/login': 'Login regular user (sends OTP)',
                'POST /api/auth/admin/login': 'Admin login (no OTP required)',
                'POST /api/auth/verify-login-otp': 'Verify OTP and complete login',
                'POST /api/auth/resend-login-otp': 'Resend OTP for login',
                'POST /api/auth/test-email': 'Test email configuration',
                'GET /api/auth/me': 'Get current user (requires JWT)'
            },
            'profile': {
                'GET /api/profile': 'Get user profile (requires JWT)',
                'POST /api/profile': 'Create/update profile (requires JWT)'
            },
            'loans': {
                'GET /api/loans': 'Get all loans (requires JWT)',
                'POST /api/loans': 'Create loan application (requires JWT)',
                'GET /api/loans/<id>': 'Get specific loan (requires JWT)'
            },
            'admin': {
                'GET /api/admin/loans/pending': 'Get pending loans (admin only)',
                'POST /api/admin/loans/<id>/approve': 'Approve loan (admin only)',
                'POST /api/admin/loans/<id>/reject': 'Reject loan (admin only)',
                'GET /api/admin/rejection-reasons': 'Get rejection reason codes (admin only)'
            }
        },
        'status': 'running'
    }), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    scheduler.start()
    # Get port from environment variable (for production deployments like Render, Railway)
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)

