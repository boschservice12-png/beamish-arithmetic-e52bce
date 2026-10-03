/* ==== Pénzügyi panel ↔ adatbázis szinkron (finance_panel_state) ====
   A panel saját kódja (01-app.js) változatlan: továbbra is a böngésző tárhelyére ment (saveAllData),
   ez a réteg utána az adatbázisba is menti, verziózva, és induláskor onnan tölt.
   - Belépés: ugyanaz a Supabase-fiók, mint az AdminCore-ban (ugyanazon a domainen közös munkamenet).
   - Hozzáférés: csak iroda (owner, admin, reception) — az adatbázis RLS-e kényszeríti ki, itt csak jelezzük.
   - Ütközés: ha közben más mentett, nem írjuk felül; figyelmeztetünk, frissítés után az ő verziója jön be.
   - Minden mentés új verzió (append-only) → bármikor visszaállítható, látszik ki és mikor mentett. */
(function () {
  'use strict';
  var CFG = window.ADMINCORE_CFG || {};
  var TABLE = 'finance_panel_state';
  var PUSH_EVERY_MS = 3000;           // legfeljebb 3 mp-enként egy verzió (gépelés közben ne legyen 100 sor); bezáráskor azonnal
  var PAGE_START = performance.timeOrigin || Date.now();
  var OFFICE = ['owner', 'admin', 'reception'];
  var sb = null, me = null, baseId = null, pushTimer = null, lastPush = 0, dirty = false, blocked = false;

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(ts) { try { return new Date(ts).toLocaleString('hu-HU', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ts; } }

  function status(txt, bad) {
    var s = document.getElementById('dbSyncStatus');
    if (!s) {
      var host = document.getElementById('saveStatus');
      s = el('<span id="dbSyncStatus" style="margin-left:10px;font-size:12px"></span>');
      if (host && host.parentNode) host.parentNode.insertBefore(s, host.nextSibling); else document.body.appendChild(s);
    }
    s.textContent = txt;
    s.style.color = bad ? '#C62828' : '#2E7D32';
  }

  function overlay(inner) {
    var o = document.getElementById('dbSyncOverlay');
    if (!o) {
      o = el('<div id="dbSyncOverlay" style="position:fixed;inset:0;z-index:99999;background:rgba(244,241,236,.97);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif"></div>');
      document.body.appendChild(o);
    }
    o.innerHTML = '<div style="background:#fff;border:1px solid #D7DBE2;border-radius:16px;padding:28px 30px;width:min(400px,92vw);box-shadow:0 10px 40px rgba(0,0,0,.08)">' +
      '<div style="color:#E53935;font-weight:800;letter-spacing:.12em;font-size:12px">PÉNZÜGY · PANOU DE CONTROL</div>' + inner + '</div>';
    return o;
  }
  function closeOverlay() { var o = document.getElementById('dbSyncOverlay'); if (o) o.remove(); }

  function loginScreen(msg) {
    var o = overlay('<h2 style="font-size:20px;margin:6px 0 14px;color:#0F141A">Bejelentkezés</h2>' +
      '<input id="dbsEmail" type="email" autocomplete="username" placeholder="E-mail" style="width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:11px;border:1px solid #D7DBE2;border-radius:9px;margin-bottom:10px">' +
      '<input id="dbsPass" type="password" autocomplete="current-password" placeholder="Jelszó" style="width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:11px;border:1px solid #D7DBE2;border-radius:9px;margin-bottom:12px">' +
      '<button id="dbsGo" style="width:100%;background:#E53935;color:#fff;border:0;border-radius:9px;padding:12px;font:600 15px system-ui;cursor:pointer">Belépés</button>' +
      '<div id="dbsErr" style="color:#C62828;font-size:13px;margin-top:10px;min-height:18px">' + esc(msg || '') + '</div>');
    var go = async function () {
      o.querySelector('#dbsErr').textContent = 'Bejelentkezés…';
      var r = await sb.auth.signInWithPassword({ email: o.querySelector('#dbsEmail').value.trim(), password: o.querySelector('#dbsPass').value });
      if (r.error) { o.querySelector('#dbsErr').textContent = 'Hibás e-mail vagy jelszó.'; return; }
      start();
    };
    o.querySelector('#dbsGo').onclick = go;
    o.querySelector('#dbsPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    o.querySelector('#dbsEmail').focus();
  }

  async function latest() {
    var r = await sb.from(TABLE).select('id,data,saved_at,saved_by_name').order('id', { ascending: false }).limit(1);
    if (r.error) throw r.error;
    return r.data && r.data[0] ? r.data[0] : null;
  }

  function applyState(row) {
    // a panel saját betöltőjét használjuk: a tárhelyre tesszük, majd loadAllData() + újrarajzolás
    localStorage.setItem(STORAGE_KEY, JSON.stringify(row.data));
    loadAllData();
    try { renderSumar(); render(); } catch (e) { console.warn('[db-sync] újrarajzolás', e); }
    baseId = row.id;
    status('☁ Adatbázis: v' + row.id + ' · ' + (row.saved_by_name || '') + ' · ' + fmt(row.saved_at));
  }

  async function push() {
    if (blocked || !dirty) return;
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var cur = await latest();
      if (cur && cur.id !== baseId) {
        blocked = true;
        status('⚠ Közben ' + (cur.saved_by_name || 'más') + ' mentett (' + fmt(cur.saved_at) + '). Frissítsd az oldalt — a te módosításod NEM került az adatbázisba.', true);
        return;
      }
      var r = await sb.from(TABLE).insert({ data: JSON.parse(raw), saved_by_name: me.full_name || null, client_saved_at: new Date().toISOString() })
        .select('id,saved_at').single();
      if (r.error) throw r.error;
      baseId = r.data.id; dirty = false; lastPush = Date.now();
      status('☁ Mentve az adatbázisba: v' + r.data.id + ' · ' + fmt(r.data.saved_at));
    } catch (e) {
      status('⚠ Adatbázis-mentés sikertelen: ' + (e.message || e) + ' — a böngészőben megvan, újrapróbálom.', true);
      schedulePush();
    }
  }

  function savedBeforeThisVisit() {
    try {
      var d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return !!(d && d.savedAt && new Date(d.savedAt).getTime() < PAGE_START - 1000);
    } catch (e) { return false; }
  }

  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, Math.max(1500, PUSH_EVERY_MS - (Date.now() - lastPush)));
  }

  // A panel saveAllData()-ja után az adatbázisba is
  var origSave = saveAllData;
  saveAllData = function () {
    origSave.apply(this, arguments);
    if (sb && me && !blocked) { dirty = true; schedulePush(); }
  };
  // oldal elhagyásakor ne vesszen el az utolsó módosítás
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && dirty) push(); });

  async function start() {
    var s = await sb.auth.getSession();
    if (!s.data.session) { loginScreen(); return; }
    var p = await sb.from('profiles').select('role,full_name').eq('id', s.data.session.user.id).single();
    me = p.data || {};
    if (OFFICE.indexOf(me.role) === -1) {
      overlay('<h2 style="font-size:19px;margin:8px 0">Nincs jogosultságod</h2><p style="color:#5C6571;line-height:1.5">A pénzügyi panelt csak az iroda (owner, admin, recepció) látja.</p>' +
        '<button id="dbsOut" style="margin-top:8px;background:#fff;border:1px solid #D7DBE2;border-radius:9px;padding:10px 16px;cursor:pointer">Kilépés</button>');
      document.getElementById('dbsOut').onclick = async function () { await sb.auth.signOut(); location.reload(); };
      return;
    }
    closeOverlay();
    try {
      var row = await latest();
      if (row) { applyState(row); return; }
      // Az adatbázis még üres: ha ebben a böngészőben a megnyitás ELŐTT is voltak adatok, felajánljuk a feltöltést
      // (egyszeri átköltöztetés). A panel induláskor magától is ment — azok csak az alapértékek, azt nem ajánljuk fel.
      if (savedBeforeThisVisit() && confirm('Az adatbázisban még nincs pénzügyi adat.\nFeltöltsem az ebben a böngészőben lévő adatokat?')) {
        dirty = true; baseId = null; lastPush = 0; await push();
      } else {
        status('☁ Adatbázis üres — az első mentéssel jön létre');
      }
    } catch (e) {
      status('⚠ Adatbázis nem érhető el: ' + (e.message || e) + ' — a böngészőben dolgozol tovább.', true);
    }
  }

  if (!window.supabase || !CFG.supabaseUrl) { status('⚠ Adatbázis-kapcsolat nincs beállítva', true); return; }
  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
  start();
})();
