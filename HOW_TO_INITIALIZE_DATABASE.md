# How to Initialize Database on Railway - Step by Step

## 🎯 Quick Answer

You need to open a terminal in Railway and run two commands. Here's how:

---

## Method 1: Using Railway Dashboard (Recommended) ✅

### Step 1: Open Your Railway Project

1. Go to https://railway.app
2. Sign in with your GitHub account
3. Click on your project (loan-management-system)

### Step 2: Open Backend Service Terminal

1. **Find your backend service** in the project dashboard
   - It should be the service that deployed from GitHub
   - Usually named after your repo or "web"

2. **Click on the backend service** to open its settings

3. **Look for "Connect" or "Terminal" tab**
   - It might be in the top menu
   - Or in the left sidebar
   - Or look for a button that says "Connect" or "Terminal"

4. **Click "Connect" or "Open Terminal"**
   - This opens a web-based terminal
   - You'll see a command prompt like: `$`

### Step 3: Run Database Commands

In the terminal, type these commands **one at a time** and press Enter:

```bash
flask db upgrade
```

Wait for it to finish (you'll see messages like "Running upgrade"), then run:

```bash
python seed_data.py
```

Wait for it to finish (you'll see "Database seeded successfully!").

### Step 4: Verify

You should see output like:
```
✅ Running upgrade -> xxxx, initial migration
✅ Database seeded successfully!
✅ Admin user created: admin
```

---

## Method 2: Using Railway CLI (Alternative)

If you can't find the terminal in the dashboard, use Railway CLI:

### Step 1: Install Railway CLI

Open PowerShell on your computer and run:

```powershell
npm install -g @railway/cli
```

### Step 2: Login to Railway

```powershell
railway login
```

This opens your browser - click "Authorize" to allow Railway CLI access.

### Step 3: Navigate to Backend Directory

```powershell
cd C:\Users\Admin\Desktop\Loan\backend
```

### Step 4: Link to Railway Project

```powershell
railway link
```

Select your project and service when prompted.

### Step 5: Run Database Commands

```powershell
railway run flask db upgrade
railway run python seed_data.py
```

---

## 📸 What to Look For in Railway Dashboard

When you're in Railway:

1. **Project Dashboard:**
   - You'll see your services (backend, frontend, database)
   - Click on the **backend service**

2. **Service Page:**
   - Look for tabs: **Variables**, **Settings**, **Deployments**, **Connect**
   - Click **"Connect"** tab
   - Or look for a **"Terminal"** button

3. **Terminal Window:**
   - A black terminal window opens
   - You can type commands here
   - Commands run in your Railway service environment

---

## 🔍 Where is the "Connect" Tab?

The "Connect" tab might be in different places:

- **Top menu bar:** Next to Variables, Settings, Deployments
- **Left sidebar:** In the service navigation
- **Deployments tab:** Look for a "Connect" button in the latest deployment
- **Service settings:** Some Railway interfaces have it in Settings → Connect

If you can't find it:
1. Check Railway's documentation: https://docs.railway.app
2. Use Railway CLI instead (Method 2)
3. Contact Railway support

---

## ✅ Success Indicators

After running the commands, you should see:

### For `flask db upgrade`:
```
INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, Initial migration
```

### For `python seed_data.py`:
```
Created admin user: admin / admin123
Created user: john_doe / password123
Created user: jane_smith / password123
Database seeded successfully!

Test Accounts:
Admin: admin / admin123
User 1: john_doe / password123
User 2: jane_smith / password123
```

---

## 🆘 Troubleshooting

### "flask: command not found"

**Solution:**
```bash
pip install -r requirements.txt
```

### "No such file or directory: migrations"

**Solution:** Initialize migrations first:
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### "Can't connect to database"

**Solution:**
1. Make sure PostgreSQL service is running in Railway
2. Check that `DATABASE_URL` is set (Railway sets this automatically)
3. Verify you're in the backend service, not frontend

### Terminal not opening

**Solution:** Use Railway CLI instead (Method 2)

---

## 🎯 Quick Checklist

- [ ] Opened Railway project dashboard
- [ ] Found backend service
- [ ] Opened terminal/Connect tab
- [ ] Ran `flask db upgrade` ✅
- [ ] Ran `python seed_data.py` ✅
- [ ] Saw success messages
- [ ] Verified admin user created

---

## 💡 Pro Tips

1. **Keep the terminal open** - You might need it later for debugging
2. **Check logs** - Railway shows logs in the Deployments tab
3. **Test the API** - After setup, visit your backend URL to verify it's working
4. **Change admin password** - After first login, change the default admin password!

---

## 📚 More Help

- **Railway Docs:** https://docs.railway.app/develop/cli
- **Railway Support:** https://railway.app/help
- **Full Guide:** See `RAILWAY_DATABASE_SETUP.md`

---

## 🎉 You're Done!

After running these commands, your database is initialized and you can:
- Login as admin (admin/admin123)
- Register new users
- Create loan applications
- Test all features

**Next step:** Deploy your frontend and test the full application!

