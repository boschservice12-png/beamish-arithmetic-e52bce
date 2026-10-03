# RedAssistance — AdminCore + szerelő-telefon + Teendőim (Symfony 7.4 LTS)

Három, eddig önálló HTML-fájl egy Symfony-alkalmazásban, egy közös Supabase-kapuval:

| Cím | Eredeti fájl | Kinek |
|---|---|---|
| `/` | `AdminCore_Szervezesi_tabla_33_3.html` (505 KB) | vezetés / iroda — Supabase-bejelentkezés |
| `/szerelo` | `szerelo-telefon.html` | szerelők telefonja — név + 4 jegyű PIN |
| `/teendoim` | `teendoim.html` | iroda ↔ szerelő-telefon csatorna — név + PIN vagy iroda-kulcs |
| `/penzugy` | `panou … (2026-04 modell)` — „Panou de control operațional” | pénzügy / vezetés — fejlesztés alatt; az AdminCore „Pénzügy ↗” gombja (`finance-dashboard.html`) ide visz |

A régi fájlnevek (`/szerelo-telefon.html`, `/teendoim.html`, `/finance-dashboard.html`, `/AdminCore_…html`) 301-gyel az új címre visznek,
így a kiosztott linkek és QR-kódok működnek.

**A felületek és a működés változatlanok**: ugyanaz a HTML, CSS és JS, ugyanaz a Supabase-adatbázis,
ugyanaz a bejelentkezés — mind a négy oldal bájtra azonos az eredetivel (`app:verify-legacy`).

**Pénzügyi panel — adatbázis-mentés (1. fázis, 2026-10-03):** a panel kódja változatlan; a
`public/assets/penzugy/js/02-db-sync.js` réteg minden mentést a `finance_panel_state` táblába is beír,
**verziózva** (append-only: minden mentés új sor, felülírás/törlés nincs), induláskor onnan tölt.
- Belépés: ugyanaz a Supabase-fiók, mint az AdminCore-ban (azonos domainen közös munkamenet).
- Hozzáférés: **iroda** (owner, admin, reception) — az adatbázis RLS-e kényszeríti ki; szerelő/hr nem lát.
- Ütközés: ha közben más mentett, nem írja felül, figyelmeztet.
- Egyszeri átköltöztetés: ha a böngészőben régi adat van és az adatbázis üres, felajánlja a feltöltést.
- A sablonban a `<!-- penzugy-db:begin/end -->` blokk a kiegészítés; az `app:verify-legacy` ezt kivágva
  ellenőrzi a bájtazonosságot (`VerifyLegacyCommand::ADDITIONS`).
- 2. fázis: lásd lent, „ASM-import és havi jelentés”.

**ASM-import és havi jelentés (2. fázis, 2026-10-03):**
- A panel „Import ASM” → „Importă în panel” gombja után a `03-asm-import.js` ugyanazokat a fájlokat az
  adatbázisba is betölti (`f_asm_import`, forrás `manual`): köteg → tételek → **havi jelentés automatikusan**
  (külön „küldés” gomb nélkül) → szerelőnkénti KPI és óra-mezők (`f_asm_rollup`). Az eredményt és a
  dolgozóhoz nem párosított ASM-neveket a panel kiírja.
- A hónap 5. napjától a panel figyelmeztet, ha az előző havi ASM-import hiányzik.
- Minden import egy verzió (`asm_import_batch`), semmi nem íródik felül: hónaponként a legutolsó köteg érvényes,
  a korábbiak visszakereshetők. A márciusi adatok újrabetöltése bájtra ugyanazt a jelentést és KPI-t adja.
- **Automatikus ASM-API (előkészítve, KI):** `POST /api/asm/import` (Bearer `ASM_API_TOKEN`), ugyanaz a
  JSON-formátum és ugyanaz az adatbázis-függvény `api` forrással. Bekapcsolás: `ASM_API_TOKEN` +
  `ADMINCORE_SUPABASE_SERVICE_KEY` a `.env.local`-ba. Ami még kell hozzá: az ASM oldali export/feltöltő.
Ami változott: szétbontott, kereshető fájlok, verziózott cache, konfiguráció `.env`-ben, Supabase-kapu
engedélylistával, auditnaplóval és PIN-fékkel.

## Szerkezet

