# Getting Started with Turf Booking System

Welcome! Your turf booking system is now built and ready to use. Here's what you need to do to get it running.

## What's Been Built

Your application includes:

✅ **Complete Authentication System**
- User signup and login
- Password-based authentication via Supabase Auth
- Admin role management

✅ **Turf Booking Features**
- Browse available turfs with pricing
- Interactive calendar date picker
- Hourly time slot booking (6 AM - 10 PM)
- Real-time slot availability checking
- Booking confirmation and history

✅ **User Dashboard**
- View all personal bookings
- Cancel bookings with confirmation
- Booking details and history

✅ **Admin Dashboard**
- Add new turfs to the system
- View all user bookings
- Cancel any booking for management
- Manage turf inventory

✅ **Professional UI**
- Dark green theme (#166534)
- Responsive design (mobile-friendly)
- Toast notifications for user feedback
- shadcn/ui components
- Tailwind CSS styling

## Next Steps

### Step 1: Set Up Your Supabase Project

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. In your project settings (Settings → API), copy:
   - Project URL
   - Anon/Public API Key

### Step 2: Configure Environment Variables

1. In this project folder, create a `.env.local` file
2. Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. You can also see the example in `.env.local.example`

### Step 3: Run the Database Migration

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Open `/scripts/01_create_schema.sql` in this project
4. Copy the entire SQL content
5. Paste it into the Supabase query editor
6. Click **"Run"**

This creates all necessary tables and security policies.

### Step 4: Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Quick Test

1. **Sign up** - Create a new account
2. **Browse turfs** - Click "Browse Turfs" (there won't be any yet)
3. **Create a turf** - You need to create an admin account first:
   - Sign up with an email
   - In Supabase SQL Editor, run:
     ```sql
     UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
     ```
   - Log out and back in
   - Go to `/admin` and add a turf
4. **Book a turf** - Sign in with a regular user account and make a booking

## File Structure

```
├── app/
│   ├── api/                  # API endpoints
│   ├── admin/               # Admin dashboard
│   ├── bookings/            # Turf browsing & booking
│   ├── dashboard/           # User bookings
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   └── page.tsx             # Home page
├── components/
│   └── navbar.tsx           # Navigation
├── lib/supabase/
│   ├── client.ts            # Browser client
│   ├── server.ts            # Server client
│   └── middleware.ts        # Auth middleware
├── scripts/
│   └── 01_create_schema.sql # Database setup
├── .env.local.example       # Environment template
└── SETUP.md                 # Detailed setup guide
```

## Key Features Explained

### Authentication Flow
1. Users sign up with email/password
2. Supabase Auth manages the session
3. User profile created automatically in `users` table
4. Admin role can be assigned in Supabase

### Booking System
- Users select a turf from the list
- Pick a date (no past dates allowed)
- Choose an hourly time slot (6 AM - 10 PM)
- System checks slot availability
- Booking is confirmed and saved

### Admin Features
- Add new turfs with price per hour
- View all bookings across the system
- Cancel any booking for management
- Identified by `role = 'admin'` in database

## Database Schema

Three main tables:

**users** - User accounts
- id, email, name, role (user/admin)

**turfs** - Turf listings
- id, name, location, price_per_hour

**bookings** - User bookings
- id, user_id, turf_id, date, time_slot, status, total_price

All tables have Row Level Security (RLS) enabled for safety.

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env.local` has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Values must start with your project URL and be actual keys (not placeholders)

### "Table doesn't exist"
- Run the SQL migration from `/scripts/01_create_schema.sql` in Supabase SQL Editor
- Check the migration completed without errors

### "RLS policy violation"
- This is a security feature. It means the user doesn't have permission.
- Regular users can only see their own bookings
- Admins can see all bookings
- Make sure roles are set correctly in the `users` table

### Still need help?
- Check `SETUP.md` for more detailed instructions
- Verify all environment variables are set correctly
- Make sure the database schema is created in Supabase

## Next: Deploy to Vercel

When ready to go live:

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel settings
4. Deploy!

See `SETUP.md` → Deployment section for details.

## What's Next?

You can enhance this app by:
- Adding payment integration (Stripe)
- Email notifications for bookings
- File uploads for turf images
- Review/rating system
- Advanced availability management
- SMS notifications
- Integration with calendar systems (Google Calendar, Outlook)

The foundation is solid and ready to scale! 🚀
