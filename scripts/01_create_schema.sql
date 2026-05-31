-- Create users table
create table if not exists users (
  id uuid references auth.users on delete cascade,
  email text not null,
  name text,
  role text default 'user',
  created_at timestamp default now(),
  primary key (id)
);

-- Create turfs table
create table if not exists turfs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  price_per_hour numeric not null,
  peak_price_per_hour numeric default 0,
  sport text default 'football',
  image_url text,
  created_at timestamp default now()
);

-- Create bookings table
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  turf_id uuid references turfs(id) on delete cascade not null,
  date date not null,
  time_slot integer not null,
  duration integer default 1,
  status text default 'confirmed',
  total_price numeric not null,
  created_at timestamp default now(),
  unique(turf_id, date, time_slot)
);

-- Enable RLS
alter table users enable row level security;
alter table turfs enable row level security;
alter table bookings enable row level security;

-- RLS policies for users
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on users for update
  using (auth.uid() = id);

-- RLS policies for turfs (public read)
create policy "Anyone can view turfs"
  on turfs for select
  using (true);

-- RLS policies for bookings
create policy "Users can view their own bookings"
  on bookings for select
  using (auth.uid() = user_id);

create policy "Admins can view all bookings"
  on bookings for select
  using (
    exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can insert their own bookings"
  on bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bookings"
  on bookings for update
  using (auth.uid() = user_id);

create policy "Admins can update any booking"
  on bookings for update
  using (
    exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert bookings"
  on bookings for insert
  with check (
    exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    ) or auth.uid() = user_id
  );

-- Create trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
