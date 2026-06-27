# Vi Microsystems - Production Deployment Guide

This guide will help you deploy your website to production so others can access it.

## Overview

- **Backend**: Deploy to Render (free tier)
- **Frontend**: Deploy to Netlify or Vercel (free tier)
- **Database**: SQLite on Render (persistent storage)

## Step 1: Prepare Backend for Deployment

Your backend is already prepared with:
- ✅ `.gitignore` file (excludes sensitive data)
- ✅ `.env.example` file (template for environment variables)
- ✅ `package.json` with start script
- ✅ All necessary dependencies

## Step 2: Create GitHub Repository

1. Go to https://github.com and sign in/create account
2. Click "+" → "New repository"
3. Name it: `vi-microsystems-backend`
4. Make it **Private** (recommended for security)
5. Click "Create repository"

6. Open terminal/command prompt in your backend folder:
```bash
cd "C:\Users\PADMASYSTEMS\Desktop\vi microsystems\backend"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vi-microsystems-backend.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Deploy Backend to Render

1. Go to https://render.com and sign up (free account)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select `vi-microsystems-backend` repository
5. Configure:

**Build & Deploy Settings:**
- **Name**: `vi-microsystems-backend`
- **Region**: Singapore (or nearest to your users)
- **Branch**: `main`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

6. Click "Create Web Service"

## Step 4: Configure Environment Variables on Render

After creating the service, go to your service dashboard and add these environment variables:

1. Click "Environment" tab
2. Add each variable:

**Required Variables:**
```
JWT_SECRET=your-super-secret-random-string-at-least-32-characters-long
ALLOWED_ORIGIN=https://your-frontend-url.netlify.app
PORT=3000
```

**Optional (for email notifications):**
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
NOTIFY_EMAIL=your-email@gmail.com
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not enabled
3. Search "App Passwords"
4. Create new app password
5. Copy the 16-character password

3. Click "Save Changes"
4. Click "Manual Deploy" → "Clear build cache & deploy"

## Step 5: Get Your Backend URL

After deployment completes:
1. Go to your Render service dashboard
2. Copy the URL (e.g., `https://vi-microsystems-backend.onrender.com`)
3. Test it: Visit `https://your-backend-url.onrender.com/`
4. You should see: `{"status":"ok","message":"Vi Microsystems backend is running."}`

## Step 6: Deploy Frontend to Netlify

1. Go to https://netlify.com and sign up (free account)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop your `frontend` folder into Netlify
4. Wait for deployment to complete
5. Copy your Netlify URL (e.g., `https://vi-microsystems.netlify.app`)

## Step 7: Update Frontend API URLs

Update these files in your frontend to use the production backend URL:

**File: `frontend/js/Account.js`**
```javascript
var API_BASE_URL = 'https://vi-microsystems-backend.onrender.com';
```

**File: `frontend/js/cart.js`**
```javascript
var API_BASE_URL = 'https://vi-microsystems-backend.onrender.com';
```

**File: `frontend/js/product-extras.js`**
```javascript
var VI_API_BASE_URL = 'https://vi-microsystems-backend.onrender.com';
```

Replace with your actual Render backend URL.

## Step 8: Redeploy Frontend

After updating the API URLs:
1. Go to Netlify dashboard
2. Click "Deploys"
3. Click "Trigger deploy" → "Deploy site"
4. Wait for redeployment to complete

## Step 9: Update Render ALLOWED_ORIGIN

Go back to Render:
1. Environment tab
2. Update `ALLOWED_ORIGIN` to your Netlify URL:
```
ALLOWED_ORIGIN=https://your-frontend-url.netlify.app
```
3. Save and redeploy

## Step 10: Test Production Website

1. Visit your Netlify frontend URL
2. Test user registration/login
3. Submit an enquiry
4. Check admin panel (you'll need to access `admin.html` from your deployed backend)
5. Place a test order

## Important Notes

**Database Persistence:**
- Render's free tier includes persistent disk storage
- Your SQLite database will persist between deployments
- Data is safe unless you delete the service

**Security:**
- Never commit `.env` file to GitHub
- Keep your JWT_SECRET secure
- Use strong passwords
- Consider implementing role-based admin access

**Performance:**
- Render free tier spins down after 15 minutes of inactivity
- First request may take 30-60 seconds (cold start)
- Paid tier eliminates this delay

**Monitoring:**
- Render provides logs in the dashboard
- Monitor for errors and performance issues
- Set up alerts if needed

## Troubleshooting

**Backend not starting:**
- Check Render logs for errors
- Ensure Node.js version is 22+
- Verify all dependencies are in package.json

**Frontend can't connect:**
- Verify ALLOWED_ORIGIN is set correctly
- Check CORS settings
- Ensure backend URL is correct in frontend files

**Database issues:**
- Database is created automatically on first run
- Check Render disk storage is not full
- Verify database file permissions

**Email not working:**
- Verify Gmail App Password is correct
- Check email is not blocked by spam filters
- Review Render logs for email errors

## Cost Summary

**Free Tier (Recommended for starting):**
- Render Backend: $0/month
- Netlify Frontend: $0/month
- Total: $0/month

**Paid Tier (For production):**
- Render: ~$7/month (eliminates cold starts)
- Netlify: $0/month (generous free tier)
- Total: ~$7/month

## Support

If you encounter issues:
1. Check Render logs
2. Check Netlify logs
3. Verify environment variables
4. Test API endpoints directly
5. Review this guide

Your website is now live and accessible to everyone!
