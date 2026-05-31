# Troubleshooting Guide

## Email Rate Limit Exceeded

If you're seeing "email rate limit exceeded" error:

**Cause:** You've tried to sign up with the same email address too many times within a short period (Supabase's default is 4 attempts per hour).

**Quick Fixes:**

**Option 1: Use a Different Email (Easiest)**
- Sign up with a different email address instead
- This is the quickest way to test the app

**Option 2: Disable Rate Limiting (Development Only)**
1. Go to Supabase Dashboard → Authentication → Providers
2. Click on Email/Magic Link
3. Find "Email Rate Limiting" section
4. Set the rate limit to `0` to disable it (development only)
5. Try signing up again with the same email

**Option 3: Wait for Reset**
- Supabase resets rate limits periodically
- Wait 15-60 minutes and try with the same email again

---

## "Invalid Email" Error During Signup

If you're seeing an "invalid email" error when trying to sign up, here are the most common causes and solutions:

### 1. Missing Environment Variables (Most Common)

**Problem:** You'll see a message saying "Supabase environment variables are not configured"

**Solution:**
1. Go to your Supabase project dashboard at https://app.supabase.com
2. Click on "Settings" → "API"
3. Copy:
   - `Project URL` → goes to `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → goes to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Create a `.env.local` file in your project root with:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
5. Restart your dev server (Ctrl+C, then `pnpm dev`)

### 2. Database Schema Not Set Up

**Problem:** You get past the validation but get an error about inserting into "users" table

**Solution:**
1. Go to your Supabase SQL Editor
2. Copy and paste the entire content of `/scripts/01_create_schema.sql`
3. Click "Run" to execute the migration
4. Wait for it to complete successfully
5. Try signing up again

### 3. Email Confirmation Required

**Problem:** Signup works but you get "User already exists" or can't log in

**Solution:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. If email sending isn't configured, go to Authentication → Providers → Email
3. For development, you can:
   - Check your email for a confirmation link and click it
   - OR disable email confirmation: Authentication → Settings → Disable Confirmation (not recommended for production)

### 4. Supabase Project Not Created Yet

**Problem:** When you try to set env variables, there's nowhere to get them from

**Solution:**
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - Organization: Create or select one
   - Name: "turf-booking" or similar
   - Database Password: Create a strong password
   - Region: Choose closest to your location
4. Wait for project to initialize (2-3 minutes)
5. Go to Settings → API and copy the credentials

### 5. Incorrect Email Format

**Problem:** You're entering an email that Supabase doesn't like

**Solution:**
- Use a proper email format: `user@example.com`
- Avoid test emails like `test@test` (missing TLD)
- Make sure there are no spaces in the email
- The email must have a valid domain

### How to Debug

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any red errors with `[v0]` prefix
   - These will show the exact error from Supabase

2. **Check Network Requests:**
   - Go to DevTools → Network tab
   - Try to signup
   - Look for requests to `supabase.co`
   - Click on failed requests to see the response

3. **Test Your Connection:**
   - Visit `http://localhost:3000/api/debug/config`
   - It should show:
     - `supabaseUrl: ✓ Set`
     - `supabaseAnonKey: ✓ Set`
   - If either shows `✗ Missing`, your env vars aren't set

### Still Having Issues?

1. Delete `.next` folder: `rm -rf .next`
2. Restart dev server: `pnpm dev`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try in a fresh incognito window
5. Check the console logs for the exact Supabase error message

### Test Credentials

If you just want to test the app quickly:
1. Create a user with email: `test@example.com` and password: `password123`
2. After signup succeeds, go to login and use those credentials
3. Make sure email verification is disabled in your Supabase settings for testing

### Getting Help

If the above doesn't work:
1. Check the browser console for the exact error message
2. Look at the Supabase error in the Network tab
3. Post the error message from the console for more specific help
