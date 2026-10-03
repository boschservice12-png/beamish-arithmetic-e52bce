-- =====================================================================
-- PIN-FÉK — UTOLSÓ LÉPÉS · redassistance-v2 · Ferenc jóváhagyta 2026-10-03
--
-- FUTTATÁS: Supabase Dashboard → redassistance-v2 → SQL Editor → New query
--           → az egész fájl bemásolása → Run
--
-- Mit csinál: 5 egymást követő hibás PIN → 15 perc zárolás; minden próbálkozás
-- a pin_login_naplo táblába kerül. A tábla, az oszlopok és az f_set_pin már élesek.
-- A végén lévő ellenőrzés 1 sort ad: pin_login_uj = true.
-- =====================================================================

create or replace function public.f_pin_login(p_emp uuid, p_pin text, p_device text default null::text)
 returns table(token uuid, employee_id uuid, name text, expires_at timestamp with time zone)
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  e record;
  v_api boolean := session_user = 'authenticator';   -- PostgREST-en át jön-e a hívás
  v_fail int;
begin
  select id, employees.name as nm, pin_hash, pin_locked_until into e
    from employees where id = p_emp and is_active and deleted_at is null
    for update;
  if e.id is null or e.pin_hash is null then
    raise exception 'Hibas PIN';
  end if;

  if e.pin_locked_until is not null and e.pin_locked_until > now() then
    insert into pin_login_naplo(employee_id, ok, zarolva, device) values (e.id, false, true, left(p_device, 120));
    if v_api then return; end if;
    raise exception 'PIN zarolva %-ig', to_char(e.pin_locked_until at time zone 'Europe/Bucharest', 'HH24:MI');
  end if;

  if e.pin_hash <> crypt(p_pin, e.pin_hash) then
    update employees
       set pin_fail_count = case when pin_fail_count + 1 >= 5 then 0 else pin_fail_count + 1 end,
           pin_locked_until = case when pin_fail_count + 1 >= 5 then now() + interval '15 minutes' else pin_locked_until end
     where id = e.id
    returning pin_fail_count into v_fail;
    insert into pin_login_naplo(employee_id, ok, zarolva, device) values (e.id, false, v_fail = 0, left(p_device, 120));
    if v_api then return; end if;            -- üres válasz: a számláló megmarad
    raise exception 'Hibas PIN';
  end if;

  update employees set pin_fail_count = 0, pin_locked_until = null where id = e.id;
  insert into pin_login_naplo(employee_id, ok, device) values (e.id, true, left(p_device, 120));
  delete from pin_login_naplo n where n.employee_id = e.id and n.at < now() - interval '180 days';
  delete from prod_session ps where ps.employee_id = e.id and ps.expires_at < now();
  return query insert into prod_session(employee_id, device) values (e.id, p_device)
    returning prod_session.token, prod_session.employee_id, e.nm, prod_session.expires_at;
end
$function$;
revoke execute on function public.f_pin_login(uuid, text, text) from public;
grant  execute on function public.f_pin_login(uuid, text, text) to anon, authenticated;

-- Ellenőrzés: true-t kell mutatnia
select position('pin_locked_until' in pg_get_functiondef('public.f_pin_login(uuid,text,text)'::regprocedure)) > 0 as pin_login_uj;

-- Visszaállítás (ha bármi gond van): a régi függvény
-- create or replace function public.f_pin_login(p_emp uuid, p_pin text, p_device text default null::text)
--  returns table(token uuid, employee_id uuid, name text, expires_at timestamp with time zone)
--  language plpgsql security definer set search_path to 'public', 'extensions'
-- as $f$
-- declare e record;
-- begin
--   select id, employees.name as nm, pin_hash into e from employees where id=p_emp and is_active and deleted_at is null;
--   if e.id is null or e.pin_hash is null or e.pin_hash <> crypt(p_pin, e.pin_hash) then raise exception 'Hibas PIN'; end if;
--   delete from prod_session ps where ps.employee_id=e.id and ps.expires_at < now();
--   return query insert into prod_session(employee_id, device) values (e.id, p_device)
--     returning prod_session.token, prod_session.employee_id, e.nm, prod_session.expires_at;
-- end $f$;
