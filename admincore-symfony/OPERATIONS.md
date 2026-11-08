# RedAssistance AdminCore — üzemeltetési kézikönyv

Egy helyen: hogyan kerül élesbe egy változás, mit figyelünk, mi riaszt, hogyan mentünk és hogyan állunk vissza.
Minden itt leírt eljárás **ki van próbálva** (CI-ban automatikusan, illetve élesben a fejlesztés során).

---

## 1. Áttekintés

| Réteg | Mi | Hol |
|---|---|---|
| Alkalmazás | Symfony 7.4 + FrankenPHP, egy konténer | `compose.yml` |
| Adat | Supabase (Postgres 17, RLS) — az alkalmazás csak a `/sb` kapun át éri el | Supabase-projekt |
| Monitoring | Prometheus, Alertmanager, Loki, Alloy, Grafana, blackbox, node-exporter | `compose.monitoring.yml`, `ops/monitoring/` |
| Mentés | éjszakai titkosított dump + automatikus visszaállítási próba | `compose.backup.yml`, `ops/backup/` |
| CI/CD | GitHub Actions: teszt → kép → staging → (jóváhagyás) → éles | `.github/workflows/admincore.yml` |

Indítás a szerveren (minden réteg):

```sh
docker compose -f compose.yml -f compose.monitoring.yml -f compose.backup.yml --env-file .env.prod up -d
```

---

## 2. CI/CD

### Mi fut minden pushnál

1. **PHP**: composer validate + `composer audit` (sérülékeny függőség = piros), szintaxis, konténer/YAML/Twig-lint, **PHPStan** (alkalmazás: 8-as szint, tesztek: 6-os), 58 PHPUnit-teszt, `app:verify-legacy` (byte-azonosság a régi HTML-ekkel, csak dokumentált javításokkal).
2. **E2E**: valódi Chromium, a valódi Symfony egy Supabase-utánzat előtt: belépés, menü, mért KPI, kapu-tiltás, szerelő-PIN, Teendőim, pénzügyi belépés.
3. **Ops**: compose-fájlok, Prometheus (21 szabály), Alertmanager, Loki, Alloy, blackbox, dashboard JSON, shellcheck.
4. **Mentés**: a teljes mentés → titkosítás → visszaállítási próba → kézi visszafejtés → egy tábla kinyerése lánc egy Supabase-szerű próbaadatbázison, **negatív próbákkal** (eltérést és hibás mentést is észre kell vennie).
5. **Kép**: Docker-build + füstteszt a kész képen (nem root, `cap_drop ALL`, egészség, kapu, metrics, HEALTHCHECK).

`main` ágon a képek a GHCR-be kerülnek (`sha-xxxxxxx`, `latest`), és ha be van állítva, **staging telepítés** indul.
`admincore-v1.2.3` tag → verziózott kép → **éles telepítés a „production” környezet jóváhagyása után**.

### Egyszeri beállítás a GitHubon (Settings)

| Hol | Név | Érték |
|---|---|---|
| Environments | `staging`, `production` | a `production`-nál: *Required reviewers* = Ferenc |
| Secrets | `DEPLOY_SSH_KEY` | a deploy-felhasználó privát SSH-kulcsa (csak erre a célra) |
| Variables | `DEPLOY_USER`, `DEPLOY_PATH` | pl. `deploy`, `/opt/redassistance` (a repo klónja a szerveren) |
| Variables | `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan szerver` kimenete (MITM ellen) |
| Variables | `STAGING_HOST`, `PRODUCTION_HOST` | üresen hagyva az adott telepítés kimarad |

A GHCR-hez nem kell külön titok (a workflow saját `GITHUB_TOKEN`-je). Privát csomagnál a szerveren egyszer:
`echo <PAT read:packages> | docker login ghcr.io -u <user> --password-stdin`.

### Telepítés és visszaállás

```sh
ops/deploy.sh sha-1a2b3c4      # adott kép; 90 mp-ig várja a /health/ready-t, ha nem kész → AUTOMATIKUSAN vissza az előzőre
ops/deploy.sh --rollback       # kézi visszaállás az előző sikeres címkére
cat .deploy/redassistance/history
```

Kiadás: `git tag admincore-v1.0.0 && git push origin admincore-v1.0.0` → CI → jóváhagyás → éles.

---

## 3. Monitoring és naplózás

- **Grafana**: csak a szerverről, `127.0.0.1:3000` → `ssh -L 3000:localhost:3000 szerver`, majd http://localhost:3000 (admin / `ops/secrets/grafana_admin_password`). Kezdőlap: *RedAssistance — áttekintés*.
- **/metrics**: `METRICS_TOKEN` nélkül nem létezik (404). Címkékben soha nincs felhasználó, e-mail vagy IP.
- **Naplók (Loki)**: minden konténer stdout/stderr-je + az auditnapló. Hasznos lekérdezések (Grafana → Explore → Loki):

