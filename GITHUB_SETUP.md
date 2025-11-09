# GitHub Setup Guide for Railway Deployment

Follow these steps to push your code to GitHub so you can deploy to Railway.

## Step 1: Create GitHub Repository

1. Go to https://github.com
2. Sign in (or create an account)
3. Click the **"+"** icon in the top right → **"New repository"**
4. Repository name: `loan-management-system` (or any name you prefer)
5. Description: "Loan Management System with Flask and React"
6. Choose **Public** or **Private**
7. **DO NOT** initialize with README, .gitignore, or license (you already have these)
8. Click **"Create repository"**

## Step 2: Add Remote and Push

After creating the repository, GitHub will show you commands. Use these commands:

### Option A: If your repository URL is `https://github.com/yourusername/loan-management-system.git`

```powershell
# Add remote repository
git remote add origin https://github.com/yourusername/loan-management-system.git

# Rename branch to main (optional, Railway works with master too)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Option B: If you want to keep the master branch

```powershell
# Add remote repository
git remote add origin https://github.com/yourusername/loan-management-system.git

# Push to GitHub (master branch)
git push -u origin master
```

## Step 3: Verify Push

1. Go to your GitHub repository page
2. You should see all your files there
3. Verify that files like `backend/app.py`, `frontend/package.json`, etc. are visible

## Step 4: Deploy to Railway

Now you can proceed with Railway deployment:

1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository
6. Follow the instructions in `RAILWAY_QUICK_START.md`

## Troubleshooting

### Authentication Issues

If you get authentication errors when pushing:

**Option 1: Use GitHub Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` permissions
3. Use token as password when pushing

**Option 2: Use SSH (Recommended)**
```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add SSH key to GitHub
# Copy the public key: cat ~/.ssh/id_ed25519.pub
# Add it to GitHub → Settings → SSH and GPG keys

# Change remote to SSH
git remote set-url origin git@github.com:yourusername/loan-management-system.git

# Push
git push -u origin master
```

### Branch Name Issues

If you prefer to use `main` instead of `master`:
```powershell
git branch -M main
git push -u origin main
```

Railway works with both `master` and `main` branches.

## Next Steps

After pushing to GitHub:
1. ✅ Verify code is on GitHub
2. ✅ Go to Railway and connect your repository
3. ✅ Follow `RAILWAY_QUICK_START.md` for deployment
4. ✅ Set up environment variables
5. ✅ Deploy!

---

**Need help?** Check Railway documentation or GitHub documentation.

