# Turf Booking System - Setup Guide

This is a full-stack turf booking application built with Next.js, Supabase, and Tailwind CSS.

## Prerequisites

- Node.js 18+ and pnpm
- A Supabase project
- Environment variables configured

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database

You need to run the SQL migration in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Click "New Query"
4. Copy and paste the contents of `scripts/01_create_schema.sql`
5. Click "Run"

This will create:
- `users` table - for user profiles and roles
- `turfs` table - for turf listings
- `bookings` table - for user bookings
- Row Level Security (RLS) policies

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### User Features
- **Authentication**: Sign up and sign in with email/password
- **Browse Turfs**: View available turfs with pricing
- **Book Turfs**: Select date and time slot to book
- **My Bookings**: View and manage your bookings
- **Cancel Bookings**: Cancel confirmed bookings

### Admin Features
- **Manage Turfs**: Add new turfs to the system
- **View All Bookings**: See all user bookings
- **Cancel Bookings**: Cancel any booking as needed

## Project Structure

```
app/
  ├── api/                    # API routes
  │   ├── bookings/          # Booking endpoints
  │   └── turfs/             # Turf endpoints
  ├── admin/                 # Admin dashboard
  ├── bookings/              # Turf browsing & booking
  ├── dashboard/             # User bookings dashboard
  ├── login/                 # Login page
  ├── signup/                # Signup page
  ├── layout.tsx             # Root layout
  ├── page.tsx               # Home page
  └── globals.css            # Global styles
components/
  └── navbar.tsx             # Navigation component
lib/
  └── supabase/
      ├── client.ts          # Browser client
      ├── server.ts          # Server client
      └── middleware.ts      # Auth middleware
middleware.ts               # Next.js middleware
scripts/
  └── 01_create_schema.sql   # Database schema
```

## Database Schema

### users
- `id` (UUID) - Primary key, references auth.users
- `email` (TEXT) - User email
- `name` (TEXT) - User full name
- `role` (TEXT) - 'user' or 'admin'
- `created_at` (TIMESTAMP)

### turfs
- `id` (UUID) - Primary key
- `name` (TEXT) - Turf name
- `location` (TEXT) - Turf location
- `price_per_hour` (NUMERIC) - Hourly rate
- `image_url` (TEXT) - Optional image URL
- `created_at` (TIMESTAMP)

### bookings
- `id` (UUID) - Primary key
- `user_id` (UUID) - References users
- `turf_id` (UUID) - References turfs
- `date` (DATE) - Booking date
- `time_slot` (INTEGER) - Hour of day (6-22)
- `status` (TEXT) - 'confirmed' or 'cancelled'
- `total_price` (NUMERIC) - Booking cost
- `created_at` (TIMESTAMP)

## Creating an Admin User

To create an admin user:

1. Sign up normally on the app
2. Go to Supabase dashboard
3. In the SQL Editor, run:
```sql
update users set role = 'admin' where email = 'admin@example.com';
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and anon key are correct
- Ensure the database schema is set up by running the SQL migration
- Check that RLS policies are enabled

### Authentication Issues
- Clear browser cookies and try again
- Verify email confirmation is not required in Supabase Auth settings
- Check the middleware configuration in `middleware.ts`

### Booking Issues
- Ensure the turf exists in the database
- Check that the selected time slot is not already booked
- Verify user is authenticated before booking

## Technology Stack

- **Frontend**: Next.js 14+, React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui
- **Notifications**: Sonner
- **Calendar**: react-day-picker

## License

MIT
