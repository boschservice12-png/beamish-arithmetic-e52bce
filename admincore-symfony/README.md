# AdminCore — Szervezési tábla (Symfony 7.4 LTS)

A `AdminCore_Szervezesi_tabla_33_3.html` (505 KB, egyetlen fájl) Symfony-alkalmazásként.
**A felület és a működés változatlan**: ugyanaz a HTML, CSS és JS, ugyanaz a Supabase-adatbázis,
ugyanaz a bejelentkezés. Ami változott, az a szerkezet: 1 monolit helyett 28 különálló,
név szerint kereshető fájl, verziózott cache, konfiguráció `.env`-ben, automatikus regressziós ellenőrzés.

## Szerkezet

```
admincore-symfony/
├── legacy/AdminCore_Szervezesi_tabla_33_3.html   eredeti v33, érintetlen (referencia)
├── templates/admincore/
│   ├── index.html.twig                           az oldal váza: a blokkok sorrendje
│   └── markup/01-head … 04-admin-shell           a HTML-jelölő részek
├── public/admincore/css/  (6 fájl)               01-base, 05-browser-design, 08-admin-nav, …
├── public/admincore/js/   (22 fájl)              12-supabase-adapter, 21-production, 23-verif, …
├── src/
│   ├── Controller/AdminCoreController.php        /  ·  /health  ·  régi fájlnév → 301 /
│   ├── Controller/SupabaseGatewayController.php  /sb/... → Supabase (engedélylista + auditnapló)
│   ├── Gateway/GatewayPolicy.php                 mely táblák / függvények / auth végpontok mehetnek át
│   ├── AdminCore/AdminCoreConfig.php             Supabase URL/kulcs/SDK a .env-ből
│   ├── Asset/ContentHashVersionStrategy.php      ?v=<hash> → módosítás után azonnal frissül
│   ├── EventSubscriber/SecurityHeadersSubscriber biztonsági fejlécek
│   └── Command/VerifyLegacyCommand.php           bájtra pontos összevetés a v33-mal
├── tests/                                      26 teszt (oldal, gateway, engedélylista-lefedettség)
├── supabase/2026-10-03_security_hardening.sql  adatbázis-javítás — ELŐKÉSZÍTVE, NINCS LEFUTTATVA
└── tools/split_legacy.py                         a monolit → fájlok bontó (újrafuttatható)
```

A fájlok számozása a betöltési sorrend. **A sorrend számít** (a későbbi szkriptek az előzőkre épülnek),
ne cseréld fel őket az `index.html.twig`-ben.

## Indítás helyben

```bash
composer install
php bin/console app:verify-legacy     # bájtra azonos-e a v33-mal
php bin/phpunit                       # 26 teszt
php -S 127.0.0.1:8000 -t public       # http://127.0.0.1:8000/
```

## Élesítés (PHP-tárhely)

A Netlify **nem futtat PHP-t**, ezért ehhez PHP 8.2+ tárhely kell (cPanel/Apache, Nginx + PHP-FPM, VPS).

1. Feltöltés, majd a gyökérben: `composer install --no-dev --optimize-autoloader`
2. `.env.local` létrehozása (nem kerül gitbe):
   ```
   APP_ENV=prod
   APP_SECRET=<32 karakteres véletlen hex: php -r "echo bin2hex(random_bytes(16));">
   ```
3. `APP_ENV=prod php bin/console cache:clear`
4. A webszerver dokumentumgyökere a **`public/`** mappa legyen (Apache-hoz a `public/.htaccess` kész).
5. Ellenőrzés: `https://<domain>/health` → `{"status":"ok"}`

A `finance-dashboard.html` és `panou-operational.html` felugró ablakokat az oldal relatív címen nyitja:
ha ezeket is ki kell szolgálni, másold őket a `public/` mappába.

## Konfiguráció (`.env` / `.env.local`)

| Változó | Jelentés |
|---|---|
| `ADMINCORE_SUPABASE_URL` | Supabase projekt címe |
| `ADMINCORE_SUPABASE_KEY` | **publishable** kliens-kulcs (nyilvános, a böngészőbe kerül) — `service_role` kulcsot soha |
| `ADMINCORE_SUPABASE_SDK` | a Supabase JS SDK CDN-címe |
| `ADMINCORE_GATEWAY` | `1` = a böngésző a saját domainen (`/sb`) át éri el a Supabase-t · `0` = közvetlenül, mint a v33 (azonnali visszaállás) |

