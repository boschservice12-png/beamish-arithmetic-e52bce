-- Biztonsági szigorítás 2 (2026-10-03) — szerepkör-alapú hozzáférés, Supabase Advisor alapján.
-- ALKALMAZVA a Supabase-en: security_2_role_based_access_20261003. Próbafuttatás szerepenként visszagörgetett tranzakcióban.
-- Eredmény: Supabase Advisor 17 ERROR → 0, 44 search_path WARN → 0.
-- Elv: a pénzügyi adat csak az irodáé (owner, admin, recepció); HR- és termelési táblák a belső stábé
-- (owner, admin, recepció, hr). A szerelők a PIN-es telefonos appot használják (token-alapú függvények),
-- ezért a táblákhoz közvetlen jog nem kell nekik. Felhasználási térkép: repó + RPW-csomag + pg_stat_statements.

-- 0) segédfüggvény: belső stáb
create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path = public, pg_temp
  as $$ select auth_role() in ('owner', 'admin', 'reception', 'hr') $$;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- 1) pénzügyi táblák: olvasni és írni csak az iroda; a havi jelentést közvetlenül csak owner/admin írja
--    (az ASM-import SECURITY DEFINER függvényen át ír, arra ez nem vonatkozik)
do $$
declare t text; p record;
begin
  foreach t in array array['finance_factura_furnizor', 'finance_furnizor_tipus', 'finance_kolt_tipus', 'asm_manopera_sor_regi_20261003'] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t and coalesce(qual, 'true') = 'true' loop
      execute format('alter policy %I on public.%I to authenticated using (is_office()) with check (is_office())', p.policyname, t);
    end loop;
  end loop;
end $$;

alter policy fhs_auth on public.finance_havi_snapshot to authenticated
  using (auth_role() in ('owner', 'admin')) with check (auth_role() in ('owner', 'admin'));
create policy fhs_iroda_olvas on public.finance_havi_snapshot for select to authenticated using (is_office());

alter policy ftv_read on public.finance_terv_havi to authenticated using (is_office());

-- 2) HR- és termelési táblák: a belső stáb (szerelő-fiók nélkül)
do $$
declare t text; p record;
begin
  foreach t in array array['hr_betanulasi_lap', 'hr_betanulasi_naplo', 'hr_csataterv', 'hr_heti_gyules', 'hr_munkaposzt',
                           'hr_munkaposzt_szemely', 'hr_poszt_aramlas', 'hr_poszt_betoltes', 'hr_tmj', 'hr_verif_lista',
                           'hr_verif_naplo', 'prod_photo', 'prod_task', 'prod_time_entry'] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t and cmd = 'ALL' and coalesce(qual, 'true') = 'true' loop
      execute format('alter policy %I on public.%I to authenticated using (is_staff()) with check (is_staff())', p.policyname, t);
    end loop;
  end loop;
end $$;

-- 3) nézetek: a hívó jogaival fussanak (security_invoker); amit egy alkalmazás sem használ, azt az API nem látja
do $$
declare v text;
begin
  foreach v in array array['v_kolt_havi', 'v_asm_napi_szerelo', 'v_cel_audit', 'v_nc_iranyelv_nelkul', 'v_betanulas_haladas',
                           'v_tabla_logika', 'v_prod_zi_abatere', 'v_prod_zi_incarcare', 'v_prod_zi_kontroll', 'v_nota_echilibru',
                           'v_balanta_lunar', 'v_cheltuieli_lunar', 'v_venituri_lunar', 'v_rezultat_lunar'] loop
    execute format('alter view public.%I set (security_invoker = on)', v);
    execute format('revoke all on public.%I from anon, authenticated', v);
  end loop;
  foreach v in array array['v_eredmeny_havi', 'v_termeles_utolso_ho', 'v_verif_ma'] loop
    execute format('alter view public.%I set (security_invoker = on)', v);
  end loop;
end $$;

-- 4) alkalmazás által nem hívott függvények: nem hívhatók az API-ból (a trigger ettől továbbra is fut)
revoke execute on function public.f_feladat_uj_szam() from public, anon, authenticated;
revoke execute on function public.intake_sheets_before() from public, anon, authenticated;

-- 5) rögzített search_path minden érintett függvényen (az API-szerepek eddigi tényleges útvonala + a saját séma)
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, n.nspname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'core', 'fin', 'kpi', 'legacy', 'audit')
       and p.prokind = 'f'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
       and pg_get_userbyid(p.proowner) = 'postgres'
  loop
    execute format('alter function %s set search_path = %s', f.sig,
      case when f.nspname = 'public' then 'public, extensions, pg_temp' else 'public, extensions, ' || quote_ident(f.nspname) || ', pg_temp' end);
  end loop;
end $$;
