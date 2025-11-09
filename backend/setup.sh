#!/bin/bash

# Setup script for Loan Management System Backend

echo "Setting up Loan Management System Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update .env with your database credentials and email settings"
fi

# Initialize database migrations
echo "Initializing database migrations..."
flask db init

# Create initial migration
echo "Creating initial migration..."
flask db migrate -m "Initial migration"

# Apply migrations
echo "Applying migrations..."
flask db upgrade

# Seed database
echo "Seeding database..."
python seed_data.py

echo "Setup complete!"
echo "To start the server, run: python app.py"

