-- Supabase-szerű próbaadatbázis a mentés / visszaállítás automatikus teszteléséhez (CI és helyi próba).
-- Szándékosan tartalmazza azt, ami egy naiv dump/restore-on elbukik: Supabase-szerepkörök, RLS, auth-hivatkozás,
-- generált oszlop, security_invoker nézet, bővítmény az extensions sémában, kizárandó kezelt sémák.
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create role supabase_admin nologin; create role supabase_auth_admin nologin;
create schema extensions; create extension pgcrypto schema extensions; create extension "uuid-ossp" schema extensions;
create schema auth authorization supabase_auth_admin;
create table auth.users (id uuid primary key default extensions.gen_random_uuid(), email text unique, encrypted_password text, created_at timestamptz default now());
create table auth.identities (id uuid primary key default extensions.uuid_generate_v4(), user_id uuid references auth.users(id), provider text);
alter table auth.users owner to supabase_auth_admin; alter table auth.identities owner to supabase_auth_admin;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema realtime; create table realtime.messages (id bigserial primary key, payload text);   -- kezelt séma: NEM kerül a mentésbe
create schema vault; create table vault.secrets (id int primary key, secret text);                   -- kezelt séma: NEM kerül a mentésbe

create table public.profiles (id uuid primary key references auth.users(id), role text not null, full_name text);
alter table public.profiles enable row level security;
create policy own on public.profiles for select to authenticated using (id = auth.uid());
grant select on public.profiles to authenticated;
create table public.employees (id text primary key, name text, department text);
create schema fin;
create table fin.finance_havi_snapshot (ho date primary key, bevetel numeric, koltseg numeric,
  fedezet numeric generated always as (bevetel - koltseg) stored);
create table fin.asm_manopera_tetel (id bigserial primary key, ho date references fin.finance_havi_snapshot(ho), asm_nev text, norma_ora numeric, adat jsonb);
create view fin.v_havi with (security_invoker = on) as select ho, fedezet from fin.finance_havi_snapshot;
grant select on fin.v_havi to authenticated;
create table public.ures_tabla (id int);   -- üres tábla is szerepeljen a manifestben (0 sor)

insert into auth.users (email, encrypted_password) select 'u' || g || '@szerviz.ro', extensions.crypt('x', extensions.gen_salt('bf', 4)) from generate_series(1, 6) g;
insert into auth.identities (user_id, provider) select id, 'email' from auth.users;
insert into public.profiles select id, case when email like 'u1@%' then 'owner' else 'reception' end, email from auth.users;
insert into public.employees select 'e' || g, 'Dolgozó ' || g || ' — ăâîșț', 'Mecanica' from generate_series(1, 25) g;
insert into fin.finance_havi_snapshot select d::date, 100000 + random() * 1000, 60000 from generate_series('2025-01-01'::date, '2026-09-01', '1 month') d;
insert into fin.asm_manopera_tetel (ho, asm_nev, norma_ora, adat)
  select '2026-03-01', 'SZERELO ' || (g % 9), (g % 7) * 0.5, jsonb_build_object('deviz', 'AAA' || g, 'megj', E'tab\there "idéző"')
  from generate_series(1, 5000) g;
insert into realtime.messages (payload) values ('x'); insert into vault.secrets values (1, 'titok');
