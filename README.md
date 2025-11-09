# Loan Management System

A comprehensive Loan Management System built with Flask REST API, MySQL database, and React frontend. Features user/admin roles, JWT authentication, profile completion, loan management, admin approval/rejection workflow, automatic rejection scheduler, and email notifications.

## Features

- **User Authentication**: JWT-based authentication with OTP verification for users, separate admin login
- **OTP Verification**: Email-based OTP for user registration and login
- **Profile Management**: Mandatory profile completion on first login
- **Loan Management**: Create and list loan applications
- **Admin Dashboard**: Review, approve, or reject loan applications
- **Rejection Reasons**: 4 predefined reason codes for loan rejections
- **Auto-Rejection**: Automatic rejection of loans pending for more than 5 days
- **Email Notifications**: Email alerts for loan approval/rejection with rejection reasons
- **Database Migrations**: Flask-Migrate for database version control
- **Seed Data**: Pre-populated test data for development
- **Tests**: Comprehensive test suite for backend API
- **Docker Support**: Production-ready Docker and docker-compose setup
- **Deployment Ready**: Configuration files for Render, Railway, Vercel, and Docker

## Tech Stack

### Backend
- Flask 3.0.0
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- Flask-CORS
- Flask-Mail
- APScheduler
- PyMySQL
- MySQL

### Frontend
- React 18.2.0
- React Router DOM
- Axios
- CSS3

## Project Structure

```
Loan/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── models.py              # Database models (User, Loan, Profile)
│   ├── routes/                # API route handlers
│   │   ├── auth.py            # Authentication routes
│   │   ├── profile.py         # Profile management routes
│   │   ├── loans.py           # Loan management routes
│   │   └── admin.py           # Admin routes
│   ├── utils/
│   │   └── email_service.py   # Email notification service
│   ├── scheduler.py           # Auto-rejection scheduler
│   ├── seed_data.py           # Database seeding script
│   ├── tests/                 # Test suite
│   ├── migrations/            # Database migrations
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # React context (Auth)
│   │   ├── services/          # API service layer
│   │   └── App.js             # Main App component
│   └── package.json           # Node dependencies
├── docker-compose.yml         # Docker setup
└── README.md                  # This file
```

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- (Optional) Docker and Docker Compose

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Update `.env` with your database credentials and email settings:
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=mysql+pymysql://root:password@localhost/loan_management
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

6. Create MySQL database:
```sql
CREATE DATABASE loan_management;
```

7. Initialize database and run migrations:
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

8. Seed the database with test data:
```bash
python seed_data.py
```

9. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Docker Setup (Optional)

1. Update environment variables in `docker-compose.yml` if needed

2. Build and start containers:
```bash
docker-compose up -d
```

3. Initialize database (inside backend container):
```bash
docker-compose exec backend flask db init
docker-compose exec backend flask db migrate -m "Initial migration"
docker-compose exec backend flask db upgrade
docker-compose exec backend python seed_data.py
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Default Test Accounts

After seeding the database, you can use these accounts:

- **Admin**: 
  - Username: `admin`
  - Password: `admin123`

- **User 1**: 
  - Username: `john_doe`
  - Password: `password123`

- **User 2**: 
  - Username: `jane_smith`
  - Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires JWT)

### Profile
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create/update profile

### Loans
- `GET /api/loans` - Get all loans (user's own or all if admin)
- `POST /api/loans` - Create new loan application
- `GET /api/loans/<id>` - Get specific loan

### Admin
- `GET /api/admin/loans/pending` - Get all pending loans
- `POST /api/admin/loans/<id>/approve` - Approve loan
- `POST /api/admin/loans/<id>/reject` - Reject loan
- `GET /api/admin/rejection-reasons` - Get rejection reason codes

## Rejection Reason Codes

1. `INSUFFICIENT_INCOME` - Insufficient Income
2. `POOR_CREDIT_HISTORY` - Poor Credit History
3. `INCOMPLETE_DOCUMENTATION` - Incomplete Documentation
4. `EXCEEDS_LIMIT` - Exceeds Maximum Limit
5. `AUTO_REJECTED` - Automatic rejection after 5 days (system-generated)

## Running Tests

```bash
cd backend
pytest
```

Or run specific test files:
```bash
pytest tests/test_auth.py
pytest tests/test_loans.py
pytest tests/test_admin.py
```

## Features in Detail

### Profile Completion
- Users must complete their profile before creating loan applications
- Profile includes: name, phone, address, date of birth, employment status, and annual income

### Auto-Rejection Scheduler
- Runs every hour
- Automatically rejects loans that have been pending for more than 5 days
- Sends email notification to the user
- Uses `AUTO_REJECTED` reason code

### Email Notifications
- Sent when loans are approved or rejected
- Includes loan details and rejection reason (if applicable)
- Requires email configuration in `.env` file
- Works with Gmail SMTP (or any SMTP server)

## Development

### Database Migrations

Create a new migration:
```bash
flask db migrate -m "Description of changes"
```

Apply migrations:
```bash
flask db upgrade
```

### Adding New Features

1. Update models in `backend/models.py`
2. Create migration: `flask db migrate -m "Add new feature"`
3. Apply migration: `flask db upgrade`
4. Update routes in `backend/routes/`
5. Update frontend components if needed
6. Add tests in `backend/tests/`

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists: `CREATE DATABASE loan_management;`

### Email Notifications Not Working
- Check email credentials in `.env`
- For Gmail, use an App Password (not regular password)
- Verify SMTP settings are correct

### CORS Issues
- Ensure Flask-CORS is installed
- Check that frontend proxy is configured in `package.json`

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