| Kérdés | Lekérdezés |
|---|---|
| Hibák | `{job="docker", level=~"error\|critical"}` |
| Ki írt mit (audit) | `{job="audit", event="gateway.write"} \| json` |
| Tiltott hívások | `{job="audit", event="gateway.denied"} \| json` |
| PIN-próbálkozások | `{job="audit", event=~"gateway.pin_login_failed\|gateway.pin_throttled"} \| json` |
| Egy felhasználó | `{job="audit"} \|= "valaki@szerviz.ro"` |

Megőrzés: metrikák 90 nap, Loki 90 nap, **auditnapló-fájl 400 nap** (a naplókötetben, a Lokitól függetlenül).

**Ha maga a monitoring áll le (deadman):** a `RA_Watchdog` riasztás szándékosan mindig aktív, és percenként pingel egy
külső figyelőt. Beállítás (ingyenes): healthchecks.io → új check, „Period 1 perc, Grace 5 perc” → a ping-URL a
`.env.prod`-ba: `DEADMAN_URL=https://hc-ping.com/<uuid>`. Ha a szerver, a Prometheus vagy az Alertmanager leáll,
a healthchecks.io küld e-mailt / SMS-t — a riasztórendszer saját kiesése is látszik.

**Biztonsági fejlécek:** Content-Security-Policy (az adat csak a saját kapura / Supabase-re mehet, idegen szkript nem
tölthető, keretbe ágyazás tiltva), HSTS a HTTPS-kapun, `nosniff`, `X-Frame-Options`, `Referrer-Policy`.

---

## 4. Riasztások — mit tegyél

E-mail az `ALERT_EMAIL_TO` címre. **critical** = azonnal, **warning** = munkaidőben. Minden riasztás e-mailje tartalmazza a „Teendő” sort.

| Riasztás | Jelentés | Első lépés |
|---|---|---|
| RA_AlkalmazasLeallt (critical) | az app nem válaszol | `docker compose ps`, `docker compose logs --tail=100 app`, `ops/deploy.sh --rollback` ha friss telepítés után |
| RA_NemKeszenleti (critical) | fut, de nem tud kiszolgálni | `curl localhost:8080/health/ready` → melyik ellenőrzés hibás |
| RA_SupabaseKapuNemEriEl (critical) | a Supabase elérhetetlen | status.supabase.com, szerver DNS/hálózat |
| RA_KulsoElerhetetlen (critical) | kívülről nem érhető el | DNS, reverse proxy, tűzfal |
| RA_MentesElmaradt / RA_MentesNincsAdat (critical) | >26 órája nincs sikeres mentés | `docker compose logs backup` → 6. fejezet |
| RA_LemezBetelik (critical) | <4% szabad hely | `docker system df`, `docker image prune` |
| RA_SokSzerverHiba, RA_LassuValaszok, RA_SupabaseLassu | romló szolgáltatás | Grafana → Hibák panel |
| RA_PinProbalkozasok, RA_JelszoProbalkozasok, RA_SokTiltottKeres | lehetséges támadás / hibás telepítés | auditnapló (fenti lekérdezések); idegen IP → tűzfal, érintett PIN csere |
| RA_AsmImportHianyzik, RA_AsmImportSikertelen | a havi ASM-adat nincs bent → a jelentés és a KPI nem friss | Pénzügyi panel → Import ASM |
| RA_TanusitvanyLejar | 14 napon belül lejár a TLS | a reverse proxy automatikus megújítása |

---

## 5. Mentési szabályzat

| Elem | Szabály |
|---|---|
| Mit | a teljes adatbázis, a Supabase saját kezelt sémái nélkül (realtime, vault, graphql…), **beleértve a felhasználókat (auth)** és minden alkalmazás-sémát. A Storage jelenleg üres (0 fájl) — ha lesz benne fájl, külön mentés kell. |
| Mikor | naponta 03:15 (Europe/Bucharest) |
| Hogyan | `pg_dump` egy exportált pillanatképből; ugyanabban a pillanatban **minden tábla sorszáma** is rögzül (`.counts`) |
| Ellenőrzés | **minden mentés után** automatikus visszaállítás egy ideiglenes Postgresbe → minden tábla sorszáma egyezik-e. Ha nem: a mentés sikertelennek számít és riaszt. |
| Titkosítás | `age`, nyilvános kulccsal. A szerveren **csak a nyilvános kulcs** van; a titkos kulcs offline (Ferenc: jelszókezelő + papír a széfben). Szivárgott mentés = olvashatatlan. |
| Megőrzés | 14 napi + 8 heti (vasárnap) + 12 havi (hónap 1.) |
| Off-site | `BACKUP_RCLONE_REMOTE` (pl. Backblaze B2 / S3, objektumzárral) — **3-2-1**: a szerver elvesztése után is megvan |
| Felügyelet | `ra_backup_*` és `ra_restore_test_*` metrikák → RA_MentesElmaradt, RA_VisszaallitasProbaRegi |
| Célok | **RPO ≤ 24 óra** (a Supabase saját napi mentésével és PITR-rel ez percekre szűkíthető) · **RTO ≈ 1–2 óra** új Supabase-projektbe |

