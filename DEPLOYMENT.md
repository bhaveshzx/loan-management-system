# Deployment Guide

This guide covers deploying the Loan Management System to various platforms.

## Table of Contents

1. [Docker Deployment (Recommended)](#docker-deployment)
2. [Render Deployment](#render-deployment)
3. [Railway Deployment](#railway-deployment)
4. [Vercel + Render Deployment](#vercel--render-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)

## Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Loan
   ```

2. **Create environment file**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your production values
   ```

3. **Create production environment file for docker-compose**
   ```bash
   cp .env.example .env.prod
   # Edit .env.prod with your production values
   ```

4. **Build and run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

5. **Initialize database**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
   docker-compose -f docker-compose.prod.yml exec backend python seed_data.py
   ```

6. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

## Render Deployment

### Backend Deployment

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `backend` directory as the root directory
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`

2. **Configure Environment Variables**
   - `SECRET_KEY`: Generate a random secret key
   - `JWT_SECRET_KEY`: Generate a random JWT secret key
   - `DATABASE_URL`: PostgreSQL database URL (Render provides this)
   - `MAIL_SERVER`: smtp.gmail.com
   - `MAIL_PORT`: 587
   - `MAIL_USE_TLS`: True
   - `MAIL_USERNAME`: Your Gmail address
   - `MAIL_PASSWORD`: Your Gmail app password
   - `FLASK_ENV`: production

3. **Database Setup**
   - Create a PostgreSQL database on Render
   - Use the database URL provided by Render
   - Run migrations: `flask db upgrade`
   - Seed data: `python seed_data.py`

### Frontend Deployment

1. **Create a new Static Site on Render**
   - Connect your GitHub repository
   - Select the `frontend` directory
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

2. **Configure Environment Variables**
   - `REACT_APP_API_URL`: Your backend URL (e.g., https://your-backend.onrender.com)

## Railway Deployment

### Backend Deployment

1. **Create a new project on Railway**
   - Connect your GitHub repository
   - Add a new service from GitHub repo
   - Select the `backend` directory

2. **Configure Environment Variables**
   - Add all environment variables from the `.env.example` file
   - Railway will automatically provide a `DATABASE_URL` if you add a PostgreSQL service

3. **Database Setup**
   - Add a PostgreSQL service
   - Railway will automatically set `DATABASE_URL`
   - Run migrations in the Railway console:
     ```bash
     flask db upgrade
     python seed_data.py
     ```

4. **Configure Start Command**
   - Set start command to: `gunicorn --bind 0.0.0.0:$PORT app:app`

### Frontend Deployment

1. **Create a new static site on Railway**
   - Add a new service
   - Select the `frontend` directory
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s build -l $PORT`

2. **Configure Environment Variables**
   - `REACT_APP_API_URL`: Your backend URL

## Vercel + Render Deployment

### Backend on Render

Follow the [Render Backend Deployment](#backend-deployment) steps above.

### Frontend on Vercel

1. **Create a new project on Vercel**
   - Connect your GitHub repository
   - Select the `frontend` directory as the root directory
   - Framework Preset: Create React App

2. **Configure Environment Variables**
   - `REACT_APP_API_URL`: Your Render backend URL

3. **Deploy**
   - Vercel will automatically build and deploy your frontend

## Environment Variables

### Backend Environment Variables

Create a `backend/.env` file with the following variables:

```env
# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database (for production, use PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database
# Or for development with SQLite:
# DATABASE_URL=sqlite:///loan_management.db

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Flask Configuration
FLASK_ENV=production
FLASK_APP=app.py
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=https://your-backend-url.com
```

## Database Setup

### PostgreSQL (Production)

1. **Create database**
   ```sql
   CREATE DATABASE loan_management;
   ```

2. **Run migrations**
   ```bash
   flask db upgrade
   ```

3. **Seed data (optional)**
   ```bash
   python seed_data.py
   ```

### MySQL (Alternative)

1. **Update DATABASE_URL**
   ```env
   DATABASE_URL=mysql+pymysql://user:password@host:port/database
   ```

2. **Run migrations**
   ```bash
   flask db upgrade
   ```

## Production Checklist

- [ ] Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Use PostgreSQL or MySQL for production (not SQLite)
- [ ] Configure email settings with app passwords
- [ ] Set `FLASK_ENV=production`
- [ ] Update CORS settings to allow only your frontend domain
- [ ] Enable HTTPS for both frontend and backend
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Test email notifications
- [ ] Test admin and user login flows
- [ ] Verify OTP functionality

## Troubleshooting

### Backend Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` format
   - Verify database is accessible
   - Check firewall rules

2. **Email Not Sending**
   - Verify Gmail app password is correct
   - Check `MAIL_USERNAME` and `MAIL_PASSWORD`
   - Ensure 2-Step Verification is enabled on Gmail

3. **CORS Errors**
   - Update CORS settings in `app.py` to include your frontend URL
   - Check that frontend URL matches exactly

### Frontend Issues

1. **API Connection Errors**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check backend is running and accessible
   - Verify CORS is configured on backend

2. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version (should be 18+)
   - Verify all environment variables are set

## Support

For issues or questions, please check the main README.md file or open an issue on GitHub.

