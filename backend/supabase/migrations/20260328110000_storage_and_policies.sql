
-- Create storage bucket for services if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('services', 'services', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies for services bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'services');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'services' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id = 'services' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'services' AND auth.role() = 'authenticated');

-- Fix bookings policies (Allow public insertion for clients)
DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- Ensure update_updated_at_column exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update customer totals based on bookings
CREATE OR REPLACE FUNCTION public.sync_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
    customer_id_found UUID;
BEGIN
    -- Try to find existing customer by phone or create new one
    SELECT id INTO customer_id_found FROM public.customers WHERE phone = COALESCE(NEW.phone, OLD.phone) LIMIT 1;
    
    IF customer_id_found IS NULL AND TG_OP = 'INSERT' THEN
        INSERT INTO public.customers (name, phone)
        VALUES (NEW.name, NEW.phone)
        RETURNING id INTO customer_id_found;
    END IF;

    IF customer_id_found IS NOT NULL THEN
        UPDATE public.customers
        SET total_visits = (SELECT count(*) FROM public.bookings WHERE (phone = customers.phone AND status = 'Confirmed')),
            total_spent = (SELECT COALESCE(sum(amount), 0) FROM public.bookings WHERE (phone = customers.phone AND status = 'Confirmed'))
        WHERE id = customer_id_found;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_sync_customer_stats ON public.bookings;
CREATE TRIGGER trigger_sync_customer_stats
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION sync_customer_stats();
