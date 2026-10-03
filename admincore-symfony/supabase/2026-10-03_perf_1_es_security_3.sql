-- ALKALMAZVA a Supabase-en (2026-10-03): perf_1_initplan_fk_indexes_dblink_20261003, security_3_prod_zi_staff_only_20261003
-- Eredmény: unindexed_foreign_keys 150 → 0, auth_rls_initplan 2 → 0, extension_in_public 1 → 0.
-- (Próbafuttatás visszagörgetett tranzakcióban: 150 index; a legacy.import_pxyp a search_path-on át továbbra is eléri a dblinket.)

-- perf_1: az auth.uid() soronként helyett egyszer értékelődjön ki
alter policy profiles_self on public.profiles using (id = (select auth.uid()));
alter policy fps_iroda_ir on public.finance_panel_state with check (is_office() and saved_by = (select auth.uid()));
-- perf_1: a dblink bővítmény a public helyett az extensions sémába
alter extension dblink set schema extensions;
-- perf_1: index minden indexeletlen idegen kulcsra (az alkalmazás sémáiban)
do $$
declare r record; cols text; nm text;
begin
  for r in
    select c.oid, c.conrelid, c.conkey, cl.relname, ns.nspname
      from pg_constraint c join pg_class cl on cl.oid = c.conrelid join pg_namespace ns on ns.oid = cl.relnamespace
     where c.contype = 'f' and ns.nspname in ('public','core','fin','kpi','legacy','audit','admin_core','backup')
       and not exists (select 1 from pg_index i where i.indrelid = c.conrelid
                        and (i.indkey::int2[])[0:array_length(c.conkey,1)-1] @> c.conkey and (i.indkey::int2[])[0:array_length(c.conkey,1)-1] <@ c.conkey)
  loop
    select string_agg(quote_ident(a.attname), ', ' order by k.ord), string_agg(a.attname, '_' order by k.ord)
      into cols, nm
      from unnest(r.conkey) with ordinality k(attnum, ord) join pg_attribute a on a.attrelid = r.conrelid and a.attnum = k.attnum;
    execute format('create index if not exists %I on %I.%I (%s)', left('ix_' || r.relname || '_' || nm, 63), r.nspname, r.relname, cols);
  end loop;
end $$;

-- security_3: napi műhelybeosztás (ügyfélnév, rendszám) csak a belső stábnak; írni az iroda
alter policy prod_zi_lucrare_read on public.prod_zi_lucrare to authenticated using (is_staff());
alter policy prod_zi_post_read on public.prod_zi_post to authenticated using (is_staff());
alter policy prod_zi_lucrare_write on public.prod_zi_lucrare to authenticated using (is_office()) with check (is_office());
alter policy prod_zi_post_write on public.prod_zi_post to authenticated using (is_office()) with check (is_office());
