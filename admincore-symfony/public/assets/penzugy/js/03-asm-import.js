/* ==== ASM-import → adatbázis (f_asm_import) + hiányzó havi import figyelmeztetés ====
   A panel saját importja (applyAsmData) változatlanul fut és a panelt tölti; ez a réteg utána ugyanazokat
   a fájlokat (asmParsed) az adatbázisba is betölti egyetlen hívással:
     köteg (asm_import_batch) → tételek (asm_manopera_tetel) → havi jelentés (finance_havi_snapshot)
     → szerelőnkénti KPI + óra-mezők (f_asm_rollup).
   Forrás most 'manual'; az automatikus ASM-API ugyanezt a függvényt hívja majd 'api' forrással, ugyanezzel a formátummal. */
(function () {
  'use strict';
  var TIPUSOK = ['AAA', 'EAA', 'DAA', 'CAA'];
  var HONAP = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

  function norm(h) { return String(h || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function num(v) { return typeof v === 'number' ? v : (parseFloat(String(v || '0').replace(/[^\d.\-]/g, '')) || 0); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function toDate(v) {
    if (v instanceof Date && !isNaN(v)) return v;
    if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400000));     // Excel sorszám
    var s = String(v || '').trim(), m;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/))) return new Date(+m[3], +m[2] - 1, +m[1]);
    if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/))) return new Date(+m[3], +m[1] - 1, +m[2]);
    return null;
  }

  /** PersonalManopere sorai az adatbázis formátumában (ugyanazok az oszlopfelismerések, mint a panelben). */
  function persSorok(rows) {
    var ci = {};
    rows[0].forEach(function (h, i) {
      var l = norm(h);
      if (l.includes('nume mecanic')) ci.mech = i;
      if (l.includes('data exec')) ci.data = i;
      if (l.includes('nr. deviz')) ci.deviz = i;
      if (l.includes('stare deviz')) ci.stare = i;
      if (l.includes('val. f. tva') || l.includes('val. fara tva')) ci.netto = i;
      if (l.includes('norma de timp') && !l.includes('total')) ci.ore = i;
      if (l.includes('tarif')) ci.tarif = i;
      if (l.includes('categorie')) ci.cat = i;
      if (l.includes('descriere')) ci.desc = i;
      if (l.includes('inmatr')) ci.rsz = i;
      if (l === 'auto' || l.includes('marca') || l.includes('vehicul')) ci.auto = i;
      if (l.includes('cant')) ci.cant = i;
    });
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i], mech = String(r[ci.mech] || '');
      if (!mech || mech.includes('Lista mecanicilor')) continue;
      var deviz = String(r[ci.deviz] || ''), pfx = deviz.substring(0, 3).toUpperCase(), d = toDate(r[ci.data]);
      out.push({
        deviz_nr: deviz, data_exec: d ? iso(d) : null, asm_nev: mech,
        descriere: ci.desc !== undefined ? String(r[ci.desc] || '') : null,
        rendszam: ci.rsz !== undefined ? String(r[ci.rsz] || '') : null,
        auto: ci.auto !== undefined ? String(r[ci.auto] || '') : null,
        categorie: ci.cat !== undefined ? String(r[ci.cat] || '') : null,
        stare_deviz: ci.stare !== undefined ? String(r[ci.stare] || '') : null,
        cant: ci.cant !== undefined ? num(r[ci.cant]) : null,
        norma_ora: ci.ore !== undefined ? num(r[ci.ore]) : 0,
        tarif: ci.tarif !== undefined ? num(r[ci.tarif]) : null,
        val_manopera: ci.netto !== undefined ? num(r[ci.netto]) : 0,
        tip: TIPUSOK.indexOf(pfx) !== -1 ? pfx : 'ALT'
      });
    }
    return out;
  }

  /** Év: a tételek leggyakoribb éve (a panel csak a hónapot ismeri fel). */
  function evMeghatarozas(sorok, honap) {
    var db = {};
    sorok.forEach(function (s) { if (s.data_exec && +s.data_exec.substring(5, 7) - 1 === honap) { var y = s.data_exec.substring(0, 4); db[y] = (db[y] || 0) + 1; } });
    var best = Object.keys(db).sort(function (a, b) { return db[b] - db[a]; })[0];
    return best ? +best : new Date().getFullYear();
  }

  async function betoltes() {
    var F = window.RA_FIN;
    if (!F || !F.ready) { alert('A panel importja kész, de az adatbázisba NEM került: nincs belépve vagy nincs jogosultság.'); return; }
    try {
      var stat = parseStatVanzari(asmParsed.stat);
      if (stat.month < 0) return;
      var sorok = asmParsed.pers ? persSorok(asmParsed.pers) : [];
      var ev = evMeghatarozas(sorok, stat.month);
      var diszkont = stat.txns.reduce(function (s, t) { return s + (t.dS || 0) + (t.dA || 0); }, 0);
      var osszesitok = { total: stat.total, atelier: stat.atelier, transport: stat.transport, diszkont: diszkont };
      var fajlok = {}; Object.keys(asmFiles).forEach(function (k) { if (asmFiles[k]) fajlok[k] = asmFiles[k]; });
      F.status('☁ ASM-import az adatbázisba… (' + sorok.length + ' sor)');
      var r = await F.client().rpc('f_asm_import', {
        p_ho: ev + '-' + String(stat.month + 1).padStart(2, '0') + '-01', p_forras: 'manual',
        p_fajlok: fajlok, p_osszesitok: osszesitok, p_sorok: sorok
      });
      if (r.error) throw r.error;
      var x = r.data || {}, j = x.jelentes || {};
      F.status('☁ ASM ' + HONAP[stat.month] + ' ' + ev + ' → adatbázis: ' + x.sorok + ' sor, havi jelentés frissítve (köteg #' + x.batch + ')');
      var figy = [];
      if (x.parositatlan && x.parositatlan.length) figy.push('Dolgozóhoz NEM párosított ASM-nevek (a KPI-ból kimaradnak): ' + x.parositatlan.join(', '));
      if (x.honapon_kivuli_sor) figy.push(x.honapon_kivuli_sor + ' sor dátuma nem ' + HONAP[stat.month] + ' — ezek ebben a hónapban nem számítanak.');
      alert('✓ ASM-import az adatbázisba: ' + HONAP[stat.month] + ' ' + ev + '\n' +
        '• ' + x.sorok + ' tétel, ' + (j.factura_db || 0) + ' számla\n' +
        '• munkadíj ' + Math.round(j.bevetel_munkadij || 0) + ' RON, fedezet ' + Math.round(j.fedezet || 0) + ' RON\n' +
        '• normaóra ' + (j.normaora_osszes || 0) + ', realizált tarifa ' + (j.realizalt_tarifa || '—') + ' RON/óra' +
        (figy.length ? '\n\n⚠ ' + figy.join('\n⚠ ') : ''));
      ellenorzes();
    } catch (e) {
      F.status('⚠ ASM-import az adatbázisba sikertelen: ' + (e.message || e) + ' — a panelben megvan, próbáld újra.', true);
      alert('⚠ Az ASM-adatok a panelben megvannak, de az adatbázisba NEM kerültek:\n' + (e.message || e));
    }
  }

  // A panel saját importja után
  var origApply = applyAsmData;
  applyAsmData = function () {
    var res = origApply.apply(this, arguments);
    if (asmParsed && asmParsed.stat) betoltes();
    return res;
  };
  window.applyAsmData = applyAsmData;

  /** Hiányzó import: a hónap 5. napjától figyelmeztet, ha az előző havi ASM-import nincs az adatbázisban. */
  async function ellenorzes() {
    var F = window.RA_FIN; if (!F || !F.ready) return;
    var ma = new Date(), elozo = new Date(ma.getFullYear(), ma.getMonth() - 1, 1);
    var ho = iso(elozo).substring(0, 8) + '01';
    var r = await F.client().from('asm_import_batch').select('id,ho,forras,imported_at,imported_by_name').eq('ho', ho).order('id', { ascending: false }).limit(1);
    var el = document.getElementById('asmImportFigyelo');
    if (!el) {
      el = document.createElement('div'); el.id = 'asmImportFigyelo';
      el.style.cssText = 'margin:8px 24px 0;padding:9px 14px;border-radius:10px;font:600 13px system-ui;display:none';
      var host = document.querySelector('header') || document.body.firstElementChild;
      if (host && host.parentNode) host.parentNode.insertBefore(el, host.nextSibling); else document.body.prepend(el);
    }
    if (r.error) return;
    if (r.data && r.data.length) { el.style.display = 'none'; return; }
    if (ma.getDate() >= 5) {
      el.style.display = 'block'; el.style.background = '#FFEBEE'; el.style.color = '#B71C1C'; el.style.border = '1px solid #EF9A9A';
      el.textContent = '⚠ Hiányzik a ' + HONAP[elozo.getMonth()] + ' ' + elozo.getFullYear() + '-i ASM-import — a havi jelentés és a szerelő-KPI nem frissült. Import ASM → 6 fájl.';
    }
  }
  document.addEventListener('ra-fin-ready', ellenorzes);
  if (window.RA_FIN && window.RA_FIN.ready) ellenorzes();
})();
