# 🚀 Complete Free Deployment Guide - Loan Management System

This guide will walk you through deploying your Loan Management System **completely FREE** using Railway (free tier available).

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ A GitHub account (free)
- ✅ A Gmail account (for email notifications)
- ✅ Your code pushed to GitHub

---

## 🎯 Step-by-Step Deployment Instructions

### **STEP 1: Push Your Code to GitHub**

If you haven't already, push your code to GitHub:

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it: `loan-management-system` (or any name you prefer)
   - Make it **Public** or **Private** (both work)
   - Click **"Create repository"**

2. **Push your code:**
   ```powershell
   # In your project directory (C:\Users\Admin\Desktop\Loan)
   git init
   git add .
   git commit -m "Initial commit - Ready for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/loan-management-system.git
   git push -u origin main
   ```
   *(Replace `YOUR_USERNAME` with your GitHub username)*

---

### **STEP 2: Create Railway Account**

1. **Go to Railway:**
   - Visit: https://railway.app
   - Click **"Start a New Project"** or **"Login"**

2. **Sign up with GitHub:**
   - Click **"Login with GitHub"**
   - Authorize Railway to access your GitHub account
   - Railway offers a **free tier** with $5 credit monthly

---

### **STEP 3: Create New Project on Railway**

1. **Click "New Project"** in Railway dashboard
2. **Select "Deploy from GitHub repo"**
3. **Find and select your repository:** `YOUR_USERNAME/loan-management-system`
4. **Click "Deploy Now"**
5. Railway will start deploying (this will fail initially - that's normal!)

---

### **STEP 4: Add PostgreSQL Database**

1. **In your Railway project dashboard**, click **"+ New"** button
2. **Select "Database"** → **"Add PostgreSQL"**
3. ✅ Railway automatically creates the database and sets `DATABASE_URL` environment variable
4. **Note:** The database is now ready - Railway handles everything!

---

### **STEP 5: Configure Backend Service**

#### **5.1: Set Root Directory**

1. Click on your **backend service** (the one that deployed from GitHub)
2. Go to **Settings** tab
3. Scroll to **"Root Directory"**
4. Set to: `backend`
5. Click **"Save"**

#### **5.2: Generate Secret Keys**

**Open PowerShell and run these commands:**

```powershell
# Generate SECRET_KEY
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"

# Generate JWT_SECRET_KEY  
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

**Copy both keys** - you'll need them in the next step!

#### **5.3: Get Gmail App Password (For Email Notifications)**

1. **Enable 2-Step Verification on your Gmail:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification" (if not already enabled)

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it: "Railway Loan System"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - **Remove spaces** when using it (should be: `abcdefghijklmnop`)

#### **5.4: Add Environment Variables to Backend**

1. In your backend service, go to **Variables** tab
2. Click **"+ New Variable"** and add each of these **one by one**:

```env
SECRET_KEY=your-generated-secret-key-here
```

```env
JWT_SECRET_KEY=your-generated-jwt-secret-key-here
```

```env
MAIL_SERVER=smtp.gmail.com
```

```env
MAIL_PORT=587
```

```env
MAIL_USE_TLS=True
```

```env
MAIL_USERNAME=your-email@gmail.com
```

```env
MAIL_PASSWORD=your-gmail-app-password
```

```env
FLASK_ENV=production
```

```env
PORT=5000
```

**Important Notes:**
- Replace `your-generated-secret-key-here` with the keys you generated in step 5.2
- Replace `your-email@gmail.com` with your Gmail address
- Replace `your-gmail-app-password` with the app password from step 5.3
- **DO NOT** add `DATABASE_URL` manually - Railway sets it automatically!

#### **5.5: Set Start Command**

1. Go to **Settings** → **Deploy** section
2. Find **"Start Command"** field
3. Set it to:
   ```
   gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 app:app
   ```
4. Click **"Save"**

#### **5.6: Wait for Backend Deployment**

1. Railway will automatically redeploy when you save settings
2. Go to **Deployments** tab to watch the build
3. Wait for deployment to complete (✅ green checkmark)
4. **Copy your backend URL** - it will look like: `https://your-backend-name.up.railway.app`
   - You can find it in the **Settings** → **Domains** section
   - Or click **"Generate Domain"** if not visible

---

### **STEP 6: Initialize Database**

1. In your backend service, go to **Connect** tab
2. Click **"Connect"** button (opens a terminal)
3. Run these commands **one by one**:

```bash
flask db upgrade
```

```bash
python seed_data.py
```

4. Wait for both commands to complete successfully
5. Close the terminal

**✅ Your database is now initialized with tables and seed data!**

---

### **STEP 7: Deploy Frontend**

#### **7.1: Create Frontend Service**

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose your repository again: `YOUR_USERNAME/loan-management-system`
4. Click **"Deploy Now"**

#### **7.2: Configure Frontend Service**

1. Click on your **frontend service**
2. Go to **Settings** → Set **Root Directory** to: `frontend`
3. Click **"Save"**

#### **7.3: Add Frontend Environment Variable**

1. Go to **Variables** tab
2. Click **"+ New Variable"**
3. Add:
   ```env
   REACT_APP_API_URL=https://your-backend-url.up.railway.app
   ```
   **Replace `your-backend-url.up.railway.app` with your actual backend URL from Step 5.6**

#### **7.4: Set Build and Start Commands**

1. Go to **Settings** → **Deploy** section
2. Set **Build Command:**
   ```
   npm install && npm run build
   ```
3. Set **Start Command:**
   ```
   npx serve -s build -l $PORT
   ```
4. Click **"Save"**

#### **7.5: Wait for Frontend Deployment**

1. Railway will automatically redeploy
2. Go to **Deployments** tab to watch the build
3. Wait for deployment to complete (✅ green checkmark)
4. **Copy your frontend URL** - it will look like: `https://your-frontend-name.up.railway.app`

---

### **STEP 8: Update CORS Settings**

1. Go back to your **backend service**
2. Go to **Variables** tab
3. Click **"+ New Variable"**
4. Add:
   ```env
   CORS_ORIGINS=https://your-frontend-url.up.railway.app
   ```
   **Replace with your actual frontend URL from Step 7.5**
5. Backend will automatically redeploy

---

### **STEP 9: Test Your Application**

1. **Visit your frontend URL** (from Step 7.5)
2. **Test Registration:**
   - Click "Register"
   - Fill in the form
   - Check your email for OTP
   - Enter OTP to complete registration

3. **Test Login:**
   - Login as regular user (OTP required)
   - Or login as admin:
     - Go to: `https://your-frontend-url.up.railway.app/admin/login`
     - Username: `admin`
     - Password: `admin123`

4. **⚠️ IMPORTANT:** Change admin password immediately after first login!

---

## 🎯 Quick Reference

### **Environment Variables Summary**

#### **Backend Variables:**
- `SECRET_KEY` - Generated secret key (from step 5.2)
- `JWT_SECRET_KEY` - Generated JWT secret key (from step 5.2)
- `DATABASE_URL` - **Auto-set by Railway** (don't add manually!)
- `MAIL_SERVER` - `smtp.gmail.com`
- `MAIL_PORT` - `587`
- `MAIL_USE_TLS` - `True`
- `MAIL_USERNAME` - Your Gmail address
- `MAIL_PASSWORD` - Gmail app password
- `FLASK_ENV` - `production`
- `CORS_ORIGINS` - Your frontend URL
- `PORT` - `5000`

#### **Frontend Variables:**
- `REACT_APP_API_URL` - Your backend URL

### **Default Admin Credentials**
- **Username:** `admin`
- **Password:** `admin123`
- ⚠️ **Change immediately after deployment!**

---

## 🆘 Troubleshooting

### **Backend won't start**
- ✅ Check all environment variables are set correctly
- ✅ Verify `DATABASE_URL` is set (Railway auto-sets this)
- ✅ Check build logs in Railway dashboard → Deployments tab
- ✅ Verify root directory is set to `backend`
- ✅ Check that `gunicorn` is in `requirements.txt` (it should be)

### **Database errors**
- ✅ Run migrations: `flask db upgrade` (in Connect tab)
- ✅ Check PostgreSQL service is running in Railway dashboard
- ✅ Verify `DATABASE_URL` is correct (Railway sets this automatically)

### **Frontend can't connect to backend**
- ✅ Verify `REACT_APP_API_URL` matches backend URL exactly
- ✅ Check CORS settings in backend (`CORS_ORIGINS` variable)
- ✅ Verify backend is accessible (visit backend URL in browser)
- ✅ Check browser console for errors (F12 → Console tab)
- ✅ Make sure both URLs use `https://` (not `http://`)

### **Email not working**
- ✅ Verify Gmail app password is correct (no spaces)
- ✅ Check `MAIL_USERNAME` and `MAIL_PASSWORD` are set
- ✅ Ensure 2-Step Verification is enabled on Gmail
- ✅ Check Railway logs for email errors (Deployments → View Logs)

### **CORS errors**
- ✅ Verify `CORS_ORIGINS` is set to frontend URL exactly
- ✅ Check frontend URL matches exactly (no trailing slash)
- ✅ Restart backend service after updating CORS (Railway does this automatically)

### **Build fails**
- ✅ Check build logs in Railway dashboard
- ✅ Verify all files are committed to GitHub
- ✅ Check that `package.json` and `requirements.txt` are correct
- ✅ Make sure root directories are set correctly

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is set up:

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] PostgreSQL database added
- [ ] Backend service root directory set to `backend`
- [ ] Secret keys generated and added
- [ ] Gmail app password created
- [ ] All backend environment variables added
- [ ] Backend start command set
- [ ] Backend deployed successfully
- [ ] Backend URL copied
- [ ] Database migrations run (`flask db upgrade`)
- [ ] Seed data loaded (`python seed_data.py`)
- [ ] Frontend service created
- [ ] Frontend root directory set to `frontend`
- [ ] Frontend environment variable added (`REACT_APP_API_URL`)
- [ ] Frontend build and start commands set
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied
- [ ] CORS settings updated in backend
- [ ] Application tested (registration, login)
- [ ] Admin password changed

---

## 💰 Railway Free Tier Limits

Railway offers a **free tier** with:
- **$5 credit per month** (free)
- **500 hours of usage** per month
- **512 MB RAM** per service
- **1 GB storage** per database

**For this application:**
- Backend service: ~$0.01/hour
- Frontend service: ~$0.01/hour  
- PostgreSQL database: ~$0.01/hour
- **Total: ~$0.03/hour**

**With $5 credit, you get approximately 166 hours of runtime per month!**

**Note:** If you exceed the free tier, Railway will pause your services. You can upgrade to a paid plan if needed.

---

## 🎉 Success!

Your Loan Management System is now live on Railway! 🚀

**Your application URLs:**
- **Frontend:** `https://your-frontend-url.up.railway.app`
- **Backend API:** `https://your-backend-url.up.railway.app`

**Next Steps:**
1. ✅ Change admin password immediately
2. ✅ Test all features thoroughly
3. ✅ Monitor logs in Railway dashboard
4. ✅ Set up custom domains (optional, may require paid plan)
5. ✅ Configure backups (optional)

---

## 📚 Additional Resources

- **Railway Documentation:** https://docs.railway.app
- **Railway Status:** https://status.railway.app
- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
- **Railway Pricing:** https://railway.app/pricing

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Railway deployment logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Make sure all steps were followed in order

**Good luck with your deployment! 🚀**

