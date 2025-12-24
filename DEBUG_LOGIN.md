# Debugging Admin Login

## Steps to Debug

1. **Open Browser Console** (F12 → Console tab)
2. **Go to** http://localhost:3000/admin/login
3. **Try logging in** with:
   - Email: `admin2@example.com`
   - Password: `admin123`
4. **Check Console** for:
   - "Login response:" - Should show user and session data
   - "Setting session..." - Should appear
   - "Session set successfully" - Should appear
   - Any errors

## Common Issues

### Issue: "Login failed" or Network Error
- **Check**: Browser Network tab → Look for `/api/auth/login` request
- **Fix**: Verify backend is running: `docker ps | grep backend`
- **Fix**: Check CORS: Backend should allow `http://localhost:3000`

### Issue: "Failed to set session"
- **Check**: Console for session error details
- **Fix**: Verify Supabase URL is correct: `http://localhost:8000`
- **Fix**: Check cookies are enabled in browser

### Issue: Redirects but shows login page again
- **Check**: Application tab → Cookies → Look for Supabase auth cookies
- **Fix**: Clear cookies and try again
- **Fix**: Check middleware isn't blocking the session

### Issue: No response when clicking Login
- **Check**: Browser Console for JavaScript errors
- **Check**: Network tab to see if request is being sent
- **Fix**: Verify `NEXT_PUBLIC_API_URL` is set correctly

## Manual Test

Run this in browser console on login page:

```javascript
fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email:'admin2@example.com', password:'admin123'})
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

This will show if:
- Backend is reachable
- Login works
- What response you get

## Verify Session

After login, run this in browser console:

```javascript
const { createClient } = await import('/src/lib/supabase/client.ts');
const supabase = createClient();
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, error);
```

This will show if the session is set correctly.