```
admincore-symfony/
├── legacy/                                     a 3 eredeti HTML, érintetlen (referencia)
├── templates/{admincore,szerelo,teendoim}/
│   ├── index.html.twig                           az oldal váza: a blokkok sorrendje
│   └── markup/                                   a HTML-jelölő részek
├── public/assets/admincore/{css,js}/  (6 + 22)   01-base, 12-supabase-adapter, 21-production, 23-verif, …
├── public/assets/szerelo/{css,js}/    (1 + 1)
├── public/assets/teendoim/{css,js}/   (1 + 1)
├── public/assets/penzugy/{css,js}/    (1 + 1)   a 255 KB-os JS egyben — modulokra bontás a fejlesztés része
├── src/
│   ├── Controller/AdminCoreController.php        /  ·  /szerelo  ·  /teendoim  ·  /health  ·  régi fájlnevek → 301
│   ├── Controller/SupabaseGatewayController.php  /sb/... → Supabase (engedélylista + auditnapló)
│   ├── Gateway/GatewayPolicy.php                 mely táblák / függvények / auth végpontok mehetnek át
│   ├── Gateway/PinLoginThrottle.php              PIN- és iroda-kulcs-próbálkozások fékezése
│   ├── AdminCore/AdminCoreConfig.php             Supabase URL/kulcs/SDK a .env-ből
│   ├── Asset/ContentHashVersionStrategy.php      ?v=<hash> → módosítás után azonnal frissül
│   ├── EventSubscriber/SecurityHeadersSubscriber biztonsági fejlécek
│   └── Command/VerifyLegacyCommand.php           bájtra pontos összevetés az eredetiekkel (mind a 3 app)
├── tests/                                      42 teszt (oldalak, gateway, PIN-fék, engedélylista-lefedettség)
├── supabase/2026-10-03_security_hardening.sql  adatbázis-javítás — LEFUTTATVA 2026-10-03
└── tools/split_legacy.py                         a monolit → fájlok bontó (újrafuttatható)
```

A fájlok számozása a betöltési sorrend. **A sorrend számít** (a későbbi szkriptek az előzőkre épülnek),
ne cseréld fel őket az `index.html.twig`-ben.

## Indítás helyben

```bash
composer install
php bin/console app:verify-legacy     # bájtra azonos-e mind a 3 app az eredetivel
php bin/phpunit                       # 50 teszt
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

**Proxy / Cloudflare mögött** állítsd be a `TRUSTED_PROXIES` változót (pl. `TRUSTED_PROXIES=REMOTE_ADDR`),
különben minden kérés a proxy IP-jéről látszik, és az IP-alapú PIN-fék az egész műhelyt egyszerre fékezné.

A `finance-dashboard.html` és `panou-operational.html` felugró ablakokat az oldal relatív címen nyitja:
ha ezeket is ki kell szolgálni, másold őket a `public/` mappába.

## Konfiguráció (`.env` / `.env.local`)

| Változó | Jelentés |
|---|---|
| `ADMINCORE_SUPABASE_URL` | Supabase projekt címe |
| `ADMINCORE_SUPABASE_KEY` | **publishable** kliens-kulcs (nyilvános, a böngészőbe kerül) — `service_role` kulcsot soha |
| `ADMINCORE_SUPABASE_SDK` | a Supabase JS SDK CDN-címe |
| `ADMINCORE_GATEWAY` | `1` = a böngésző a saját domainen (`/sb`) át éri el a Supabase-t · `0` = közvetlenül, mint eredetileg (azonnali visszaállás, mindhárom appra) |
| `TRUSTED_PROXIES` | reverse proxy / Cloudflare IP-je; üresen: nincs proxy |

Supabase-projekt váltásakor csak ezt a 2–3 sort kell átírni, a JS-hez nem kell nyúlni.

## Supabase API-kapu (`/sb`)

`ADMINCORE_GATEWAY=1` esetén a supabase-js a `https://<domain>/sb` címet kapja, és **minden** hívás
(bejelentkezés, olvasás, írás, függvények) a Symfony-n megy át. A JS-kód ehhez nem változott.

| Funkció | Működés |
|---|---|
| Engedélylista | csak a `GatewayPolicy`-ben felsorolt 33 tábla/nézet, 11 iroda- és 35 telefonos függvény, 3 auth végpont megy át — minden más 403, és be sem jut a Supabase-be |
| Bejelentkezés kötelező | AdminCore: az adatlekérések és függvények csak bejelentkezett tokennel mennek át (a pénzügyi jelentés is). Bejelentkezés nélkül csak az a 35 függvény hívható, amit a telefonos appok tényleg használnak (teszt őrzi) |
| PIN-fék | dolgozónként 5 hibás PIN / 15 perc, IP-nként 30 hibás PIN vagy iroda-kulcs / 15 perc → 429, a kérés ki sem megy; sikeres belépés nullázza a dolgozó számlálóját. A felületen ugyanúgy „Rossz PIN” látszik |
| Jogosultság | a felhasználó saját tokenje megy tovább → a Supabase sorszintű jogai (RLS) változatlanul érvényesek; szerveroldali titkos kulcs nincs |
| Auditnapló | `var/log/audit-ÉÉÉÉ-HH-NN.log` (JSON, 400 napig): minden írás, függvényhívás, bejelentkezés (sikeres és sikertelen), fékezés és tiltott kérés — ki, mikor, mit, melyik soron, milyen eredménnyel |
| Telefonos munkamenet | a PIN-belépés sora rögzíti a dolgozót és a munkamenet 12 jegyű lenyomatát; a későbbi műveletek ugyanezzel a lenyomattal kerülnek a naplóba → minden szerelői lépés visszakövethető a dolgozóhoz |
| Adatvédelem | a naplóba **csak mezőnevek** és lenyomatok kerülnek, értékek soha (jelszó, PIN, munkamenet-token, iroda-kulcs, személyes adat) — teszt őrzi |
| Supabase-kiesés | 502 + érthető hibaüzenet, nem fehér képernyő |

