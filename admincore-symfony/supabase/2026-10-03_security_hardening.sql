-- =====================================================================
-- RedAssistance — redassistance-v2 (zwsjfzqtskicrukidaog)
-- Biztonsági javítás · 2026-10-03 · ELŐKÉSZÍTVE, MÉG NINCS LEFUTTATVA
--
-- Miért: a publishable kulcs nyilvános (minden HTML-ben benne van), így bárki
-- közvetlenül hívhatja a Supabase-t a Symfony-kapu megkerülésével. Az alábbi
-- SECURITY DEFINER függvények ma bejelentkezés nélkül (anon) is futnak:
--   f_gazdasagi_jelentes_utolso  → havi bevétel, fedezet, szerelőszám (pénzügyi adat)
--   f_iranyelv_uj                → új irányelv írása a hr_documents táblába
--   f_verif_generalas            → verifikációs tételek generálása
--   f_heti_gyules_elokeszites    → heti gyűlés adatai
--   f_kalap                      → munkaposzt-kalap (belső dokumentáció)
-- és f_set_pin bármely bejelentkezett felhasználónak (szerelőnek is) engedi
-- BÁRMELY szerelő PIN-jének átírását → a szerelő-telefon fiókjai átvehetők.
--
-- NEM érintett: f_szerelok — a szerelő-telefon a bejelentkezés ELŐTT ezzel
-- listázza a neveket, ezért anon számára nyitva marad.
--
-- Futtatás előtt ellenőrizd: van-e más app (pl. finance-dashboard.html,
-- panou-operational.html), amely bejelentkezés NÉLKÜL hívja a fenti függvényeket.
-- =====================================================================
begin;

-- 1) Bejelentkezés nélküli hívás tiltása (a bejelentkezett felhasználóknál nincs változás)
revoke execute on function public.f_gazdasagi_jelentes_utolso()                 from public, anon;
revoke execute on function public.f_iranyelv_uj(text, text[], text, text, text, text, uuid, text, text) from public, anon;
revoke execute on function public.f_verif_generalas(date)                       from public, anon;
revoke execute on function public.f_heti_gyules_elokeszites(date)               from public, anon;
revoke execute on function public.f_kalap(text)                                 from public, anon;

grant execute on function public.f_gazdasagi_jelentes_utolso()                  to authenticated;
grant execute on function public.f_iranyelv_uj(text, text[], text, text, text, text, uuid, text, text) to authenticated;
grant execute on function public.f_verif_generalas(date)                        to authenticated;
grant execute on function public.f_heti_gyules_elokeszites(date)                to authenticated;
grant execute on function public.f_kalap(text)                                  to authenticated;

-- 2) PIN beállítása csak owner/admin szerepkörrel (az AdminCore "Szerelő PIN" modulja is ezt feltételezi)
create or replace function public.f_set_pin(p_emp uuid, p_pin text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
begin
  if coalesce(auth_role(), '') not in ('owner', 'admin') then
    raise exception 'forbidden: PIN-t csak owner/admin állíthat' using errcode = '42501';
  end if;
  update employees set pin_hash = crypt(p_pin, gen_salt('bf')) where id = p_emp;
end
$function$;
revoke execute on function public.f_set_pin(uuid, text) from public, anon;
grant  execute on function public.f_set_pin(uuid, text) to authenticated;

commit;

-- ---------------------------------------------------------------------
-- VISSZAÁLLÍTÁS (ha valami eltörik):
-- begin;
-- grant execute on function public.f_gazdasagi_jelentes_utolso() to anon;
-- grant execute on function public.f_iranyelv_uj(text, text[], text, text, text, text, uuid, text, text) to anon;
-- grant execute on function public.f_verif_generalas(date) to anon;
-- grant execute on function public.f_heti_gyules_elokeszites(date) to anon;
-- grant execute on function public.f_kalap(text) to anon;
-- create or replace function public.f_set_pin(p_emp uuid, p_pin text) returns void language sql
--   security definer set search_path to 'public', 'extensions'
--   as $f$ update employees set pin_hash = crypt(p_pin, gen_salt('bf')) where id = p_emp; $f$;
-- commit;
-- ---------------------------------------------------------------------
