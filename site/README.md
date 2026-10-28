# RedAssistance publikus weboldal (RO)

Éles, többoldalas statikus site a V4.0 specifikáció alapján, a
https://claude.ai/artifact/KDyWtEBs41gey9SdpB6JvY hasonmásból. A demó- és auditréteg nincs benne.

## Felépítés

| Út | Tartalom |
|---|---|
| `src/config.json` | **Minden jóváhagyandó adat egy helyen.** A `null` / `false` érték elrejti a hozzá tartozó blokkot. |
| `src/layout.html` | Fejléc, lábléc, SEO-meta, JSON-LD (Organization) |
| `src/pages/*.html` | 8 oldal tartalma |
| `build.mjs` | Generátor, függőség nélkül: `node site/build.mjs` → `ro/*.html` |
| `ro/*.html` | Generált kimenet (commitolva, build nélkül is kiszolgálható) |
| `assets/` | CSS, JS, saját tárhelyről kiszolgált fontok (OFL) |
| `../functions/site-lead.js` | Űrlap → e-mail (Resend), fix címzettel, honeypottal, szerveroldali validálással |
| `oglinda.html` | A korábbi „Oglinda” oldal, változatlanul |

Szerkesztés: `src/` módosítása → `node site/build.mjs` → commit. A `ro/` mappát kézzel ne szerkeszd.

## Indulás előtti teendők (a `config.json`-ban)

| # | Teendő | Kulcs | Amíg nincs kitöltve |
|---|---|---|---|
| 1 | Telefonszám | `company.phone`, `company.phoneHref` | nem jelenik meg |
| 2 | Árazás jóváhagyása (35–99 EUR, időszak?) | `offer.price` | általános mondat: „az árat a fiókban látod fizetés előtt” |
| 3 | Kell-e kártya a regisztrációhoz? | `offer.cardAtSignup` | a sor rejtve |
| 4 | Mi történik a próbaidő végén? | `offer.onExpiry` | a sor rejtve |
| 5 | Felmérés módszere + kérdések | `survey.method`, `survey.questionsUrl`, majd `survey.published: true` | a felmérés-blokk rejtve |
| 6 | Jogi validálás (hozzáférés, eladás, GDPR-szerepek) | `flags.legalValidated` | rövid, semleges mondat |
| 7 | Biztonsági jelentés | `flags.securityReport` | csak „szerverek az EU-ban (Frankfurt)” |
| 8 | Jogi dokumentumok éles URL-je | `links.*` | jelenleg **staging** URL-ek |
| 9 | Indexelés engedélyezése | `site.indexable: true` | `noindex`, nincs canonical |

Netlify környezeti változók: `RESEND_API_KEY` (kötelező), `LEAD_TO` (alapértelmezés: `contact@redassistance.net`).

## Ami a hasonmáshoz képest változott

- A „35 de ani” idézet ellentmondott az „1992 óta” állításnak (2026-ban ez 34 év). Csak az ellenőrizhető „1992 óta” maradt meg.
- A demó a teszt-CUI-k között a `12345673`-at érvényesnek írta, pedig nem az (az érvényes: `12345674`). A cégünk saját CUI-ja (`47746920`) helyesen átmegy az ellenőrzésen.
- A cégnév automatikus kitöltése a registry-ből (ANAF) nincs bekötve. A mezőt kézzel kell kitölteni, mi ellenőrizzük.
- Nincs Google Fonts, nincs külső script, nincs süti: GDPR szempontból nincs adattovábbítás harmadik félnek, ezért süti-sáv sem kell.
- A konverziós események (`click_trial`, `start_signup`, `complete_signup`, `complete_demo`, `complete_notify`, `view_service`, `share_whatsapp`, `invite_service`) csak akkor kerülnek a `window.dataLayer`-be, ha van analitika. Személyes adatot nem tartalmaznak.
