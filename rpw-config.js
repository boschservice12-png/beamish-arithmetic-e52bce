// RedAssistance Paint Workflow — KÖZPONTI KONFIG (egyetlen igazságforrás)
// DB / kulcs / bucket váltás KIZÁRÓLAG ITT. Minden oldal ezt tölti be.
// v1.0 — Fázis 1 (2026-07)
window.RPW_CFG = {
  SB_URL: 'https://pxypbbvqinbwesfikkdb.supabase.co',
  SB_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eXBiYnZxaW5id2VzZmlra2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjMwNzIsImV4cCI6MjA4NjU5OTA3Mn0.WZBdbr-YBxLq1ALnHY2weFQ7j2JhUUj6hOUGkuuErnQ',
  BUCKET: 'rpw-photos'
};

// ── v1.1 — file://-őr (adatvédelem) ─────────────────────────────
// Ha az oldal LETÖLTÖTT MÁSOLATBÓL fut (file://), NEM engedünk DB-írást:
// semlegesítjük a configot (nincs Supabase-kliens) és figyelmeztetünk.
// ÉLŐ https:// oldalon EZ A BLOKK NEM FUT LE (azonnal visszatér).
(function(){
  if (location.protocol !== 'file:') return;   // <-- élő oldalon nincs hatása
  window.RPW_CFG = null;                        // nincs DB-kliens -> nincs írás
  function show(){
    if(!document.body){document.addEventListener('DOMContentLoaded',show);return;}
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;background:#FAF8F5;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:system-ui,Segoe UI,Arial,sans-serif;z-index:2147483647">'
      + '<div style="max-width:440px">'
      + '<div style="font-size:44px">&#9888;&#65039;</div>'
      + '<div style="font-size:19px;font-weight:800;color:#C81E33;margin:12px 0 6px">Copie descarcata local</div>'
      + '<div style="font-size:14px;color:#3F4956;line-height:1.6">Rulezi o copie VECHE descarcata pe calculator (file://).<br>De aici NU se scrie nimic in baza de date.<br>Deschide sistemul LIVE:</div>'
      + '<a href="https://beamish-arithmetic-e52bce.netlify.app/" style="display:inline-block;margin-top:16px;background:#E11D2E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:9px;font-weight:800;font-size:14px">Deschide site-ul live &rarr;</a>'
      + '</div></div>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
