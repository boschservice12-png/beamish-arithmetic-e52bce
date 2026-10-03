// Végponttól-végpontig füstteszt valódi böngészővel: Symfony (BASE_URL) → Supabase-utánzat (fake-supabase.mjs).
// Minden lépés ellenőrzött; bármely hiba → kilépési kód 1 (CI piros).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765';
const require = createRequire(import.meta.url);
const sdk = fs.readFileSync(require.resolve('@supabase/supabase-js/dist/umd/supabase.js'), 'utf8');
const failures = [];
const check = (ok, what, detail = '') => { console.log(`${ok ? '✓' : '✗'} ${what}${detail ? ' — ' + detail : ''}`); if (!ok) failures.push(what); };

const browser = await chromium.launch();
async function open(path, viewport = { width: 1400, height: 900 }, extra = {}) {
  const page = await browser.newPage({ viewport, ...extra });
  const errors = [], outside = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/status of (400|403)|net::ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js')) return r.fulfill({ contentType: 'application/javascript', body: sdk });
    if (u.startsWith(BASE)) return r.continue();
    if (!/fonts\.|pdfjs|mammoth|cdnjs\.cloudflare\.com/.test(u)) outside.push(u);
    return r.abort();
  });
  await page.goto(BASE + path, { waitUntil: 'load' });
  return { page, errors, outside };
}

// --- A) Admin Core: belépés, menü, mért KPI, kapu-tiltás ---
{
  const { page, errors, outside } = await open('/');
  await page.waitForSelector('#sbLogin #sbPass', { timeout: 15000 });
  await page.fill('#sbPass', 'rossz-jelszo'); await page.click('#sbGo');
  await page.waitForFunction(() => /Hibás/.test((document.getElementById('sbErr') || {}).textContent || ''), null, { timeout: 10000 }).catch(() => {});
  check(/Hibás/.test(await page.textContent('#sbErr')), 'Admin Core: rossz jelszó elutasítva');
  await page.fill('#sbPass', 'helyes-jelszo'); await page.click('#sbGo');
  await page.waitForFunction(() => !document.getElementById('sbLogin'), null, { timeout: 15000 }).catch(() => {});
  check(await page.evaluate(() => !document.getElementById('sbLogin')), 'Admin Core: helyes jelszóval belép');
  await page.evaluate(() => document.getElementById('adminOpen').click());
  await page.waitForSelector('[data-adm9]', { timeout: 10000 });
  check(await page.evaluate(() => document.querySelectorAll('#adminNav button').length) >= 20, 'Admin Core: menü betöltve');
  // szándékosan azonnal kattintunk (a belépés utáni adatbetöltés közben) — FIX-002 regressziós próbája
  await page.click('[data-adm9]');
  await page.waitForSelector('#kpiHo', { timeout: 10000 });
  await page.waitForTimeout(800);
  const k = await page.evaluate(() => ({
    ho: document.getElementById('kpiHo').value,
    piros: document.getElementById('kpiB').textContent,
    xss: !!document.querySelector('#adminRoot td b b'),
    koteg: document.body.innerText.includes('ASM-import: #7'),
    parositatlan: document.body.innerText.includes('99.ISMERETLEN'),
  }));
  check(k.ho === '2026-03-01', 'KPI: alapból az utolsó mért hónap', k.ho);
  check(k.piros === '2', 'KPI: beavatkozást igénylő mutatók száma a menüben', k.piros);
  check(!k.xss, 'KPI: adatbázisból jövő HTML escape-elve');
  check(k.koteg && k.parositatlan, 'KPI: ASM-köteg és párosítatlan nevek látszanak');
  const w = await page.evaluate(async () => {
    const c = window.RA_SB.client;
    const tiltott = await c.from('finance_havi_snapshot_nem_letezo').select('*');
    return { tiltott: tiltott.status, kod: tiltott.error && tiltott.error.code };
  });
  check(w.tiltott === 403 && w.kod === 'GATEWAY_FORBIDDEN', 'Kapu: nem engedélyezett tábla tiltva', JSON.stringify(w));
  check(errors.length === 0, 'Admin Core: nincs JS-hiba', errors.join(' | '));
  check(outside.length === 0, 'Admin Core: minden adat a kapun át megy', outside.join(' '));
  await page.close();
}

// --- B) Szerelő-telefon: PIN-belépés ---
{
  const { page, errors, outside } = await open('/szerelo', { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await page.waitForSelector('[data-emp]', { timeout: 15000 });
  const pin = async p => { for (const d of p) await page.click(`[data-k="${d}"]`); await page.waitForTimeout(700); };
  await page.click('[data-emp]');
  await pin('1111');
  check(((await page.textContent('#perr')) || '').length > 0, 'Szerelő: rossz PIN elutasítva');
  await pin('4321');
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => document.body.innerText.includes('BH-12-RED')), 'Szerelő: belépés után a saját munkák látszanak');
  check(errors.length === 0 && outside.length === 0, 'Szerelő: nincs JS-hiba, nincs kapun kívüli hívás', errors.concat(outside).join(' | '));
  await page.close();
}

// --- C) Teendőim (iroda): PIN-belépés ---
{
  const { page, errors, outside } = await open('/teendoim', { width: 1200, height: 800 });
  await page.waitForSelector('[data-ne]', { timeout: 15000 });
  await page.click('[data-ne]');
  await page.fill('#lp', '1111'); await page.click('#lf button[type=submit]'); await page.waitForTimeout(700);
  check(((await page.textContent('#le')) || '').length > 0, 'Teendőim: rossz PIN elutasítva');
  await page.fill('#lp', '4321'); await page.click('#lf button[type=submit]'); await page.waitForTimeout(1200);
  check(await page.evaluate(() => !document.getElementById('lf')), 'Teendőim: helyes PIN-nel belép');
  check(errors.length === 0 && outside.length === 0, 'Teendőim: nincs JS-hiba, nincs kapun kívüli hívás', errors.concat(outside).join(' | '));
  await page.close();
}

// --- D) Pénzügy: belépési képernyő (az adatbázis-szinkron rétege) ---
{
  const { page, errors } = await open('/penzugy');
  await page.waitForSelector('#dbSyncOverlay #dbsEmail', { timeout: 15000 }).catch(() => {});
  check(await page.evaluate(() => !!document.querySelector('#dbSyncOverlay #dbsEmail')), 'Pénzügy: belépés nélkül nem látszik adat (bejelentkezés kérve)');
  const csp = errors.filter(e => /Content Security Policy|Refused to/.test(e));
  check(csp.length === 0, 'Pénzügy: nincs CSP-sértés', csp.join(' | '));
  await page.close();
}

await browser.close();
if (failures.length) { console.log(`\n${failures.length} HIBA`); process.exit(1); }
console.log('\nMINDEN E2E ELLENŐRZÉS SIKERES');
