# Pre-Deployment Checklist

Use this checklist to ensure your turf booking system is ready for production.

## ✅ Local Setup

- [ ] Clone/download the project
- [ ] Run `pnpm install` to install dependencies
- [ ] Create `.env.local` with Supabase credentials
- [ ] Verify all environment variables are set
- [ ] Run `pnpm dev` and confirm app starts

## ✅ Database Setup

- [ ] Create Supabase project
- [ ] Get Project URL and Anon Key
- [ ] Run SQL migration from `/scripts/01_create_schema.sql`
- [ ] Verify tables exist in Supabase dashboard:
  - [ ] `users` table created
  - [ ] `turfs` table created
  - [ ] `bookings` table created
- [ ] Verify RLS policies are enabled on all tables
- [ ] Test that auth trigger creates user profile

## ✅ Authentication Testing

- [ ] Sign up with new email works
- [ ] User profile created automatically
- [ ] Can log in with credentials
- [ ] Can log out successfully
- [ ] Session persists on page refresh
- [ ] Unauthenticated users redirected to login

## ✅ Feature Testing - User

- [ ] User can see home page
- [ ] User can browse turfs on `/bookings`
- [ ] User can select date (past dates disabled)
- [ ] User can select time slot
- [ ] User can confirm booking
- [ ] Booking appears in `/dashboard`
- [ ] Can cancel own bookings
- [ ] Cannot cancel cancelled bookings
- [ ] Navbar shows user email and role
- [ ] Logout works properly

## ✅ Feature Testing - Admin

- [ ] Create admin user via Supabase SQL:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
  ```
- [ ] Admin can access `/admin` dashboard
- [ ] Can add new turf with all fields
- [ ] New turf appears in turf list
- [ ] Can view all bookings
- [ ] Can cancel any booking
- [ ] Admin navbar shows "Admin Dashboard" button
- [ ] Cannot delete from regular user account

## ✅ Availability & Slot Management

- [ ] Slot shows as booked after confirming
- [ ] Cannot book same time slot twice
- [ ] Availability updates in real-time
- [ ] Time slots 6-22 (6 AM - 10 PM) shown
- [ ] Past dates disabled in calendar
- [ ] Future dates enabled in calendar

## ✅ Data Validation

- [ ] Signup requires name, email, password
- [ ] Login requires email and password
- [ ] Adding turf requires all fields
- [ ] Booking requires turf, date, time, price
- [ ] Invalid emails rejected
- [ ] Empty fields show validation errors

## ✅ UI/UX

- [ ] Page loads without errors
- [ ] Responsive on mobile (test in browser DevTools)
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Dark green theme applied consistently
- [ ] Toast notifications work (errors, success)
- [ ] Buttons are clickable and accessible
- [ ] Forms are user-friendly
- [ ] Loading states show spinners
- [ ] All text is readable

## ✅ Security

- [ ] Users can't access other user's bookings
- [ ] Users can't modify other bookings
- [ ] Regular users can't access `/admin`
- [ ] RLS prevents unauthorized data access
- [ ] Passwords not visible in browser storage
- [ ] Session cookies are secure
- [ ] API endpoints check authentication

## ✅ Performance

- [ ] Home page loads quickly
- [ ] Booking page loads quickly
- [ ] No console errors
- [ ] Images load properly
- [ ] API responses are fast
- [ ] Pagination works if many turfs/bookings

## ✅ Documentation

- [ ] README.md is clear
- [ ] GETTING_STARTED.md covers setup
- [ ] SETUP.md has detailed instructions
- [ ] All dependencies listed
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Database schema documented

## ✅ Pre-Production

- [ ] All error messages are user-friendly
- [ ] No `console.log()` debug statements
- [ ] No hardcoded credentials or secrets
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` shows template
- [ ] API keys are in environment variables
- [ ] Build completes without errors (`pnpm build`)

## ✅ Deployment to Vercel

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added in Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deployed successfully
- [ ] No build errors on Vercel
- [ ] App works on Vercel production URL
- [ ] HTTPS enabled
- [ ] Custom domain configured (if needed)

## ✅ Post-Deployment Testing

- [ ] Live app loads without errors
- [ ] Can sign up on live site
- [ ] Can book turfs on live site
- [ ] Database correctly connected
- [ ] All features work same as local
- [ ] No console errors in browser
- [ ] Mobile view works on live site

## ✅ Monitoring

- [ ] Set up error tracking (optional: Sentry)
- [ ] Monitor Supabase usage
- [ ] Check API rate limits
- [ ] Review database backups

## ✅ Optional Enhancements

- [ ] Add user reviews/ratings
- [ ] Add turf images
- [ ] Add payment integration (Stripe)
- [ ] Add email notifications
- [ ] Add SMS notifications
- [ ] Add analytics

## 🚀 Ready to Deploy!

If all items are checked, your turf booking system is ready for production!

**Last checked**: _____________
**Checked by**: _____________
**Notes**: 
```
________________________________
________________________________
________________________________
```

## Quick Troubleshooting

If something fails:

1. **Can't connect to Supabase?**
   - Check environment variables
   - Verify Supabase project is active
   - Test URL and key in Supabase dashboard

2. **Can't book turfs?**
   - Verify turfs exist in database
   - Check bookings table is created
   - Confirm RLS policies are correct

3. **Can't access admin dashboard?**
   - Verify user role is 'admin' in database
   - Check RLS policy allows admin access
   - Ensure user is logged in

4. **Build fails?**
   - Run `pnpm install` again
   - Clear `.next` folder: `rm -rf .next`
   - Check environment variables
   - Verify Node.js version

See **GETTING_STARTED.md** or **SETUP.md** for more help.
