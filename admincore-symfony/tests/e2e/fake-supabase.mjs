// Supabase-utánzat (GoTrue + PostgREST minimum) az e2e teszthez. Minden kérést naplóz (upstream.log).
// Port: FAKE_SUPABASE_PORT (alap 8767).
import http from 'http'; import fs from 'fs';
const LOG = new URL('./upstream.log', import.meta.url);
fs.writeFileSync(LOG, '');
const b64 = s => Buffer.from(s).toString('base64url');
const uid = '6f1b2c3d-0000-4000-8000-000000000001';
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = 'Bearer'.length && b64('{"alg":"HS256","typ":"JWT"}') + '.' + b64(JSON.stringify({ sub: uid, email: 'ferenc@szkaliczki.local', role: 'authenticated', aud: 'authenticated', exp })) + '.c2ln';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'ferenc@szkaliczki.local', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    fs.appendFileSync(LOG, JSON.stringify({ m: req.method, u: req.url, auth: (req.headers.authorization || '').slice(0, 20), apikey: req.headers.apikey, body }) + '\n');
    const json = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/rest/v1/rpc/f_szerelok') return json(200, [{ id: 'e-tamas', name: 'Kovács Tamás', department: 'Technic', has_pin: true }]);
    if (u.pathname === '/rest/v1/rpc/f_pin_login') {
      const b = JSON.parse(body || '{}');
      if (b.p_pin !== '4321') return json(400, { code: 'P0001', message: 'Hibas PIN', details: null, hint: null });
      return json(200, [{ token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', employee_id: 'e-tamas', name: 'Kovács Tamás', expires_at: '2026-10-04T06:00:00Z' }]);
    }
    if (u.pathname === '/rest/v1/rpc/f_tf_irodasok') return json(200, [{ employee_id: 'e-yvonne', nev: 'Szkaliczki Yvonne' }]);
    if (u.pathname === '/rest/v1/rpc/f_tf_ki') { const b = JSON.parse(body || '{}'); return json(200, b.p_key === 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' ? [{ id: 'k1', nev: 'Szkaliczki Yvonne', szerep: 'hr' }] : []); }
    if (u.pathname === '/rest/v1/rpc/f_pin_must_change') return json(200, false);
    if (u.pathname === '/rest/v1/rpc/f_my_tasks_on') return json(200, [{ id: 't-1', cim: 'Fékbetét csere', rendszam: 'BH-12-RED', auto: 'Skoda Octavia', deviz_nr: 'D-77', block: 'A', block_date: '2026-10-03', est_minutes: 60, actual_minutes: 0, status: 'assigned', running: false, paused_bl: null, extra: false, extra_approved: null, tarif: null }]);

    const KPI = [
      { ho: '2026-03-01', sorrend: 1, divizio: 4, dept_code: '4.1', osztaly: 'Mecanica', kod: 'P_ORE', nev_hu: 'Normaóra', egyseg: 'óra', elert: 438, kert: 715, teljesules_pct: 61.3, allapot: 'piros', bizalmas: false, elert_forras: 'ASM', elert_megj: 'kapacitás' },
      { ho: '2026-03-01', sorrend: 2, divizio: 3, dept_code: '3.1', osztaly: null, kod: 'E_VANZ', nev_hu: 'Egyeztetési eltérés — eladás', egyseg: 'lei', elert: 18349, kert: 0, teljesules_pct: null, allapot: 'piros', bizalmas: true, elert_forras: 'ASM vs könyvelés', kert_megj: 'egyeztetés: 0' },
      { ho: '2026-03-01', sorrend: 3, divizio: 2, dept_code: '2.1', osztaly: null, kod: 'X', nev_hu: '<b>xss</b>', egyseg: 'db', elert: 5, kert: null, teljesules_pct: null, allapot: 'nincs_cel', bizalmas: false },
      { ho: '2026-04-01', sorrend: 1, divizio: 4, dept_code: '4.1', osztaly: null, kod: 'P_ORE', nev_hu: 'Normaóra', egyseg: 'óra', elert: null, kert: 715, allapot: 'nincs_adat' } ];
    if (u.pathname === '/rest/v1/v_kpi_honap') {
      let rows = KPI; const ho = u.searchParams.get('ho'); if (ho) rows = rows.filter(r => 'eq.' + r.ho === ho);
      if (u.searchParams.get('elert') === 'not.is.null') rows = rows.filter(r => r.elert != null);
      if (u.searchParams.get('order') === 'ho.desc') rows = [...rows].sort((a, b) => b.ho.localeCompare(a.ho));
      return json(200, rows);
    }
    if (u.pathname === '/rest/v1/v_szerelo_kpi_honap') return json(200, u.searchParams.get('ho') === 'eq.2026-03-01' ? [
      { ho: '2026-03-01', nev: 'Arnold Tamás', szerelo: '01.ARNOLD TAMAS', osztaly: 'Mecanica', ore_o2: 151.5, kuszob: 160, ore_aaa: 120, ore_eaa: 20, ore_daa: 10, ore_caa: 1.5, manopera: 26000, tarifa: 186, szamlazasi_arany: 0.79, allapot: 'sarga' },
      { ho: '2026-03-01', nev: null, szerelo: 'Y-A24 BH-99-AAA', osztaly: null, ore_o2: 2, kuszob: null, manopera: 300, allapot: 'nem_termelo' } ] : []);
    if (u.pathname === '/rest/v1/asm_import_batch') return json(200, u.searchParams.get('ho') === 'eq.2026-03-01' ? [{ id: 7, forras: 'manual', imported_at: '2026-04-03T08:12:00Z', imported_by_name: 'Teszt Ferenc', sorok: 412, parositatlan: ['99.ISMERETLEN'] }] : []);
    if (u.pathname === '/rest/v1/rpc/f_stat_szamol') return json(200, 13);
    if (u.pathname === '/auth/v1/token') {
      const b = JSON.parse(body || '{}');
      if (b.password && b.password !== 'helyes-jelszo') return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials', msg: 'Invalid login credentials' });
      return json(200, { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r1', user });
    }
    if (u.pathname === '/auth/v1/user') return json(200, user);
    if (u.pathname === '/auth/v1/logout') return json(204);
    if (u.pathname === '/rest/v1/profiles' && (req.headers.accept || '').includes('vnd.pgrst.object'))
      return json(200, { role: 'owner', full_name: 'Teszt Ferenc', must_change_password: false, employee_id: null });
    if ((req.headers.accept || '').includes('vnd.pgrst.object')) return json(406, { code: 'PGRST116', message: 'no rows' });
    if (req.method === 'POST' && !u.pathname.includes('/rpc/')) return json(201, []);
    return json(200, []);
  });
}).listen(Number(process.env.FAKE_SUPABASE_PORT || 8767), '127.0.0.1');
