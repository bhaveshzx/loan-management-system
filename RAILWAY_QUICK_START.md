# Railway Quick Start Guide

Get your Loan Management System deployed on Railway in 10 minutes!

## 🚀 Quick Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### Step 3: Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. ✅ Railway automatically sets `DATABASE_URL`

### Step 4: Configure Backend Service
1. Click on your service (or create new from GitHub repo)
2. Go to **Settings** → Set **Root Directory** to `backend`
3. Go to **Variables** tab and add:

```env
SECRET_KEY=your-random-secret-key-here
JWT_SECRET_KEY=your-random-jwt-secret-key-here
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
FLASK_ENV=production
```

**Generate secrets:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

4. Go to **Settings** → **Deploy** → Set **Start Command**:
```
gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 app:app
```

5. Railway will auto-deploy! 🎉

### Step 5: Initialize Database
1. Go to **Settings** → **Service Connection** → **Connect**
2. Run in terminal:
```bash
flask db upgrade
python seed_data.py
```

**Or use Railway CLI:**
```bash
npm i -g @railway/cli
railway login
railway link
railway run flask db upgrade
railway run python seed_data.py
```

### Step 6: Deploy Frontend
1. In Railway project, click **"+ New"**
2. Select **"GitHub Repo"** → Choose your repo again
3. Go to **Settings** → Set **Root Directory** to `frontend`
4. Go to **Variables** → Add:
```env
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```
*(Replace with your actual backend URL from Step 4)*

5. Go to **Settings** → **Deploy** → Set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l $PORT`

6. Railway will auto-deploy! 🎉

### Step 7: Update CORS
1. Go to backend service → **Variables**
2. Add/Update:
```env
CORS_ORIGINS=https://your-frontend-url.up.railway.app
```
3. Backend will auto-redeploy

### Step 8: Test Your App
1. Visit your frontend URL
2. Register a new user
3. Login as admin (admin/admin123)
4. ✅ Change admin password immediately!

## 📋 Environment Variables Summary

### Backend
- `SECRET_KEY` - Random secret key
- `JWT_SECRET_KEY` - Random JWT secret key
- `DATABASE_URL` - Auto-set by Railway (PostgreSQL)
- `MAIL_SERVER` - smtp.gmail.com
- `MAIL_PORT` - 587
- `MAIL_USE_TLS` - True
- `MAIL_USERNAME` - Your Gmail
- `MAIL_PASSWORD` - Gmail app password
- `FLASK_ENV` - production
- `CORS_ORIGINS` - Your frontend URL

### Frontend
- `REACT_APP_API_URL` - Your backend URL

## 🔐 Gmail App Password Setup

1. Enable 2-Step Verification on Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate app password for "Mail"
4. Use the 16-character password (remove spaces)

## 🎯 Default Credentials

- **Admin Username:** `admin`
- **Admin Password:** `admin123`
- ⚠️ **Change immediately after first login!**

## 📚 Full Documentation

For detailed instructions, see [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

## 🆘 Troubleshooting

### Backend won't start
- Check all environment variables are set
- Verify `DATABASE_URL` is set (Railway auto-sets this)
- Check build logs in Railway dashboard

### Database errors
- Run migrations: `railway run flask db upgrade`
- Check PostgreSQL service is running

### Frontend can't connect
- Verify `REACT_APP_API_URL` matches backend URL
- Check CORS settings in backend
- Verify backend is accessible

### Email not working
- Verify Gmail app password is correct
- Check `MAIL_USERNAME` and `MAIL_PASSWORD`
- Ensure 2-Step Verification is enabled

## 🎉 You're Done!

Your app is live on Railway! 🚀

Need help? Check [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for detailed instructions.

