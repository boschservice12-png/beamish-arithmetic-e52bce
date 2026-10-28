// RedAssistance — Netlify Function: a publikus site (site/ro/*) űrlapjai -> e-mail a csapatnak (Resend)
// Típusok: notify (értesítés indulásról), demo (demó-kérés), signup (szerviz-regisztráció).
// A címzett FIX (LEAD_TO), a kliens nem adhatja meg -> nem használható spam-relének.
// Env: RESEND_API_KEY (kötelező), LEAD_TO (opcionális, alap: contact@redassistance.net)

const RESEND_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'dosar@redassistance.com'; // verifikalt kuldo domain (ua. mint sendmail.js)

const LABEL = { notify: 'Anunț lansare aplicație', demo: 'Cerere de demonstrație', signup: 'Înscriere service (probă 30 zile)' };
const FIELDS = { name: 'Service', email: 'E-mail', phone: 'Telefon', cui: 'CUI', firm: 'Firmă', consent: 'Acord', page: 'Pagina' };

const emailOk = v => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
const phoneOk = v => /^(\+40|0040|0)\d{9}$/.test(v);
function cuiOk(v) {
  if (!/^\d{2,10}$/.test(v)) return false;
  const ctrl = +v.slice(-1), body = v.slice(0, -1).padStart(9, '0'), key = '753217532';
  let s = 0;
  for (let i = 0; i < 9; i++) s += (+body[i]) * (+key[i]);
  let c = (s * 10) % 11; if (c === 10) c = 0;
  return c === ctrl;
}
const clean = (v, max) => String(v == null ? '' : v).replace(/[\r\n<>]/g, ' ').trim().slice(0, max);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });
  if ((event.body || '').length > 5000) return response(413, { error: 'Payload too large' });

  let p;
  try { p = JSON.parse(event.body || '{}'); }
  catch (e) { return response(400, { error: 'Invalid JSON' }); }

  // Honeypot: bot fills the hidden field -> pretend success, send nothing.
  if (p.website) return response(200, { ok: true });

  const type = p.type;
  if (!LABEL[type]) return response(400, { error: 'Unknown type' });

  const d = {
    name: clean(p.name, 120), email: clean(p.email, 160), phone: clean(p.phone, 20),
    cui: clean(p.cui, 12).replace(/^RO/i, ''), firm: clean(p.firm, 160),
    consent: p.consent === true ? 'da' : '', page: clean(p.page, 120)
  };
  const bad = [];
  if (!emailOk(d.email)) bad.push('email');
  if (type === 'notify' && !d.consent) bad.push('consent');
  if (type !== 'notify' && !d.name) bad.push('name');
  if (type === 'demo' && d.phone && !phoneOk(d.phone)) bad.push('phone');
  if (type === 'signup') {
    if (!phoneOk(d.phone)) bad.push('phone');
    if (!cuiOk(d.cui)) bad.push('cui');
    if (!d.firm) bad.push('firm');
    if (!d.consent) bad.push('consent');
  }
  if (bad.length) return response(422, { error: 'Invalid fields', fields: bad });

  const key = process.env.RESEND_API_KEY;
  if (!key) return response(500, { error: 'RESEND_API_KEY lipseste (Netlify env)' });

  const rows = Object.keys(FIELDS).filter(k => d[k]).map(k => [FIELDS[k], d[k]]);
  const subject = 'RedAssistance site · ' + LABEL[type] + ' · ' + (d.name || d.email);
  const payload = {
    from: 'RedAssistance site <' + FROM_EMAIL + '>',
    to: [process.env.LEAD_TO || 'contact@redassistance.net'],
    reply_to: d.email,
    subject: subject,
    text: rows.map(r => r[0] + ': ' + r[1]).join('\n'),
    html: '<table>' + rows.map(r => '<tr><th align="left">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>'
  };

  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return response(502, { error: 'Resend error ' + r.status });
    return response(200, { ok: true });
  } catch (e) {
    return response(502, { error: 'Trimitere esuata' });
  }
};

function response(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
