-- Add image_url and category to bookings to store rental details
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS category TEXT;