Supabase-projekt váltásakor csak ezt a 2–3 sort kell átírni, a JS-hez nem kell nyúlni.

## Supabase API-kapu (`/sb`)

`ADMINCORE_GATEWAY=1` esetén a supabase-js a `https://<domain>/sb` címet kapja, és **minden** hívás
(bejelentkezés, olvasás, írás, függvények) a Symfony-n megy át. A JS-kód ehhez nem változott.

| Funkció | Működés |
|---|---|
| Engedélylista | csak a `GatewayPolicy`-ben felsorolt 33 tábla/nézet, 12 függvény és 3 auth végpont (bejelentkezés, saját fiók, kilépés) megy át — minden más 403, és be sem jut a Supabase-be |
| Bejelentkezés kötelező | az adatlekérések és függvények csak bejelentkezett tokennel mennek át (a pénzügyi jelentés is) |
| Jogosultság | a felhasználó saját tokenje megy tovább → a Supabase sorszintű jogai (RLS) változatlanul érvényesek; szerveroldali titkos kulcs nincs |
| Auditnapló | `var/log/audit-ÉÉÉÉ-HH-NN.log` (JSON, 400 napig): minden írás, függvényhívás, bejelentkezés (sikeres és sikertelen) és tiltott kérés — ki, mikor, mit, melyik soron, milyen eredménnyel |
| Adatvédelem | a naplóba **csak mezőnevek** kerülnek, értékek soha (jelszó, PIN, személyes adat) — teszt őrzi |
| Supabase-kiesés | 502 + érthető hibaüzenet, nem fehér képernyő |

**Átálláskor egyszer újra be kell jelentkezni** (a böngésző a munkamenetet a Supabase-cím alapján tárolja, ez megváltozott).

Új tábla vagy függvény használatakor az `GatewayPolicyCoverageTest` bukik, amíg fel nem kerül a `GatewayPolicy`-be —
így nem élesben derül ki, hogy egy modul üres maradt.

**Korlát:** a publishable kulcs nyilvános, a Supabase közvetlenül is elérhető, tehát a kapu a *mi felületünk*
forgalmát szabályozza és naplózza; az adatbázis védelmét az RLS-nek és a függvényjogoknak kell adnia →
lásd `supabase/2026-10-03_security_hardening.sql`.

## Szabály módosításkor

1. A módosítás a megfelelő `public/admincore/js|css/NN-*.js|css` fájlba megy — a monolitot ne szerkeszd tovább.
2. Szándékos eltérés a v33-hoz képest → `VerifyLegacyCommand::KNOWN_FIXES`-be indoklással (auditnapló).
3. Új tábla / függvény → `GatewayPolicy` (a teszt jelzi, ha kimaradt).
4. `php bin/phpunit` zöld → mehet élesbe.

Ha mégis egy új monolit-verzió (pl. v34) érkezik: `python3 tools/split_legacy.py legacy/<új>.html`,
aztán `app:verify-legacy` — a `KNOWN_FIXES` javításait az újrabontás felülírja, az ellenőrző ezt jelezni fogja.

## Dokumentált javítások a v33-hoz képest

| Kód | Fájl | Hiba | Hatás |
|---|---|---|---|
| FIX-001 | `js/21-production.js` | A „Panou Operațional” menügomb ellenőrzése a `[data-adm4]` attribútumot kereste, amit a gomb rögtön elveszít → minden újrarajzolásnál új gomb, a NAV_SHIM figyelője erre újrarajzol | végtelen ciklus, a böngészőfül **betöltéskor lefagyott** |

## Adatbázis-leletek (2026-10-03) — döntésre vár

A `supabase/2026-10-03_security_hardening.sql` **nincs lefuttatva**. Visszaállító rész a fájl végén.

| Függvény | Ma | Javítás után |
|---|---|---|
| `f_gazdasagi_jelentes_utolso` | havi bevétel/fedezet **bejelentkezés nélkül** lekérhető | csak bejelentkezve |
| `f_iranyelv_uj` | új irányelv írható **bejelentkezés nélkül** | csak bejelentkezve |
| `f_verif_generalas`, `f_heti_gyules_elokeszites`, `f_kalap` | bejelentkezés nélkül futnak | csak bejelentkezve |
| `f_set_pin` | **bármely** bejelentkezett felhasználó (szerelő is) bármely szerelő PIN-jét átírhatja | csak owner/admin |
| `f_szerelok` | bejelentkezés nélkül | marad így (a szerelő-telefon belépés előtt használja) |
