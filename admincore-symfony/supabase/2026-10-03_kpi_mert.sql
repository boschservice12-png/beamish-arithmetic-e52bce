-- Mért KPI-k (2026-10-03) — ALKALMAZVA a Supabase-en: kpi_1_measured_automatic_20261003, kpi_2_grant_select_stat_20261003
-- „A KPI-t mérni kell, nem beírni”: az ASM-import végén automatikusan fut a kért/elért számolás (f_stat_szamol).
-- Ellenőrizve (visszagörgetett tranzakcióban): owner 15 KPI + 9 szerelő, recepció 14 (bizalmas nélkül), szerelő 0, írás tiltva.

-- 1) f_stat_szamol: az iroda (owner, admin, recepció) is futtathatja — az import végén automatikusan fut.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.f_stat_szamol(date,integer)'::regprocedure);
  n := replace(d, 'auth_role() not in (''owner'',''admin'') then', 'not is_office() then');
  n := replace(n, '''f_stat_szamol: doar owner sau admin''', '''f_stat_szamol: doar biroul (owner, admin, recepție)''');
  if n = d or position('not is_office() then' in n) = 0 then raise exception 'f_stat_szamol: a jogosultsági sor nem található'; end if;
  execute n;
end $$;

-- 2) f_asm_import: az import végén a mért KPI-k (stat_ertek) is újraszámolódnak
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.f_asm_import(date,text,jsonb,jsonb,jsonb)'::regprocedure);
  n := replace(d, 'perform f_asm_rollup(v_ho);', 'perform f_asm_rollup(v_ho);' || chr(10) || '  perform f_stat_szamol(v_ho);   -- mért KPI-k (kért/elért) a havi forrásokból');
  n := replace(n, '''jelentes'', (select', '''kpi_mert'', (select count(*) from stat_ertek se where se.ho = v_ho and se.elert is not null), ''jelentes'', (select');
  if n = d or position('perform f_stat_szamol(v_ho)' in n) = 0 or position('kpi_mert' in n) = 0 then raise exception 'f_asm_import: a beillesztési pont nem található'; end if;
  execute n;
end $$;

-- 3) Szerelőnkénti KPI (bónusz-alap): írni csak a számolófüggvény (f_asm_rollup, SECURITY DEFINER) ír; olvasni az iroda
revoke insert, update, truncate, references, trigger on public.prod_havi_szerelo from authenticated;
revoke all on public.prod_havi_szerelo from anon;
alter policy phs_auth on public.prod_havi_szerelo to authenticated using (is_office()) with check (false);

-- 4) Mért KPI-értékek: csak az iroda látja (a bizalmas sorokat csak az owner)
alter policy se_read on public.stat_ertek to authenticated
  using (is_office() and ((auth_role() = 'owner') or not exists (select 1 from stat_def d where d.kod = stat_ertek.kod and d.bizalmas)));

-- 5) Havi KPI-nézet: kért / elért / teljesülés / lámpa
create or replace view public.v_kpi_honap with (security_invoker = on) as
select se.ho, d.kod, d.nev_hu, d.nume_ro, d.egyseg, d.irany, d.divizio, d.dept_code, ad.title_hu as osztaly,
       d.kert_modszer, d.bizalmas, d.sorrend, d.elert_forras,
       se.kert, se.elert, se.kert_megj, se.elert_megj, se.lezarva, se.szamolva,
       case when se.kert is null or se.elert is null or d.kert_modszer = 'nulla' or se.kert = 0 then null
            else round(se.elert / se.kert * 100, 1) end as teljesules_pct,
       case
         when se.elert is null then 'nincs_adat'
         when d.kert_modszer = 'nulla' then case when abs(se.elert) <= 100 then 'zold' when abs(se.elert) <= 1000 then 'sarga' else 'piros' end
         when se.kert is null or se.kert = 0 then 'nincs_cel'
         when d.irany >= 0 then case when se.elert >= se.kert then 'zold' when se.elert >= 0.85 * se.kert then 'sarga' else 'piros' end
         else case when se.elert <= se.kert then 'zold' when se.elert <= 1.10 * se.kert then 'sarga' else 'piros' end
       end as allapot
from public.stat_ertek se
join public.stat_def d on d.kod = se.kod
left join public.admin_dept ad on ad.dept_code = d.dept_code
where d.aktiv;
comment on view public.v_kpi_honap is 'Mért KPI havonta. Lámpa: növelendő ≥100% zöld, ≥85% sárga; csökkentendő ≤100% zöld, ≤110% sárga; egyeztetés (nulla) |eltérés| ≤100 lei zöld, ≤1000 sárga.';

-- 6) Szerelőnkénti havi KPI: normaóra a 140/160 órás küszöbhöz, tarifa, számlázási arány
create or replace view public.v_szerelo_kpi_honap with (security_invoker = on) as
select p.ho, p.szerelo, p.employee_id, e.name as nev, e.department as osztaly, p.termelo_poszt,
       p.ore_aaa, p.ore_eaa, p.ore_daa, p.ore_caa, p.ore_o2, p.manopera,
       case when p.ore_o2 > 0 then round(p.manopera / p.ore_o2, 0) end as tarifa,
       case when p.ore_o2 > 0 then round(p.ore_aaa / p.ore_o2, 3) end as szamlazasi_arany,
       coalesce(p.kuszob_aranyositott, 140) as kuszob,
       case when not p.termelo_poszt then 'nem_termelo'
            when p.ore_o2 >= 160 then 'zold'
            when p.ore_o2 >= coalesce(p.kuszob_aranyositott, 140) then 'sarga'
            else 'piros' end as allapot
from public.prod_havi_szerelo p
left join public.employees e on e.id = p.employee_id;
comment on view public.v_szerelo_kpi_honap is 'Szerelőnkénti havi KPI (f_asm_rollup → prod_havi_szerelo). Lámpa: ≥160 h zöld, ≥küszöb (140) sárga, alatta piros.';

revoke all on public.v_kpi_honap, public.v_szerelo_kpi_honap from anon;
grant select on public.v_kpi_honap, public.v_szerelo_kpi_honap to authenticated;

-- 7) (kpi_2) A security_invoker nézetekhez az alaptáblák olvasási joga kell; a sorokat az RLS szűri
grant select on public.stat_ertek, public.stat_def to authenticated;
revoke all on public.stat_ertek, public.stat_def from anon;
