// RedAssistance — Netlify Function: e-mail küldés a biztosítónak (Resend)
// Skálázható multi-tenant modell:
//   - From: kozponti, verifikalt domain (dosar@redassistance.com)
//   - From-nev: a szerviz neve (CONFIG.unitate-bol, kliens kuldi)
//   - Reply-To: a szerviz sajat e-mailje -> a biztosito valasza a szervizhez megy
//
// Input (POST JSON):
//   {
//     to:          "biztosito@example.com" | ["a@x.ro","b@y.ro"],
//     from_name:   "SC Szkaliczki Service SRL",
//     reply_to:    "szerviz@example.com",
//     subject:     "Nota de reconstatare — MS-12-ABC — Dosar 12345",
//     text:        "sima szoveg body",
//     html:        "<p>html body</p>"   (opcionalis),
//     attachments: [ { filename:"nota.pdf", content:"<base64>" }, ... ]
//   }
// Env: RESEND_API_KEY  (Netlify Site configuration -> Environment variables)

const RESEND_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'dosar@redassistance.com'; // verifikalt kuldo domain

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return response(200, { ok: true });
  if (event.httpMethod !== 'POST')    return response(405, { error: 'Method not allowed' });

  const key = process.env.RESEND_API_KEY;
  if (!key) return response(500, { error: 'RESEND_API_KEY lipseste (Netlify env)' });

  let p;
  try { p = JSON.parse(event.body || '{}'); }
  catch (e) { return response(400, { error: 'Invalid JSON' }); }

  if (!p.to || !p.subject) return response(400, { error: 'to + subject obligatoriu' });

  // From-nev tisztitasa (fejlec-injekcio ellen)
  const fromName = String(p.from_name || 'RedAssistance').replace(/[<>"\r\n]/g, '').trim() || 'RedAssistance';

  const payload = {
    from: fromName + ' <' + FROM_EMAIL + '>',
    to:   Array.isArray(p.to) ? p.to : [p.to],
    subject: String(p.subject).replace(/[\r\n]/g, ' ')
  };
  if (p.reply_to) payload.reply_to = String(p.reply_to).replace(/[\r\n<>]/g, '').trim();
  if (p.html)     payload.html = p.html;
  if (p.text)     payload.text = p.text;
  if (!payload.html && !payload.text) payload.text = ' ';

  // Csatolmanyok: PDF (nota) + JPG-k (fotok) — base64 content
  if (Array.isArray(p.attachments) && p.attachments.length) {
    payload.attachments = p.attachments
      .filter(function (a) { return a && a.filename && a.content; })
      .map(function (a) { return { filename: a.filename, content: a.content }; });
  }

  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(function () { return {}; });
    if (!r.ok) {
      return response(r.status, { error: (data && (data.message || data.name)) || 'Resend error', detail: data });
    }
    return response(200, { ok: true, id: data.id });
  } catch (e) {
    return response(502, { error: 'Trimitere esuata: ' + e.message });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
  };
}
