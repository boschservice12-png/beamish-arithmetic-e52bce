-- ============================================================================================
-- FUTTATANDÓ: Supabase Dashboard → SQL Editor (a DROP POLICY miatt kézi megerősítés kell)
-- Átfedő RLS-szabályok szétbontása — Supabase Advisor: multiple_permissive_policies 63 → 0
--
-- Minden érintett táblán két engedékeny szabály van: „írás” (ALL) és „olvasás” (SELECT).
-- 2026-10-03-i ellenőrzés: az olvasási feltétel MINDENHOL bővebb az írásinál
-- (true ⊇ iroda ⊇ owner/admin ⊇ owner), így az írási szabály INSERT/UPDATE/DELETE-re bontása
-- PONTOSAN UGYANAZT a hozzáférést adja — csak gyorsabb (SELECT-nél egy szabály fut, nem kettő).
-- Őr: ha bármelyik tábla szabálya azóta megváltozott, a teljes futás megszakad, semmi nem módosul.
-- ============================================================================================
begin;
do $$
declare
  t text; w record; r record; n int := 0;
  tabs text[] := array['admin_clasificare','admin_core','admin_dept','admin_dept_loop','admin_dept_sep_exception',
    'admin_dept_separation','crai_knowledge','crai_neconformitati','employees','finance_asm_contare','finance_asm_export_map',
    'finance_cont_variabila','finance_havi_snapshot','finance_nota','finance_nota_linie','finance_plan_cont',
    'finance_schema_contare','finance_terv_havi','hr_documents','org_bonus_config','org_employee_points','org_i18n',
    'org_kpi_entries','org_point_rules','prod_zi_lucrare','prod_zi_post','stat_def'];
  -- feltételek bővülő sorrendben: az olvasás rangja >= az írás rangja kell legyen
  rang jsonb := jsonb_build_object(
    '(auth_role() = ''owner''::text)', 1,
    '(auth_role() = ANY (ARRAY[''owner''::text, ''admin''::text]))', 2,
    'is_office()', 3, 'is_staff()', 4, 'true', 5);
begin
  foreach t in array tabs loop
    select * into w from pg_policies where schemaname = 'public' and tablename = t and cmd = 'ALL' and permissive = 'PERMISSIVE';
    select * into r from pg_policies where schemaname = 'public' and tablename = t and cmd = 'SELECT' and permissive = 'PERMISSIVE';
    if w.policyname is null or r.policyname is null then raise exception 'ŐR: %: nem a várt szabálypár (azóta módosult?)', t; end if;
    if w.qual is distinct from w.with_check or (rang ->> w.qual) is null or (rang ->> r.qual) is null
       or (rang ->> r.qual)::int < (rang ->> w.qual)::int or w.roles <> r.roles then
      raise exception 'ŐR: %: az olvasás nem bővebb az írásnál (% / %) — nem bontom', t, r.qual, w.qual;
    end if;
    execute format('create policy %I on public.%I for insert to %s with check (%s)', w.policyname || '_ins', t, array_to_string(w.roles, ','), w.with_check);
    execute format('create policy %I on public.%I for update to %s using (%s) with check (%s)', w.policyname || '_upd', t, array_to_string(w.roles, ','), w.qual, w.with_check);
    execute format('create policy %I on public.%I for delete to %s using (%s)', w.policyname || '_del', t, array_to_string(w.roles, ','), w.qual);
    execute format('drop policy %I on public.%I', w.policyname, t);
    n := n + 1;
  end loop;
  raise notice 'Kész: % tábla írási szabálya szétbontva (a hozzáférés változatlan).', n;
end $$;
commit;
