# Railway Deployment - Step by Step Guide

## 🚀 Your Repository
**GitHub URL:** https://github.com/bhaveshzx/loan-management-system

---

## Step 1: Create Railway Account & Project

1. **Go to Railway**
   - Visit: https://railway.app
   - Click **"Start a New Project"** or **"Login"**

2. **Sign in with GitHub**
   - Click **"Login with GitHub"**
   - Authorize Railway to access your GitHub account

3. **Create New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Find and select: `bhaveshzx/loan-management-system`
   - Click **"Deploy Now"**

---

## Step 2: Add PostgreSQL Database

1. **In your Railway project dashboard**, click **"+ New"** button
2. Select **"Database"** → **"Add PostgreSQL"**
3. ✅ Railway automatically creates the database and sets `DATABASE_URL` environment variable
4. **Note the database service name** (e.g., "PostgreSQL")

---

## Step 3: Configure Backend Service

### 3.1: Set Root Directory

1. Click on your **backend service** (the one that deployed from GitHub)
2. Go to **Settings** tab
3. Scroll to **"Root Directory"**
4. Set to: `backend`
5. Click **"Save"**

### 3.2: Generate Secret Keys

**Run these commands in PowerShell to generate secure keys:**

```powershell
# Generate SECRET_KEY
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"

# Generate JWT_SECRET_KEY
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

**Copy both keys** - you'll need them in the next step!

### 3.3: Add Environment Variables

1. In your backend service, go to **Variables** tab
2. Click **"+ New Variable"** and add each of these:

```env
SECRET_KEY=your-generated-secret-key-here
JWT_SECRET_KEY=your-generated-jwt-secret-key-here
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
FLASK_ENV=production
PORT=5000
```

**Important:**
- Replace `your-generated-secret-key-here` with the keys you generated in step 3.2
- Replace `your-email@gmail.com` with your Gmail address
- Replace `your-gmail-app-password` with a Gmail App Password (see Step 3.4)
- `DATABASE_URL` is automatically set by Railway (don't add it manually)

### 3.4: Get Gmail App Password

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it: "Railway Loan System"
   - Click "Generate"
   - **Copy the 16-character password** (remove spaces)
   - Use this in `MAIL_PASSWORD`

### 3.5: Set Start Command

1. Go to **Settings** → **Deploy** section
2. Set **Start Command:**
   ```
   gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 app:app
   ```
3. Click **"Save"**

### 3.6: Deploy Backend

1. Railway will automatically redeploy when you save settings
2. Go to **Deployments** tab to watch the build
3. Wait for deployment to complete (✅ green checkmark)
4. **Copy your backend URL** (e.g., `https://your-backend.up.railway.app`)

---

## Step 4: Initialize Database

### Option A: Using Railway Dashboard (Recommended)

1. In your backend service, go to **Connect** tab
2. Click **"Connect"** to open a terminal
3. Run these commands:

```bash
flask db upgrade
python seed_data.py
```

### Option B: Using Railway CLI

1. **Install Railway CLI:**
   ```powershell
   npm install -g @railway/cli
   ```

2. **Login and link:**
   ```powershell
   railway login
   railway link
   ```

3. **Run migrations:**
   ```powershell
   railway run flask db upgrade
   railway run python seed_data.py
   ```

---

## Step 5: Deploy Frontend

### 5.1: Create Frontend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose your repository: `bhaveshzx/loan-management-system`
4. Click **"Deploy Now"**

### 5.2: Configure Frontend Service

1. Click on your **frontend service**
2. Go to **Settings** → Set **Root Directory** to: `frontend`
3. Go to **Variables** tab → Add:

```env
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```

**Replace `your-backend-url.up.railway.app` with your actual backend URL from Step 3.6**

4. Go to **Settings** → **Deploy** section
5. Set **Build Command:**
   ```
   npm install && npm run build
   ```
6. Set **Start Command:**
   ```
   npx serve -s build -l $PORT
   ```
