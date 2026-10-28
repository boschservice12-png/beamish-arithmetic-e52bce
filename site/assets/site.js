/* RedAssistance demo site: menu, copy buttons, conversion events, simulated lead forms. No third-party code. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CFG = window.RA || {};

  /* ---------- conversion events: names only, never personal data ---------- */
  var fired = {};
  function track(name, once) {
    if (once && fired[name]) return;
    fired[name] = true;
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ev]');
    if (a) track(a.getAttribute('data-ev'));
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menuBtn'), nav = $('#mainNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
    });
  }

  /* ---------- copy buttons ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var txt = b.getAttribute('data-copy'), old = b.textContent;
    function done() { b.textContent = 'Copiat'; setTimeout(function () { b.textContent = old; }, 1600); }
    try { navigator.clipboard.writeText(txt).then(done, function () { b.textContent = txt; }); }
    catch (_) { b.textContent = txt; }
  });

  /* ---------- validation ---------- */
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v); };
  var phoneNorm = function (v) { return v.replace(/[\s.\-()\/]/g, ''); };
  var phoneOk = function (v) { return /^(\+40|0040|0)\d{9}$/.test(phoneNorm(v)); };
  // Romanian CUI control digit (key 753217532).
  function cuiOk(v) {
    v = String(v).trim().replace(/^RO/i, '');
    if (!/^\d{2,10}$/.test(v)) return false;
    var ctrl = +v.slice(-1), body = v.slice(0, -1).padStart(9, '0'), key = '753217532', s = 0;
    for (var i = 0; i < 9; i++) s += (+body[i]) * (+key[i]);
    var c = (s * 10) % 11; if (c === 10) c = 0;
    return c === ctrl;
  }
  var RULES = {
    required: function (v) { return v ? '' : 'Completează acest câmp.'; },
    email: function (v) { return !v ? 'Scrie adresa de e-mail.' : !emailOk(v) ? 'Adresa nu pare corectă. Exemplu: nume@exemplu.ro' : ''; },
    phone: function (v) { return !v ? 'Scrie un număr de telefon.' : !phoneOk(v) ? 'Numărul trebuie să aibă 10 cifre, ex. 0740 123 456.' : ''; },
    'phone-opt': function (v) { return v && !phoneOk(v) ? 'Numărul trebuie să aibă 10 cifre, ex. 0740 123 456.' : ''; },
    cui: function (v) { return !v ? 'Scrie CUI-ul firmei.' : !cuiOk(v) ? 'CUI-ul nu trece verificarea cifrei de control. Verifică cifrele, fără „RO”.' : ''; },
    consent: function (_, el) { return el.checked ? '' : 'Bifează caseta pentru a continua.'; }
  };
  function errBox(el) {
    var f = el.closest('.field');
    return f ? $('.err', f) : $('.err[data-for="' + el.name + '"]', el.form);
  }
  function check(el) {
    var rule = el.getAttribute('data-rule');
    var msg = RULES[rule](el.type === 'checkbox' ? '' : el.value.trim(), el);
    if (msg && el.getAttribute('data-msg') && (rule === 'required' || rule === 'consent')) msg = el.getAttribute('data-msg');
    var box = errBox(el);
    if (box) {
      box.textContent = msg; box.hidden = !msg;
      if (!box.id) box.id = (el.id || el.name) + 'Err';
    }
    if (msg) { el.setAttribute('aria-invalid', 'true'); if (box) el.setAttribute('aria-describedby', box.id); }
    else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
    return !msg;
  }
  function checkAll(scope) {
    var bad = $$('[data-rule]', scope).filter(function (el) { return !check(el); });
    if (bad.length) bad[0].focus();
    return !bad.length;
  }
  // Re-validate a field once the user fixes it, not while first typing.
  document.addEventListener('input', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') check(e.target);
  });

  /* ---------- submit ---------- */
  function state(box, kind, msg) {
    box.innerHTML = '';
    if (!kind) return;
    var d = document.createElement('div');
    d.className = 'form-state ' + kind;
    if (kind === 'load') { var s = document.createElement('span'); s.className = 'spin'; d.appendChild(s); }
    var t = document.createElement('span'); t.innerHTML = msg; d.appendChild(t);
    box.appendChild(d);
  }
  var MAIL = CFG.email || 'contact@redassistance.net';
  // Kept for when a real endpoint replaces the demo send().
  var ERR = {
    net: 'Conexiunea s-a întrerupt. Datele tale au rămas în formular. Verifică internetul și apasă din nou butonul.',
    server: 'Serverul nu a putut salva cererea acum. Nu s-a trimis nimic. Încearcă din nou în câteva minute sau scrie la <a href="mailto:' + MAIL + '">' + MAIL + '</a>.'
  };
  var OK = {
    notify: 'Gata. Îți scriem o singură dată, la lansarea aplicației.',
    demo: 'Cererea a ajuns. Îți răspundem pe e-mail în 2 zile lucrătoare.',
    signup: '<strong>Înscriere primită.</strong> Verificăm datele atelierului în 2 zile lucrătoare și îți scriem pe e-mail. Proba de 30 de zile începe la activare.'
  };
  // Demo: no backend. Resolves after a short delay so the loading/success states are visible.
  function send(form) {
    return new Promise(function (res) { setTimeout(res, 900); });
  }

  $$('form[data-lead]').forEach(function (form) {
    var type = form.getAttribute('data-lead');
    var steps = +(form.getAttribute('data-steps') || 1), step = 1, busy = false;
    var box = $('.state', form), next = $('[type=submit]', form), back = $('[data-back]', form);
    var stepper = form.parentNode.querySelector('.stepper');

    function goStep(n) {
      step = n;
      $$('fieldset[data-step]', form).forEach(function (fs) { fs.hidden = +fs.getAttribute('data-step') !== n; });
      if (stepper) $$('[data-step]', stepper).forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-step') === n); });
      if (back) back.hidden = n === 1 || n > steps;
      next.textContent = n < steps ? 'Continuă' : 'Trimite înscrierea';
      var first = $('fieldset[data-step="' + n + '"] input', form);
      if (first) first.focus();
    }
    if (back) back.addEventListener('click', function () { state(box); goStep(step - 1); });
    if (type === 'signup') form.addEventListener('focusin', function () { track('start_signup', true); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      state(box);
      var scope = steps > 1 ? $('fieldset[data-step="' + step + '"]', form) : form;
      if (!checkAll(scope)) return;
      if (step < steps) { goStep(step + 1); return; }

      busy = true; next.disabled = true; if (back) back.disabled = true;
      state(box, 'load', 'Se trimite… Nu închide pagina.');
      send(form).then(function () {
        track('complete_' + type, true);
        if (steps > 1) {
          $$('fieldset[data-step]', form).forEach(function (fs) { fs.hidden = true; });
          $('[data-buttons]', form).hidden = true;
          if (stepper) $$('[data-step]', stepper).forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-step') === '3'); });
        } else {
          form.reset();
        }
        state(box, 'ok', OK[type] + (CFG.demo ? ' <em>(Demo: nimic nu a fost trimis.)</em>' : ''));
      }, function (kind) {
        state(box, 'bad', ERR[kind] || ERR.server);
      }).then(function () {
        busy = false; next.disabled = false; if (back) back.disabled = false;
      });
    });
  });

  if (/service-auto/.test(location.pathname)) track('view_service', true);
})();