Első beállítás:

```sh
age-keygen -o redassistance-mentes.key        # a SAJÁT gépeden — ez a titkos kulcs, NEM megy a szerverre
grep 'public key' redassistance-mentes.key     # age1… → ops/secrets/age_recipient a szerveren
# ops/secrets/backup_db_url: Supabase Dashboard → Connect → Session pooler (5432) — NEM a transaction pooler
docker compose -f compose.yml -f compose.monitoring.yml -f compose.backup.yml run --rm backup run-now   # első próba
```

---

## 6. Visszaállítás

A mentésfájlok a `backups` kötetben vannak (`docker run --rm -v redassistance_backups:/b alpine ls -l /b`) és off-site.
A titkos kulcsot **csak a művelet idejére** másold a szerverre, utána töröld.

### A) Mentés ellenőrzése (bármikor, semmit nem ír)

```sh
docker compose … run --rm -v $PWD/redassistance-mentes.key:/tmp/k:ro backup restore verify /backups/redassistance_2026-10-03_0315.dump.age /tmp/k
```

### B) Véletlenül törölt / elrontott sorok (a projekt él)

```sh
# 1) a tábla a mentés pillanatából, CSV-ben
docker compose … run --rm -v $PWD/redassistance-mentes.key:/tmp/k:ro backup \
  restore extract /backups/redassistance_2026-10-03_0315.dump.age /tmp/k public.employees /backups/employees.csv
# 2) a szükséges sorok visszatöltése (Supabase SQL Editor vagy psql \copy), előtte a jelenlegi állapotról is mentés
```

### C) Teljes katasztrófa (a Supabase-projekt elveszett)

1. Új Supabase-projekt (ugyanaz a régió), Postgres 17.
2. `docker compose … run --rm -it -v $PWD/redassistance-mentes.key:/tmp/k:ro backup restore full /backups/<legutóbbi>.dump.age /tmp/k '<új projekt Session pooler URL>'`
   — bővítmények → felhasználók (auth.users, identities) → alkalmazás-sémák (szerkezet, adat, jogosultságok, RLS).
3. Ellenőrzőlista: a `.counts` fájl sorszámai az új projektben (`select count(*)` a fő táblákra); belépés owner-ként; Admin Core, szerelő-telefon, Teendőim, pénzügy betölt.
4. Az alkalmazás átállítása: `.env.prod` → `ADMINCORE_SUPABASE_URL`, `ADMINCORE_SUPABASE_KEY` (új publishable kulcs) → `ops/deploy.sh <jelenlegi címke>`.
5. A Supabase Auth beállításai (e-mail sablonok, redirect URL-ek) és az Edge Functionök nincsenek a dumpban — a projekt beállításaiból újra kell rögzíteni.
6. Ha ugyanaz a PIN-rendszer kell: a PIN-ek hash-ként a táblákban vannak, visszaállnak; a futó munkamenet-tokenek nem (újra kell belépni).

### Visszaállítási próba (negyedévente, kézzel is)

A gép minden éjjel visszaállít próbaként; negyedévente egyszer **ember** is csinálja végig a B) lépést egy
tetszőleges táblára, és írja be ide a dátumot. Utolsó kézi próba: _______

---

## 7. Titkok

Mind a szerveren, gitben soha. Részletek: `ops/secrets/README.md`.

| Titok | Hol | Ki fér hozzá |
|---|---|---|
| `APP_SECRET`, Supabase-kulcsok, `METRICS_TOKEN`, `ASM_API_TOKEN` | `.env.prod` | szerver (root) |
| `metrics_token`, `grafana_admin_password`, `smtp_password` | `ops/secrets/` | szerver (root) |
| `backup_db_url` (DB-jelszó!) | `ops/secrets/` | szerver (root) |
| `age_recipient` (nyilvános kulcs) | `ops/secrets/` | nem titok |
| age **titkos** kulcs | offline | csak Ferenc |
| `DEPLOY_SSH_KEY` | GitHub Secrets | CI |
