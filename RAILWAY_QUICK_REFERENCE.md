# Railway Deployment - Quick Reference

## 🚀 Your Repository
**GitHub:** https://github.com/bhaveshzx/loan-management-system

---

## ⚡ Quick Deployment Steps

### 1. Create Railway Project
- Go to: https://railway.app
- Sign in with GitHub
- New Project → Deploy from GitHub repo
- Select: `bhaveshzx/loan-management-system`

### 2. Add PostgreSQL Database
- Click "+ New" → Database → Add PostgreSQL
- ✅ `DATABASE_URL` is auto-set

### 3. Configure Backend Service
- **Root Directory:** `backend`
- **Start Command:** `gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 app:app`

**Environment Variables:**
```env
SECRET_KEY=gEtOquLs5hHX0rcCH6JlJICopeLFmagYkD1hX10vqx8
JWT_SECRET_KEY=0PbS4EKJviGujIERq8lXFoGvk-IpktdEgmV_TP7u088
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
FLASK_ENV=production
CORS_ORIGINS=https://your-frontend-url.up.railway.app
DATABASE_URL=auto-set-by-railway
```

### 4. Initialize Database
In Railway terminal:
```bash
flask db upgrade
python seed_data.py
```

### 5. Deploy Frontend Service
- Click "+ New" → GitHub Repo → Select your repo
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npx serve -s build -l $PORT`

**Environment Variables:**
```env
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```

### 6. Update CORS
- Backend → Variables → Add `CORS_ORIGINS` with frontend URL

---

## 🔑 Generated Secret Keys

**SECRET_KEY:**
```
gEtOquLs5hHX0rcCH6JlJICopeLFmagYkD1hX10vqx8
```

**JWT_SECRET_KEY:**
```
0PbS4EKJviGujIERq8lXFoGvk-IpktdEgmV_TP7u088
```

---

## 📧 Gmail App Password Setup

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `MAIL_PASSWORD`

---

## 👤 Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`
- ⚠️ **Change immediately after deployment!**

---

## 🔍 Verify Deployment

1. **Backend Health:** Visit `https://your-backend-url.up.railway.app/`
2. **Frontend:** Visit your frontend URL
3. **Test:** Register user, login, create loan

---

## 📚 Full Documentation

See `RAILWAY_DEPLOYMENT_STEPS.md` for detailed instructions.

---

## 🆘 Common Issues

### Backend won't start
- Check all environment variables are set
- Verify root directory is `backend`
- Check Railway build logs

### Database errors
- Run: `flask db upgrade`
- Verify PostgreSQL service is running

### Frontend can't connect
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings
- Verify backend is accessible

### Email not working
- Verify Gmail app password
- Check `MAIL_USERNAME` and `MAIL_PASSWORD`
- Ensure 2-Step Verification is enabled

---

## ✅ Deployment Checklist

- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Backend service configured
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Seed data loaded
- [ ] Frontend service deployed
- [ ] CORS configured
- [ ] Application tested
- [ ] Admin password changed

---

**Ready to deploy? Follow `RAILWAY_DEPLOYMENT_STEPS.md` for step-by-step instructions!** 🚀