7. Click **"Save"**

### 5.3: Install serve package (if needed)

If `npx serve` doesn't work, update the start command to:

```
npm install -g serve && serve -s build -l $PORT
```

Or add `serve` to `frontend/package.json` dependencies.

---

## Step 6: Update CORS Settings

1. Go back to your **backend service**
2. Go to **Variables** tab
3. Add/Update:

```env
CORS_ORIGINS=https://your-frontend-url.up.railway.app
```

**Replace with your actual frontend URL from Step 5.3**

4. Backend will automatically redeploy

---

## Step 7: Test Your Application

1. **Visit your frontend URL** (from Step 5.3)
2. **Test Registration:**
   - Register a new user
   - Check email for OTP
   - Complete registration

3. **Test Login:**
   - Login as regular user (OTP required)
   - Login as admin at `/admin/login`
   - Username: `admin`
   - Password: `admin123`

4. **⚠️ IMPORTANT:** Change admin password immediately after first login!

---

## Step 8: Verify Everything Works

### Backend Health Check
- Visit: `https://your-backend-url.up.railway.app/`
- Should show API endpoint information

### Frontend
- Should load without errors
- Should be able to register/login
- Should connect to backend API

### Database
- Check Railway dashboard → Database service
- Verify tables are created
- Verify seed data is loaded

---

## 🎯 Quick Reference

### Environment Variables Summary

#### Backend:
- `SECRET_KEY` - Generated secret key
- `JWT_SECRET_KEY` - Generated JWT secret key
- `DATABASE_URL` - Auto-set by Railway
- `MAIL_SERVER` - smtp.gmail.com
- `MAIL_PORT` - 587
- `MAIL_USE_TLS` - True
- `MAIL_USERNAME` - Your Gmail
- `MAIL_PASSWORD` - Gmail app password
- `FLASK_ENV` - production
- `CORS_ORIGINS` - Your frontend URL
- `PORT` - 5000 (or Railway's $PORT)

#### Frontend:
- `REACT_APP_API_URL` - Your backend URL

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`
- ⚠️ **Change immediately after deployment!**

---

## 🆘 Troubleshooting

### Backend won't start
- ✅ Check all environment variables are set
- ✅ Verify `DATABASE_URL` is set (Railway auto-sets this)
- ✅ Check build logs in Railway dashboard
- ✅ Verify root directory is set to `backend`

### Database errors
- ✅ Run migrations: `flask db upgrade`
- ✅ Check PostgreSQL service is running
- ✅ Verify `DATABASE_URL` is correct

### Frontend can't connect to backend
- ✅ Verify `REACT_APP_API_URL` matches backend URL
- ✅ Check CORS settings in backend
- ✅ Verify backend is accessible (visit backend URL)
- ✅ Check browser console for errors

### Email not working
- ✅ Verify Gmail app password is correct
- ✅ Check `MAIL_USERNAME` and `MAIL_PASSWORD`
- ✅ Ensure 2-Step Verification is enabled
- ✅ Check Railway logs for email errors

### CORS errors
- ✅ Verify `CORS_ORIGINS` is set to frontend URL
- ✅ Check frontend URL matches exactly (no trailing slash)
- ✅ Restart backend service after updating CORS

---

## 📚 Additional Resources

- **Railway Documentation:** https://docs.railway.app
- **Railway Status:** https://status.railway.app
- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833

---

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] PostgreSQL database added
- [ ] Backend service configured (root directory, environment variables, start command)
- [ ] Database migrations run
- [ ] Seed data loaded
- [ ] Frontend service created and configured
- [ ] CORS settings updated
- [ ] Application tested
- [ ] Admin password changed

---

## 🎉 Success!

Your Loan Management System is now live on Railway! 🚀

**Next Steps:**
1. Update admin password
2. Test all features
3. Monitor logs in Railway dashboard
4. Set up custom domains (optional)
5. Configure backups (optional)

