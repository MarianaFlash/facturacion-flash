-- Migration: enable invoice PDF upload + repository access
-- Run this in Supabase SQL Editor once.

-- 1. Columns to store the uploaded invoice
alter table public.solicitudes
  add column if not exists factura_url text,
  add column if not exists factura_path text;

-- 2. Storage bucket for invoice PDFs (public read so the app can preview them)
insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', true)
on conflict (id) do nothing;

-- 3. Storage policies: anyone with anon key can upload / read / replace invoices
--    (tighten later with auth if you add login)
drop policy if exists "facturas_public_read" on storage.objects;
create policy "facturas_public_read"
  on storage.objects for select
  using (bucket_id = 'facturas');

drop policy if exists "facturas_anon_insert" on storage.objects;
create policy "facturas_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'facturas');

drop policy if exists "facturas_anon_update" on storage.objects;
create policy "facturas_anon_update"
  on storage.objects for update
  using (bucket_id = 'facturas');
