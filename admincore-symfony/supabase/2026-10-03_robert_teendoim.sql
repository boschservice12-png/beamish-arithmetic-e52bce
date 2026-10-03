-- redassistance-v2 · 2026-10-03 · LEFUTTATVA
-- Szkaliczki Robert iroda-hozzáférést kap a Teendőim apphoz (Ferenc döntése).
--   szerep: workshop (a legszűkebb, mint David) — hr/owner jogokhoz: update tel_kuldo set szerep='hr' where nev='Robert';
--   belépés: név + PIN (induló 1234, első belépéskor kötelező saját PIN)
--   iroda-kulcs: nincs — a kötelező kulcs_hash egy senki által nem ismert véletlen érték lenyomata
-- Ellenőrizve (visszagörgetett tranzakcióban): f_tf_irodasok listázza, f_pin_login → f_tf_ki → Robert / workshop.
insert into public.tel_kuldo (nev, employee_id, kulcs_hash, aktiv, szerep)
select 'Robert', e.id, encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), true, 'workshop'
from public.employees e
where e.name = 'Szkaliczki Robert' and e.deleted_at is null
  and not exists (select 1 from public.tel_kuldo k where k.employee_id = e.id);
-- Visszavonás: update public.tel_kuldo set aktiv = false where nev = 'Robert';
