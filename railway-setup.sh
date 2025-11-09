#!/bin/bash

# Railway Deployment Setup Script
# This script helps set up the database after deploying to Railway

echo "🚀 Railway Deployment Setup"
echo "============================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in Railway environment variables"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Run database migrations
echo "📦 Running database migrations..."
flask db upgrade

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ ERROR: Database migrations failed"
    exit 1
fi

echo ""

# Seed database
echo "🌱 Seeding database with initial data..."
python seed_data.py

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully"
else
    echo "⚠️  WARNING: Database seeding failed (this is okay if data already exists)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"