**Átálláskor az AdminCore-ba egyszer újra be kell jelentkezni** (a böngésző a munkamenetet a Supabase-cím alapján tárolja, ez megváltozott).
A telefonos appok saját munkamenetet tárolnak (`ra_sess`, `ra_tf_key`), de **új domainre költözéskor** a böngésző
azt sem viszi át → a szerelőknek is egyszer újra be kell lépniük a PIN-nel.

Új tábla vagy függvény használatakor az `GatewayPolicyCoverageTest` bukik, amíg fel nem kerül a `GatewayPolicy`-be —
így nem élesben derül ki, hogy egy modul üres maradt.

**Korlát:** a publishable kulcs nyilvános, a Supabase közvetlenül is elérhető, tehát a kapu a *mi felületünk*
forgalmát szabályozza és naplózza; az adatbázis védelmét az RLS-nek és a függvényjogoknak kell adnia →
lásd `supabase/2026-10-03_security_hardening.sql`.

## Szabály módosításkor

1. A módosítás a megfelelő `public/assets/<app>/js|css/NN-*.js|css` fájlba megy — a monolitokat ne szerkeszd tovább.
2. Szándékos eltérés a v33-hoz képest → `VerifyLegacyCommand::KNOWN_FIXES`-be indoklással (auditnapló).
3. Új tábla / függvény → `GatewayPolicy` (a teszt jelzi, ha kimaradt).
4. `php bin/phpunit` zöld → mehet élesbe.

Ha mégis egy új monolit-verzió (pl. v34) érkezik: `python3 tools/split_legacy.py admincore legacy/<új>.html`
(telefonos appoknál `szerelo` / `teendoim`),
aztán `app:verify-legacy` — a `KNOWN_FIXES` javításait az újrabontás felülírja, az ellenőrző ezt jelezni fogja.

## Dokumentált javítások a v33-hoz képest

| Kód | Fájl | Hiba | Hatás |
|---|---|---|---|
| FIX-001 | `js/21-production.js` | A „Panou Operațional” menügomb ellenőrzése a `[data-adm4]` attribútumot kereste, amit a gomb rögtön elveszít → minden újrarajzolásnál új gomb, a NAV_SHIM figyelője erre újrarajzol | végtelen ciklus, a böngészőfül **betöltéskor lefagyott** |

## Adatbázis-javítás (2026-10-03) — LEFUTTATVA

`supabase/2026-10-03_security_hardening.sql`, migration: `admincore_security_hardening_20261003`. Visszaállító rész a fájl végén.

Futtatás előtti bizonyíték (`pg_stat_statements`): az `f_gazdasagi_jelentes_utolso`-t 39-szer hívták, **mindig
bejelentkezve**, anon egyszer sem; a pénzügyi panel jelentésküldése is bejelentkezve megy → az automatikus,
kötelező pénzügyi jelentést a javítás nem érinti.

| Függvény | Előtte | Most |
|---|---|---|
| `f_gazdasagi_jelentes_utolso` | havi bevétel/fedezet **bejelentkezés nélkül** lekérhető | csak bejelentkezve |
| `f_iranyelv_uj` | új irányelv írható **bejelentkezés nélkül** | csak bejelentkezve |
| `f_verif_generalas`, `f_heti_gyules_elokeszites`, `f_kalap` | bejelentkezés nélkül futnak | csak bejelentkezve |
| `f_set_pin` | **bármely** bejelentkezett felhasználó (szerelő is) bármely szerelő PIN-jét átírhatja | csak owner/admin (Ferenc, Yvonne, David) — tesztelve: szerelő elutasítva, owner sikeres, mindkét próba visszagörgetve |
| `f_szerelok` | bejelentkezés nélkül | marad így (a szerelő-telefon belépés előtt használja) |

## PIN-fék az adatbázisban (2026-10-03) — RÉSZBEN LEFUTTATVA

`supabase/2026-10-03_pin_brake.sql` — a kapu fékje csak a mi felületünkön át érkező kéréseket látja; a nyilvános
kulccsal a Supabase közvetlenül is hívható, ezért a fék az `f_pin_login`-ba is bekerül:
5 egymást követő hibás PIN → 15 perc zárolás, minden próbálkozás a `pin_login_naplo` táblába (180 nap),
owner/admin új PIN-nel azonnal feloldja.

| Rész | Állapot |
|---|---|
| `pin_login_naplo` tábla, `employees.pin_fail_count` / `pin_locked_until` | lefuttatva |
| `f_set_pin`: zárolás törlése új PIN-nél; közvetlen SQL-ből (pl. `f_prod_selftest`) újra hívható | lefuttatva |
| `f_prod_selftest` lezárása — bejelentkezés nélkül is futtatható volt, és Tamás Arnold PIN-jét törli | lefuttatva |
| `f_pin_login` új változata (maga a fék) | **nincs lefuttatva** — SQL Editorból kell, lásd a fájl fejlécét |

A kapu már kezeli az új viselkedést (hibás PIN-re API-n át `200 []` jön kivétel helyett — teszt őrzi).
