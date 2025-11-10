# Railway Database Setup Guide

## How to Initialize Database on Railway

There are two ways to run database migrations and seed data on Railway:

---

## Method 1: Using Railway Dashboard (Easiest) ✅

### Step 1: Open Terminal in Railway

1. **Go to your Railway project dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Click on your Backend Service**
   - Find the service named "backend" or your backend service

3. **Open the Terminal**
   - Click on the **"Connect"** tab (or **"Deployments"** tab)
   - Look for **"Connect"** or **"Terminal"** button
   - Click it to open a terminal connected to your service

### Step 2: Run Database Commands

Once the terminal opens, run these commands **one by one**:

```bash
# Step 1: Upgrade database (create tables)
flask db upgrade

# Step 2: Seed database with initial data (admin user, etc.)
python seed_data.py
```

### Step 3: Verify

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, initial migration
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
```

And for seed data:
```
Database seeded successfully!
Admin user created: admin
```

---

## Method 2: Using Railway CLI (Alternative)

### Step 1: Install Railway CLI

**On Windows (PowerShell):**
```powershell
npm install -g @railway/cli
```

**On Mac/Linux:**
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authorize Railway CLI.

### Step 3: Link to Your Project

```bash
# Navigate to your project directory (if not already there)
cd C:\Users\Admin\Desktop\Loan\backend

# Link to your Railway project
railway link
```

Select your project and service when prompted.

### Step 4: Run Database Commands

```bash
# Upgrade database
railway run flask db upgrade

# Seed database
railway run python seed_data.py
```

---

## Troubleshooting

### Issue: "flask: command not found"

**Solution:** Make sure you're in the backend service terminal and Flask is installed.

```bash
# Check if Flask is installed
pip list | grep Flask

# If not, install dependencies
pip install -r requirements.txt
```

### Issue: "No such file or directory: migrations"

**Solution:** Initialize migrations first (if not done):

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### Issue: "Can't connect to database"

**Solution:** 
1. Verify PostgreSQL service is running in Railway
2. Check that `DATABASE_URL` environment variable is set (Railway sets this automatically)
3. Verify you're running commands in the backend service, not the frontend service

### Issue: "Module not found" errors

**Solution:** Install dependencies:

```bash
pip install -r requirements.txt
```

---

## What These Commands Do

### `flask db upgrade`
- Applies all pending database migrations
- Creates all database tables (User, Loan, Profile, PendingRegistration, PendingLogin)
- Sets up the database schema

### `python seed_data.py`
- Creates default admin user (username: `admin`, password: `admin123`)
- Creates test users (optional)
- Populates initial data for testing

---

## Verify Database is Set Up

After running the commands, you can verify:

1. **Check Railway logs** for success messages
2. **Test the API:**
   - Visit: `https://your-backend-url.up.railway.app/`
   - Should show API information
3. **Try admin login:**
   - Username: `admin`
   - Password: `admin123`

---

## Quick Reference

**Railway Dashboard Method:**
1. Backend Service → Connect tab → Connect
2. Run: `flask db upgrade`
3. Run: `python seed_data.py`

**Railway CLI Method:**
1. Install: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link: `railway link`
4. Run: `railway run flask db upgrade`
5. Run: `railway run python seed_data.py`

---

## Need Help?

If you encounter issues:
1. Check Railway service logs
2. Verify PostgreSQL service is running
3. Check environment variables are set correctly
4. Make sure you're in the backend service (not frontend)

