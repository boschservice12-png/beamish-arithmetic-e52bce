-- redassistance-v2 · 2026-10-03 · LEFUTTATVA (Ferenc jóváhagyásával)
-- Ferenc (owner) iroda-kulcsa egy régi, fájlba írt példányban szerepelt → érvénytelenítve.
-- A kulcs_hash helyére egy senki által nem ismert véletlen érték lenyomata került (új kulcs nem készült).
-- Belépés a Teendőim-be: név + PIN (változatlan). Ha iroda-kulcs kell: új véletlen kulcs → sha256 → kulcs_hash.
-- Ellenőrizve: a régi kulcs nem enged be; Ferenc a névlistában; név + PIN belépés owner szerepkörrel működik.
update public.tel_kuldo
   set kulcs_hash = encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex')
 where nev = 'Ferenc';
