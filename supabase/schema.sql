-- Run in Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),          -- unguessable link id
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_unit text not null,
  guest_email text,
  guest_name text,
  personal_id text check (personal_id is null or personal_id ~ '^[0-9]{11}$'),
  phone text,
  check_in date,
  check_out date,
  amount numeric(10,2) not null default 0,
  doc_front_path text,
  doc_back_path text,
  signature_path text,
  pdf_agreement_url text,
  invoice_pdf_url text,
  status text not null default 'awaiting_guest'
    check (status in ('awaiting_guest','pending_approval','verified','rejected')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

alter table public.verifications enable row level security;

-- Owners: full access to their own rows only. Anonymous/spoofed clients get nothing.
drop policy if exists owner_all on public.verifications;
create policy owner_all on public.verifications
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Guests (anon) have NO table policy. They use two narrow SECURITY DEFINER functions
-- that only work with the exact unguessable id.
create or replace function public.get_verification(p_id uuid)
returns table (id uuid, property_unit text, status text, check_in date, check_out date)
language sql security definer set search_path = public as $$
  select v.id, v.property_unit, v.status, v.check_in, v.check_out
  from public.verifications v where v.id = p_id;
$$;

create or replace function public.submit_verification(
  p_id uuid, p_name text, p_pid text, p_phone text, p_in date, p_out date,
  p_front text, p_back text, p_sig text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.verifications set
    guest_name = p_name, personal_id = p_pid, phone = p_phone,
    check_in = p_in, check_out = p_out,
    doc_front_path = p_front, doc_back_path = p_back, signature_path = p_sig,
    status = 'pending_approval', submitted_at = now()
  where id = p_id and status = 'awaiting_guest';
  if not found then raise exception 'Verification not available'; end if;
end $$;

grant execute on function public.get_verification(uuid) to anon, authenticated;
grant execute on function public.submit_verification(uuid,text,text,text,date,date,text,text,text) to anon, authenticated;

-- Storage: private bucket, insert-only for anon, folder = verification id.
insert into storage.buckets (id, name, public) values ('verification-docs','verification-docs', false)
on conflict (id) do update set public = false;

create or replace function public.can_guest_upload(folder text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.verifications v
                 where v.id::text = folder and v.status = 'awaiting_guest');
$$;
create or replace function public.owns_verification(folder text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.verifications v
                 where v.id::text = folder and v.owner_id = auth.uid());
$$;
grant execute on function public.can_guest_upload(text) to anon, authenticated;
grant execute on function public.owns_verification(text) to authenticated;

drop policy if exists guest_insert_docs on storage.objects;
create policy guest_insert_docs on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'verification-docs' and public.can_guest_upload((storage.foldername(name))[1]));

drop policy if exists owner_read_docs on storage.objects;
create policy owner_read_docs on storage.objects
  for select to authenticated
  using (bucket_id = 'verification-docs' and public.owns_verification((storage.foldername(name))[1]));
-- No anon select/update/delete policies exist => insert-only for guests.
-- Tip: Auth > Providers > Email: disable "Confirm email" so sign-up creates a session immediately.
