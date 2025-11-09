@echo off
REM Setup script for Loan Management System Backend (Windows)

echo Setting up Loan Management System Backend...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please update .env with your database credentials and email settings
)

REM Initialize database migrations
echo Initializing database migrations...
flask db init

REM Create initial migration
echo Creating initial migration...
flask db migrate -m "Initial migration"

REM Apply migrations
echo Applying migrations...
flask db upgrade

REM Seed database
echo Seeding database...
python seed_data.py

echo Setup complete!
echo To start the server, run: python app.py

pause

