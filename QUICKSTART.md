# Quick Start Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+

## Quick Setup (5 minutes)

### 1. Database Setup

Create MySQL database:
```sql
CREATE DATABASE loan_management;
```

### 2. Backend Setup

```bash
cd backend

# Windows
setup.bat

# Linux/Mac
chmod +x setup.sh
./setup.sh

# Or manually:
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
python seed_data.py
python app.py
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Test Accounts

After seeding:
- **Admin**: admin / admin123
- **User**: john_doe / password123

## Docker Quick Start

```bash
docker-compose up -d
docker-compose exec backend flask db init
docker-compose exec backend flask db migrate -m "Initial migration"
docker-compose exec backend flask db upgrade
docker-compose exec backend python seed_data.py
```

## Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure database exists

### Frontend won't connect
- Check backend is running on port 5000
- Verify CORS is enabled
- Check proxy in `package.json`

### Email not working
- Update `.env` with email credentials
- For Gmail, use App Password
- Check SMTP settings

