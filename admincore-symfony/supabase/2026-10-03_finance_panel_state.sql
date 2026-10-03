-- redassistance-v2 · 2026-10-03 · LEFUTTATVA (migration: finance_panel_state_20261003)
-- Pénzügyi panel állapota, verziózva (append-only). Hozzáférés: iroda = is_office() (owner, admin, reception).
-- Ellenőrizve (visszagörgetett tranzakcióban): recepció ír+olvas; más nevében írni, módosítani, törölni nem lehet;
-- szerelő, hr, anon nem lát.
create table if not exists public.finance_panel_state (
  id              bigserial primary key,
  shop_id         uuid not null default '00000000-0000-0000-0000-000000000001',
  data            jsonb not null,
  saved_by        uuid not null default auth.uid(),
  saved_by_name   text,
  client_saved_at timestamptz,
  saved_at        timestamptz not null default now()
);
create index if not exists finance_panel_state_shop_id_desc on public.finance_panel_state (shop_id, id desc);
alter table public.finance_panel_state enable row level security;
revoke all on public.finance_panel_state from anon, authenticated;
grant select, insert on public.finance_panel_state to authenticated;
grant usage on sequence public.finance_panel_state_id_seq to authenticated;
create policy fps_iroda_olvas on public.finance_panel_state for select to authenticated using (is_office());
create policy fps_iroda_ir    on public.finance_panel_state for insert to authenticated with check (is_office() and saved_by = auth.uid());
-- Visszaállítás egy korábbi verzióra: a kívánt sor data-ját új sorként kell beszúrni (az előzmény megmarad).
