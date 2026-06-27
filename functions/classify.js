// RedAssistance Paint Workflow — Netlify Function: CLASSIFY
// AI kép-klasszifikáció. Kap 1 képet → eldönti hogy melyik típus:
// talon | buletin | constatare | foto_auto_fata | foto_auto_spate | foto_auto_lateral | foto_elem | altceva
//
// Input:  { image: base64_nyers (jpg/png) }
// Output: { type: 'talon'|'buletin'|..., confidence: 0-1, label: 'descriere' }

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 200;

const CLASSIFY_PROMPT = `Analizeaza aceasta imagine. Este un document sau fotografie dintr-un service auto.

Identifica categoria cea mai potrivita din lista de mai jos si returneaza DOAR JSON valid, fara explicatii:

{
  "type": "talon" | "buletin" | "constatare" | "foto_fata" | "foto_spate" | "foto_lateral_stg" | "foto_lateral_dr" | "foto_elem" | "altceva",
  "confidence": 0.0-1.0,
  "label": "descriere scurta in romana"
}

CATEGORIILE:
- "talon" = Certificat de inmatriculare romanesc (vehicul). Contine campuri A, B, D.1, D.3, E (VIN), C.2.1 (proprietar).
- "buletin" = Carte de identitate romaneasca (persoana). Contine nume, CNP, adresa.
- "constatare" = Constatare amiabila, Proces verbal de dauna, sau Deviz asigurator. Contine nr. dosar, asigurator, lista daune.
- "foto_fata" = Fotografie auto din fata (bara fata + far + capota vizibile)
- "foto_spate" = Fotografie auto din spate (bara spate + lampa + portbagaj)
- "foto_lateral_stg" = Fotografie auto din lateral stang (usi, aripi pe stanga)
- "foto_lateral_dr" = Fotografie auto din lateral drept
- "foto_elem" = Fotografie unui element (zoom pe o piesa: bara, aripa, usa, far, etc.)
- "altceva" = Orice altceva (permis, polita, factura, selfie, etc.)

REGULI:
1. Daca identifici clar un document romanesc oficial (talon/buletin/constatare), confidence > 0.8
2. Daca este o foto auto dar nu e clar din ce unghi, foloseste "foto_elem" cu confidence 0.5
3. Nu fi prea optimist cu confidence — doar peste 0.85 daca esti sigur.

DOAR JSON.`;

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };
  }

  try {
    const { image } = JSON.parse(event.body || '{}');
    if (!image) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing image' }) };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
    }

    // base64 tisztitas (data:image/jpeg;base64, prefixet levesszuk ha van)
    const cleanImage = image.replace(/^data:image\/\w+;base64,/, '');

    const body = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cleanImage } },
          { type: 'text', text: CLASSIFY_PROMPT }
        ]
      }]
    };

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic error:', res.status, err);
      return { statusCode: res.status, headers, body: JSON.stringify({ error: 'AI API error', detail: err }) };
    }

    const data = await res.json();
    const textContent = data.content?.[0]?.text || '';

    // JSON kinyeres
    let parsed;
    try {
      const match = textContent.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { type: 'altceva', confidence: 0, label: 'Nerecunoscut' };
    } catch (e) {
      parsed = { type: 'altceva', confidence: 0, label: 'Parse error' };
    }

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (err) {
    console.error('Handler error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', detail: String(err.message || err) }) };
  }
};
