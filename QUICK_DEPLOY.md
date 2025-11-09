# Quick Deployment Guide

This is a simplified guide for quickly deploying the Loan Management System.

## Option 1: Docker Deployment (Easiest)

### Prerequisites
- Docker and Docker Compose installed
- Git

### Steps

1. **Clone and navigate to project**
   ```bash
   git clone <your-repo-url>
   cd Loan
   ```

2. **Create environment file**
   ```bash
   # Copy example file
   cp .env.example .env.prod
   
   # Edit .env.prod with your values:
   # - Set strong SECRET_KEY and JWT_SECRET_KEY
   # - Configure MySQL passwords
   # - Set email credentials (Gmail app password)
   # - Set REACT_APP_API_URL (e.g., http://localhost:5000 for local, or your domain for production)
   ```

3. **Start services**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

4. **Initialize database**
   ```bash
   # Wait for services to be ready (about 30 seconds)
   sleep 30
   
   # Run migrations
   docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
   
   # Seed initial data (optional)
   docker-compose -f docker-compose.prod.yml exec backend python seed_data.py
   ```

5. **Access application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000/api

6. **Default admin credentials** (from seed_data.py)
   - Username: `admin`
   - Password: `admin123`

## Option 2: Render Deployment (Free Tier Available)

### Backend on Render

1. **Create account** at https://render.com
2. **Create new Web Service**
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && flask db upgrade`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`

3. **Add PostgreSQL Database**
   - Create new PostgreSQL database
   - Copy the internal database URL

4. **Set Environment Variables**
   ```
   SECRET_KEY=<generate-random-string>
   JWT_SECRET_KEY=<generate-random-string>
   DATABASE_URL=<postgres-url-from-render>
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-gmail-app-password
   FLASK_ENV=production
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy your backend URL (e.g., https://loan-backend.onrender.com)

### Frontend on Render

1. **Create new Static Site**
   - Connect GitHub repository
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

2. **Set Environment Variable**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

3. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment
   - Your frontend will be live!

## Option 3: Railway Deployment (Free Tier Available)

### Backend on Railway

1. **Create account** at https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Add PostgreSQL** service
4. **Configure Backend Service**
   - Root Directory: `backend`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`

5. **Set Environment Variables**
   - Railway auto-sets `DATABASE_URL` from PostgreSQL service
   - Add other variables:
     ```
     SECRET_KEY=<generate-random-string>
     JWT_SECRET_KEY=<generate-random-string>
     MAIL_SERVER=smtp.gmail.com
     MAIL_PORT=587
     MAIL_USE_TLS=True
     MAIL_USERNAME=your-email@gmail.com
     MAIL_PASSWORD=your-gmail-app-password
     FLASK_ENV=production
     ```

6. **Deploy and get URL**

### Frontend on Railway

1. **Add new service** → **GitHub Repo**
2. **Configure**
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s build -l $PORT`

3. **Set Environment Variable**
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

4. **Deploy**

## Option 4: Vercel (Frontend) + Render (Backend)

### Backend: Follow Render steps above

### Frontend on Vercel

1. **Create account** at https://vercel.com
2. **Import Project** from GitHub
3. **Configure**
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Environment Variable: `REACT_APP_API_URL=https://your-backend-url.onrender.com`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

## Environment Variables Quick Reference

### Backend (.env)
```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=postgresql://user:pass@host:port/db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
FLASK_ENV=production
CORS_ORIGINS=https://your-frontend-url.com
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.com
```

## Post-Deployment Steps

1. **Initialize Database**
   ```bash
   flask db upgrade
   python seed_data.py
   ```

2. **Test the Application**
   - Register a new user
   - Login as admin (admin/admin123)
   - Create a loan application
   - Approve/reject loans
   - Test email notifications

3. **Update Admin Password** (Important!)
   - Login as admin
   - Change password from default

## Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify database URL is correct
- Check logs for errors

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running and accessible

### Email not working
- Verify Gmail app password is correct
- Check 2-Step Verification is enabled
- Verify `MAIL_USERNAME` and `MAIL_PASSWORD` are set

### Database errors
- Run migrations: `flask db upgrade`
- Check database connection string
- Verify database is accessible

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Using PostgreSQL/MySQL (not SQLite) in production
- [ ] CORS configured for your frontend domain only
- [ ] HTTPS enabled (most platforms do this automatically)
- [ ] Environment variables secured (not in code)
- [ ] Email credentials secured

## Need Help?

- Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- Review [README.md](./README.md) for project overview
- Check platform-specific documentation:
  - Render: https://render.com/docs
  - Railway: https://docs.railway.app
  - Vercel: https://vercel.com/docs

