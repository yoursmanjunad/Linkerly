# Password-Protected Links - Quick Fix Guide

## ✅ What Was Fixed

The password page was redirecting to the wrong URL. It was redirecting to the frontend (localhost:3000) instead of the backend (localhost:5000) where the short URL redirect handler lives.

## 🔧 Required Setup

### 1. Backend Environment Variable

Add this to your `backend/.env` file:

```env
FRONTEND_URL=http://localhost:3000
```

**For production:**
```env
FRONTEND_URL=https://yourdomain.com
```

### 2. Frontend Environment Variables (Already Set)

Your frontend should already have:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SHORT_BASE_URL=http://localhost:5000
```

## 🔄 How It Works Now

### Password-Protected Link Flow:

1. **User clicks short URL** (e.g., `http://localhost:5000/abc123`)
2. **Backend detects** password protection
3. **Backend redirects** to `http://localhost:3000/password?url=abc123`
4. **User enters password** on the password page
5. **Password page redirects** to `http://localhost:5000/abc123?password={enteredPassword}`
6. **Backend validates** the password
7. **If valid** → Redirects to original long URL ✅
8. **If invalid** → Redirects to `http://localhost:3000/password?url=abc123&error=invalid` ❌

## ✨ Testing

### Create a Password-Protected Link:
1. Go to URLs page
2. Create a new short URL
3. Enable "Password Protection"
4. Set a password (e.g., "test123")
5. Save the URL

### Test the Flow:
1. Copy the short URL
2. Open it in a new incognito/private window
3. You should see the password entry page
4. Try wrong password → Should show error
5. Try correct password → Should redirect to destination

## 🐛 Troubleshooting

### Issue: "Cannot find frontend page"
- **Fix:** Make sure `FRONTEND_URL` is set in backend `.env`
- **Fix:** Restart backend server after adding the variable

### Issue: "Password page not loading"
- **Fix:** Make sure `/password` route exists in frontend
- **Fix:** Check browser console for errors

### Issue: "Infinite redirect loop"
- **Fix:** Check that `NEXT_PUBLIC_SHORT_BASE_URL` points to backend (port 5000)
- **Fix:** Verify backend redirect controller is using `FRONTEND_URL` correctly

## 📁 Files Modified

1. ✅ `frontend/src/app/password/page.tsx` - Password entry page
2. ✅ `frontend/src/app/expired/page.tsx` - Expired link page
3. ✅ `backend/controllers/redirect.controllers.js` - Redirect logic

All set! 🎉
