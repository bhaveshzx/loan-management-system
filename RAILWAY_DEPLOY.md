# Railway Deployment Guide

Complete guide for deploying the Loan Management System to Railway.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Gmail account (for email notifications)

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

## Step 2: Deploy Backend to Railway

### 2.1 Create New Project

1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your repository

### 2.2 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. Note: Railway automatically sets the `DATABASE_URL` environment variable

### 2.3 Configure Backend Service

1. Click on the backend service (or create a new service from GitHub repo)
2. Go to **"Settings"** tab
3. Set **Root Directory** to `backend`
4. Go to **"Variables"** tab to set environment variables

### 2.4 Set Environment Variables

Add the following environment variables in Railway:

```env
# Security Keys (generate strong random strings)
SECRET_KEY=your-very-long-random-secret-key-here
JWT_SECRET_KEY=your-very-long-random-jwt-secret-key-here

# Database (Railway automatically sets DATABASE_URL from PostgreSQL service)
# DATABASE_URL is automatically set by Railway, no need to add manually

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password

# Flask Configuration
FLASK_ENV=production
FLASK_APP=app.py

# CORS (update with your frontend URL after deploying frontend)
CORS_ORIGINS=https://your-frontend-app.up.railway.app
```

**Important Notes:**
- Generate strong `SECRET_KEY` and `JWT_SECRET_KEY` (use a password generator or: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- For Gmail: You need an App Password (not your regular password)
  - Enable 2-Step Verification on Google Account
  - Generate App Password: https://myaccount.google.com/apppasswords
  - Use the 16-character app password (remove spaces)

### 2.5 Configure Start Command

1. Go to **"Settings"** → **"Deploy"**
2. Set **Start Command** to:
   ```
   gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 app:app
   ```
3. Railway automatically sets the `PORT` environment variable

### 2.6 Deploy Backend

1. Railway will automatically detect the backend and start building
2. Wait for deployment to complete
3. Check the **"Deployments"** tab for build logs
4. Once deployed, Railway will provide a URL like: `https://your-backend-app.up.railway.app`

### 2.7 Initialize Database

1. Go to **"Settings"** → **"Service Connection"**
2. Click **"Connect"** to open a terminal
3. Run database migrations:
   ```bash
   flask db upgrade
   ```
4. Seed initial data (optional):
   ```bash
   python seed_data.py
   ```

**Alternative: Use Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
railway run flask db upgrade

# Seed data
railway run python seed_data.py
```

## Step 3: Deploy Frontend to Railway

### 3.1 Create Frontend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** → Select your repository again
3. This creates a new service for the frontend

### 3.2 Configure Frontend Service

1. Click on the frontend service
2. Go to **"Settings"** tab
3. Set **Root Directory** to `frontend`
4. Go to **"Variables"** tab

### 3.3 Set Environment Variables

Add the following environment variable:

```env
REACT_APP_API_URL=https://your-backend-app.up.railway.app
```

**Important:** Replace `your-backend-app.up.railway.app` with your actual backend URL from Step 2.6

### 3.4 Configure Build and Start Commands

1. Go to **"Settings"** → **"Deploy"**
2. Set **Build Command** to:
   ```
   npm install && npm run build
   ```
3. Set **Start Command** to:
   ```
   npx serve -s build -l $PORT
   ```

**Note:** Railway automatically sets the `PORT` environment variable

### 3.5 Deploy Frontend

1. Railway will automatically build and deploy the frontend
2. Wait for deployment to complete
3. Once deployed, Railway will provide a URL like: `https://your-frontend-app.up.railway.app`

## Step 4: Update CORS Settings

After deploying the frontend, update the backend CORS settings:

1. Go to backend service → **"Variables"**
2. Update `CORS_ORIGINS` to your frontend URL:
   ```
   CORS_ORIGINS=https://your-frontend-app.up.railway.app
   ```
3. Railway will automatically redeploy the backend

## Step 5: Custom Domain (Optional)

### For Backend

1. Go to backend service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Add your custom domain
4. Update DNS records as instructed

### For Frontend

1. Go to frontend service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Add your custom domain
4. Update DNS records as instructed
5. Update `REACT_APP_API_URL` and `CORS_ORIGINS` with new domain

## Step 6: Verify Deployment

### 6.1 Test Backend

1. Visit your backend URL: `https://your-backend-app.up.railway.app`
2. You should see the API documentation JSON
3. Test API endpoint: `https://your-backend-app.up.railway.app/api/auth/me` (should return 401, which is expected)

### 6.2 Test Frontend

1. Visit your frontend URL: `https://your-frontend-app.up.railway.app`
2. You should see the login page
3. Test user registration
4. Test admin login (username: `admin`, password: `admin123`)

### 6.3 Test Full Flow

1. **Register a new user**
   - Go to register page
   - Fill in details
   - Verify OTP from email
   - Complete profile

2. **Login as user**
   - Login with credentials
   - Verify OTP from email
   - Create a loan application

3. **Login as admin**
   - Go to `/admin/login`
   - Login with admin credentials
   - Approve/reject loan applications
   - Verify email notifications

## Step 7: Post-Deployment Tasks

### 7.1 Change Default Admin Password

**Important:** Change the default admin password immediately!

1. Login as admin (username: `admin`, password: `admin123`)
2. You can create a script to change the password or do it manually through the database

**Using Railway CLI:**
```bash
railway run python
```

Then in Python:
```python
from app import app
from models import User
from db import db

with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    admin.set_password('your-new-strong-password')
    db.session.commit()
    print('Admin password updated!')
```

### 7.2 Set Up Monitoring (Optional)

1. Railway provides built-in metrics
2. Check **"Metrics"** tab for CPU, Memory, and Network usage
3. Set up alerts for errors (Railway Pro feature)

### 7.3 Set Up Database Backups (Optional)

1. Railway automatically backs up PostgreSQL databases
2. Check **"Database"** service → **"Backups"** tab
3. For production, consider additional backup strategies

## Troubleshooting

### Backend Issues

**Problem: Backend won't start**
- Check build logs in Railway dashboard
- Verify all environment variables are set
- Check that `DATABASE_URL` is set (automatically set by Railway)
- Verify Python version (should be 3.11+)

**Problem: Database connection errors**
- Verify PostgreSQL service is running
- Check `DATABASE_URL` is set correctly
- Run migrations: `railway run flask db upgrade`

**Problem: Email not sending**
- Verify Gmail app password is correct
- Check `MAIL_USERNAME` and `MAIL_PASSWORD` are set
- Ensure 2-Step Verification is enabled on Gmail
- Check Railway logs for email errors

### Frontend Issues

**Problem: Frontend can't connect to backend**
- Verify `REACT_APP_API_URL` is set correctly
- Check backend URL is accessible
- Verify CORS settings in backend
- Check browser console for errors

**Problem: Build fails**
- Check build logs in Railway dashboard
- Verify Node.js version (should be 18+)
- Clear cache and rebuild
- Check for syntax errors in code

**Problem: 404 errors on page refresh**
- This is a known issue with React Router on static hosts
- Railway's `serve` command should handle this, but if not, you may need to configure redirects

### CORS Issues

**Problem: CORS errors in browser**
- Verify `CORS_ORIGINS` includes your frontend URL
- Check that URLs match exactly (including https://)
- Restart backend service after changing CORS settings

## Railway CLI Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# View logs
railway logs

# Run commands
railway run flask db upgrade
railway run python seed_data.py

# Open service in browser
railway open

# View environment variables
railway variables

# Set environment variable
railway variables set SECRET_KEY=your-key

# Deploy
railway up
```

## Cost Estimation

### Free Tier
- **$5 free credit per month**
- Suitable for development and small projects
- Includes:
  - 500 hours of usage
  - 100 GB bandwidth
  - PostgreSQL database

### Paid Plans
- **Developer Plan**: $5/month + usage
- **Team Plan**: $20/month + usage
- Check Railway pricing for details

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Using PostgreSQL (provided by Railway)
- [ ] CORS configured for frontend domain only
- [ ] HTTPS enabled (Railway provides this automatically)
- [ ] Environment variables secured (Railway manages these)
- [ ] Email credentials secured
- [ ] Database backups enabled (Railway automatic)
- [ ] Regular security updates

## Next Steps

1. ✅ Deploy backend and frontend
2. ✅ Initialize database
3. ✅ Test all functionality
4. ✅ Change admin password
5. ✅ Set up custom domain (optional)
6. ✅ Monitor usage and performance
7. ✅ Set up alerts (Railway Pro)

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

## Additional Resources

- [Railway Getting Started](https://docs.railway.app/getting-started)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Railway Networking](https://docs.railway.app/networking)

---

**Congratulations! Your Loan Management System is now deployed on Railway! 🚀**

