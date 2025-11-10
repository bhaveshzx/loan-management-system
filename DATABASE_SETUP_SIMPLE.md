# Database Setup - Simple Steps

## 🎯 What You Need to Do

Run 2 commands in Railway's terminal to set up your database.

---

## 📝 Step-by-Step Instructions

### Step 1: Go to Railway Website
1. Open: https://railway.app
2. Sign in with GitHub
3. Click on your project

### Step 2: Find Backend Service
- You'll see a list of services (backend, frontend, database)
- **Click on the "backend" service** (or the service that says "web")

### Step 3: Open Terminal
Look for one of these:
- **"Connect"** tab (click it)
- **"Terminal"** button (click it)
- **"Shell"** option (click it)
- **"Deployments"** tab → Find latest deployment → **"Connect"** button

### Step 4: Run First Command
In the terminal, type this and press **Enter**:

```
flask db upgrade
```

**Wait for it to finish** (you'll see "Running upgrade" messages)

### Step 5: Run Second Command
Type this and press **Enter**:

```
python seed_data.py
```

**Wait for it to finish** (you'll see "Database seeded successfully!")

### Step 6: Done! ✅
Your database is now set up!

---

## 🖼️ What It Looks Like

```
Railway Dashboard
├── Your Project
    ├── Backend Service ← Click here
    │   ├── Variables tab
    │   ├── Settings tab
    │   ├── Deployments tab
    │   └── Connect tab ← Click here (opens terminal)
    ├── Frontend Service
    └── PostgreSQL Database
```

---

## 💻 Terminal Commands (Copy & Paste)

```
flask db upgrade
```

```
python seed_data.py
```

---

## ✅ Success Messages

You should see:
- ✅ "Running upgrade -> xxxx, Initial migration"
- ✅ "Database seeded successfully!"
- ✅ "Admin user created: admin"

---

## 🆘 Can't Find Terminal?

### Option 1: Use Railway CLI
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Go to backend folder
cd C:\Users\Admin\Desktop\Loan\backend

# Link to project
railway link

# Run commands
railway run flask db upgrade
railway run python seed_data.py
```

### Option 2: Check Railway Documentation
- Go to: https://docs.railway.app
- Search for: "connect to service" or "terminal"

---

## 🎯 Quick Checklist

- [ ] Opened Railway website
- [ ] Found backend service
- [ ] Opened terminal/Connect
- [ ] Ran `flask db upgrade`
- [ ] Ran `python seed_data.py`
- [ ] Saw success messages

---

## 🎉 That's It!

Your database is now ready. You can:
- Login as admin (admin/admin123)
- Register new users
- Create loans
- Test your application

---

## 📚 Need More Help?

See these files for detailed instructions:
- `HOW_TO_INITIALIZE_DATABASE.md` - Detailed step-by-step guide
- `RAILWAY_DATABASE_SETUP.md` - Technical reference

