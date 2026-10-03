
// === STATE ===
let period = 'luna';
let currentPage = 'sumar';
let currentDept = 'tehnic';
let currentMonth = new Date().getMonth();
let showAnualStats = false;

// Munkanapok per hónap — szerkeszthető
let munkanapok = [21, 20, 22, 21, 20, 21, 23, 21, 22, 22, 20, 22]; // Ian-Dec 2026

// Plan targets — ÉVES célszámok, automatikusan lebontva napi/heti/havi
let planTargets = {
  forgalom: 1500000,
  manopera: 600000,
  piese: 300000,
  cheltuieli: 240000,
  salarii: 360000,
  // régi kompatibilitás
  ebitda: 5000000,
  venituri: 7000000,
  costuri: 2000000
};

// Kapacitás paraméterek per departament
let kapacitas = {
  tarifOra: 186,
  oreZi: 8,
  minOrePost: 140,   // minimum ore/post de lucru/lună — alatta piros
  maxOrePost: 160,   // 140-160 sárga, 160+ zöld
  medianTarif: 186,
  depts: {
    tehnic:    { angajati: 6, posztok: 6, label: 'Tehnic (Mecanică)', sector: 'prod' },
    body:      { angajati: 1, posztok: 1, label: 'Body (Tinichigerie)', sector: 'prod' },
    paint:     { angajati: 2, posztok: 2, label: 'Paint (Vopsitorie)', sector: 'prod' },
    transport: { angajati: 1, posztok: 1, label: 'Transport', sector: 'prod' },
    rentacar:  { angajati: 0, posztok: 0, label: 'Rent a Car', sector: 'prod' },
    admin:     { angajati: 2, posztok: 0, label: 'Admin', nonprod: true, sector: 'admin' },
    auxiliar:  { angajati: 1, posztok: 0, label: 'Auxiliar', nonprod: true, sector: 'auxiliar', sporolas: 0 }
  }
};

// Venituri cu 12 luni de date (0=Ian, 11=Dec)
// Datele se completează automat prin Import ASM
let venituri = {
  tehnicFacturat: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  tehnicProforma: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  bodyFacturat: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  bodyProforma: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  paintFacturat: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  paintProforma: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  transportFacturat: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  transportProforma: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  rentacarFacturat: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  rentacarProforma: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  admin: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  auxiliar: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  garantii: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  alteVenituri: Array(12).fill(0).map(() => ({p: 0, r: 0})),
  comertPiese: Array(12).fill(0).map(() => ({p: 0, r: 0}))
};

// Facturi cu 12 luni de date
let facturi = [
  {
    id: 1,
    dept: 'tehnic',
    nume: 'Electricitate',
    months: Array(12).fill(0).map(() => ({p: 0, r: 0}))
  },
  {
    id: 2,
    dept: 'tehnic',
    nume: 'Apă',
    months: Array(12).fill(0).map(() => ({p: 0, r: 0}))
  }
];

// Angajati cu 12 luni de date
let angajati = [];

// Cash Flow — Sold + Facturat/Platit per hónap
let cfSoldInitial = 0; // Sold la 1 Ianuarie
let cfMonths = Array(12).fill(0).map(() => ({facturat: 0, platit: 0, achizitiiPiese: 0, nManop: 0, artNyer: 0, eaaManop: 0, daaManop: 0}));

// Achiziții részletes lista (importált)
let cfAchizitii = []; // [{data, doc, valoare, tva, sumaPos}]
let cfSinteza = Array(12).fill(0).map(() => ({
  // BEVÉTELEK
  incasariBank: 0,    // 5121 ← 4111 (ügyfelek fizettek bankra)
  incasariCasa: 0,    // 5311 ← 4111 (ügyfelek fizettek pénztárba)
  alteBevételek: 0,   // 5121 ← egyéb (társasági, hitel)
  // KIADÁSOK
  platiPiese: 0,      // 401 → 5121/5311 (szállítók - piese)
  platiSalarii: 0,    // 421 → 5121/5311 (bérek)
  platiTaxe: 0,       // 4315+436+4423+4426 → 5121 (adók, járulékok, TVA)
  platiHitel: 0,      // 5191+1621 → 5121 (hitel/leasing)
  platiAlte: 0,       // egyéb kiadások (627, 6581, 604, stb)
  transferuri: 0,     // 581 → 5121 (belső átutalás)
  imported: false
}));

// planTargets is defined above in STATE section

let nextFacturaId = 3;
let nextAngajatId = 2;

const venituriCats = [
  {id: 'tehnicFacturat', n: 'Tehnic — Facturat', i: '', c: '#1e293b'},
  {id: 'tehnicProforma', n: 'Tehnic — Proformă', i: '', c: '#1e293b'},
  {id: 'bodyFacturat', n: 'Body — Facturat', i: '', c: '#1e293b'},
  {id: 'bodyProforma', n: 'Body — Proformă', i: '', c: '#1e293b'},
  {id: 'paintFacturat', n: 'Paint — Facturat', i: '', c: '#1e293b'},
  {id: 'paintProforma', n: 'Paint — Proformă', i: '', c: '#1e293b'},
  {id: 'transportFacturat', n: 'Transport — Facturat', i: '', c: '#1e293b'},
  {id: 'transportProforma', n: 'Transport — Proformă', i: '', c: '#1e293b'},
  {id: 'rentacarFacturat', n: 'Rent a Car — Facturat', i: '', c: '#1e293b'},
  {id: 'rentacarProforma', n: 'Rent a Car — Proformă', i: '', c: '#1e293b'},
  {id: 'admin', n: 'Admin', i: '', c: '#1e293b'},
  {id: 'auxiliar', n: 'Auxiliar', i: '', c: '#1e293b'},
  {id: 'garantii', n: 'Garanții', i: '', c: '#1e293b'},
  {id: 'alteVenituri', n: 'Alte Venituri', i: '', c: '#1e293b'},
  {id: 'comertPiese', n: 'Comerț cu Piese', i: '', c: '#1e293b'}
];

const depts = [
  // CONDUCERE
  {id: 'conducere', n: 'Conducere', i: '🏢', c: '#1e293b', group: 'conducere', groupLabel: 'CONDUCERE'},
  // AUXILIAR
  {id: 'hr', n: 'HR', i: '👥', c: '#8b5cf6', group: 'auxiliar', groupLabel: 'AUXILIAR'},
  {id: 'marketing', n: 'Marketing', i: '📣', c: '#ec4899', group: 'auxiliar'},
  {id: 'finante', n: 'Finanțe', i: '💰', c: '#f59e0b', group: 'auxiliar'},
  // PRODUCȚIE
  {id: 'tehnic', n: 'Tehnic', i: '🔧', c: '#c84040', group: 'productie', groupLabel: 'PRODUCȚIE'},
  {id: 'body', n: 'Body', i: '🛠', c: '#c84040', group: 'productie'},
  {id: 'paint', n: 'Paint', i: '🎨', c: '#c84040', group: 'productie'},
  {id: 'transport', n: 'Transport', i: '🚛', c: '#06b6d4', group: 'productie'},
  // REVIZIE
  {id: 'revizie', n: 'Revizie', i: '✅', c: '#10b981', group: 'revizie', groupLabel: 'REVIZIE'},
  // VÂNZĂRI
  {id: 'vanzari', n: 'Vânzări', i: '📊', c: '#3b82f6', group: 'vanzari', groupLabel: 'VÂNZĂRI'}
];

// === HELPERS ===
const fmt = (n) => new Intl.NumberFormat('ro-RO').format(Math.round(n));

// Periódus számítás munkanapok alapján
const totalMunkanapok = () => munkanapok.reduce((s, n) => s + n, 0);
const currentMunkanapok = () => munkanapok[currentMonth];

// Éves realizat → periódus lebontás
const toPeriod = (yearVal) => {
  const totalDays = totalMunkanapok();
  const daily = totalDays > 0 ? yearVal / totalDays : 0;
  switch(period) {
    case 'zi': return daily;
    case 'saptamana': return daily * 5;
    case 'luna': return daily * currentMunkanapok();
    case 'an': return yearVal;
    default: return daily * currentMunkanapok();
  }
};

const periodLabel = () => {
  switch(period) {
    case 'zi': return 'ZI';
    case 'saptamana': return 'SĂPTĂMÂNĂ';
    case 'luna': return months[currentMonth].toUpperCase();
    case 'an': return 'AN';
    default: return 'LUNĂ';
  }
};

const updateTimestamp = () => {
  const now = new Date();
  document.getElementById('saveStatus').textContent = 
    `${now.toLocaleTimeString('ro-RO')}`;
};

// === GANTT — Műhely Programozás ===
let munkaordine = [];
let ganttDate = new Date();
let gantt30 = false;
let nextWoId = 1;
let ganttStartH = 7, ganttEndH = 17;

// Szerelők listája (termelő)
function getGanttMechs() {
  const exclude = ['transport','rentacar','admin','auxiliar'];
  const deptOrder = {tehnic:1,lacatus:2,body:2,paint:3};
  return angajati.filter(a => {
    if((a.nume||'').match(/Y.?A24|RENT/i)) return false;
    return !exclude.includes(a.dept);
  }).sort((a,b) => (deptOrder[a.dept]||9) - (deptOrder[b.dept]||9));
}

function getPosztok() {
  const p = [];
  Object.keys(kapacitas.depts).forEach(dk => {
    const d = kapacitas.depts[dk];
    if(d.nonprod) return;
    for(let i=1; i<=d.posztok; i++) p.push({id:dk+'-'+i, dept:dk, label:d.label+' '+i});
  });
  return p;
}

let ganttView = 'zi'; // 'zi' | 'sapt' | 'luna'
let cheltFilter = 'all'; // 'all' | 'fix' | 'flex'
let achGrup = 'all'; // 'all' | 'rulaj' | 'tehnic' | 'body' | 'transport' | 'admin' | 'auxiliar' | 'rentacar' | 'garantii'

function setCheltFilter(f) { cheltFilter = f; renderCheltuieli(); }
function setAchGrup(g) { achGrup = g; renderCheltuieli(); }
window.setCheltFilter = setCheltFilter;
window.setAchGrup = setAchGrup;

function setGanttView(v) { ganttView = v; renderGantt(); }
function ganttPrev() {
  if(ganttView==='zi') ganttDate.setDate(ganttDate.getDate()-1);
  else if(ganttView==='sapt') ganttDate.setDate(ganttDate.getDate()-7);
  else ganttDate.setMonth(ganttDate.getMonth()-1);
  renderGantt();
}
function ganttNext() {
  if(ganttView==='zi') ganttDate.setDate(ganttDate.getDate()+1);
  else if(ganttView==='sapt') ganttDate.setDate(ganttDate.getDate()+7);
  else ganttDate.setMonth(ganttDate.getMonth()+1);
  renderGantt();
}
function ganttToday() { ganttDate = new Date(); renderGantt(); }
function ganttToggle30() { gantt30 = !gantt30; renderGantt(); }

// Státusz szín — fokozatos sötétedés
function woColor(wo) {
  if(wo.status==='lefoglalt'||wo.status==='programat'||wo.status==='receptie') return {bg:'#fef3c7',border:'#f59e0b',text:'#92400e',label:'LEFOGLALT',level:1};
  if(wo.status==='kiosztott'||wo.status==='in_lucru') return {bg:'#fed7aa',border:'#ea580c',text:'#9a3412',label:'KIOSZTOTT',level:2};
  if(wo.status==='lezart'||wo.status==='finalizat') return {bg:'#fecaca',border:'#dc2626',text:'#991b1b',label:'LEZÁRT',level:3};
  if(wo.status==='leszamlazott'||wo.status==='proforma'||wo.status==='facturat') return {bg:'#c4b5a0',border:'#78350f',text:'#451a03',label:'LESZÁMLÁZOTT',level:4};
  if(wo.status==='kesz'||wo.status==='livrat') return {bg:'#334155',border:'#0f172a',text:'#f8fafc',label:'KÉSZ',level:5};
  return {bg:'#fef3c7',border:'#f59e0b',text:'#92400e',label:'LEFOGLALT',level:1};
}

// Receptie: új deviz
function openAddWO() {
  const ov=document.createElement('div');ov.className='asm-ov';ov.id='woModal';
  const mechs = getGanttMechs();
  const posztok = getPosztok();
  const dStr = ganttDate.toISOString().split('T')[0];
  
  let h='<div class="asm-mod" style="max-width:560px;">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--red);">';
  h+='<div style="font-size:1rem;font-weight:800;color:var(--dark);">Comanda noua</div>';
  h+='<button onclick="document.getElementById(\'woModal\').remove()" style="background:var(--red);color:#fff;border:none;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:.72rem;font-weight:700;font-family:inherit;">Inchide</button></div>';
  
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Nr. Deviz</div><input id="woDeviz" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;" placeholder="AAA031456"></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Client</div><input id="woClient" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;" placeholder="Pop Ioan"></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Auto</div><input id="woAuto" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;" placeholder="BMW X5"></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Nr. inmatriculare</div><input id="woNrAuto" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;" placeholder="MS-01-ABC"></div>';
  h+='</div>';
  
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Descriere lucrare</div><input id="woDesc" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;margin-bottom:8px;" placeholder="Distributie + revizie"></div>';
  
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:8px;">';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Norma (h)</div><input id="woOre" type="number" value="2" step="0.5" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;"></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Mecanic</div><select id="woMech" style="width:100%;padding:4px;font-size:.72rem;border:1px solid var(--border);border-radius:4px;"><option value="">-- alege --</option>'+mechs.map(function(m){return '<option value="'+m.nume+'">'+m.nume+'</option>';}).join('')+'</select></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Post lucru</div><select id="woPost" style="width:100%;padding:4px;font-size:.72rem;border:1px solid var(--border);border-radius:4px;"><option value="">-- alege --</option>'+posztok.map(function(p){return '<option value="'+p.id+'">'+p.label+'</option>';}).join('')+'</select></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Prioritate</div><select id="woPrio" style="width:100%;padding:4px;font-size:.72rem;border:1px solid var(--border);border-radius:4px;"><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="low">Low</option></select></div>';
  h+='</div>';
  
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Data</div><input id="woData" type="date" value="'+dStr+'" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;"></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Ora start</div><input id="woOraS" type="time" value="08:00" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;"></div>';
  h+='<div><div style="font-size:.55rem;color:var(--muted);margin-bottom:1px;">Valoare (RON)</div><input id="woVal" type="number" value="0" style="width:100%;padding:4px 6px;font-size:.78rem;border:1px solid var(--border);border-radius:4px;"></div>';
  h+='</div>';
  
  h+='<div style="display:flex;justify-content:space-between;">';
  h+='<button onclick="saveNewWO(\'receptie\')" style="padding:6px 16px;background:var(--bg);border:1px solid var(--border);border-radius:10px;cursor:pointer;font-size:.72rem;font-weight:600;font-family:inherit;color:var(--muted);">Doar receptie</button>';
  h+='<button onclick="saveNewWO(\'programat\')" style="padding:6px 20px;background:var(--red);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:.78rem;font-weight:700;font-family:inherit;">Programeaza</button>';
  h+='</div></div>';
  ov.innerHTML=h;document.body.appendChild(ov);
}

function saveNewWO(initStatus) {
  const ore = Number(document.getElementById('woOre').value)||2;
  const oraS = document.getElementById('woOraS').value||'08:00';
  const sh = parseInt(oraS.split(':')[0]), sm = parseInt(oraS.split(':')[1]||0);
  const totalMin = sh*60 + sm + ore*60;
  const eh = Math.floor(totalMin/60), em = Math.round(totalMin%60);
  const oraE = String(eh).padStart(2,'0')+':'+String(em).padStart(2,'0');
  
  munkaordine.push({
    id: 'WO-'+nextWoId++,
    devizNr: document.getElementById('woDeviz').value||'',
    client: document.getElementById('woClient').value||'',
    auto: document.getElementById('woAuto').value||'',
    nrAuto: document.getElementById('woNrAuto').value||'',
    desc: document.getElementById('woDesc').value||'',
    normaTimp: ore,
    mechanic: document.getElementById('woMech').value||'',
    postLucru: document.getElementById('woPost').value||'',
    data: document.getElementById('woData').value||ganttDate.toISOString().split('T')[0],
    oraStart: oraS,
    oraEnd: oraE,
    prioritate: document.getElementById('woPrio').value||'normal',
    status: initStatus||'receptie',
    valoare: Number(document.getElementById('woVal').value)||0,
    createdAt: new Date().toISOString()
  });
  document.getElementById('woModal').remove();
  renderGantt(); scheduleSave();
}

function updateWoStatus(woId, newStatus) {
  const wo = munkaordine.find(function(w){return w.id===woId;});
  if(wo) wo.status = newStatus;
  renderGantt(); scheduleSave();
}

function progWO(woId) {
  const wo = munkaordine.find(function(w){return w.id===woId;});
  if(!wo) return;
  wo.status = 'programat';
  renderGantt(); scheduleSave();
}

function deleteWO(woId) {
  if(!confirm('Sterge comanda?')) return;
  munkaordine = munkaordine.filter(function(w){return w.id!==woId;});
  renderGantt(); scheduleSave();
}

// === GANTT RENDERELÉS ===
// Napi struktúra fix:
// 08:00-08:10 Briefing | 08:10-12:10 I.Blokk (4h) | 12:10-12:40 Ebéd | 12:40-16:40 II.Blokk (4h) | 16:40-17:00 Zárás
const NAP = {
  briefStart: 8*60,      briefEnd: 8*60+10,     // 08:00-08:10
  blokk1Start: 8*60+10,  blokk1End: 12*60+10,   // 08:10-12:10
  ebedStart: 12*60+10,   ebedEnd: 12*60+40,      // 12:10-12:40
  blokk2Start: 12*60+40, blokk2End: 16*60+40,    // 12:40-16:40
  zarasStart: 16*60+40,  zarasEnd: 17*60          // 16:40-17:00
};

function isNonProd(min) {
  return (min >= NAP.briefStart && min < NAP.briefEnd) ||
         (min >= NAP.ebedStart && min < NAP.ebedEnd) ||
         (min >= NAP.zarasStart && min < NAP.zarasEnd);
}

function slotType(min) {
  if(min >= NAP.briefStart && min < NAP.briefEnd) return 'brief';
  if(min >= NAP.blokk1Start && min < NAP.blokk1End) return 'blokk1';
  if(min >= NAP.ebedStart && min < NAP.ebedEnd) return 'ebed';
  if(min >= NAP.blokk2Start && min < NAP.blokk2End) return 'blokk2';
  if(min >= NAP.zarasStart && min < NAP.zarasEnd) return 'zaras';
  return 'off';
}

function renderGantt() {
  var dStr = ganttDate.toISOString().split('T')[0];
  var dayFull = ganttDate.toLocaleDateString('ro-RO',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  
  // Date picker sync
  var dp = document.getElementById('ganttDatePicker');
  if(dp) dp.value = dStr;
  
  // View button styles
  ['gvZi','gvSapt','gvLuna'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){el.style.background=el.id==='gv'+ganttView.charAt(0).toUpperCase()+ganttView.slice(1)?'var(--red)':'var(--white)';el.style.color=el.id==='gv'+ganttView.charAt(0).toUpperCase()+ganttView.slice(1)?'#fff':'var(--dark)';}
  });
  // Fix: exact match
  var zvEl=document.getElementById('gvZi'),svEl=document.getElementById('gvSapt'),lvEl=document.getElementById('gvLuna');
  if(zvEl){zvEl.style.background=ganttView==='zi'?'var(--red)':'var(--white)';zvEl.style.color=ganttView==='zi'?'#fff':'var(--dark)';}
  if(svEl){svEl.style.background=ganttView==='sapt'?'var(--red)':'var(--white)';svEl.style.color=ganttView==='sapt'?'#fff':'var(--dark)';}
  if(lvEl){lvEl.style.background=ganttView==='luna'?'var(--red)':'var(--white)';lvEl.style.color=ganttView==='luna'?'#fff':'var(--dark)';}
  
  var titleEl = document.getElementById('ganttDateTitle');
  var resBtn = document.getElementById('ganttResBtn');
  if(resBtn) resBtn.textContent = gantt30 ? '60min' : '30min';
  
  var mechs = getGanttMechs();
  
  if(ganttView === 'zi') {
    if(titleEl) titleEl.textContent = dayFull;
    renderGanttZi(mechs, dStr, dayFull);
  } else if(ganttView === 'sapt') {
    // Hét kezdete (hétfő)
    var mon = new Date(ganttDate);
    var day = mon.getDay(); var diff = day===0?-6:1-day;
    mon.setDate(mon.getDate()+diff);
    var sun = new Date(mon); sun.setDate(sun.getDate()+6);
    if(titleEl) titleEl.textContent = 'Sapt. '+mon.toLocaleDateString('ro-RO',{day:'numeric',month:'short'})+' \u2014 '+sun.toLocaleDateString('ro-RO',{day:'numeric',month:'short',year:'numeric'});
    renderGanttSapt(mechs, mon);
  } else {
    var moName = ganttDate.toLocaleDateString('ro-RO',{month:'long',year:'numeric'});
    if(titleEl) titleEl.textContent = moName.charAt(0).toUpperCase()+moName.slice(1);
    renderGanttLuna(mechs);
  }
}

// === ZI NÉZET (eredeti Gantt) ===
function renderGanttZi(mechs, dStr, dayFull) {
  var dayWO = munkaordine.filter(function(w){return w.data===dStr && w.status!=='receptie';});
  
  // KPI
  var kpiEl = document.getElementById('ganttKPI');
  if(kpiEl) {
    var nLef = dayWO.filter(function(w){return w.status==='lefoglalt'||w.status==='programat';}).length;
    var nKio = dayWO.filter(function(w){return w.status==='kiosztott'||w.status==='in_lucru';}).length;
    var nLez = dayWO.filter(function(w){return w.status==='lezart'||w.status==='finalizat';}).length;
    var nFac = dayWO.filter(function(w){return w.status==='leszamlazott'||w.status==='proforma'||w.status==='facturat';}).length;
    var nKesz = dayWO.filter(function(w){return w.status==='kesz'||w.status==='livrat';}).length;
    var totOre = dayWO.reduce(function(s,w){return s+w.normaTimp;},0);
    var maxOre = mechs.length * 8;
    var util = maxOre>0?Math.round(totOre/maxOre*100):0;
    var uCol = util>=70?'var(--green)':util>=40?'var(--orange)':'var(--danger)';
    kpiEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;">'+
      '<div style="background:var(--white);border-radius:8px;padding:6px 10px;border:1px solid var(--border);border-left:4px solid #f59e0b;"><div style="font-size:.52rem;color:#92400e;font-weight:600;">LEFOGLALT</div><div style="font-size:1rem;font-weight:900;color:#92400e;">'+nLef+'</div></div>'+
      '<div style="background:var(--white);border-radius:8px;padding:6px 10px;border:1px solid var(--border);border-left:4px solid #ea580c;"><div style="font-size:.52rem;color:#9a3412;font-weight:600;">KIOSZTOTT</div><div style="font-size:1rem;font-weight:900;color:#9a3412;">'+nKio+'</div></div>'+
      '<div style="background:var(--white);border-radius:8px;padding:6px 10px;border:1px solid var(--border);border-left:4px solid #dc2626;"><div style="font-size:.52rem;color:#991b1b;font-weight:600;">LEZ\u00c1RT</div><div style="font-size:1rem;font-weight:900;color:#991b1b;">'+nLez+'</div></div>'+
      '<div style="background:var(--white);border-radius:8px;padding:6px 10px;border:1px solid var(--border);border-left:4px solid #78350f;"><div style="font-size:.52rem;color:#451a03;font-weight:600;">LESZ\u00c1ML\u00c1ZOTT</div><div style="font-size:1rem;font-weight:900;color:#451a03;">'+nFac+'</div></div>'+
      '<div style="background:var(--white);border-radius:8px;padding:6px 10px;border:1px solid var(--border);border-left:4px solid #0f172a;"><div style="font-size:.52rem;color:#334155;font-weight:600;">K\u00c9SZ</div><div style="font-size:1rem;font-weight:900;color:#334155;">'+nKesz+'</div></div>'+
      '<div style="background:var(--white);border-radius:8px;padding:6px 10px;border:1px solid var(--border);border-left:4px solid var(--red);"><div style="font-size:.52rem;color:var(--muted);font-weight:600;">UTILIZARE</div><div style="font-size:1rem;font-weight:900;color:'+uCol+';">'+util+'% <span style="font-size:.65rem;font-weight:600;color:var(--muted);">('+totOre.toFixed(1)+'/'+maxOre+'h)</span></div></div>'+
    '</div>';
  }
  
  // GANTT GRID — sorok angajat, 2 blokk: 08:10-12:10 | 12:40-16:40
  var gridEl = document.getElementById('ganttGrid');
  if(!gridEl) return;
  
  // Blokkok: 30 perces slotok
  var blokk1 = []; // 08:10 - 12:10 = 8 slot (30min)
  for(var m=8*60+10; m<12*60+10; m+=30) blokk1.push(m);
  var blokk2 = []; // 12:40 - 16:40 = 8 slot (30min)
  for(var m=12*60+40; m<16*60+40; m+=30) blokk2.push(m);
  
  function minToStr(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  
  var colW = 70;
  var nameW = 140;
  var totalW = nameW + (blokk1.length + blokk2.length + 3) * colW; // +3 = brief,ebed,zaras
  
  var gh = '<table style="border-collapse:collapse;width:100%;min-width:'+totalW+'px;background:var(--white);border-radius:10px;border:1px solid var(--border);overflow:hidden;font-size:.68rem;">';
  
  // HEADER — blokk struktúra
  gh += '<thead>';
  // Sor 1: blokk nevek
  gh += '<tr style="background:var(--bg);">';
  gh += '<th rowspan="2" style="padding:6px 10px;text-align:left;color:var(--red);font-weight:800;font-size:.8rem;width:'+nameW+'px;position:sticky;left:0;background:var(--bg);z-index:3;border-right:2px solid var(--red);border-bottom:2px solid var(--border);">Angajat</th>';
  gh += '<th style="padding:4px;text-align:center;font-size:.55rem;font-weight:700;color:var(--muted);background:rgba(200,64,64,.05);border-bottom:1px solid var(--border);width:'+colW+'px;">BRIEF</th>';
  gh += '<th colspan="'+blokk1.length+'" style="padding:4px;text-align:center;font-size:.65rem;font-weight:800;color:var(--red);border-left:2px solid var(--red);border-bottom:1px solid var(--border);">I. BLOC PRODUC\u021aIE (08:10\u201312:10)</th>';
  gh += '<th style="padding:4px;text-align:center;font-size:.55rem;font-weight:700;color:var(--muted);background:rgba(200,64,64,.05);border-left:2px solid var(--red);border-bottom:1px solid var(--border);width:'+colW+'px;">PAUZ\u0102</th>';
  gh += '<th colspan="'+blokk2.length+'" style="padding:4px;text-align:center;font-size:.65rem;font-weight:800;color:var(--red);border-left:2px solid var(--red);border-bottom:1px solid var(--border);">II. BLOC PRODUC\u021aIE (12:40\u201316:40)</th>';
  gh += '<th style="padding:4px;text-align:center;font-size:.55rem;font-weight:700;color:var(--muted);background:rgba(200,64,64,.05);border-left:2px solid var(--red);border-bottom:1px solid var(--border);width:'+colW+'px;">Z\u00c1R\u00c1S</th>';
  gh += '</tr>';
  // Sor 2: időpontok
  gh += '<tr style="background:var(--bg);border-bottom:2px solid var(--border);">';
  gh += '<th style="font-size:.5rem;color:var(--muted);background:rgba(200,64,64,.05);">08:00</th>';
  blokk1.forEach(function(m){gh += '<th style="font-size:.5rem;color:var(--muted);border-left:1px solid var(--border);">'+minToStr(m)+'</th>';});
  gh += '<th style="font-size:.5rem;color:var(--muted);background:rgba(200,64,64,.05);border-left:2px solid var(--red);">12:10</th>';
  blokk2.forEach(function(m){gh += '<th style="font-size:.5rem;color:var(--muted);border-left:1px solid var(--border);">'+minToStr(m)+'</th>';});
  gh += '<th style="font-size:.5rem;color:var(--muted);background:rgba(200,64,64,.05);border-left:2px solid var(--red);">16:40</th>';
  gh += '</tr></thead><tbody>';
  
  // PER ANGAJAT sor
  mechs.forEach(function(mech, mi) {
    var bg = mi%2===0?'#fff':'#fafafa';
    var mechWOs = dayWO.filter(function(w){return w.mechanic===mech.nume;});
    var mechOre = mechWOs.reduce(function(s,w){return s+w.normaTimp;},0);
    var overload = mechOre > 8;
    
    gh += '<tr style="border-bottom:1px solid var(--border);">';
    // Név
    gh += '<td onclick="openMunkalap(\''+mech.nume.replace(/'/g,"\\'")+'\')" style="padding:8px 10px;font-weight:800;font-size:.82rem;color:'+(overload?'var(--danger)':'var(--dark)')+';white-space:nowrap;position:sticky;left:0;background:'+bg+';z-index:1;border-right:2px solid var(--red);cursor:pointer;vertical-align:middle;" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\''+(overload?'var(--danger)':'var(--dark)')+'\'">'+mech.nume.split(' ').slice(-1)[0]+'<div style="font-size:.55rem;font-weight:600;color:'+(overload?'var(--danger)':'var(--muted)')+';">'+mechOre.toFixed(1)+'/8h</div></td>';
    
    // BRIEF cella (08:00-08:10) — szürke
    gh += '<td style="background:repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(200,64,64,.04) 3px,rgba(200,64,64,.04) 6px);border-left:1px solid var(--border);"></td>';
    
    // I. BLOKK (08:10-12:10)
    blokk1.forEach(function(slotMin) {
      var cellWO = mechWOs.filter(function(w) {
        var ws = parseInt(w.oraStart.split(':')[0])*60 + parseInt(w.oraStart.split(':')[1]||0);
        var we = parseInt(w.oraEnd.split(':')[0])*60 + parseInt(w.oraEnd.split(':')[1]||0);
        return slotMin >= ws && slotMin < we;
      });
      if(cellWO.length > 0) {
        var w = cellWO[0];
        var ws = parseInt(w.oraStart.split(':')[0])*60 + parseInt(w.oraStart.split(':')[1]||0);
        var isFirst = slotMin <= ws + 15; // first slot of this WO
        var wc = woColor(w);
        gh += '<td style="padding:2px;border-left:1px solid var(--border);background:'+wc.bg+';border-top:2px solid '+wc.border+';border-bottom:2px solid '+wc.border+';vertical-align:top;">';
        if(isFirst) {
          gh += '<div style="font-size:.62rem;font-weight:800;color:'+wc.text+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;">'+w.auto+'</div>';
          gh += '<div style="font-size:.48rem;color:'+wc.text+';opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+w.desc.substring(0,20)+'</div>';
        }
        gh += '</td>';
      } else {
        gh += '<td style="border-left:1px solid var(--border);background:'+bg+';cursor:pointer;" onclick="quickAssign(\''+mech.nume.replace(/'/g,"\\'")+'\','+Math.floor(slotMin/60)+')"></td>';
      }
    });
    
    // EBÉD cella (12:10-12:40) — szürke
    gh += '<td style="background:repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(148,163,184,.06) 3px,rgba(148,163,184,.06) 6px);border-left:2px solid var(--red);"></td>';
    
    // II. BLOKK (12:40-16:40)
    blokk2.forEach(function(slotMin) {
      var cellWO = mechWOs.filter(function(w) {
        var ws = parseInt(w.oraStart.split(':')[0])*60 + parseInt(w.oraStart.split(':')[1]||0);
        var we = parseInt(w.oraEnd.split(':')[0])*60 + parseInt(w.oraEnd.split(':')[1]||0);
        return slotMin >= ws && slotMin < we;
      });
      if(cellWO.length > 0) {
        var w = cellWO[0];
        var ws = parseInt(w.oraStart.split(':')[0])*60 + parseInt(w.oraStart.split(':')[1]||0);
        var isFirst = slotMin <= ws + 15;
        var wc = woColor(w);
        gh += '<td style="padding:2px;border-left:1px solid var(--border);background:'+wc.bg+';border-top:2px solid '+wc.border+';border-bottom:2px solid '+wc.border+';vertical-align:top;">';
        if(isFirst) {
          gh += '<div style="font-size:.62rem;font-weight:800;color:'+wc.text+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;">'+w.auto+'</div>';
          gh += '<div style="font-size:.48rem;color:'+wc.text+';opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+w.desc.substring(0,20)+'</div>';
        }
        gh += '</td>';
      } else {
        gh += '<td style="border-left:1px solid var(--border);background:'+bg+';cursor:pointer;" onclick="quickAssign(\''+mech.nume.replace(/'/g,"\\'")+'\','+Math.floor(slotMin/60)+')"></td>';
      }
    });
    
    // ZÁRÁS cella (16:40-17:00) — szürke
    gh += '<td style="background:repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(200,64,64,.04) 3px,rgba(200,64,64,.04) 6px);border-left:2px solid var(--red);"></td>';
    gh += '</tr>';
  });
  
  gh += '</tbody></table>';
  gridEl.innerHTML = gh;
  
  // RIASZTÁSOK
  var alertEl = document.getElementById('ganttAlerts');
  if(alertEl) {
    var alerts = [];
    mechs.forEach(function(m) {
      var mWOs = dayWO.filter(function(w){return w.mechanic===m.nume;});
      var mOre = mWOs.reduce(function(s,w){return s+w.normaTimp;},0);
      if(mOre > 8) alerts.push({type:'warn',text:m.nume+' \u2014 '+mOre.toFixed(1)+'h, DEP\u0102\u0218E\u0218TE 8h!'});
      if(mOre === 0) alerts.push({type:'info',text:m.nume+' \u2014 LIBER, capacitate disponibil\u0103'});
    });
    alertEl.innerHTML = alerts.length > 0 ? '<div style="background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.12);border-radius:8px;padding:8px 12px;">'+alerts.map(function(a){return '<div style="font-size:.68rem;color:'+(a.type==='warn'?'var(--danger)':'#0e7490')+';margin-bottom:2px;">'+(a.type==='warn'?'\u26a0':'\u2139')+' '+a.text+'</div>';}).join('')+'</div>' : '';
  }
  
  // COMENZI LISTA — státusz gombokkal
  var listEl = document.getElementById('ganttList');
  if(listEl && dayWO.length > 0) {
    var lh = '<div style="font-size:.72rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:6px;">Comenzi \u2014 '+dayFull+'</div>';
    lh += '<div style="display:grid;gap:4px;">';
    dayWO.forEach(function(w) {
      var wc = woColor(w);
      lh += '<div style="background:'+wc.bg+';border-radius:8px;border:1px solid '+wc.border+';border-left:5px solid '+wc.border+';padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">';
      lh += '<div><span style="font-size:.82rem;font-weight:800;color:'+wc.text+';">'+w.auto+'</span>';
      lh += ' <span style="font-size:.65rem;color:'+wc.text+';opacity:.7;">'+w.client+' | '+w.mechanic+' | '+w.oraStart+'-'+w.oraEnd+' ('+w.normaTimp+'h)</span>';
      lh += '<div style="font-size:.6rem;color:'+wc.text+';opacity:.6;margin-top:2px;">'+w.desc+'</div></div>';
      lh += '<div style="display:flex;gap:4px;align-items:center;">';
      lh += '<span style="font-size:.58rem;font-weight:700;padding:3px 8px;border-radius:6px;background:'+wc.border+';color:#fff;">'+wc.label+'</span>';
      // Következő státusz gomb
      if(w.status==='lefoglalt'||w.status==='programat') lh += '<button onclick="updateWoStatus(\''+w.id+'\',\'kiosztott\')" style="font-size:.55rem;padding:3px 6px;background:#ea580c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">\u25b6 Kioszt</button>';
      if(w.status==='kiosztott'||w.status==='in_lucru') lh += '<button onclick="updateWoStatus(\''+w.id+'\',\'lezart\')" style="font-size:.55rem;padding:3px 6px;background:#dc2626;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">\u2713 Lez\u00e1r</button>';
      if(w.status==='lezart'||w.status==='finalizat') lh += '<button onclick="updateWoStatus(\''+w.id+'\',\'leszamlazott\')" style="font-size:.55rem;padding:3px 6px;background:#78350f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">\u20ac Sz\u00e1ml\u00e1z</button>';
      if(w.status==='leszamlazott'||w.status==='proforma'||w.status==='facturat') lh += '<button onclick="updateWoStatus(\''+w.id+'\',\'kesz\')" style="font-size:.55rem;padding:3px 6px;background:#334155;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">\u2714 K\u00e9sz</button>';
      lh += '<button onclick="deleteWO(\''+w.id+'\')" style="font-size:.5rem;padding:3px 5px;background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--danger);">\u2715</button>';
      lh += '</div></div>';
    });
    lh += '</div>';
    listEl.innerHTML = lh;
  } else if(listEl) { listEl.innerHTML = ''; }
}

// === SĂPTĂMÂNA NÉZET ===
function renderGanttSapt(mechs, monday) {
  var days = [];
  for(var i=0; i<7; i++) {
    var d = new Date(monday); d.setDate(d.getDate()+i);
    var ds = d.toISOString().split('T')[0];
    var isWeekend = d.getDay()===0 || d.getDay()===6;
    var dayLabel = d.toLocaleDateString('ro-RO',{weekday:'short',day:'numeric'});
    days.push({date:d, dStr:ds, label:dayLabel, isWeekend:isWeekend});
  }
  
  var allWO = munkaordine.filter(function(w){return w.status!=='receptie';});
  
  // KPI
  var kpiEl = document.getElementById('ganttKPI');
  if(kpiEl) {
    var weekWO = allWO.filter(function(w){return days.some(function(d){return d.dStr===w.data;});});
    var totOre = weekWO.reduce(function(s,w){return s+w.normaTimp;},0);
    var nWO = weekWO.length;
    var maxOre = mechs.length * 8 * 5;
    var util = maxOre>0?Math.round(totOre/maxOre*100):0;
    var uCol = util>=70?'var(--green)':util>=40?'var(--orange)':'var(--danger)';
    kpiEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">COMENZI SAPT.</div><div style="font-size:.95rem;font-weight:900;">'+nWO+'</div></div><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">ORE SAPT.</div><div style="font-size:.95rem;font-weight:900;">'+totOre.toFixed(1)+'h</div></div><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">MAX CAPACITATE</div><div style="font-size:.95rem;font-weight:900;color:var(--muted);">'+maxOre+'h</div></div><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">UTILIZARE</div><div style="font-size:.95rem;font-weight:900;color:'+uCol+';">'+util+'%</div></div></div>';
  }
  
  // Grid: angajat × nap
  var gridEl = document.getElementById('ganttGrid');
  if(gridEl) {
    var gh = '<div style="background:var(--white);border-radius:10px;border:1px solid var(--border);overflow-x:auto;">';
    gh += '<table style="width:100%;border-collapse:collapse;font-size:.68rem;">';
    gh += '<thead><tr style="background:var(--bg);border-bottom:2px solid var(--border);">';
    gh += '<th style="padding:6px 8px;text-align:left;color:var(--red);font-weight:700;width:130px;">Angajat</th>';
    days.forEach(function(d) {
      var isToday = d.dStr === new Date().toISOString().split('T')[0];
      var bg = d.isWeekend?'rgba(148,163,184,.08)':isToday?'var(--red-light)':'';
      gh += '<th style="padding:6px 4px;text-align:center;color:'+(d.isWeekend?'var(--muted)':isToday?'var(--red)':'var(--dark)')+';font-weight:'+(isToday?'800':'600')+';background:'+bg+';min-width:100px;border-left:1px solid var(--border);">'+d.label+'</th>';
    });
    gh += '<th style="padding:6px 4px;text-align:center;color:var(--red);font-weight:700;border-left:2px solid var(--red);">Total</th>';
    gh += '</tr></thead><tbody>';
    
    mechs.forEach(function(mech, mi) {
      var bg = mi%2===0?'':'background:var(--bg);';
      var weekOre = 0;
      gh += '<tr style="border-bottom:1px solid var(--border);'+bg+'">';
      gh += '<td onclick="openMunkalap(\''+mech.nume.replace(/'/g,"\\'")+'\')" style="padding:5px 8px;font-weight:700;color:var(--dark);cursor:pointer;font-size:.75rem;" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dark)\'">'+mech.nume.split(' ').slice(-1)[0]+'</td>';
      
      days.forEach(function(d) {
        var dayWOs = allWO.filter(function(w){return w.data===d.dStr && w.mechanic===mech.nume;});
        var dayOre = dayWOs.reduce(function(s,w){return s+w.normaTimp;},0);
        weekOre += dayOre;
        var isToday = d.dStr === new Date().toISOString().split('T')[0];
        var cellBg = d.isWeekend?'rgba(148,163,184,.05)':isToday?'rgba(200,64,64,.03)':'';
        
        if(dayWOs.length > 0) {
          var wc = woColor(dayWOs[0]);
          gh += '<td style="padding:3px 4px;border-left:1px solid var(--border);background:'+cellBg+';vertical-align:top;">';
          dayWOs.forEach(function(w) {
            var wcc = woColor(w);
            gh += '<div style="font-size:.55rem;padding:2px 4px;border-radius:4px;background:'+wcc.bg+';border-left:3px solid '+wcc.border+';margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><b style="color:'+wcc.text+';">'+w.auto+'</b> <span style="color:var(--muted);">'+w.normaTimp+'h</span></div>';
          });
          gh += '<div style="font-size:.5rem;font-weight:700;color:var(--dark);text-align:right;">'+dayOre.toFixed(1)+'h</div>';
          gh += '</td>';
        } else {
          gh += '<td style="padding:3px 4px;border-left:1px solid var(--border);background:'+cellBg+';text-align:center;color:var(--muted);font-size:.5rem;">'+(d.isWeekend?'\u2014':'')+'</td>';
        }
      });
      
      var oreCol = weekOre>40?'var(--danger)':weekOre>=30?'var(--dark)':'var(--muted)';
      gh += '<td style="padding:5px 4px;text-align:center;font-weight:800;color:'+oreCol+';border-left:2px solid var(--red);">'+weekOre.toFixed(1)+'h</td>';
      gh += '</tr>';
    });
    
    // Total sor
    gh += '<tr style="border-top:2px solid var(--red);background:var(--red-light);">';
    gh += '<td style="padding:5px 8px;font-weight:800;color:var(--red);">TOTAL</td>';
    days.forEach(function(d) {
      var dayTotal = allWO.filter(function(w){return w.data===d.dStr;}).reduce(function(s,w){return s+w.normaTimp;},0);
      gh += '<td style="padding:5px 4px;text-align:center;font-weight:800;border-left:1px solid var(--border);">'+dayTotal.toFixed(1)+'h</td>';
    });
    var weekTotal = allWO.filter(function(w){return days.some(function(d){return d.dStr===w.data;});}).reduce(function(s,w){return s+w.normaTimp;},0);
    gh += '<td style="padding:5px 4px;text-align:center;font-weight:900;color:var(--red);border-left:2px solid var(--red);">'+weekTotal.toFixed(1)+'h</td>';
    gh += '</tr></tbody></table></div>';
    gridEl.innerHTML = gh;
  }
  
  var alertEl = document.getElementById('ganttAlerts'); if(alertEl) alertEl.innerHTML='';
  var listEl = document.getElementById('ganttList'); if(listEl) listEl.innerHTML='';
}

// === LUNA NÉZET ===
function renderGanttLuna(mechs) {
  var year = ganttDate.getFullYear(), month = ganttDate.getMonth();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var allWO = munkaordine.filter(function(w){return w.status!=='receptie';});
  
  // Napok listája
  var days = [];
  for(var i=1; i<=daysInMonth; i++) {
    var d = new Date(year, month, i);
    var ds = d.toISOString().split('T')[0];
    var isWeekend = d.getDay()===0 || d.getDay()===6;
    days.push({nr:i, dStr:ds, isWeekend:isWeekend, dayName:d.toLocaleDateString('ro-RO',{weekday:'short'}).substring(0,2)});
  }
  
  // KPI
  var kpiEl = document.getElementById('ganttKPI');
  if(kpiEl) {
    var moWO = allWO.filter(function(w){return days.some(function(d){return d.dStr===w.data;});});
    var totOre = moWO.reduce(function(s,w){return s+w.normaTimp;},0);
    var workDays = days.filter(function(d){return !d.isWeekend;}).length;
    var maxOre = mechs.length * 8 * workDays;
    var util = maxOre>0?Math.round(totOre/maxOre*100):0;
    var uCol = util>=70?'var(--green)':util>=40?'var(--orange)':'var(--danger)';
    kpiEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">COMENZI LUNA</div><div style="font-size:.95rem;font-weight:900;">'+moWO.length+'</div></div><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">ORE LUNA</div><div style="font-size:.95rem;font-weight:900;">'+totOre.toFixed(0)+'h</div></div><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">MAX ('+workDays+' zile)</div><div style="font-size:.95rem;font-weight:900;color:var(--muted);">'+maxOre+'h</div></div><div style="background:var(--white);border-radius:8px;padding:6px 8px;border:1px solid var(--border);border-top:3px solid var(--red);"><div style="font-size:.5rem;color:var(--muted);font-weight:600;">UTILIZARE</div><div style="font-size:.95rem;font-weight:900;color:'+uCol+';">'+util+'%</div></div></div>';
  }
  
  // Grid: angajat × nap (kompakt)
  var gridEl = document.getElementById('ganttGrid');
  if(gridEl) {
    var gh = '<div style="background:var(--white);border-radius:10px;border:1px solid var(--border);overflow-x:auto;">';
    gh += '<table style="border-collapse:collapse;font-size:.58rem;min-width:'+(130+daysInMonth*28)+'px;">';
    gh += '<thead><tr style="background:var(--bg);border-bottom:2px solid var(--border);">';
    gh += '<th style="padding:4px 6px;text-align:left;color:var(--red);font-weight:700;width:110px;position:sticky;left:0;background:var(--bg);z-index:2;font-size:.62rem;">Angajat</th>';
    days.forEach(function(d) {
      var isToday = d.dStr === new Date().toISOString().split('T')[0];
      gh += '<th style="padding:2px 1px;text-align:center;width:26px;color:'+(d.isWeekend?'var(--muted)':isToday?'var(--red)':'var(--dark)')+';font-weight:'+(isToday?'800':'500')+';background:'+(isToday?'var(--red-light)':d.isWeekend?'rgba(148,163,184,.06)':'')+';border-left:1px solid var(--border);font-size:.5rem;"><div>'+d.dayName+'</div><div style="font-weight:700;">'+d.nr+'</div></th>';
    });
    gh += '<th style="padding:4px 3px;text-align:center;color:var(--red);font-weight:700;border-left:2px solid var(--red);font-size:.55rem;">Tot</th>';
    gh += '</tr></thead><tbody>';
    
    mechs.forEach(function(mech, mi) {
      var bg = mi%2===0?'':'background:var(--bg);';
      var moOre = 0;
      gh += '<tr style="border-bottom:1px solid var(--border);'+bg+'">';
      gh += '<td onclick="openMunkalap(\''+mech.nume.replace(/'/g,"\\'")+'\')" style="padding:3px 6px;font-weight:700;color:var(--dark);cursor:pointer;font-size:.65rem;position:sticky;left:0;background:'+(mi%2===0?'var(--white)':'var(--bg)')+';z-index:1;border-right:2px solid var(--border);" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dark)\'">'+mech.nume.split(' ').slice(-1)[0]+'</td>';
      
      days.forEach(function(d) {
        var dayWOs = allWO.filter(function(w){return w.data===d.dStr && w.mechanic===mech.nume;});
        var dayOre = dayWOs.reduce(function(s,w){return s+w.normaTimp;},0);
        moOre += dayOre;
        var isToday = d.dStr === new Date().toISOString().split('T')[0];
        
        if(dayOre > 0) {
          var wc = woColor(dayWOs[0]);
          var oreCol = dayOre>=8?'var(--green)':dayOre>=4?'var(--dark)':'var(--orange)';
          gh += '<td style="padding:1px;text-align:center;border-left:1px solid var(--border);background:'+wc.bg+';font-weight:700;color:'+oreCol+';font-size:.52rem;">'+dayOre.toFixed(0)+'</td>';
        } else {
          gh += '<td style="padding:1px;text-align:center;border-left:1px solid var(--border);background:'+(isToday?'var(--red-light)':d.isWeekend?'rgba(148,163,184,.04)':'')+';"></td>';
        }
      });
      
      gh += '<td style="padding:3px;text-align:center;font-weight:800;color:var(--dark);border-left:2px solid var(--red);font-size:.58rem;">'+moOre.toFixed(0)+'</td>';
      gh += '</tr>';
    });
    
    // Total sor
    gh += '<tr style="border-top:2px solid var(--red);background:var(--red-light);">';
    gh += '<td style="padding:3px 6px;font-weight:800;color:var(--red);font-size:.6rem;position:sticky;left:0;background:var(--red-light);z-index:1;">TOTAL</td>';
    var grandTotal = 0;
    days.forEach(function(d) {
      var dt = allWO.filter(function(w){return w.data===d.dStr;}).reduce(function(s,w){return s+w.normaTimp;},0);
      grandTotal += dt;
      gh += '<td style="padding:1px;text-align:center;font-weight:700;border-left:1px solid var(--border);font-size:.5rem;">'+(dt>0?dt.toFixed(0):'')+'</td>';
    });
    gh += '<td style="padding:3px;text-align:center;font-weight:900;color:var(--red);border-left:2px solid var(--red);font-size:.6rem;">'+grandTotal.toFixed(0)+'</td>';
    gh += '</tr></tbody></table></div>';
    gridEl.innerHTML = gh;
  }
  
  var alertEl = document.getElementById('ganttAlerts'); if(alertEl) alertEl.innerHTML='';
  var listEl = document.getElementById('ganttList'); if(listEl) listEl.innerHTML='';
}

function quickAssign(mechName, hour) {
  openMunkalap(mechName);
  setTimeout(function() {
    var os = document.getElementById('woOraS');
    if(os) os.value = String(hour).padStart(2,'0')+':00';
  }, 100);
}

window.ganttPrev=ganttPrev;window.ganttNext=ganttNext;window.ganttToday=ganttToday;window.ganttToggle30=ganttToggle30;window.setGanttView=setGanttView;
window.saveNewWO=saveNewWO;window.updateWoStatus=updateWoStatus;window.progWO=progWO;window.deleteWO=deleteWO;window.quickAssign=quickAssign;

// === CALCULATIONS — 5 BLOKK ===
const calc5 = () => {
  const cm = currentMonth;
  const mnap = munkanapok[cm] || 22;
  
  // HAVI értékek (aktuális hónap)
  const forgalomMonth = cfMonths[cm].facturat || 0;
  const manoperaMonth = cfMonths[cm].nManop || 0;
  const pieseMonth = cfMonths[cm].artNyer || 0;
  const transportMonth = venituri.transportFacturat[cm]?.r || 0;
  
  // ÉVES értékek (12 hónap összeg)
  const forgalomYear = cfMonths.reduce((s, m) => s + (m.facturat || 0), 0);
  const manoperaYear = cfMonths.reduce((s, m) => s + (m.nManop || 0), 0);
  const pieseYear = cfMonths.reduce((s, m) => s + (m.artNyer || 0), 0);
  const transportYear = venituri.transportFacturat.reduce((s,m) => s + (m.r || 0), 0);
  
  // CHELTUIELI
  const cheltMonth = facturi.reduce((s, f) => s + (f.months?.[cm]?.r || 0), 0);
  const cheltYear = facturi.reduce((s, f) => s + f.months.reduce((x, m) => x + (m.r || 0), 0), 0);
  
  // SALARII fix cost
  const salariiMonth = angajati.reduce((s, a) => {
    ensureFix(a);
    return s + calcAngCost(a.fix).totalCost;
  }, 0);
  const salariiYear = salariiMonth * 12;

  // VENITURI total
  const venMonth = manoperaMonth + pieseMonth + transportMonth;
  const venYear = manoperaYear + pieseYear + transportYear;
  
  // PROFIT
  const profitMonth = venMonth - cheltMonth - salariiMonth;
  const profitYear = venYear - cheltYear - salariiYear;

  return {
    forgalom: { year: forgalomYear, month: forgalomMonth, daily: mnap>0?forgalomMonth/mnap:0, plan: planTargets.forgalom },
    manopera: { year: manoperaYear, month: manoperaMonth, daily: mnap>0?manoperaMonth/mnap:0, plan: planTargets.manopera },
    piese: { year: pieseYear, month: pieseMonth, daily: mnap>0?pieseMonth/mnap:0, plan: planTargets.piese },
    transport: { year: transportYear, month: transportMonth, daily: mnap>0?transportMonth/mnap:0 },
    cheltuieli: { year: cheltYear, month: cheltMonth, daily: mnap>0?cheltMonth/mnap:0, plan: planTargets.cheltuieli },
    salarii: { year: salariiYear, month: salariiMonth, daily: mnap>0?salariiMonth/mnap:0, plan: planTargets.salarii },
    salariiMonth,
    profit: { year: profitYear, month: profitMonth, daily: mnap>0?profitMonth/mnap:0 }
  };
};

// Régi calc kompatibilitás (más oldalak használják)
const calc = () => {
  const c = calc5();
  const tvr12 = c.manopera.year + c.piese.year;
  const tcostr12 = c.cheltuieli.year + c.salarii.year;
  return {tvr: toPeriod(tvr12), tvr12, tcr: toPeriod(c.cheltuieli.year), tcr12: c.cheltuieli.year,
    tsp: toPeriod(c.salarii.year), tsp12: c.salarii.year, ttp: 0, ttp12: 0,
    tcostr: toPeriod(tcostr12), tcostr12, er: toPeriod(tvr12-tcostr12), er12: tvr12-tcostr12, m: 1};
};

// === NAVIGATION ===
const setPeriod = (p) => {
  period = p;
  document.querySelectorAll('.period-nav button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('period-label').textContent = p.toUpperCase();
  renderSumar(); // Update SUMAR first
  render(); // Then render current page
};

const showPage = (page) => {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(page);
  if (pageEl) pageEl.classList.add('active');
  // Sub-nav active state frissítés (ha létezik)
  document.querySelectorAll('.sub-nav button').forEach(b => {
    b.classList.remove('active');
    const oc = b.getAttribute('onclick') || '';
    if (oc.includes(`'${page}'`)) b.classList.add('active');
  });
  // Régi main-nav (most rejtett) active is frissül — ha van event
  if (typeof event !== 'undefined' && event && event.target && event.target.classList) {
    document.querySelectorAll('.main-nav button').forEach(b => b.classList.remove('active'));
    if (event.target.tagName === 'BUTTON') event.target.classList.add('active');
  }
  render();
};

// ═══ ÚJ: 7 főcsoportos navigáció ═══
const groupConfig = {
  cegvezetes:     { defaultPage: 'sumar',          subTabs: [] },
  hr:             { defaultPage: 'salarii',        subTabs: [] },
  marketing:      { defaultPage: 'marketing',      subTabs: [] },
  penzugy:        { defaultPage: 'venituri',       subTabs: [
    { id: 'venituri',   label: 'Venituri'   },
    { id: 'cheltuieli', label: 'Cheltuieli' },
    { id: 'cashflow',   label: 'Cash Flow'  },
    { id: 'evzaras',    label: 'Évzárás'    }
  ]},
  termeles:       { defaultPage: 'programare',     subTabs: [] },
  felulvizsgalat: { defaultPage: 'felulvizsgalat', subTabs: [] },
  ertekesites:    { defaultPage: 'ertekesites',    subTabs: [] }
};

const showGroup = (group, btn) => {
  const cfg = groupConfig[group];
  if (!cfg) return;

  // group-nav active button
  document.querySelectorAll('.group-nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // sub-nav: render or hide
  const subNav = document.getElementById('subNav');
  if (cfg.subTabs.length > 0) {
    subNav.style.display = '';
    subNav.innerHTML = cfg.subTabs.map(t =>
      `<button onclick="showPage('${t.id}')" class="${t.id === cfg.defaultPage ? 'active' : ''}">${t.label}</button>`
    ).join('');
  } else {
    subNav.style.display = 'none';
    subNav.innerHTML = '';
  }

  // Megnyitja az alapértelmezett oldalt (event nélkül, hogy showPage ne dőljön el)
  currentPage = cfg.defaultPage;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(cfg.defaultPage);
  if (pageEl) pageEl.classList.add('active');
  if (typeof render === 'function') render();
};

const setDept = (dept) => {
  currentDept = dept;
  renderCheltuieli();
};

const updatePlanTarget = (type, val) => {
  planTargets[type] = Number(val);
  renderSumar();
};

// Make all functions globally available
window.setPeriod = setPeriod;
window.showPage = showPage;
window.showGroup = showGroup;
window.setDept = setDept;
window.updatePlanTarget = updatePlanTarget;

// === VENITURI ===
const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
                'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

const setMonth = (monthIdx) => {
  currentMonth = monthIdx;
  render();
};

const updVen = (id, field, val) => {
  venituri[id][currentMonth][field] = Number(val);
  renderSumar();
  if (currentPage === 'venituri') renderVenituri();
};

// Make functions globally available
window.setMonth = setMonth;
window.updVen = updVen;

const renderVenituri = () => {
  const td = totalMunkanapok();
  const cm = currentMunkanapok();
  const monthTotal = Object.values(venituri).reduce((s, arr) => s + arr[currentMonth].r, 0);
  const yearTotal = Object.values(venituri).reduce((s, arr) => s + arr.reduce((x, m) => x + m.r, 0), 0);
  const dailyTotal = td > 0 ? yearTotal / td : 0;
  const weeklyTotal = dailyTotal * 5;
  const monthlyTotal = dailyTotal * cm;

  let html = `
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div>
        <div style="font-size:.78rem;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.06em;">VENITURI</div>
        <div style="font-size:1.4rem;font-weight:800;color:var(--dark);">Categorii de venituri</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select onchange="setMonth(parseInt(this.value))" style="padding:8px 16px;font-size:.85rem;border-radius:8px;min-width:160px;">
          ${months.map((m, idx) => '<option value="'+idx+'" '+(idx === currentMonth ? 'selected' : '')+'>'+m+'</option>').join('')}
        </select>
        <button class="btn btn-primary" onclick="toggleAnualStats()">${showAnualStats ? 'Lunar' : 'Anual'}</button>
      </div>
    </div>

    <!-- Summary: Zi / Sapt / Luna / An -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
      <div style="background:var(--white);border-radius:12px;padding:12px 16px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.68rem;font-weight:700;color:var(--red);text-transform:uppercase;">Zi</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(dailyTotal)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:12px;padding:12px 16px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.68rem;font-weight:700;color:var(--red);text-transform:uppercase;">Saptamana</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(weeklyTotal)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:12px;padding:12px 16px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.68rem;font-weight:700;color:var(--red);text-transform:uppercase;">${months[currentMonth]}</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(monthTotal)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:12px;padding:12px 16px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.68rem;font-weight:700;color:var(--red);text-transform:uppercase;">An</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(yearTotal)} RON</div>
      </div>
    </div>

    <!-- Table -->
    <div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 120px;gap:0;padding:10px 18px;border-bottom:2px solid var(--border);background:var(--bg);">
        <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;">Categorie</div>
        <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:right;">Planificat</div>
        <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:right;">Realizat</div>
        <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:right;">Anual</div>
        <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:right;">Dif.</div>
      </div>`;

  venituriCats.forEach((cat, idx) => {
    const d = venituri[cat.id][currentMonth];
    const dif = d.r - d.p;
    const catYear = venituri[cat.id].reduce((s, m) => s + m.r, 0);
    const isProforma = cat.id.includes('Proforma');
    const bg = idx % 2 === 0 ? 'var(--white)' : 'var(--bg)';

    html += `
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 120px;gap:0;padding:12px 18px;border-bottom:1px solid var(--border);background:${bg};align-items:center;transition:.15s;" onmouseover="this.style.background='var(--red-light)'" onmouseout="this.style.background='${bg}'">
        <div>
          <div style="font-size:.88rem;font-weight:700;color:var(--dark);">${cat.n}</div>
          ${isProforma ? '<span style="display:inline-block;padding:2px 8px;font-size:.65rem;font-weight:700;border-radius:12px;background:rgba(245,158,11,.1);color:#d97706;border:1px solid rgba(245,158,11,.3);">Proforma</span>' :
          cat.id.includes('Facturat') ? '<span style="display:inline-block;padding:2px 8px;font-size:.65rem;font-weight:700;border-radius:12px;background:rgba(16,185,129,.1);color:#059669;border:1px solid rgba(16,185,129,.3);">Facturat</span>' : ''}
        </div>
        <div style="text-align:right;">
          <input type="number" value="${d.p}" onchange="updVen('${cat.id}','p',this.value)"
            style="width:100px;padding:5px 8px;font-size:.85rem;font-weight:600;text-align:right;color:var(--dark);">
        </div>
        <div style="text-align:right;">
          <input type="number" value="${d.r}" onchange="updVen('${cat.id}','r',this.value)"
            style="width:100px;padding:5px 8px;font-size:.85rem;font-weight:700;text-align:right;color:var(--dark);">
        </div>
        <div style="text-align:right;font-size:.85rem;font-weight:700;color:var(--dark);">${fmt(catYear)}</div>
        <div style="text-align:right;">
          <span style="padding:4px 12px;font-size:.78rem;font-weight:700;border-radius:20px;${dif >= 0 ? 'background:rgba(16,185,129,.1);color:#059669;' : 'background:rgba(239,68,68,.1);color:#ef4444;'}">${dif >= 0 ? '+' : ''}${fmt(dif)}</span>
        </div>
      </div>`;
  });

  // Total row
  const totalP = venituriCats.reduce((s, c) => s + venituri[c.id][currentMonth].p, 0);
  const totalR = venituriCats.reduce((s, c) => s + venituri[c.id][currentMonth].r, 0);
  html += `
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 120px;gap:0;padding:14px 18px;background:var(--red-light);border-top:2px solid var(--red);">
      <div style="font-size:.88rem;font-weight:800;color:var(--red);">TOTAL VENITURI</div>
      <div style="text-align:right;font-weight:800;color:var(--dark);">${fmt(totalP)}</div>
      <div style="text-align:right;font-weight:800;color:var(--dark);">${fmt(totalR)}</div>
      <div style="text-align:right;font-weight:800;color:var(--dark);">${fmt(yearTotal)}</div>
      <div style="text-align:right;"><span style="padding:4px 12px;font-size:.78rem;font-weight:800;border-radius:20px;background:var(--red);color:#fff;">${fmt(totalR - totalP)}</span></div>
    </div>
  </div>`;

  // Annual table
  if (showAnualStats) {
    html += `<div class="card" style="margin-top:14px;overflow-x:auto;">
      <div style="font-size:.82rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:10px;">Raport Anual Detaliat</div>
      <table style="width:100%;border-collapse:collapse;min-width:900px;font-size:.78rem;">
        <thead><tr style="border-bottom:2px solid var(--red);">
          <th style="padding:8px;text-align:left;color:var(--red);font-weight:700;">Categorie</th>
          ${months.map(m => '<th style="padding:8px;text-align:right;color:var(--red);font-weight:600;font-size:.7rem;">'+m.substring(0,3)+'</th>').join('')}
          <th style="padding:8px;text-align:right;color:var(--red);font-weight:800;">Total</th>
        </tr></thead>
        <tbody>
          ${venituriCats.map((cat, ci) => {
            const yr = venituri[cat.id].reduce((s,m)=>s+m.r,0);
            return '<tr style="border-bottom:1px solid '+(ci%2===0?'var(--border)':'#f4f4f5')+';">'+
              '<td style="padding:6px 8px;font-weight:700;color:var(--dark);font-size:.76rem;white-space:nowrap;">'+cat.n+'</td>'+
              venituri[cat.id].map((m,mi) => '<td style="padding:6px 4px;text-align:right;font-weight:'+(mi===currentMonth?'800':'600')+';color:var(--dark);'+(mi===currentMonth?'background:var(--red-light);':'')+'">'+ fmt(m.r)+'</td>').join('')+
              '<td style="padding:6px 8px;text-align:right;font-weight:800;color:var(--dark);">'+fmt(yr)+'</td></tr>';
          }).join('')}
          <tr style="border-top:2px solid var(--red);background:var(--red-light);">
            <td style="padding:8px;font-weight:800;color:var(--red);">TOTAL</td>
            ${Array.from({length:12},(_,i) => {
              const t = venituriCats.reduce((s,c)=>s+venituri[c.id][i].r,0);
              return '<td style="padding:8px;text-align:right;font-weight:800;color:var(--dark);'+(i===currentMonth?'background:#fde2e2;':'')+'">'+fmt(t)+'</td>';
            }).join('')}
            <td style="padding:8px;text-align:right;font-weight:900;color:var(--red);font-size:.88rem;">${fmt(yearTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
  }

  document.getElementById('venituri-list').innerHTML = html;
};


// === CHELTUIELI ===
const addFactura = () => {
  facturi.push({
    id: nextFacturaId++,
    dept: currentDept,
    nume: '',
    tip: 'fix',
    months: Array(12).fill(0).map(() => ({p: 0, r: 0}))
  });
  renderCheltuieli();
};

const delFactura = (id) => {
  facturi = facturi.filter(f => f.id !== id);
  renderCheltuieli();
};

const updFactura = (id, field, val) => {
  const f = facturi.find(f => f.id === id);
  if (f) {
    if (field === 'nume' || field === 'dept' || field === 'tip') {
      f[field] = val;
    } else {
      f.months[currentMonth][field] = Number(val);
    }
  }
  renderSumar();
  renderCheltuieli();
};

// Make functions globally available
window.addFactura = addFactura;
window.delFactura = delFactura;
window.updFactura = updFactura;

const renderDeptButtons = () => {
  // Csoportosított gombok
  const groups = [];
  const seen = {};
  depts.forEach(d => {
    const gk = d.group || 'other';
    if(!seen[gk]) { 
      seen[gk] = true; 
      groups.push({key: gk, label: d.groupLabel || '', items: depts.filter(x => (x.group||'other') === gk)}); 
    }
  });
  
  let html = '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">';
  groups.forEach((g, gi) => {
    if(gi > 0) html += '<div style="width:1px;height:24px;background:var(--border);margin:0 2px;"></div>';
    if(g.label) html += '<span style="font-size:.5rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-right:2px;">'+g.label+'</span>';
    g.items.forEach(d => {
      const active = d.id === currentDept;
      html += '<button class="dept-btn" onclick="setDept(\''+d.id+'\')" style="'+(active?'background:'+d.c+'20;border:2px solid '+d.c+';color:'+d.c+';font-weight:800;':'')+'font-size:.7rem;padding:6px 12px;">';
      html += d.i+' '+d.n+'</button>';
    });
  });
  html += '</div>';
  
  document.getElementById('dept-buttons').innerHTML = html;
};

const renderCheltuieli = () => {
  // Hónap select feltöltés
  const msel = document.getElementById('cheltMonthSelect');
  if(msel) msel.innerHTML = months.map((m,i) => '<option value="'+i+'"'+(i===currentMonth?' selected':'')+'>'+m+'</option>').join('');
  
  renderDeptButtons();
  const dept = depts.find(d => d.id === currentDept);
  const allDeptFacturi = facturi.filter(f => f.dept === currentDept);
  
  // Szűrés
  const deptFacturi = cheltFilter === 'all' ? allDeptFacturi : allDeptFacturi.filter(f => (f.tip||'fix') === cheltFilter);
  const totalR = deptFacturi.reduce((s, f) => s + f.months[currentMonth].r, 0);
  const yearR = deptFacturi.reduce((s, f) => s + f.months.reduce((x, m) => x + m.r, 0), 0);
  
  // Fix/Flex összeg
  const fixR = allDeptFacturi.filter(f=>(f.tip||'fix')==='fix').reduce((s,f)=>s+f.months[currentMonth].r,0);
  const flexR = allDeptFacturi.filter(f=>f.tip==='flex').reduce((s,f)=>s+f.months[currentMonth].r,0);
  
  // Filter button highlight
  ['cfAll','cfFix','cfFlex'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.style.background=(id==='cf'+cheltFilter.charAt(0).toUpperCase()+cheltFilter.slice(1)||(id==='cfAll'&&cheltFilter==='all'))?'var(--red)':'var(--white)';el.style.color=(id==='cf'+cheltFilter.charAt(0).toUpperCase()+cheltFilter.slice(1)||(id==='cfAll'&&cheltFilter==='all'))?'#fff':'var(--dark)';}
  });
  document.getElementById('cfAll').style.background=cheltFilter==='all'?'var(--red)':'var(--white)';
  document.getElementById('cfAll').style.color=cheltFilter==='all'?'#fff':'var(--dark)';
  document.getElementById('cfFix').style.background=cheltFilter==='fix'?'var(--red)':'var(--white)';
  document.getElementById('cfFix').style.color=cheltFilter==='fix'?'#fff':'var(--dark)';
  document.getElementById('cfFlex').style.background=cheltFilter==='flex'?'var(--red)':'var(--white)';
  document.getElementById('cfFlex').style.color=cheltFilter==='flex'?'#fff':'var(--dark)';

  let html = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
      <div style="background:var(--white);border-radius:12px;padding:14px 18px;border:1px solid var(--border);border-top:3px solid var(--danger);">
        <div style="font-size:.68rem;font-weight:600;color:var(--muted);text-transform:uppercase;">${dept?dept.i:""} ${dept?dept.n:""} — ${months[currentMonth]}</div>
        <div style="font-size:1.4rem;font-weight:800;color:var(--danger);">${fmt(totalR)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:12px;padding:14px 18px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.68rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Cheltuieli FIXE</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--red);">${fmt(fixR)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:12px;padding:14px 18px;border:1px solid var(--border);border-top:3px solid var(--cyan);">
        <div style="font-size:.68rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Cheltuieli FLEX</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--cyan);">${fmt(flexR)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:12px;padding:14px 18px;border:1px solid var(--border);">
        <div style="font-size:.68rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Total Anual</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--dark);">${fmt(yearR)} RON</div>
      </div>
    </div>
  `;

  // Table
  html += `<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">`;
  html += `<div style="display:grid;grid-template-columns:2fr .6fr 1fr 1fr 1fr 50px;gap:0;padding:10px 18px;border-bottom:2px solid var(--border);background:var(--bg);">
    <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;">Factură</div>
    <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:center;">Tip</div>
    <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:right;">Planificat</div>
    <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:right;">Realizat</div>
    <div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;text-align:right;">Diferență</div>
    <div></div>
  </div>`;

  if(deptFacturi.length===0){
    html += '<div style="padding:2rem;text-align:center;color:var(--muted);font-style:italic;">Nu există facturi</div>';
  } else {
    deptFacturi.forEach((f,idx) => {
      const d = f.months[currentMonth];
      const dif = d.p - d.r;
      const yr = f.months.reduce((s,m)=>s+m.r,0);
      const bg = idx%2===0?'var(--white)':'var(--bg)';
      const difColor = dif>=0?'var(--green)':'var(--danger)';
      const tipVal = f.tip || 'fix';
      html += `<div style="display:grid;grid-template-columns:2fr .6fr 1fr 1fr 1fr 50px;gap:0;padding:10px 18px;border-bottom:1px solid var(--border);background:${bg};align-items:center;">
        <div>
          <input type="text" value="${f.nume}" onchange="updFactura(${f.id},'nume',this.value)" placeholder="Nume factură..." style="padding:5px 8px;font-size:.85rem;font-weight:700;width:90%;">
          <div style="font-size:.65rem;color:var(--muted);margin-top:2px;">An: ${fmt(yr)} RON</div>
        </div>
        <div style="text-align:center;"><select onchange="updFactura(${f.id},'tip',this.value)" style="padding:3px;font-size:.7rem;border:1px solid var(--border);border-radius:4px;font-weight:700;color:${tipVal==='fix'?'var(--red)':'var(--cyan)'};"><option value="fix" ${tipVal==='fix'?'selected':''}>Fix</option><option value="flex" ${tipVal==='flex'?'selected':''}>Flex</option></select></div>
        <div style="text-align:right;"><input type="number" value="${d.p}" onchange="updFactura(${f.id},'p',this.value)" style="width:90px;padding:5px 8px;font-size:.85rem;text-align:right;color:var(--muted);"></div>
        <div style="text-align:right;"><input type="number" value="${d.r}" onchange="updFactura(${f.id},'r',this.value)" style="width:90px;padding:5px 8px;font-size:.85rem;text-align:right;font-weight:700;color:var(--danger);"></div>
        <div style="text-align:right;"><span style="padding:3px 10px;font-size:.78rem;font-weight:700;border-radius:16px;${dif>=0?'background:rgba(16,185,129,.1);color:var(--green);':'background:rgba(239,68,68,.1);color:var(--danger);'}">${dif>=0?'+':''}${fmt(dif)}</span></div>
        <div style="text-align:center;"><button onclick="delFactura(${f.id})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 8px;cursor:pointer;color:var(--danger);font-size:.8rem;">✕</button></div>
      </div>`;
    });
  }

  // Total row
  const totalP = deptFacturi.reduce((s,f)=>s+f.months[currentMonth].p,0);
  const totalDif = totalP - totalR;
  html += `<div style="display:grid;grid-template-columns:2fr .6fr 1fr 1fr 1fr 50px;gap:0;padding:12px 18px;background:var(--red-light);border-top:2px solid var(--red);">
    <div style="font-size:.88rem;font-weight:800;color:var(--red);">TOTAL</div>
    <div style="text-align:right;font-weight:800;color:var(--muted);">${fmt(totalP)}</div>
    <div style="text-align:right;font-weight:800;color:var(--danger);">${fmt(totalR)}</div>
    <div style="text-align:right;"><span style="padding:3px 10px;font-size:.82rem;font-weight:800;border-radius:16px;background:var(--red);color:#fff;">${totalDif>=0?'+':''}${fmt(totalDif)}</span></div>
    <div></div>
  </div>`;
  html += `</div>`;

  document.getElementById('facturi-list').innerHTML = html;
  
  // === ACHIZIȚII RÉSZLETES LISTA ===
  const achEl = document.getElementById('achizitii-list');
  if(achEl && cfAchizitii.length > 0) {
    const moStr = String(currentMonth + 1).padStart(2,'0');
    const moAch = cfAchizitii.filter(a => a.data && a.data.substring(5,7) === moStr);
    
    if(moAch.length > 0) {
      const totalAch = moAch.reduce((s,a) => s + (a.valoare||a.sumaPos||0), 0);
      
      // Csoportok
      const grupDef = [
        {id:'rulaj',label:'Rulaj Piese',color:'var(--red)'},
        {id:'cheltuieli',label:'Cheltuieli Prod.',color:'var(--orange)'},
        {id:'transport',label:'Transport',color:'var(--cyan)'},
        {id:'rentacar',label:'Rent a Car',color:'var(--purple)'},
        {id:'admin',label:'Admin (fix)',color:'var(--muted)'},
        {id:'garantii',label:'Garanții',color:'var(--danger)'}
      ];
      
      // KPI per csoport
      let ah = '<div style="font-size:.78rem;font-weight:800;color:var(--red);text-transform:uppercase;margin-bottom:8px;">Achiziții piese — '+months[currentMonth]+' <span style="font-size:.68rem;font-weight:600;color:var(--muted);">('+moAch.length+' facturi | '+fmt(totalAch)+' RON)</span></div>';
      
      ah += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;margin-bottom:10px;">';
      grupDef.forEach(function(g) {
        var gAch = moAch.filter(function(a){return a.grup===g.id;});
        var gTotal = gAch.reduce(function(s,a){return s+(a.valoare||a.sumaPos||0);},0);
        if(gTotal === 0 && gAch.length === 0) return;
        ah += '<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);border-top:3px solid '+g.color+';text-align:center;cursor:pointer;" onclick="setAchGrup(\''+g.id+'\')">';
        ah += '<div style="font-size:.55rem;font-weight:700;color:'+g.color+';text-transform:uppercase;">'+g.label+'</div>';
        ah += '<div style="font-size:.9rem;font-weight:900;color:var(--dark);">'+fmt(gTotal)+'</div>';
        ah += '<div style="font-size:.5rem;color:var(--muted);">'+gAch.length+' fac.</div>';
        ah += '</div>';
      });
      ah += '</div>';
      
      // Lista szűrve csoportra
      var filteredAch = achGrup === 'all' ? moAch : moAch.filter(function(a){return a.grup===achGrup;});
      var filtLabel = achGrup === 'all' ? 'TOATE' : grupDef.find(function(g){return g.id===achGrup;})?.label || achGrup;
      
      ah += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">';
      ah += '<div style="padding:8px 16px;background:rgba(139,92,246,.05);border-bottom:2px solid var(--purple);display:flex;justify-content:space-between;align-items:center;">';
      ah += '<div style="display:flex;gap:6px;align-items:center;"><span style="font-size:.72rem;font-weight:700;color:var(--purple);">'+filtLabel+'</span>';
      if(achGrup !== 'all') ah += '<button onclick="setAchGrup(\'all\')" style="font-size:.55rem;padding:2px 6px;background:var(--bg);border:1px solid var(--border);border-radius:4px;cursor:pointer;">Toate</button>';
      ah += '</div>';
      ah += '<span style="font-size:.85rem;font-weight:800;color:var(--purple);">'+fmt(filteredAch.reduce(function(s,a){return s+(a.valoare||a.sumaPos||0);},0))+' RON</span>';
      ah += '</div>';
      
      // Header
      ah += '<div style="display:grid;grid-template-columns:.5fr .8fr 1fr .7fr .5fr .5fr;padding:5px 14px;background:var(--bg);border-bottom:1px solid var(--border);font-size:.62rem;font-weight:700;color:var(--red);">';
      ah += '<div>Data</div><div>Furnizor</div><div>Document</div><div>Grup</div><div style="text-align:right;">Valoare</div><div style="text-align:right;">TVA</div>';
      ah += '</div>';
      
      filteredAch.forEach(function(a, i) {
        var bg = i%2===0?'':'background:var(--bg);';
        var val = a.valoare || a.sumaPos || 0;
        var valCol = val < 0 ? 'var(--green)' : 'var(--dark)';
        var gDef = grupDef.find(function(g){return g.id===a.grup;});
        ah += '<div style="display:grid;grid-template-columns:.5fr .8fr 1fr .7fr .5fr .5fr;padding:5px 14px;border-bottom:1px solid var(--border);font-size:.72rem;'+bg+'align-items:center;">';
        ah += '<div style="color:var(--muted);font-size:.65rem;">'+a.data.substring(5)+'</div>';
        ah += '<div style="font-weight:700;color:var(--dark);font-size:.68rem;">'+(a.furnizor||'—')+'</div>';
        ah += '<div style="font-size:.58rem;color:var(--muted);">'+a.doc+'</div>';
        ah += '<div><span style="font-size:.52rem;font-weight:600;padding:2px 5px;border-radius:4px;background:rgba(200,64,64,.06);color:'+(gDef?gDef.color:'var(--muted)')+';">'+(gDef?gDef.label:a.grup)+'</span></div>';
        ah += '<div style="text-align:right;font-weight:700;color:'+valCol+';">'+fmt(val)+'</div>';
        ah += '<div style="text-align:right;color:var(--muted);font-size:.65rem;">'+fmt(a.tva||0)+'</div>';
        ah += '</div>';
      });
      
      ah += '</div>';
      achEl.innerHTML = ah;
    } else {
      achEl.innerHTML = '';
    }
  } else if(achEl) { achEl.innerHTML = ''; }
};


// === RENDER SUMAR ===
const renderSumar = () => {
  const c = calc5();
  const pl = periodLabel();
  const td = totalMunkanapok();
  const cm = currentMunkanapok();
  document.getElementById('period-label').textContent = pl;

  // Munkanapok sor
  const mnRow = document.getElementById('munkanapokRow');
  if(mnRow) mnRow.innerHTML = months.map((m,i) => 
    `<div style="text-align:center">
      <div style="font-size:.6rem;color:${i===currentMonth?'var(--red)':'var(--muted)'};font-weight:${i===currentMonth?'700':'500'}">${m.substring(0,3)}</div>
      <input type="number" value="${munkanapok[i]}" onchange="munkanapok[${i}]=Number(this.value);renderSumar();render();"
        style="width:32px;padding:2px;text-align:center;border:1px solid ${i===currentMonth?'var(--red)':'var(--border)'};border-radius:5px;font-size:.75rem;font-weight:700;color:${i===currentMonth?'var(--red)':'var(--text)'};background:${i===currentMonth?'var(--red-light)':'var(--white)'}">
    </div>`
  ).join('') + `<div style="text-align:center"><div style="font-size:.6rem;color:var(--dark);font-weight:700">Tot</div><div style="font-size:.78rem;font-weight:800;color:var(--dark);padding:3px 0">${td}</div></div>`;

  // Profit hero
  const profitEl = document.getElementById('profit-hero');
  const profitSub = document.getElementById('profit-sub');
  if(profitEl) {
    profitEl.textContent = `${c.profit.month >= 0 ? '+' : ''}${fmt(c.profit.month)} RON`;
    profitEl.style.color = c.profit.month >= 0 ? 'var(--green)' : 'var(--danger)';
  }
  if(profitSub) profitSub.textContent = `Venituri ${fmt(c.manopera.month + c.piese.month + c.transport.month)} − Cheltuieli ${fmt(c.cheltuieli.month + c.salariiMonth)}`;

  // === 3 CSOPORTOK ===
  const venYear = c.manopera.year + c.piese.year;
  const venMonth = c.manopera.month + c.piese.month;
  const cheltYear = c.cheltuieli.year + c.salarii.year;
  const venPlan = planTargets.manopera + planTargets.piese;
  const cheltPlan = planTargets.cheltuieli + planTargets.salarii;

  // Pipeline havi
  const pipeline = calcPipeline();
  const pipeMonth = pipeline[currentMonth]?.total || 0;
  const pipeEaaMonth = pipeline[currentMonth]?.eaa || 0;
  const pipeAlteMonth = pipeline[currentMonth]?.alte || 0;
  const pipeYear = pipeline.reduce((s,p)=>s+p.total,0);
  const pipeEaa = pipeline.reduce((s,p)=>s+p.eaa,0);
  const pipeAlte = pipeline.reduce((s,p)=>s+p.alte,0);

  // Transport
  const transportMonth = c.transport.month;
  const transportYear = c.transport.year;

  const groups = [
    {
      key: 'forgalom', label: 'FORGALOM', icon: '', color: 'var(--red)',
      desc: 'Facturi emise cu TVA',
      items: [{ label: 'Facturi emise', valMonth: c.forgalom.month, valYear: c.forgalom.year, planKey: 'forgalom' }],
      totalMonth: c.forgalom.month, totalYear: c.forgalom.year, totalPlan: planTargets.forgalom
    },
    {
      key: 'venituri', label: 'VENITURI', icon: '', color: 'var(--red)',
      desc: 'Manoperă + Piese + Transport',
      items: [
        { label: 'Manoperă', valMonth: c.manopera.month, valYear: c.manopera.year, planKey: 'manopera' },
        { label: 'Piese (adaos)', valMonth: c.piese.month, valYear: c.piese.year, planKey: 'piese' },
        { label: 'Transport', valMonth: transportMonth, valYear: transportYear, noPlan: true }
      ],
      totalMonth: c.manopera.month+c.piese.month+transportMonth, totalYear: venYear+transportYear, totalPlan: venPlan
    },
    {
      key: 'cheltuieli', label: 'CHELTUIELI', icon: '', color: 'var(--red)',
      desc: 'Costuri operaționale',
      items: [
        { label: 'Cheltuieli fixe', valMonth: c.cheltuieli.month, valYear: c.cheltuieli.year, planKey: 'cheltuieli' },
        { label: 'Personal', valMonth: c.salariiMonth, valYear: c.salariiMonth*12, planKey: 'salarii' }
      ],
      totalMonth: c.cheltuieli.month+c.salariiMonth, totalYear: c.cheltuieli.year+c.salariiMonth*12, totalPlan: cheltPlan, isExpense: true
    },
    {
      key: 'pipeline', label: 'PIPELINE', icon: '', color: 'var(--red)',
      desc: 'Proformă (EAA) + Alte Venituri',
      items: [
        { label: 'Proformă (EAA)', valMonth: pipeEaaMonth, valYear: pipeEaa, noPlan: true },
        { label: 'Alte venituri', valMonth: pipeAlteMonth, valYear: pipeAlte, noPlan: true }
      ],
      totalMonth: pipeMonth, totalYear: pipeYear, totalPlan: 0, isPipeline: true
    }
  ];

  const groupsEl = document.getElementById('sumar3groups');
  if(groupsEl) groupsEl.innerHTML = groups.map(g => {
    const periodVal = g.totalMonth;
    const planMonth = g.totalPlan > 0 ? g.totalPlan / 12 : 0;
    const dif = g.isExpense ? (planMonth - periodVal) : (periodVal - planMonth);
    const difColor = dif >= 0 ? 'var(--green)' : 'var(--danger)';
    const pct = g.totalPlan > 0 ? Math.round((g.totalYear / g.totalPlan) * 100) : 0;
    const barW = Math.min(pct, 150);

    return `<div class="card" style="padding:0;overflow:hidden;border-top:3px solid var(--red);">
      <div style="padding:14px 16px 10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:.78rem;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:.03em">${g.label}</span>
          <span style="font-size:.65rem;color:var(--muted);font-weight:500">${g.desc}</span>
        </div>
        <div style="font-size:1.6rem;font-weight:900;color:var(--dark);margin:4px 0 2px;">${fmt(periodVal)} <span style="font-size:.65rem;color:var(--muted);font-weight:600">RON/${pl}</span></div>
        ${g.isPipeline ? '' : `
          <div style="height:3px;background:var(--border);border-radius:2px;overflow:hidden;margin:6px 0 3px;">
            <div style="height:100%;width:${barW}%;background:var(--red);border-radius:2px;transition:.3s;max-width:100%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.68rem;">
            <span style="color:${difColor};font-weight:700">${dif>=0?'+':''}${fmt(dif)} ${g.isExpense?'eco':'vs plan'}</span>
            <span style="color:var(--muted);font-weight:600">${pct}%</span>
          </div>
        `}
      </div>
      <div style="background:var(--bg);padding:8px 14px;border-top:1px solid var(--border);">
        ${g.items.map(item => {
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:.75rem;font-weight:600;color:var(--dark);">${item.label}</div>
              <div style="font-size:.62rem;color:var(--muted);">An: ${fmt(item.valYear)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:.9rem;font-weight:800;color:var(--dark);">${fmt(item.valMonth)}</div>
              ${item.noPlan ? '' : `<div style="font-size:.6rem;color:var(--muted);">plan: ${fmt(item.planKey ? planTargets[item.planKey]/12 : 0)}</div>`}
            </div>
          </div>`;
        }).join('')}
        ${g.isPipeline ? '' : `<div style="margin-top:6px;">
          ${g.items.filter(i=>!i.noPlan).map(item => `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
            <span style="font-size:.65rem;color:var(--muted);font-weight:600;width:80px;">${item.label} plan:</span>
            <input type="number" value="${Math.round(planTargets[item.planKey])}" onchange="planTargets['${item.planKey}']=Number(this.value);renderSumar();"
              style="flex:1;padding:3px 5px;font-size:.75rem;font-weight:700;text-align:right;border:1px solid var(--border);border-radius:5px;color:var(--dark);">
          </div>`).join('')}
        </div>`}
      </div>
    </div>`;
  }).join('');

  // === DETALII TÁBLA ===
  const mnap = munkanapok[currentMonth] || 22;
  const allRows = [
    {label:'Forgalom',month:c.forgalom.month,year:c.forgalom.year,plan:planTargets.forgalom},
    {label:'Manoperă',month:c.manopera.month,year:c.manopera.year,plan:planTargets.manopera},
    {label:'Piese',month:c.piese.month,year:c.piese.year,plan:planTargets.piese},
    {label:'Transport',month:c.transport.month,year:transportYear,plan:0,isPipe:true},
    {label:'TOTAL VENITURI',month:c.manopera.month+c.piese.month+c.transport.month,year:venYear+transportYear,plan:venPlan,bold:true},
    {label:'Cheltuieli',month:c.cheltuieli.month,year:c.cheltuieli.year,plan:planTargets.cheltuieli},
    {label:'Personal',month:c.salariiMonth,year:c.salariiMonth*12,plan:planTargets.salarii},
    {label:'TOTAL CHELTUIELI',month:c.cheltuieli.month+c.salariiMonth,year:c.cheltuieli.year+c.salariiMonth*12,plan:cheltPlan,bold:true},
    {label:'PIPELINE (Proformă+Alte)',month:pipeMonth,year:pipeYear,plan:0,bold:true,isPipe:true}
  ];

  const tableEl = document.getElementById('sumarTable');
  if(tableEl) tableEl.innerHTML = `
    <div style="font-size:.82rem;font-weight:700;color:var(--dark);margin-bottom:8px;">Predicție per perioadă</div>
    <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
      <thead><tr style="border-bottom:2px solid var(--red)">
        <th style="padding:7px;text-align:left;color:var(--red);font-weight:700;">Categorie</th>
        <th style="padding:7px;text-align:right;color:var(--red);font-weight:700;">Zi</th>
        <th style="padding:7px;text-align:right;color:var(--red);font-weight:700;">Săptămână</th>
        <th style="padding:7px;text-align:right;color:var(--red);font-weight:700;">${months[currentMonth]}</th>
        <th style="padding:7px;text-align:right;color:var(--red);font-weight:700;">An</th>
        <th style="padding:7px;text-align:right;color:var(--red);font-weight:700;">Plan An</th>
        <th style="padding:7px;text-align:right;color:var(--red);font-weight:700;">%</th>
      </tr></thead>
      <tbody>
        ${allRows.map(r => {
          const daily = mnap > 0 ? r.month / mnap : 0;
          const weekly = daily * 5;
          const pct = r.plan > 0 ? Math.round((r.year / r.plan) * 100) : 0;
          const bg = r.bold ? 'background:var(--bg);' : '';
          const fw = r.bold ? 'font-weight:800;' : 'font-weight:600;';
          return `<tr style="border-bottom:1px solid var(--border);${bg}">
            <td style="padding:7px;font-weight:${r.bold?'800':'600'};color:var(--dark);font-size:${r.bold?'.82rem':'.78rem'}">${r.label}</td>
            <td style="padding:7px;text-align:right;${fw}color:var(--dark);">${fmt(daily)}</td>
            <td style="padding:7px;text-align:right;${fw}color:var(--dark);">${fmt(weekly)}</td>
            <td style="padding:7px;text-align:right;${fw}color:var(--dark);">${fmt(r.month)}</td>
            <td style="padding:7px;text-align:right;font-weight:800;color:var(--dark);">${fmt(r.year)}</td>
            <td style="padding:7px;text-align:right;color:var(--muted);">${r.isPipe ? '—' : fmt(r.plan)}</td>
            <td style="padding:7px;text-align:right;font-weight:700;color:var(--dark);">${r.isPipe ? '' : pct+'%'}</td>
          </tr>`;
        }).join('')}
        <tr style="border-top:2.5px solid var(--red);background:var(--red-light);">
          <td style="padding:8px;font-weight:900;color:var(--red);font-size:.85rem;">PROFIT NET</td>
          <td style="padding:8px;text-align:right;font-weight:800;color:var(--dark);">${fmt(mnap>0?c.profit.month/mnap:0)}</td>
          <td style="padding:8px;text-align:right;font-weight:800;color:var(--dark);">${fmt(mnap>0?(c.profit.month/mnap)*5:0)}</td>
          <td style="padding:8px;text-align:right;font-weight:800;color:var(--dark);">${fmt(c.profit.month)}</td>
          <td style="padding:8px;text-align:right;font-weight:900;font-size:.9rem;color:${c.profit.year>=0?'var(--green)':'var(--danger)'};">${fmt(c.profit.year)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>`;

  // === KAPACITÁS SZÁMÍTÁS (Sumar + Break-even használja) ===
  const kMnap = munkanapok[currentMonth] || 22;
  const kDepts = kapacitas.depts;
  const kTarif = kapacitas.tarifOra;
  const kOreZ = kapacitas.oreZi;
  let kapRows = [];
  let totMaxOre = 0, totMaxRON = 0, totRealOre = 0, totRealRON = 0;
  const deptVenitMap = {
    tehnic: 'tehnicFacturat', body: 'bodyFacturat', paint: 'paintFacturat',
    transport: 'transportFacturat', rentacar: 'rentacarFacturat'
  };
  Object.keys(kDepts).forEach(dk => {
    const d = kDepts[dk];
    if(d.nonprod) return;
    const dTarif = d.tarif || kTarif;
    const maxOre = d.angajati * kOreZ * kMnap;
    const maxRON = maxOre * dTarif;
    const factKey = deptVenitMap[dk];
    const realRON = factKey ? (venituri[factKey]?.[currentMonth]?.r || 0) : 0;
    const realOre = dTarif > 0 ? Math.round(realRON / dTarif * 10) / 10 : 0;
    const kihaszPct = maxRON > 0 ? Math.round((realRON / maxRON) * 100) : 0;
    const asztalon = maxRON - realRON;
    totMaxOre += maxOre; totMaxRON += maxRON;
    totRealOre += realOre; totRealRON += realRON;
    kapRows.push({ dk, label: d.label, ang: d.angajati, poszt: d.posztok, tarif: dTarif,
      maxOre, maxRON, realOre, realRON, kihaszPct, asztalon });
  });
  const totKihasz = totMaxRON > 0 ? Math.round((totRealRON / totMaxRON) * 100) : 0;
  const totAsztalon = totMaxRON - totRealRON;
  const kihaszColor = totKihasz >= 100 ? 'var(--green)' : totKihasz >= Math.round((kapacitas.minOrePost||140)/(kapacitas.maxOrePost||160)*100) ? 'var(--orange)' : 'var(--danger)';

  // === CÉG ALAPTÁBLÁZAT — most modal-ként ===
  // (a renderelés az openCegConfig funkcióban történik)

  // === KAPACITÁS MEGJELENÍTÉS ===
    

  // === KAPACITÁS MEGJELENÍTÉS ===
  const kapEl = document.getElementById('kapacitasSection');
  if(kapEl) {

    kapEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div style="font-size:.78rem;font-weight:700;color:var(--red);text-transform:uppercase;">KAPACITÁS & KIHASZNÁLTSÁG</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--dark);">${months[currentMonth]} — ${kMnap} zile lucrătoare</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <div style="text-align:right;">
            <div style="font-size:.6rem;color:var(--muted);">Ore/zi</div>
            <input type="number" value="${kOreZ}" onchange="kapacitas.oreZi=Number(this.value);renderSumar();" style="width:40px;padding:3px;text-align:center;font-size:.8rem;font-weight:700;border:1px solid var(--border);border-radius:5px;">
          </div>
        </div>
      </div>

      <!-- HERO KOCKÁK -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);">
          <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Capacitate Max</div>
          <div style="font-size:1.1rem;font-weight:900;color:var(--dark);margin-top:4px;">${fmt(totMaxRON)} RON</div>
          <div style="font-size:.6rem;color:var(--muted);margin-top:2px;">${totMaxOre} ore disponibile</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);">
          <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Realizat</div>
          <div style="font-size:1.1rem;font-weight:900;color:var(--dark);margin-top:4px;">${fmt(totRealRON)} RON</div>
          <div style="font-size:.6rem;color:var(--muted);margin-top:2px;">${totRealOre} ore facturate</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid ${kihaszColor};">
          <div style="font-size:.65rem;font-weight:700;color:${kihaszColor};text-transform:uppercase;">Utilizare %</div>
          <div style="font-size:1.5rem;font-weight:900;color:${kihaszColor};margin-top:4px;">${totKihasz}%</div>
          <div style="height:4px;background:var(--border);border-radius:2px;margin-top:6px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(totKihasz,100)}%;background:${kihaszColor};border-radius:2px;"></div>
          </div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--danger);">
          <div style="font-size:.65rem;font-weight:700;color:var(--danger);text-transform:uppercase;">RON pe masă</div>
          <div style="font-size:1.1rem;font-weight:900;color:var(--danger);margin-top:4px;">${fmt(totAsztalon)} RON</div>
          <div style="font-size:.6rem;color:var(--muted);margin-top:2px;">${100-totKihasz}% capacitate neutilizată</div>
        </div>
      </div>

      <!-- PER DEPARTAMENT TÁBLA -->
      <div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">
        <div style="display:grid;grid-template-columns:1.5fr .6fr .6fr .6fr .8fr .8fr .8fr .7fr .8fr;gap:0;padding:10px 14px;border-bottom:2px solid var(--border);background:var(--bg);font-size:.66rem;">
          <div style="color:var(--red);font-weight:700;">DEPARTAMENT</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Angajați</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Posturi</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Tarif/h</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Max Ore</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Max RON</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Realizat</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Utilizare</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Pe masă</div>
        </div>
        ${kapRows.map((r,i) => {
          const bg = i%2===0?'var(--white)':'var(--bg)';
          const kc = r.kihaszPct >= 75 ? 'var(--green)' : r.kihaszPct >= 60 ? 'var(--orange)' : 'var(--danger)';
          return `<div style="display:grid;grid-template-columns:1.5fr .6fr .6fr .6fr .8fr .8fr .8fr .7fr .8fr;gap:0;padding:6px 14px;border-bottom:1px solid var(--border);background:${bg};font-size:.76rem;align-items:center;">
            <div style="font-weight:700;color:var(--dark);">${r.label}</div>
            <div style="text-align:right;"><input type="number" value="${r.ang}" onchange="updKap('${r.dk}','angajati',this.value)" style="width:36px;padding:2px;text-align:center;font-size:.76rem;font-weight:700;border:1px solid var(--border);border-radius:4px;"></div>
            <div style="text-align:right;"><input type="number" value="${r.poszt}" onchange="updKap('${r.dk}','posztok',this.value)" style="width:36px;padding:2px;text-align:center;font-size:.76rem;font-weight:700;border:1px solid var(--border);border-radius:4px;"></div>
            <div style="text-align:right;"><input type="number" value="${r.tarif}" onchange="updKap('${r.dk}','tarif',this.value)" style="width:44px;padding:2px;text-align:center;font-size:.76rem;font-weight:700;border:1px solid var(--border);border-radius:4px;"></div>
            <div style="text-align:right;font-weight:700;color:var(--muted);">${r.maxOre} h</div>
            <div style="text-align:right;font-weight:700;color:var(--muted);">${fmt(r.maxRON)}</div>
            <div style="text-align:right;font-weight:800;color:var(--dark);">${fmt(r.realRON)}</div>
            <div style="text-align:right;"><span style="padding:2px 8px;font-size:.72rem;font-weight:700;border-radius:12px;background:${kc==='var(--green)'?'rgba(16,185,129,.1)':kc==='var(--orange)'?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)'};color:${kc};">${r.kihaszPct}%</span></div>
            <div style="text-align:right;font-weight:800;color:var(--danger);">${fmt(r.asztalon)}</div>
          </div>`;
        }).join('')}
        <div style="display:grid;grid-template-columns:1.5fr .6fr .6fr .6fr .8fr .8fr .8fr .7fr .8fr;gap:0;padding:10px 14px;background:var(--red-light);border-top:2px solid var(--red);font-size:.8rem;">
          <div style="font-weight:800;color:var(--red);">TOTAL</div>
          <div style="text-align:right;font-weight:800;">${kapRows.reduce((s,r)=>s+r.ang,0)}</div>
          <div style="text-align:right;font-weight:800;">${kapRows.reduce((s,r)=>s+r.poszt,0)}</div>
          <div style="text-align:right;font-weight:800;color:var(--muted);">—</div>
          <div style="text-align:right;font-weight:800;">${totMaxOre} h</div>
          <div style="text-align:right;font-weight:800;">${fmt(totMaxRON)}</div>
          <div style="text-align:right;font-weight:900;">${fmt(totRealRON)}</div>
          <div style="text-align:right;"><span style="padding:2px 10px;font-size:.78rem;font-weight:800;border-radius:12px;background:${kihaszColor==='var(--green)'?'rgba(16,185,129,.15)':kihaszColor==='var(--orange)'?'rgba(245,158,11,.15)':'rgba(239,68,68,.15)'};color:${kihaszColor};">${totKihasz}%</span></div>
          <div style="text-align:right;font-weight:900;color:var(--danger);">${fmt(totAsztalon)}</div>
        </div>
      </div>
    `;
  }

  // === BREAK-EVEN KALKULÁTOR — Heti / Havi / Éves ===
  const beEl = document.getElementById('breakevenSection');
  if(beEl) {
    const mnap = munkanapok[currentMonth] || 22;
    const hetiNap = 5;
    const evesNap = totalMunkanapok();
    
    // Fix költségek
    const fixCheltuieli = facturi.reduce((s,f) => s + (f.months?.[currentMonth]?.r || 0), 0);
    const fixSalarii = angajati.reduce((s,a) => {
      ensureFix(a);
      return s + (a.fix.salariuNet||0) + (a.fix.taxe||0) + a.fix.bonificatii.reduce((x,b)=>x+(b.suma||0),0);
    }, 0);
    const fixCostFirma = angajati.reduce((s,a) => {
      ensureFix(a);
      return s + calcAngCost(a.fix).totalCostFirma;
    }, 0);
    const costHavi = fixCheltuieli + fixSalarii + fixCostFirma;
    const costHeti = mnap > 0 ? costHavi / mnap * hetiNap : 0;
    const costEves = costHavi * 12;
    const costNapi = mnap > 0 ? costHavi / mnap : 0;
    
    // Termelés (realizált havi)
    const venHavi = c.manopera.month + c.piese.month + c.transport.month;
    const elteltNapok = Math.min(new Date().getDate(), mnap);
    const venNapi = elteltNapok > 0 ? venHavi / elteltNapok : 0;
    const venHeti = venNapi * hetiNap;
    const venEves = venHavi * 12;
    
    // Break-even napok per periódus
    const beNapHavi = venNapi > 0 ? Math.ceil(costHavi / venNapi) : 99;
    const beNapHeti = venNapi > 0 ? Math.ceil(costHeti / venNapi) : 99;
    const beHonapEves = costHavi > 0 && venHavi > 0 ? (costEves / venHavi / 12 * 12).toFixed(1) : '?';
    
    // Kapacitás break-even
    const kapNapi = mnap > 0 ? totMaxRON / mnap : 0;
    const beNapKap = kapNapi > 0 ? Math.ceil(costHavi / kapNapi) : 99;
    
    // Profit per periódus
    const profitNapi = venNapi - costNapi;
    const profitHeti = profitNapi * hetiNap;
    const profitHavi = venHavi - costHavi;
    const profitEves = profitHavi * 12;
    
    // Status
    const maHol = elteltNapok;
    const maTulBE = maHol > beNapHavi;
    const beColor = beNapHavi <= 10 ? 'var(--green)' : beNapHavi <= 15 ? 'var(--orange)' : 'var(--danger)';
    const bePct = mnap > 0 ? Math.round((beNapHavi / mnap) * 100) : 0;

    beEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div style="font-size:.78rem;font-weight:700;color:var(--red);text-transform:uppercase;">BREAK-EVEN KALKULÁTOR</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--dark);">${months[currentMonth]} — Heti · Havi · Éves gondolkodás</div>
        </div>
      </div>

      <!-- BREAK-EVEN TÁBLA: Zi / Hét / Hó / Év -->
      <div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;margin-bottom:14px;">
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr;gap:0;padding:10px 14px;border-bottom:2px solid var(--border);background:var(--bg);font-size:.68rem;">
          <div style="color:var(--red);font-weight:700;">CATEGORIE</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Zi</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Săptămână</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Lună</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">An</div>
        </div>
        ${[
          {label:'Producție (venituri)', zi:venNapi, heti:venHeti, havi:venHavi, eves:venEves, color:'var(--dark)'},
          {label:'Costuri fixe', zi:costNapi, heti:costHeti, havi:costHavi, eves:costEves, color:'var(--danger)'},
          {label:'PROFIT / PIERDERE', zi:profitNapi, heti:profitHeti, havi:profitHavi, eves:profitEves, bold:true}
        ].map((r,i) => {
          const bg = r.bold ? 'var(--bg)' : (i%2===0?'var(--white)':'var(--bg)');
          const profCol = v => v >= 0 ? 'var(--green)' : 'var(--danger)';
          const col = r.bold ? profCol(r.havi) : r.color;
          return `<div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr;gap:0;padding:8px 14px;border-bottom:1px solid var(--border);background:${bg};font-size:.78rem;align-items:center;">
            <div style="font-weight:${r.bold?'800':'600'};color:${col};">${r.label}</div>
            <div style="text-align:right;font-weight:${r.bold?'900':'700'};color:${r.bold?profCol(r.zi):col};">${fmt(Math.round(r.zi))}</div>
            <div style="text-align:right;font-weight:${r.bold?'900':'700'};color:${r.bold?profCol(r.heti):col};">${fmt(Math.round(r.heti))}</div>
            <div style="text-align:right;font-weight:${r.bold?'900':'700'};color:${r.bold?profCol(r.havi):col};">${fmt(Math.round(r.havi))}</div>
            <div style="text-align:right;font-weight:${r.bold?'900':'700'};color:${r.bold?profCol(r.eves):col};">${fmt(Math.round(r.eves))}</div>
          </div>`;
        }).join('')}
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr;gap:0;padding:10px 14px;background:var(--red-light);border-top:2px solid var(--red);font-size:.78rem;">
          <div style="font-weight:800;color:var(--red);">BREAK-EVEN</div>
          <div style="text-align:right;font-weight:900;color:${beColor};">${beNapHavi}. zi</div>
          <div style="text-align:right;font-weight:900;color:${beColor};">${beNapHeti > hetiNap ? '> 1 săpt' : beNapHeti+' zile'}</div>
          <div style="text-align:right;font-weight:900;color:${beColor};">${beNapHavi} / ${mnap} zile</div>
          <div style="text-align:right;font-weight:900;color:${beColor};">${beHonapEves} luni</div>
        </div>
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr;gap:0;padding:10px 14px;background:var(--bg);border-top:1px solid var(--border);font-size:.78rem;">
          <div style="font-weight:800;color:var(--dark);">COST / REVENUE %</div>
          <div style="text-align:right;font-weight:900;color:${(venNapi>0?costNapi/venNapi*100:0)>80?'var(--danger)':(venNapi>0?costNapi/venNapi*100:0)>65?'var(--orange)':'var(--green)'};">${venNapi>0?Math.round(costNapi/venNapi*100):0}%</div>
          <div style="text-align:right;font-weight:900;color:${(venHeti>0?costHeti/venHeti*100:0)>80?'var(--danger)':(venHeti>0?costHeti/venHeti*100:0)>65?'var(--orange)':'var(--green)'};">${venHeti>0?Math.round(costHeti/venHeti*100):0}%</div>
          <div style="text-align:right;font-weight:900;color:${(venHavi>0?costHavi/venHavi*100:0)>80?'var(--danger)':(venHavi>0?costHavi/venHavi*100:0)>65?'var(--orange)':'var(--green)'};">${venHavi>0?Math.round(costHavi/venHavi*100):0}%</div>
          <div style="text-align:right;font-weight:900;color:${(venEves>0?costEves/venEves*100:0)>80?'var(--danger)':(venEves>0?costEves/venEves*100:0)>65?'var(--orange)':'var(--green)'};">${venEves>0?Math.round(costEves/venEves*100):0}%</div>
        </div>
      </div>

      <!-- HERO KOCKÁK -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px;">
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);">
          <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Costuri Fixe / Lună</div>
          <div style="font-size:1rem;font-weight:900;color:var(--dark);margin-top:4px;">${fmt(costHavi)} RON</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">Chelt: ${fmt(fixCheltuieli)} | Sal: ${fmt(fixSalarii)} | Firma: ${fmt(fixCostFirma)}</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid ${beColor};">
          <div style="font-size:.65rem;font-weight:700;color:${beColor};text-transform:uppercase;">Break-Even Ziua</div>
          <div style="font-size:1.5rem;font-weight:900;color:${beColor};margin-top:4px;">${beNapHavi}. zi</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">din ${mnap} zile | capacitate: ${beNapKap}. zi</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid ${maTulBE?'var(--green)':'var(--orange)'};">
          <div style="font-size:.65rem;font-weight:700;color:${maTulBE?'var(--green)':'var(--orange)'};text-transform:uppercase;">Status Azi (Ziua ${maHol})</div>
          <div style="font-size:1.1rem;font-weight:900;color:${maTulBE?'var(--green)':'var(--orange)'};margin-top:4px;">${maTulBE?'PROFIT ZONA':'COST ZONA'}</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">${maTulBE?'+'+(maHol-beNapHavi)+' zile profit':(beNapHavi-maHol)+' zile până la BE'}</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid ${profitHavi>=0?'var(--green)':'var(--danger)'};">
          <div style="font-size:.65rem;font-weight:700;color:${profitHavi>=0?'var(--green)':'var(--danger)'};text-transform:uppercase;">Profit / Lună</div>
          <div style="font-size:1.1rem;font-weight:900;color:${profitHavi>=0?'var(--green)':'var(--danger)'};margin-top:4px;">${fmt(Math.round(profitHavi))} RON</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">An: ${fmt(Math.round(profitEves))} RON</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid ${(venHavi>0?costHavi/venHavi*100:0)>80?'var(--danger)':(venHavi>0?costHavi/venHavi*100:0)>65?'var(--orange)':'var(--green)'};">
          <div style="font-size:.65rem;font-weight:700;color:${(venHavi>0?costHavi/venHavi*100:0)>80?'var(--danger)':(venHavi>0?costHavi/venHavi*100:0)>65?'var(--orange)':'var(--green)'};text-transform:uppercase;">Cost / Revenue</div>
          <div style="font-size:1.5rem;font-weight:900;color:${(venHavi>0?costHavi/venHavi*100:0)>80?'var(--danger)':(venHavi>0?costHavi/venHavi*100:0)>65?'var(--orange)':'var(--green)'};margin-top:4px;">${venHavi>0?Math.round(costHavi/venHavi*100):0}%</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">Cél: &lt; 65% | Riasztás: &gt; 80%</div>
        </div>
      </div>

      <!-- VIZUÁLIS CSÍK -->
      <div style="background:var(--white);border-radius:10px;padding:16px;border:1px solid var(--border);">
        <div style="font-size:.72rem;font-weight:700;color:var(--dark);margin-bottom:10px;">Hónap vizualizáció — ${months[currentMonth]}</div>
        <div style="position:relative;height:40px;background:var(--bg);border-radius:8px;overflow:hidden;border:1px solid var(--border);">
          <div style="position:absolute;left:0;top:0;height:100%;width:${Math.min(bePct,100)}%;background:rgba(239,68,68,.15);"></div>
          <div style="position:absolute;left:${Math.min(bePct,100)}%;top:0;height:100%;width:${100-Math.min(bePct,100)}%;background:rgba(16,185,129,.1);"></div>
          <div style="position:absolute;left:${Math.min(bePct,100)}%;top:0;height:100%;width:2px;background:var(--red);"></div>
          <div style="position:absolute;left:${Math.round(maHol/mnap*100)}%;top:0;height:100%;width:3px;background:var(--dark);border-radius:2px;"></div>
          <div style="position:absolute;left:4px;top:50%;transform:translateY(-50%);font-size:.6rem;font-weight:700;color:var(--danger);">COST</div>
          <div style="position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:.6rem;font-weight:700;color:var(--green);">PROFIT</div>
          <div style="position:absolute;left:${Math.min(bePct,100)}%;top:-1px;transform:translateX(-50%);font-size:.55rem;font-weight:800;color:var(--red);background:var(--white);padding:0 4px;border-radius:3px;">BE:${beNapHavi}</div>
          <div style="position:absolute;left:${Math.round(maHol/mnap*100)}%;bottom:-1px;transform:translateX(-50%);font-size:.55rem;font-weight:800;color:var(--dark);background:var(--white);padding:0 4px;border-radius:3px;">MA:${maHol}</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:.6rem;color:var(--muted);">
          <span>1. zi</span>
          <span>Break-even: ${beNapHavi}. zi</span>
          <span>${mnap}. zi</span>
        </div>
      </div>
    `;
  }

  // === FORECAST MOTOR — Bevételi Előrejelzés ===
  const fcEl = document.getElementById('forecastSection');
  if(fcEl) {
    const cm = currentMonth;
    const mnap = munkanapok[cm] || 22;
    const elteltNapok = Math.min(new Date().getDate(), mnap);
    
    // Historikus hónapok átlaga (amihez van adat)
    const histMonths = [];
    for(let i=0; i<12; i++){
      const mForg = cfMonths[i].facturat || 0;
      const mMan = cfMonths[i].nManop || 0;
      const mPiese = cfMonths[i].artNyer || 0;
      const mTr = venituri.transportFacturat[i]?.r || 0;
      if(mForg > 0 || mMan > 0) histMonths.push({i, forg:mForg, man:mMan, piese:mPiese, tr:mTr, ven:mMan+mPiese+mTr});
    }
    
    // Aktuális hónap napi átlag → hónap végi becslés
    const curForg = cfMonths[cm].facturat || 0;
    const curMan = cfMonths[cm].nManop || 0;
    const curPiese = cfMonths[cm].artNyer || 0;
    const curTr = venituri.transportFacturat[cm]?.r || 0;
    const curVen = curMan + curPiese + curTr;
    
    const napiForg = elteltNapok > 0 ? curForg / elteltNapok : 0;
    const napiVen = elteltNapok > 0 ? curVen / elteltNapok : 0;
    
    // Forecast = napi átlag × hátralévő napok + realizált
    const hatraleNapok = mnap - elteltNapok;
    const fcForg = curForg + napiForg * hatraleNapok;
    const fcMan = curMan + (elteltNapok>0?curMan/elteltNapok:0) * hatraleNapok;
    const fcPiese = curPiese + (elteltNapok>0?curPiese/elteltNapok:0) * hatraleNapok;
    const fcTr = curTr + (elteltNapok>0?curTr/elteltNapok:0) * hatraleNapok;
    const fcVen = fcMan + fcPiese + fcTr;
    
    // Historikus átlag (ha van 2+ hónap)
    const histAvgVen = histMonths.length >= 2 ? histMonths.reduce((s,h)=>s+h.ven,0)/histMonths.length : 0;
    const histAvgForg = histMonths.length >= 2 ? histMonths.reduce((s,h)=>s+h.forg,0)/histMonths.length : 0;
    
    // Plan vs forecast
    const planForg = planTargets.forgalom / 12;
    const planVen = (planTargets.manopera + planTargets.piese) / 12;
    const fcVsPlanForg = planForg > 0 ? Math.round((fcForg / planForg) * 100) : 0;
    const fcVsPlanVen = planVen > 0 ? Math.round((fcVen / planVen) * 100) : 0;
    const fcForgCol = fcVsPlanForg >= 90 ? 'var(--green)' : fcVsPlanForg >= 70 ? 'var(--orange)' : 'var(--danger)';
    const fcVenCol = fcVsPlanVen >= 90 ? 'var(--green)' : fcVsPlanVen >= 70 ? 'var(--orange)' : 'var(--danger)';
    
    // Éves forecast
    const fcForgYear = histMonths.length >= 2 ? histAvgForg * 12 : fcForg * 12;
    const fcVenYear = histMonths.length >= 2 ? histAvgVen * 12 : fcVen * 12;
    
    // Riasztás
    const riasztasForg = fcVsPlanForg < 80;
    const riasztasVen = fcVsPlanVen < 80;
    
    // Completion % (hány %-a van meg a hónapnak)
    const completePct = mnap > 0 ? Math.round((elteltNapok / mnap) * 100) : 0;

    fcEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div style="font-size:.78rem;font-weight:700;color:var(--red);text-transform:uppercase;">FORECAST — Bevételi Előrejelzés</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--dark);">${months[cm]} — ${elteltNapok}/${mnap} zile (${completePct}%)</div>
        </div>
        <div style="font-size:.65rem;color:var(--muted);">
          ${histMonths.length >= 2 ? histMonths.length+' luni istorice disponibile' : 'Proiecție din ritmul actual'}
        </div>
      </div>

      <!-- PROGRESS BAR -->
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="height:100%;width:${completePct}%;background:var(--red);border-radius:3px;transition:.3s;"></div>
      </div>

      <!-- HERO KOCKÁK -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);">
          <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Realizat ${months[cm]}</div>
          <div style="font-size:1rem;font-weight:900;color:var(--dark);margin-top:4px;">${fmt(curForg)} RON</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">Forgalom din ${elteltNapok} zile</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid ${fcForgCol};">
          <div style="font-size:.65rem;font-weight:700;color:${fcForgCol};text-transform:uppercase;">Forecast Forgalom</div>
          <div style="font-size:1rem;font-weight:900;color:${fcForgCol};margin-top:4px;">${fmt(Math.round(fcForg))} RON</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">${fcVsPlanForg}% din plan (${fmt(planForg)})</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid ${fcVenCol};">
          <div style="font-size:.65rem;font-weight:700;color:${fcVenCol};text-transform:uppercase;">Forecast Venituri</div>
          <div style="font-size:1rem;font-weight:900;color:${fcVenCol};margin-top:4px;">${fmt(Math.round(fcVen))} RON</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">${fcVsPlanVen}% din plan (${fmt(planVen)})</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);">
          <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Forecast Anual</div>
          <div style="font-size:1rem;font-weight:900;color:var(--dark);margin-top:4px;">${fmt(Math.round(fcVenYear))} RON</div>
          <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">venituri estimate pe an</div>
        </div>
      </div>

      ${riasztasForg || riasztasVen ? `
      <div style="background:rgba(239,68,68,.08);border:1.5px solid var(--danger);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
        <div style="font-size:1.2rem;">⚠</div>
        <div>
          <div style="font-size:.78rem;font-weight:700;color:var(--danger);">RIASZTÁS — Sub plan</div>
          <div style="font-size:.7rem;color:var(--dark);margin-top:2px;">
            ${riasztasForg ? 'Forgalom forecast '+fcVsPlanForg+'% din plan. ' : ''}
            ${riasztasVen ? 'Venituri forecast '+fcVsPlanVen+'% din plan. ' : ''}
            Hátralék pótlásához napi ${fmt(Math.round((planVen - curVen) / Math.max(hatraleNapok,1)))} RON/zi szükséges.
          </div>
        </div>
      </div>` : ''}

      <!-- RÉSZLETES TÁBLA -->
      <div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr .6fr;gap:0;padding:10px 14px;border-bottom:2px solid var(--border);background:var(--bg);font-size:.68rem;">
          <div style="color:var(--red);font-weight:700;">CATEGORIE</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Realizat</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Forecast lună</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Plan lună</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">Diferență</div>
          <div style="color:var(--red);font-weight:700;text-align:right;">%</div>
        </div>
        ${[
          {label:'Forgalom', real:curForg, fc:fcForg, plan:planForg},
          {label:'Manoperă', real:curMan, fc:fcMan, plan:planTargets.manopera/12},
          {label:'Piese', real:curPiese, fc:fcPiese, plan:planTargets.piese/12},
          {label:'Transport', real:curTr, fc:fcTr, plan:0, noPlan:true},
          {label:'TOTAL VENITURI', real:curVen, fc:fcVen, plan:planVen, bold:true}
        ].map((r,i) => {
          const bg = i%2===0?'var(--white)':'var(--bg)';
          const dif = r.plan > 0 ? Math.round(r.fc) - Math.round(r.plan) : 0;
          const pct = r.plan > 0 ? Math.round((r.fc / r.plan) * 100) : 0;
          const difCol = dif >= 0 ? 'var(--green)' : 'var(--danger)';
          const fw = r.bold ? 'font-weight:800;' : '';
          return `<div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr .6fr;gap:0;padding:8px 14px;border-bottom:1px solid var(--border);background:${r.bold?'var(--bg)':bg};font-size:.78rem;align-items:center;">
            <div style="${fw}color:var(--dark);">${r.label}</div>
            <div style="text-align:right;${fw}color:var(--dark);">${fmt(r.real)}</div>
            <div style="text-align:right;${fw}color:var(--dark);">${fmt(Math.round(r.fc))}</div>
            <div style="text-align:right;color:var(--muted);">${r.noPlan?'—':fmt(Math.round(r.plan))}</div>
            <div style="text-align:right;${fw}color:${difCol};">${r.noPlan?'—':(dif>=0?'+':'')+fmt(dif)}</div>
            <div style="text-align:right;"><span style="padding:2px 6px;font-size:.7rem;font-weight:700;border-radius:10px;background:${r.noPlan?'transparent':(pct>=90?'rgba(16,185,129,.1)':pct>=70?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)')};color:${r.noPlan?'var(--muted)':(pct>=90?'var(--green)':pct>=70?'var(--orange)':'var(--danger)')};">${r.noPlan?'':pct+'%'}</span></div>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  // === RIASZTÁSOK MOTOR ===
  const alertsEl = document.getElementById('sumarAlerts');
  if(alertsEl) {
    const alerts = [];
    const mnap = munkanapok[currentMonth] || 22;
    const eltelt = Math.min(new Date().getDate(), mnap);
    
    const venHavi = c.manopera.month + c.piese.month + c.transport.month;
    const planVenHavi = (planTargets.manopera + planTargets.piese) / 12;
    const fcVen = eltelt > 0 ? venHavi / eltelt * mnap : 0;
    const fcPct = planVenHavi > 0 ? Math.round(fcVen / planVenHavi * 100) : 0;
    const costRev = venHavi > 0 ? Math.round((c.cheltuieli.month + c.salariiMonth) / venHavi * 100) : 0;
    
    if(fcPct > 0 && fcPct < 60) alerts.push({level:'red', msg:'Venituri forecast '+fcPct+'% — lemaradás súlyos!', icon:'🔴'});
    else if(fcPct > 0 && fcPct < 80) alerts.push({level:'orange', msg:'Venituri forecast '+fcPct+'% — nyomás kell', icon:'🟠'});
    
    if(costRev > 80) alerts.push({level:'red', msg:'Cost/Revenue '+costRev+'% — veszteséges!', icon:'🔴'});
    else if(costRev > 65) alerts.push({level:'orange', msg:'Cost/Revenue '+costRev+'% — magas', icon:'🟠'});
    
    if(c.profit.month < 0) alerts.push({level:'red', msg:'Profit negatív: '+fmt(c.profit.month)+' RON!', icon:'🔴'});
    
    var cfD = cfSinteza[currentMonth];
    if(cfD && cfD.imported) {
      var cfT = (cfD.incasariBank+cfD.incasariCasa+cfD.alteBevételek)-(cfD.platiPiese+cfD.platiSalarii+cfD.platiTaxe+cfD.platiHitel+cfD.platiAlte+cfD.transferuri);
      if(cfT < -10000) alerts.push({level:'red', msg:'Cash Flow: '+fmt(cfT)+' RON — likviditás!', icon:'🔴'});
      else if(cfT < 0) alerts.push({level:'orange', msg:'Cash Flow negativ: '+fmt(cfT)+' RON', icon:'🟠'});
    }
    
    var mechsAct = angajati.filter(function(a){return a.dept&&!['admin','auxiliar','transport','rentacar'].includes(a.dept);});
    mechsAct.forEach(function(a){
      var ot=(a.months[currentMonth].aaa||0)+(a.months[currentMonth].eaa||0)+(a.months[currentMonth].daa||0);
      if(ot>0&&ot<(kapacitas.minOrePost||140)&&eltelt>mnap*0.6) alerts.push({level:'orange',msg:a.nume+' — '+Math.round(ot)+' ore (sub '+(kapacitas.minOrePost||140)+'h)',icon:'🟠'});
    });
    
    if(fcPct>=100&&planVenHavi>0) alerts.push({level:'green',msg:'Target depășit! '+fcPct+'% — excelent!',icon:'🟢'});
    if(costRev>0&&costRev<55) alerts.push({level:'green',msg:'Cost/Revenue '+costRev+'% — eficient!',icon:'🟢'});
    
    if(alerts.length>0){
      var ah='<div style="background:var(--white);border-radius:10px;border:1px solid var(--border);overflow:hidden;">';
      ah+='<div style="padding:8px 14px;background:rgba(200,50,50,.04);border-bottom:1px solid var(--border);font-size:.72rem;font-weight:800;color:var(--red);text-transform:uppercase;">Alerte Operaționale</div>';
      alerts.forEach(function(a){
        var bg=a.level==='red'?'rgba(239,68,68,.06)':a.level==='orange'?'rgba(245,158,11,.06)':'rgba(16,185,129,.06)';
        var col=a.level==='red'?'var(--danger)':a.level==='orange'?'var(--orange)':'var(--green)';
        ah+='<div style="padding:6px 14px;border-bottom:1px solid var(--border);background:'+bg+';display:flex;align-items:center;gap:8px;"><span style="font-size:.9rem;">'+a.icon+'</span><span style="font-size:.72rem;font-weight:600;color:'+col+';">'+a.msg+'</span></div>';
      });
      ah+='</div>';
      alertsEl.innerHTML=ah;
    } else alertsEl.innerHTML='';
  }
  
  // === KÉT TENGELYES ÖSSZEHASONLÍTÁS ===
  const twoEl = document.getElementById('sumarTwoAxis');
  if(twoEl) {
    var venT=c.manopera.month+c.piese.month+c.transport.month;
    var costT=c.cheltuieli.month+c.salariiMonth;
    var profT=venT-costT;
    var crPct=venT>0?Math.round(costT/venT*100):0;
    
    var mP=angajati.filter(function(a){return a.dept&&!['admin','auxiliar','transport','rentacar'].includes(a.dept);});
    var totOreR=mP.reduce(function(s,a){return s+(a.months[currentMonth].aaa||0)+(a.months[currentMonth].eaa||0)+(a.months[currentMonth].daa||0);},0);
    var totOreMax=mP.length*(kapacitas.maxOrePost||160);
    var kPct=totOreMax>0?Math.round(totOreR/totOreMax*100):0;
    var totProdR=mP.reduce(function(s,a){return s+(a.months[currentMonth].aaaR||0)+(a.months[currentMonth].eaaR||0)+(a.months[currentMonth].daaR||0);},0);
    var rph=totOreR>0?Math.round(totProdR/totOreR):0;
    var maxPlat=totOreMax*(kapacitas.medianTarif||186);
    var elv=Math.max(maxPlat-totProdR,0);
    
    var pC=profT>=0?'var(--green)':'var(--danger)';
    var minPct=totOreMax>0?Math.round(mP.length*(kapacitas.minOrePost||140)/totOreMax*100):0;
    var orePerPost=mP.length>0?totOreR/mP.length:0;
    var kC=orePerPost>=(kapacitas.maxOrePost||160)?'var(--green)':orePerPost>=(kapacitas.minOrePost||140)?'var(--orange)':'var(--danger)';
    
    var t2='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    
    // GAZDASÁGI
    t2+='<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">';
    t2+='<div style="padding:8px 14px;background:rgba(200,50,50,.04);border-bottom:2px solid var(--red);"><span style="font-size:.72rem;font-weight:800;color:var(--red);text-transform:uppercase;">Ax Economic (Bani)</span></div>';
    t2+='<div style="padding:12px 14px;">';
    t2+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">';
    t2+='<div style="text-align:center;"><div style="font-size:.58rem;color:var(--muted);font-weight:600;">VENITURI</div><div style="font-size:1.1rem;font-weight:900;color:var(--green);">'+fmt(venT)+'</div></div>';
    t2+='<div style="text-align:center;"><div style="font-size:.58rem;color:var(--muted);font-weight:600;">CHELTUIELI</div><div style="font-size:1.1rem;font-weight:900;color:var(--danger);">'+fmt(costT)+'</div></div>';
    t2+='</div>';
    t2+='<div style="text-align:center;padding:8px;background:var(--bg);border-radius:8px;margin-bottom:6px;"><div style="font-size:.55rem;color:var(--muted);">PROFIT NET</div><div style="font-size:1.3rem;font-weight:900;color:'+pC+';">'+fmt(profT)+' RON</div></div>';
    t2+='<div style="display:flex;justify-content:space-between;font-size:.62rem;padding:3px 0;"><span style="color:var(--muted);">Cost/Revenue</span><span style="font-weight:800;color:'+(crPct>65?'var(--danger)':'var(--green)')+';">'+crPct+'%</span></div>';
    t2+='</div></div>';
    
    // TERMELÉSI
    t2+='<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">';
    t2+='<div style="padding:8px 14px;background:rgba(59,130,246,.04);border-bottom:2px solid var(--blue);"><span style="font-size:.72rem;font-weight:800;color:var(--blue);text-transform:uppercase;">Ax Producție (Timp)</span></div>';
    t2+='<div style="padding:12px 14px;">';
    t2+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">';
    t2+='<div style="text-align:center;"><div style="font-size:.58rem;color:var(--muted);font-weight:600;">REALIZAT</div><div style="font-size:1.1rem;font-weight:900;color:var(--dark);">'+Math.round(totOreR)+' h</div></div>';
    t2+='<div style="text-align:center;"><div style="font-size:.58rem;color:var(--muted);font-weight:600;">CAPACITATE</div><div style="font-size:1.1rem;font-weight:900;color:var(--muted);">'+totOreMax+' h</div></div>';
    t2+='</div>';
    t2+='<div style="text-align:center;padding:8px;background:var(--bg);border-radius:8px;margin-bottom:6px;"><div style="font-size:.55rem;color:var(--muted);">UTILIZARE</div><div style="font-size:1.3rem;font-weight:900;color:'+kC+';">'+kPct+'%</div>';
    t2+='<div style="height:4px;background:var(--border);border-radius:2px;margin-top:4px;"><div style="height:100%;width:'+Math.min(kPct,100)+'%;background:'+kC+';border-radius:2px;"></div></div>';
    t2+='<div style="font-size:.5rem;color:var(--muted);margin-top:3px;">'+Math.round(orePerPost)+' ore/post (min '+(kapacitas.minOrePost||140)+' / eficient '+(kapacitas.maxOrePost||160)+')</div></div>';
    t2+='<div style="display:flex;justify-content:space-between;font-size:.62rem;padding:3px 0;"><span style="color:var(--muted);">RON/oră</span><span style="font-weight:800;">'+rph+'</span></div>';
    t2+='<div style="display:flex;justify-content:space-between;font-size:.62rem;padding:3px 0;"><span style="color:var(--danger);">Venit pierdut</span><span style="font-weight:800;color:var(--danger);">'+fmt(elv)+'</span></div>';
    t2+='</div></div>';
    
    t2+='</div>';
    twoEl.innerHTML=t2;
  }

  scheduleSave();
};

// === MASTER RENDER ===
const render = () => {
  if (currentPage === 'sumar') renderSumar();
  if (currentPage === 'venituri') renderVenituri();
  if (currentPage === 'cheltuieli') renderCheltuieli();
  if (currentPage === 'salarii') renderSalarii();
  if (currentPage === 'programare') renderGantt();
  if (currentPage === 'cashflow') renderCashFlow();
  if (currentPage === 'evzaras') renderEvzaras();
  scheduleSave();
};

// === CASH FLOW ===
const updCf = (field, val, monthIdx) => {
  if (field === 'soldInitial') { cfSoldInitial = Number(val); }
  else { cfMonths[monthIdx !== undefined ? monthIdx : currentMonth][field] = Number(val); }
  renderCashFlow();
  renderSumar();
};
window.updCf = updCf;

// Kapacitás szerkesztés
function updKap(dk, field, val) {
  const v = Number(val);
  if(field === 'tarif') {
    kapacitas.depts[dk].tarif = v;
  } else {
    kapacitas.depts[dk][field] = v;
  }
  renderSumar();
}
window.updKap = updKap;

// === STRUCTURA OPERAȚIONALĂ MODAL ===
function openCegConfig() {
  const kd = kapacitas.depts;
  const allDK = Object.keys(kd);
  const cm = currentMonth;
  const mnap = munkanapok[cm]||22;
  const oreZi = kapacitas.oreZi;
  const tarifOra = kapacitas.tarifOra;
  
  // Angajat alocare per dept
  const dam = {};
  allDK.forEach(dk => { dam[dk] = []; });
  angajati.forEach(a => {
    ensureFix(a);
    a.fix.deptAlloc.forEach(da => {
      if(dam[da.dept]) dam[da.dept].push({nume:a.nume, pct:da.pct, id:a.id});
    });
  });
  
  // Effektiv per dept
  const dEff = {};
  allDK.forEach(dk => { dEff[dk] = dam[dk].reduce((s,a)=>s+a.pct,0)/100; });

  // Termelő dept adatok
  const prodDK = allDK.filter(dk => !kd[dk].nonprod);
  const adminDK = allDK.filter(dk => kd[dk].sector==='admin');
  const auxDK = allDK.filter(dk => kd[dk].sector==='auxiliar');
  
  let tPoszt=0, tMaxOre=0, tMaxRON=0, tEff=0;
  const dd = prodDK.map(dk => {
    const d=kd[dk], tf=d.tarif||tarifOra, p=d.posztok||0, ef=dEff[dk]||0;
    const maxOre = p * oreZi * mnap;
    const maxRON = Math.round(maxOre * tf);
    const effOre = Math.round(ef * oreZi * mnap);
    const effRON = Math.round(effOre * tf);
    const lefog = p > 0 ? Math.round(ef / p * 100) : 0;
    tPoszt+=p; tMaxOre+=maxOre; tMaxRON+=maxRON; tEff+=ef;
    return {dk,d,tf,p,ef,maxOre,maxRON,effOre,effRON,lefog,al:dam[dk]};
  });
  const tLefog = tPoszt > 0 ? Math.round(tEff / tPoszt * 100) : 0;
  const tEffRON = dd.reduce((s,x)=>s+x.effRON,0);
  const szabadKap = tMaxRON - tEffRON;
  
  // Admin/Aux cost
  const secCost = (dkList) => {
    let cost=0;
    dkList.forEach(dk => {
      (dam[dk]||[]).forEach(am => {
        const a=angajati.find(x=>x.id===am.id);
        if(a){ensureFix(a);cost+=calcAngCost(a.fix).totalCost*am.pct/100;}
      });
    });
    return Math.round(cost);
  };
  const prodCost = secCost(prodDK);
  const adminCost = secCost(adminDK);
  const auxCost = secCost(auxDK);
  const auxSpor = kd.auxiliar?.sporolas||0;
  const totalFixCost = prodCost + adminCost + (auxCost - auxSpor);
  const bePct = tMaxRON > 0 ? Math.round(totalFixCost / tMaxRON * 100) : 0;
  const maxProfit = tMaxRON - totalFixCost;
  const real70 = Math.round(tMaxRON * 0.7) - totalFixCost;

  const ov=document.createElement('div');ov.className='asm-ov';ov.id='cegModal';
  const upd = "closeCegConfig();openCegConfig();renderSumar();";
  
  let h = '<div style="background:var(--white);border-radius:14px;padding:16px 18px;width:min(1250px,97vw);max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.15);animation:aUp .25s;">';

  // HEADER
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid var(--red);">';
  h += '<div><div style="font-size:.68rem;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.05em;">CONFIGURARE FIRMA</div>';
  h += '<div style="font-size:1rem;font-weight:800;color:var(--dark);">Platform Potential \u2014 '+months[cm]+'</div></div>';
  h += '<div style="display:flex;gap:10px;align-items:center;">';
  h += '<div style="text-align:center;"><div style="font-size:.5rem;color:var(--muted);">Ore productie/zi</div>';
  h += '<input type="number" value="'+oreZi+'" step="0.5" min="6" max="10" onchange="kapacitas.oreZi=Number(this.value);'+upd+'" style="width:42px;padding:3px;text-align:center;font-size:.82rem;font-weight:800;border:1px solid var(--border);border-radius:4px;color:var(--red);"></div>';
  h += '<div style="text-align:center;"><div style="font-size:.5rem;color:var(--muted);">Tarif mediu/h</div>';
  h += '<input type="number" value="'+tarifOra+'" onchange="kapacitas.tarifOra=Number(this.value);'+upd+'" style="width:46px;padding:3px;text-align:center;font-size:.82rem;font-weight:800;border:1px solid var(--border);border-radius:4px;color:var(--red);"></div>';
  h += '<div style="text-align:center;"><div style="font-size:.5rem;color:var(--muted);">Min ore/post</div>';
  h += '<input type="number" value="'+(kapacitas.minOrePost||140)+'" onchange="kapacitas.minOrePost=Number(this.value);'+upd+'" style="width:42px;padding:3px;text-align:center;font-size:.82rem;font-weight:800;border:1px solid var(--border);border-radius:4px;color:var(--danger);"></div>';
  h += '<div style="text-align:center;"><div style="font-size:.5rem;color:var(--muted);">Max ore/post</div>';
  h += '<input type="number" value="'+(kapacitas.maxOrePost||160)+'" onchange="kapacitas.maxOrePost=Number(this.value);'+upd+'" style="width:42px;padding:3px;text-align:center;font-size:.82rem;font-weight:800;border:1px solid var(--border);border-radius:4px;color:var(--green);"></div>';
  h += '<div style="text-align:center;"><div style="font-size:.5rem;color:var(--muted);">Zile/luna</div>';
  h += '<div style="font-size:.82rem;font-weight:800;color:var(--dark);padding:3px;">'+mnap+'</div></div>';
  h += '<button onclick="closeCegConfig()" style="background:var(--red);color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.72rem;font-weight:700;font-family:inherit;">Inchide</button>';
  h += '</div></div>';

  // TERMELŐ POSZTOK TÁBLA
  h += '<div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:4px;">Posturi de lucru active</div>';
  h += '<div style="background:var(--white);border-radius:8px;border:1px solid var(--border);overflow-x:auto;margin-bottom:10px;">';
  h += '<table style="width:100%;border-collapse:collapse;font-size:.68rem;min-width:850px;">';
  h += '<thead><tr style="border-bottom:2px solid var(--border);background:var(--bg);">';
  h += '<th style="padding:5px 8px;text-align:left;color:var(--red);font-weight:700;">Departament</th>';
  h += '<th style="padding:5px 4px;text-align:center;color:var(--red);font-weight:700;">Posturi</th>';
  h += '<th style="padding:5px 4px;text-align:center;color:var(--red);font-weight:700;">Tarif/h</th>';
  h += '<th style="padding:5px 4px;text-align:right;color:var(--red);font-weight:700;">Max Ore</th>';
  h += '<th style="padding:5px 4px;text-align:right;color:var(--red);font-weight:700;">Max RON</th>';
  h += '<th style="padding:5px 8px;text-align:left;color:var(--red);font-weight:700;">Angajati alocare</th>';
  h += '<th style="padding:5px 4px;text-align:center;color:var(--red);font-weight:700;">Eff.</th>';
  h += '<th style="padding:5px 4px;text-align:right;color:var(--red);font-weight:700;">Eff. RON</th>';
  h += '<th style="padding:5px 4px;text-align:center;color:var(--red);font-weight:700;">Lefoglaltsag</th>';
  h += '</tr></thead><tbody>';

  dd.forEach(function(x, i) {
    var bg = i%2===0?'':'background:var(--bg);';
    var lefCol = x.lefog>=80?'var(--green)':x.lefog>=50?'var(--orange)':'var(--danger)';
    
    h += '<tr style="border-bottom:1px solid var(--border);'+bg+'">';
    h += '<td style="padding:5px 8px;font-weight:700;color:var(--dark);">'+x.d.label+'</td>';
    h += '<td style="padding:5px 4px;text-align:center;"><input type="number" value="'+x.p+'" min="0" onchange="kapacitas.depts[&apos;'+x.dk+'&apos;].posztok=Number(this.value);'+upd+'" style="width:30px;padding:2px;text-align:center;font-size:.7rem;font-weight:800;border:1px solid var(--border);border-radius:3px;color:var(--red);"></td>';
    h += '<td style="padding:5px 4px;text-align:center;"><input type="number" value="'+x.tf+'" onchange="kapacitas.depts[&apos;'+x.dk+'&apos;].tarif=Number(this.value);'+upd+'" style="width:38px;padding:2px;text-align:center;font-size:.7rem;font-weight:700;border:1px solid var(--border);border-radius:3px;color:var(--red);"></td>';
    h += '<td style="padding:5px 4px;text-align:right;font-weight:700;color:var(--muted);">'+x.maxOre+' h</td>';
    h += '<td style="padding:5px 4px;text-align:right;font-weight:800;color:var(--dark);">'+fmt(x.maxRON)+'</td>';
    
    // Angajati pills
    h += '<td style="padding:5px 8px;">';
    if(x.al.length > 0) {
      x.al.forEach(function(a) {
        var nev = a.nume.indexOf(' ')>0 ? a.nume.split(' ').slice(-1)[0] : a.nume;
        var pCol = a.pct>=90?'var(--dark)':a.pct>=50?'var(--orange)':'var(--danger)';
        h += '<span style="font-size:.6rem;padding:1px 3px;border-radius:4px;background:var(--bg);border:1px solid var(--border);margin-right:2px;display:inline-flex;align-items:center;gap:2px;margin-bottom:1px;">';
        h += '<span onclick="closeCegConfig();openAngajatModal('+a.id+')" style="cursor:pointer;">'+nev+'</span>';
        h += '<input type="number" value="'+a.pct+'" min="0" max="100" step="5" onchange="updCfgPct('+a.id+',&apos;'+x.dk+'&apos;,Number(this.value))" style="width:28px;padding:0;text-align:center;font-size:.6rem;font-weight:800;border:1px solid var(--border);border-radius:3px;color:'+pCol+';background:transparent;">%</span>';
      });
    } else { h += '<span style="color:var(--danger);font-size:.6rem;font-weight:700;">LIBER</span>'; }
    h += '</td>';
    
    h += '<td style="padding:5px 4px;text-align:center;font-weight:800;color:var(--dark);">'+x.ef.toFixed(1)+'</td>';
    h += '<td style="padding:5px 4px;text-align:right;font-weight:700;color:var(--dark);">'+fmt(x.effRON)+'</td>';
    
    // Lefoglaltsag bar
    h += '<td style="padding:5px 4px;text-align:center;"><div style="display:flex;align-items:center;gap:4px;justify-content:center;"><span style="font-weight:800;color:'+lefCol+';font-size:.72rem;">'+x.lefog+'%</span>';
    h += '<div style="width:40px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="height:100%;width:'+Math.min(x.lefog,100)+'%;background:'+lefCol+';border-radius:2px;"></div></div></div></td>';
    h += '</tr>';
  });

  // TOTAL
  h += '<tr style="border-top:2px solid var(--red);background:var(--red-light);">';
  h += '<td style="padding:6px 8px;font-weight:800;color:var(--red);">TOTAL PRODUCTIE</td>';
  h += '<td style="padding:6px 4px;text-align:center;font-weight:800;">'+tPoszt+'</td>';
  h += '<td style="padding:6px 4px;text-align:center;color:var(--muted);">\u2014</td>';
  h += '<td style="padding:6px 4px;text-align:right;font-weight:800;">'+tMaxOre+' h</td>';
  h += '<td style="padding:6px 4px;text-align:right;font-weight:900;">'+fmt(tMaxRON)+'</td>';
  h += '<td style="padding:6px 8px;font-size:.6rem;color:var(--muted);">'+dd.reduce(function(s,x){return s+x.al.length;},0)+' angajati</td>';
  h += '<td style="padding:6px 4px;text-align:center;font-weight:900;">'+tEff.toFixed(1)+'</td>';
  h += '<td style="padding:6px 4px;text-align:right;font-weight:900;">'+fmt(tEffRON)+'</td>';
  var tLefCol = tLefog>=80?'var(--green)':tLefog>=50?'var(--orange)':'var(--danger)';
  h += '<td style="padding:6px 4px;text-align:center;font-weight:900;color:'+tLefCol+';">'+tLefog+'%</td>';
  h += '</tr></tbody></table></div>';

  // SUPORT SZEKTOROK
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">';
  
  // Admin
  h += '<div style="background:var(--white);border-radius:8px;padding:10px 12px;border:1px solid var(--border);border-top:3px solid var(--red);">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;">';
  h += '<div><div style="font-size:.6rem;font-weight:700;color:var(--red);text-transform:uppercase;">Admin \u2014 Cost functionare</div>';
  h += '<div style="font-size:1rem;font-weight:900;color:var(--dark);margin-top:2px;">'+fmt(adminCost)+' RON/luna</div></div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:3px;">';
  (dam.admin||[]).forEach(function(a){
    var nev = a.nume.indexOf(' ')>0 ? a.nume.split(' ').slice(-1)[0] : a.nume;
    h += '<span onclick="closeCegConfig();openAngajatModal('+a.id+')" style="cursor:pointer;font-size:.6rem;padding:2px 6px;border-radius:4px;background:var(--bg);border:1px solid var(--border);">'+nev+' <b style="color:var(--red);">'+a.pct+'%</b></span>';
  });
  h += '</div></div></div>';
  
  // Auxiliar
  h += '<div style="background:var(--white);border-radius:8px;padding:10px 12px;border:1px solid var(--border);border-top:3px solid var(--red);">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;">';
  h += '<div><div style="font-size:.6rem;font-weight:700;color:var(--red);text-transform:uppercase;">Auxiliar \u2014 Cost + Sporire</div>';
  h += '<div style="font-size:.88rem;font-weight:800;color:var(--dark);margin-top:2px;">Cost: '+fmt(auxCost)+' | Sporire: <input type="number" value="'+auxSpor+'" onchange="kapacitas.depts.auxiliar.sporolas=Number(this.value);'+upd+'" style="width:50px;padding:1px;text-align:right;font-size:.75rem;font-weight:700;border:1px solid var(--border);border-radius:3px;color:var(--red);"> | Net: '+fmt(auxCost-auxSpor)+'</div></div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:3px;">';
  (dam.auxiliar||[]).forEach(function(a){
    var nev = a.nume.indexOf(' ')>0 ? a.nume.split(' ').slice(-1)[0] : a.nume;
    h += '<span onclick="closeCegConfig();openAngajatModal('+a.id+')" style="cursor:pointer;font-size:.6rem;padding:2px 6px;border-radius:4px;background:var(--bg);border:1px solid var(--border);">'+nev+' <b style="color:var(--red);">'+a.pct+'%</b></span>';
  });
  h += '</div></div></div>';
  h += '</div>';

  // POTENCIAL OSSZESITES
  h += '<div style="background:var(--red-light);border-radius:10px;padding:12px 16px;border:2px solid var(--red);margin-bottom:8px;">';
  h += '<div style="font-size:.68rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:8px;">Potentialul firmei</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;">';
  
  h += '<div><div style="font-size:.55rem;color:var(--muted);">Max Capacitate</div><div style="font-size:1rem;font-weight:900;color:var(--dark);">'+fmt(tMaxRON)+'</div><div style="font-size:.5rem;color:var(--muted);">RON/luna (100%)</div></div>';
  h += '<div><div style="font-size:.55rem;color:var(--muted);">Lefoglalt</div><div style="font-size:1rem;font-weight:900;color:var(--dark);">'+fmt(tEffRON)+'</div><div style="font-size:.5rem;color:var(--muted);">RON/luna ('+tLefog+'%)</div></div>';
  h += '<div><div style="font-size:.55rem;color:var(--muted);">Szabad kapacitas</div><div style="font-size:1rem;font-weight:900;color:var(--danger);">'+fmt(szabadKap)+'</div><div style="font-size:.5rem;color:var(--muted);">RON nem hasznalt</div></div>';
  h += '<div><div style="font-size:.55rem;color:var(--muted);">Fix koltsegek</div><div style="font-size:1rem;font-weight:900;color:var(--red);">'+fmt(totalFixCost)+'</div><div style="font-size:.5rem;color:var(--muted);">Prod+Admin+Aux</div></div>';
  h += '<div><div style="font-size:.55rem;color:var(--muted);">Break-even</div><div style="font-size:1rem;font-weight:900;color:var(--red);">'+bePct+'%</div><div style="font-size:.5rem;color:var(--muted);">min. kihasznaltsag</div></div>';
  h += '<div><div style="font-size:.55rem;color:var(--muted);">Max Profit</div><div style="font-size:1rem;font-weight:900;color:'+(maxProfit>=0?'var(--green)':'var(--danger)')+';">'+fmt(maxProfit)+'</div><div style="font-size:.5rem;color:var(--muted);">ha 100% kihaszn.</div></div>';
  
  h += '</div></div>';

  // SALVEAZA
  h += '<div style="display:flex;justify-content:flex-end;"><button onclick="closeCegConfig();renderSumar();scheduleSave();" style="padding:7px 24px;background:var(--red);color:#fff;border:none;border-radius:14px;font-weight:700;font-size:.78rem;cursor:pointer;font-family:inherit;">Salveaza</button></div>';
  h += '</div>';
  ov.innerHTML = h;
  document.body.appendChild(ov);
}

function updCfgPct(angId, deptKey, newPct) {
  const a = angajati.find(x=>x.id===angId);
  if(!a) return;
  ensureFix(a);
  const da = a.fix.deptAlloc.find(d=>d.dept===deptKey);
  if(da) { da.pct = newPct; }
  closeCegConfig();openCegConfig();renderSumar();scheduleSave();
}
function closeCegConfig(){const m=document.getElementById('cegModal');if(m)m.remove();renderSumar();scheduleSave();}
window.openCegConfig=openCegConfig;window.closeCegConfig=closeCegConfig;window.updCfgPct=updCfgPct;

// Facturi emise és Achiziții piese: cfMonths-ból (ASM import vagy kézi)
function calcSolduri() {
  const solduri = [];
  let sold = cfSoldInitial;
  for (let i = 0; i < 12; i++) {
    const facturat = cfMonths[i].facturat || 0;
    const achizitii = cfMonths[i].achizitiiPiese || 0;
    const platit = cfMonths[i].platit || 0;
    sold = sold + facturat - platit;
    solduri.push({ facturat, achizitii, platit, soldBefore: i === 0 ? cfSoldInitial : solduri[i-1].soldAfter, soldAfter: sold });
  }
  return solduri;
}

// Pipeline: Proformă (EAA) + Alte Venituri
function calcPipeline() {
  const pipe = [];
  for (let i = 0; i < 12; i++) {
    const eaa = cfMonths[i].eaaManop || 0;
    // Proformă forgalom = összes proforma venituri
    let proformaForg = 0;
    ['tehnicProforma','bodyProforma','paintProforma','transportProforma','rentacarProforma'].forEach(k => {
      proformaForg += (venituri[k]?.[i]?.r || 0);
    });
    const alte = (venituri.alteVenituri?.[i]?.r || 0);
    pipe.push({ eaa, proformaForg, alte, total: eaa + alte });
  }
  return pipe;
}

const renderCashFlow = () => {
  const cfmsel = document.getElementById('cfMonthSelect');
  if(cfmsel) cfmsel.innerHTML = months.map((m,i) => '<option value="'+i+'"'+(i===currentMonth?' selected':'')+'>'+m+'</option>').join('');
  
  const cm = currentMonth;
  const cf = cfSinteza[cm];
  const hasData = cf.imported;
  
  // Összegek
  const totalBev = cf.incasariBank + cf.incasariCasa + cf.alteBevételek;
  const totalKiad = cf.platiPiese + cf.platiSalarii + cf.platiTaxe + cf.platiHitel + cf.platiAlte + cf.transferuri;
  const cashFlow = totalBev - totalKiad;
  const cfCol = cashFlow >= 0 ? 'var(--green)' : 'var(--danger)';
  
  // ASM adatok kiegészítés
  const asmFact = cfMonths[cm].facturat || 0;
  const asmManop = cfMonths[cm].nManop || 0;
  const asmPiese = cfMonths[cm].artNyer || 0;
  
  let html = '';
  
  // === HERO KOCKÁK ===
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">';
  html += '<div style="background:var(--white);border-radius:12px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--dark);text-align:center;"><div style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Sold Initial</div><input type="number" value="'+cfSoldInitial+'" onchange="updCf(\'soldInitial\',this.value)" style="width:100%;padding:4px;font-size:1rem;font-weight:800;text-align:center;color:var(--dark);border:1px solid var(--border);border-radius:6px;margin-top:4px;"></div>';
  html += '<div style="background:var(--white);border-radius:12px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--green);text-align:center;"><div style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Incasari</div><div style="font-size:1.3rem;font-weight:900;color:var(--green);margin-top:4px;">'+fmt(totalBev)+'</div></div>';
  html += '<div style="background:var(--white);border-radius:12px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--danger);text-align:center;"><div style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Plati</div><div style="font-size:1.3rem;font-weight:900;color:var(--danger);margin-top:4px;">'+fmt(totalKiad)+'</div></div>';
  html += '<div style="background:var(--white);border-radius:12px;padding:12px;border:1px solid var(--border);border-top:3px solid '+cfCol+';text-align:center;"><div style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Cash Flow</div><div style="font-size:1.3rem;font-weight:900;color:'+cfCol+';margin-top:4px;">'+fmt(cashFlow)+'</div></div>';
  html += '<div style="background:var(--white);border-radius:12px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);text-align:center;"><div style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Facturi Emise</div><div style="font-size:1.3rem;font-weight:900;color:var(--dark);margin-top:4px;">'+fmt(asmFact)+'</div></div>';
  html += '</div>';
  
  if(!hasData) {
    html += '<div style="background:var(--bg);border-radius:12px;padding:24px;text-align:center;border:1px solid var(--border);"><div style="font-size:.85rem;color:var(--muted);margin-bottom:8px;">Nu exista date Sinteza importate pentru '+months[cm]+'</div><div style="font-size:.72rem;color:var(--muted);">Importeaza fisierul Sinteza din ASM Import pentru a vedea Cash Flow detaliat</div></div>';
  } else {
    // === BEVÉTELEK ===
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;margin-bottom:14px;">';
    html += '<div style="padding:10px 16px;background:rgba(16,185,129,.06);border-bottom:2px solid var(--green);"><span style="font-size:.78rem;font-weight:800;color:var(--green);text-transform:uppercase;">INCASARI — '+months[cm]+'</span><span style="float:right;font-size:1rem;font-weight:900;color:var(--green);">'+fmt(totalBev)+' RON</span></div>';
    
    var bevRows = [
      {label:'Incasari clienti (banca)', val:cf.incasariBank, desc:'5121 \u2190 4111'},
      {label:'Incasari clienti (casa)', val:cf.incasariCasa, desc:'5311 \u2190 4111'},
      {label:'Alte incasari', val:cf.alteBevételek, desc:'Societar, hitel, alte surse'}
    ];
    bevRows.forEach(function(r,i) {
      var bg = i%2===0?'':'background:var(--bg);';
      html += '<div style="display:grid;grid-template-columns:2fr 1fr .5fr;padding:8px 16px;border-bottom:1px solid var(--border);'+bg+'align-items:center;">';
      html += '<div><div style="font-size:.78rem;font-weight:700;color:var(--dark);">'+r.label+'</div><div style="font-size:.58rem;color:var(--muted);">'+r.desc+'</div></div>';
      html += '<div style="text-align:right;font-size:.95rem;font-weight:800;color:var(--green);">'+fmt(r.val)+'</div>';
      var pct = totalBev > 0 ? Math.round(r.val/totalBev*100) : 0;
      html += '<div style="text-align:right;font-size:.68rem;color:var(--muted);">'+pct+'%</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // === KIADÁSOK ===
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;margin-bottom:14px;">';
    html += '<div style="padding:10px 16px;background:rgba(239,68,68,.04);border-bottom:2px solid var(--danger);"><span style="font-size:.78rem;font-weight:800;color:var(--danger);text-transform:uppercase;">PLATI — '+months[cm]+'</span><span style="float:right;font-size:1rem;font-weight:900;color:var(--danger);">'+fmt(totalKiad)+' RON</span></div>';
    
    var kiadRows = [
      {label:'Furnizori (piese + servicii)', val:cf.platiPiese, desc:'401 \u2192 5121/5311'},
      {label:'Salarii', val:cf.platiSalarii, desc:'421 \u2192 5121/5311'},
      {label:'Taxe + Impozite + TVA', val:cf.platiTaxe, desc:'4315+436+4423+4426'},
      {label:'Hitel / Leasing', val:cf.platiHitel, desc:'5191+1621 \u2192 5121'},
      {label:'Transferuri interne', val:cf.transferuri, desc:'581 \u2192 5121'},
      {label:'Alte cheltuieli', val:cf.platiAlte, desc:'Servicii, combustibil, etc.'}
    ];
    kiadRows.forEach(function(r,i) {
      var bg = i%2===0?'':'background:var(--bg);';
      html += '<div style="display:grid;grid-template-columns:2fr 1fr .5fr;padding:8px 16px;border-bottom:1px solid var(--border);'+bg+'align-items:center;">';
      html += '<div><div style="font-size:.78rem;font-weight:700;color:var(--dark);">'+r.label+'</div><div style="font-size:.58rem;color:var(--muted);">'+r.desc+'</div></div>';
      html += '<div style="text-align:right;font-size:.95rem;font-weight:800;color:var(--danger);">'+fmt(r.val)+'</div>';
      var pct = totalKiad > 0 ? Math.round(r.val/totalKiad*100) : 0;
      html += '<div style="text-align:right;font-size:.68rem;color:var(--muted);">'+pct+'%</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // === ÖSSZESÍTÉS ===
    html += '<div style="background:var(--red-light);border-radius:12px;padding:16px;border:2px solid var(--red);">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;">';
    html += '<div><div style="font-size:.68rem;color:var(--green);font-weight:700;">TOTAL INCASARI</div><div style="font-size:1.2rem;font-weight:900;color:var(--green);">'+fmt(totalBev)+'</div></div>';
    html += '<div><div style="font-size:.68rem;color:var(--danger);font-weight:700;">TOTAL PLATI</div><div style="font-size:1.2rem;font-weight:900;color:var(--danger);">'+fmt(totalKiad)+'</div></div>';
    html += '<div><div style="font-size:.68rem;color:'+cfCol+';font-weight:700;">CASH FLOW</div><div style="font-size:1.5rem;font-weight:900;color:'+cfCol+';">'+fmt(cashFlow)+' RON</div></div>';
    html += '</div></div>';
  }
  
  document.getElementById('cashflow-list').innerHTML = html;
};


// === EVZARAS ===
const renderEvzaras = () => {
  const {tvr12, tcostr12} = calc();
  const profit = tvr12 - tcostr12;
  const margin = tvr12 > 0 ? (profit / tvr12) * 100 : 0;
  
  document.getElementById('evz-year').textContent = new Date().getFullYear();
  document.getElementById('evz-ven').textContent = fmt(tvr12) + ' RON';
  document.getElementById('evz-cost').textContent = fmt(tcostr12) + ' RON';
  document.getElementById('evz-profit').textContent = (profit >= 0 ? '+' : '') + fmt(profit) + ' RON';
  document.getElementById('evz-margin').textContent = margin.toFixed(1);
  
  if (profit >= 0) {
    document.getElementById('evz-profit-label').textContent = '✅ Profit';
    document.getElementById('evz-profit').style.color = '#10b981';
    document.getElementById('evz-profit-card').style.background = 'rgba(16, 185, 129, 0.2)';
    document.getElementById('evz-profit-card').style.borderColor = 'rgba(16, 185, 129, 0.4)';
  } else {
    document.getElementById('evz-profit-label').textContent = '⚠️ Pierdere';
    document.getElementById('evz-profit').style.color = '#ef4444';
    document.getElementById('evz-profit-card').style.background = 'rgba(239, 68, 68, 0.2)';
    document.getElementById('evz-profit-card').style.borderColor = 'rgba(239, 68, 68, 0.4)';
  }
  
  let html = `
    <div style="display: grid; grid-template-columns: 180px 120px 120px 120px 120px 150px; gap: 1rem; padding: 1rem; background: rgba(30, 41, 59, 0.6); border-radius: 12px; margin-bottom: 1rem; font-weight: 700; font-size: 0.875rem; color: #cbd5e1;">
      <div>Nume Angajat</div>
      <div style="text-align: right;">Ore Așteptate</div>
      <div style="text-align: right;">Ore Lucrate</div>
      <div style="text-align: right;">Diferență</div>
      <div style="text-align: center;">% Realizare</div>
      <div style="text-align: center;">Status</div>
    </div>
  `;
  
  angajati.forEach(a => {
    const elvOre = 1400;
    // Összegezzük az összes hónap óráit
    const oreLuc = a.months.reduce((s, m) => s + m.oreR, 0);
    const difOre = oreLuc - elvOre;
    const procReal = (oreLuc / elvOre) * 100;
    const statusIcon = procReal > 100 ? '🟢' : procReal >= 95 ? '🟡' : '🔴';
    const statusColor = procReal > 100 ? '#10b981' : procReal >= 95 ? '#f59e0b' : '#ef4444';
    
    html += `
      <div style="display: grid; grid-template-columns: 180px 120px 120px 120px 120px 150px; gap: 1rem; padding: 1rem; background: rgba(30, 41, 59, 0.4); border-radius: 12px; margin-bottom: 0.75rem; align-items: center;">
        <div style="color: #f1f5f9; font-weight: 700;">${a.nume}</div>
        <div style="text-align: right; color: #94a3b8;">${fmt(elvOre)} h</div>
        <div style="text-align: right; color: ${statusColor}; font-weight: 800;">${fmt(oreLuc)} h</div>
        <div style="text-align: right; color: ${difOre >= 0 ? '#10b981' : '#ef4444'}; font-weight: 800;">
          ${difOre >= 0 ? '+' : ''}${fmt(difOre)} h
        </div>
        <div style="text-align: center; padding: 0.5rem; background: ${procReal > 100 ? 'rgba(16, 185, 129, 0.2)' : procReal >= 95 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; border-radius: 8px; color: ${statusColor}; font-weight: 800;">
          ${procReal.toFixed(1)}%
        </div>
        <div style="text-align: center; font-size: 1.5rem;">${statusIcon}</div>
      </div>
    `;
  });
  
  document.getElementById('evz-angajati-list').innerHTML = html;
};

// === SALARII ===

const delAngajat = (id) => {
  angajati = angajati.filter(a => a.id !== id);
  renderSumar();
  renderSalarii();
};
window.delAngajat = delAngajat;

const toggleAnualStats = () => {
  showAnualStats = !showAnualStats;
  // Re-render the current page
  if (currentPage === 'venituri') {
    renderVenituri();
  } else if (currentPage === 'cheltuieli') {
    renderCheltuieli();
  } else if (currentPage === 'salarii') {
    renderSalarii();
  }
};
window.toggleAnualStats = toggleAnualStats;

const updAngajat = (id, field, val) => {
  const a = angajati.find(a => a.id === id);
  if (a) {
    if (field === 'nume' || field === 'functie' || field === 'dept') {
      a[field] = val;
    } else {
      a.months[currentMonth][field] = Number(val);
    }
  }
  renderSumar();
  renderSalarii();
};
window.updAngajat = updAngajat;

// ensureFix + calcAngCost — renderSalarii előtt kell legyen!
function ensureFix(a) {
  if (!a.fix) a.fix = {};
  const f = a.fix;
  const isVehicle = (a.dept === 'transport' || a.dept === 'rentacar') && ((a.nume||'').match(/Y.?A24/i) || (a.nume||'').match(/RENT/i));
  if (!f.salariuNet) f.salariuNet = isVehicle ? 0 : 2540;
  if (!f.taxe) f.taxe = isVehicle ? 0 : 1750;
  if (f.pctVenit === undefined || f.pctVenit === null) f.pctVenit = isVehicle ? 0 : 42.5;
  if (!Array.isArray(f.bonificatii) || f.bonificatii.length === 0) f.bonificatii = isVehicle ? [] : [{nume:'Tichete masă', suma:450}];
  if (!Array.isArray(f.costFirma) || f.costFirma.length === 0) f.costFirma = [
    {nume:'Chirie', suma:0},
    {nume:'Utilități', suma:0},
    {nume:'Echipamente / Scule', suma:0},
    {nume:'Asigurări', suma:0},
    {nume:'Alte costuri', suma:0}
  ];
  if (!f.cnp) f.cnp = '';
  if (!f.telefon) f.telefon = '';
  if (!f.email) f.email = '';
  if (!f.dataAngajare) f.dataAngajare = '';
  if (!f.contractNr) f.contractNr = '';
  if (!f.deptAlloc || !f.deptAlloc.length) f.deptAlloc = [{dept:a.dept||'tehnic',pct:100,bonus:0}];
  f.deptAlloc.forEach(da => { if(da.bonus===undefined) da.bonus=0; });
  return f;
}
function calcAngCost(f) {
  const salariuBrut = f.salariuNet + f.taxe;
  const totalBonificatii = f.bonificatii.reduce((s,b) => s + (b.suma||0), 0);
  const deptBonus = f.deptAlloc.reduce((s,da) => s + Math.round(salariuBrut * da.bonus / 100), 0);
  const totalCostFirma = (f.costFirma||[]).reduce((s,c) => s + (c.suma||0), 0);
  const totalCost = salariuBrut + totalBonificatii + deptBonus + totalCostFirma;
  return { salariuBrut, totalBonificatii, deptBonus, totalCostFirma, totalCost };
}

const renderSalarii = () => {
  const totalAAA = angajati.reduce((s,a)=>s+a.months[currentMonth].venitR,0);
  const totalEAA = angajati.reduce((s,a)=>s+(a.months[currentMonth].alteVenitR||0),0);
  const totalOre = angajati.reduce((s,a)=>s+a.months[currentMonth].oreR,0);
  const tOreAAA = angajati.reduce((s,a)=>s+(a.months[currentMonth].oreAAA||0),0);
  const tOreEAA = angajati.reduce((s,a)=>s+(a.months[currentMonth].oreEAA||0),0);
  const tOreDAA = angajati.reduce((s,a)=>s+(a.months[currentMonth].daaOre||0),0);
  const totalDAA = angajati.reduce((s,a)=>s+(a.months[currentMonth].daaVal||0),0);
  const totalFixCost = angajati.reduce((s,a)=>{ensureFix(a);return s+calcAngCost(a.fix).totalCost;},0);
  const totalBonif = angajati.reduce((s,a)=>{ensureFix(a);return s+a.fix.bonificatii.reduce((x,b)=>x+(b.suma||0),0);},0);
  const totalConc = angajati.reduce((s,a)=>s+(a.months[currentMonth].zileR||0),0);
  const totalZileLib = angajati.reduce((s,a)=>s+(a.months[currentMonth].zileLib||0),0);
  const nrAng = angajati.filter(a=>a.months[currentMonth].oreR>0).length || 1;
  const oreColor = totalOre < (kapacitas.minOrePost||140)*nrAng ? 'var(--danger)' : (totalOre < (kapacitas.maxOrePost||160)*nrAng ? 'var(--orange)' : 'var(--green)');
  const efMin = (kapacitas.minOrePost||140)*186; const efMax = (kapacitas.maxOrePost||160)*186; const efActual = totalAAA;
  const efColor = efActual < efMin ? 'var(--danger)' : (efActual < efMax ? 'var(--orange)' : 'var(--green)');
  const efPct = efMax > 0 ? Math.round((efActual/efMax)*100) : 0;

  // Bonus total (dept bonus from fix)
  const totalDeptBonus = angajati.reduce((s,a)=>{ensureFix(a);return s+calcAngCost(a.fix).deptBonus;},0);
  const totalVenitTot = totalAAA + totalEAA + totalDAA;
  const totalVenitAng = angajati.reduce((s,a)=>{
    ensureFix(a);
    const m=a.months[currentMonth];
    const vt=(m.venitR||0)+(m.alteVenitR||0)+(m.daaVal||0);
    return s + (a.fix.pctVenit > 0 ? Math.round(vt * a.fix.pctVenit / 100) : (m.venitAng||0));
  },0);
  const totalTaxeFix = angajati.reduce((s,a)=>{ensureFix(a);return s+(a.fix.taxe||0);},0);
  const totalCostFirma = angajati.reduce((s,a)=>{ensureFix(a);return s+calcAngCost(a.fix).totalCostFirma;},0);

  // Cash bontás
  const tCard = angajati.reduce((s,a)=>{ensureFix(a);return s+(a.fix.salariuNet||0);},0);
  const tTichete = angajati.reduce((s,a)=>{ensureFix(a);return s+a.fix.bonificatii.reduce((x,b)=>x+(b.suma||0),0);},0);
  const tCash = totalVenitAng - tCard - totalTaxeFix - tTichete;
  const tCashCol = tCash >= 0 ? 'var(--green)' : 'var(--danger)';

  const venitFirma = totalVenitAng - totalTaxeFix - tTichete;
  const venitFirmaCol = venitFirma >= 0 ? 'var(--green)' : 'var(--danger)';
  const venitRamas = venitFirma - totalCostFirma;
  const venitRamasCol = venitRamas >= 0 ? 'var(--green)' : 'var(--danger)';

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div>
        <div style="font-size:.78rem;font-weight:700;color:var(--red);text-transform:uppercase;">PERSONAL</div>
        <div style="font-size:1.4rem;font-weight:800;color:var(--dark);">Personal si costuri</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select onchange="setMonth(parseInt(this.value))" style="padding:8px 16px;font-size:.85rem;border-radius:8px;min-width:160px;">
          ${months.map((m,idx)=>'<option value="'+idx+'" '+(idx===currentMonth?'selected':'')+'>'+m+'</option>').join('')}
        </select>
        <button onclick="addAngajat()" style="padding:8px 18px;background:var(--red);color:#fff;border:none;border-radius:20px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;">+ Adauga angajat</button>
      </div>
    </div>

    <!-- SOR 1: ORE -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:10px;">
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Ore AAA</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${tOreAAA} h</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Ore EAA</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${tOreEAA} h</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--muted);opacity:.7;">
        <div style="font-size:.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;">Ore DAA (anexă)</div>
        <div style="font-size:1rem;font-weight:800;color:var(--muted);margin-top:4px;">${tOreDAA} h</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Total EAA+DAA</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${tOreEAA + tOreDAA} h</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid ${oreColor};">
        <div style="font-size:.65rem;font-weight:700;color:${oreColor};text-transform:uppercase;">Total AAA+EAA+DAA</div>
        <div style="font-size:1.1rem;font-weight:900;color:var(--dark);margin-top:4px;">${tOreAAA + tOreEAA + tOreDAA} h</div>
      </div>
    </div>

    <!-- SOR 2: VENITURI AAA + EAA + DAA = TOTAL -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Venit AAA</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(totalAAA)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Venit EAA</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(totalEAA)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--muted);opacity:.7;">
        <div style="font-size:.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;">Venit DAA (anexă)</div>
        <div style="font-size:1rem;font-weight:800;color:var(--muted);margin-top:4px;">${fmt(totalDAA)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Total Venituri</div>
        <div style="font-size:1.1rem;font-weight:900;color:var(--dark);margin-top:4px;">${fmt(totalAAA + totalEAA + totalDAA)} RON</div>
        <div style="font-size:.58rem;color:var(--muted);margin-top:2px;">AAA+EAA: ${fmt(totalAAA + totalEAA)}</div>
      </div>
    </div>

    <!-- SOR 2: LOGIKAI LÁNC -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:14px;">
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Venit Total</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(totalVenitTot)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">Venit Angajat</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(totalVenitAng)} RON</div>
        <div style="font-size:.55rem;color:var(--muted);margin-top:2px;">× ${angajati.length>0?(angajati[0].fix?.pctVenit||42.5):42.5}%</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">− Taxe</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(totalTaxeFix)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">− Bonificații</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(tTichete)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid ${venitFirmaCol};">
        <div style="font-size:.65rem;font-weight:700;color:${venitFirmaCol};text-transform:uppercase;">= Venit Firma</div>
        <div style="font-size:1rem;font-weight:900;color:${venitFirmaCol};margin-top:4px;">${fmt(venitFirma)} RON</div>
      </div>
      <div style="background:var(--white);border-radius:10px;padding:12px;border:1px solid var(--border);border-top:3px solid var(--red);">
        <div style="font-size:.65rem;font-weight:700;color:var(--red);text-transform:uppercase;">− Cost Funcț.</div>
        <div style="font-size:1rem;font-weight:800;color:var(--dark);margin-top:4px;">${fmt(totalCostFirma)} RON</div>
      </div>
    </div>

    <!-- SOR 3: VENIT RĂMAS -->
    <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:14px;">
      <div style="background:var(--white);border-radius:12px;padding:16px 20px;border:2px solid ${venitRamasCol};display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:.78rem;font-weight:700;color:${venitRamasCol};text-transform:uppercase;">VENIT RĂMAS</div>
          <div style="font-size:.6rem;color:var(--muted);margin-top:2px;">Venit Firma − Cost Funcționare</div>
        </div>
        <div style="font-size:1.8rem;font-weight:900;color:${venitRamasCol};">${fmt(venitRamas)} RON</div>
      </div>
    </div>

    <!-- TABLA -->
    <div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;overflow-x:auto;">
      <div style="display:grid;grid-template-columns:1.3fr .4fr .5fr .4fr .5fr .4fr .5fr .6fr .7fr .3fr .6fr .5fr .5fr .5fr .6fr .7fr;gap:0;padding:10px 14px;border-bottom:2px solid var(--border);background:var(--bg);font-size:.6rem;min-width:1500px;">
        <div style="color:var(--red);font-weight:700;">ANGAJAT</div>
        <div style="color:var(--red);font-weight:700;text-align:right;">Ore AAA</div>
        <div style="color:var(--red);font-weight:700;text-align:right;">AAA RON</div>
        <div style="color:var(--muted);font-weight:700;text-align:right;">Ore EAA</div>
        <div style="color:var(--muted);font-weight:700;text-align:right;">EAA RON</div>
        <div style="color:var(--muted);font-weight:700;text-align:right;">Ore DAA</div>
        <div style="color:var(--muted);font-weight:700;text-align:right;">DAA RON</div>
        <div style="color:var(--red);font-weight:700;text-align:right;">Facturat</div>
        <div style="color:var(--red);font-weight:700;text-align:right;">Total prod.</div>
        <div style="color:var(--red);font-weight:700;text-align:center;">%</div>
        <div style="color:var(--red);font-weight:700;text-align:right;">Venit Ang.</div>
        <div style="color:var(--dark);font-weight:700;text-align:right;">Card</div>
        <div style="color:var(--dark);font-weight:700;text-align:right;">Tichete</div>
        <div style="color:var(--dark);font-weight:700;text-align:right;">Taxe</div>
        <div style="color:var(--green);font-weight:700;text-align:right;">Cash</div>
        <div style="color:var(--red);font-weight:700;text-align:right;">Profit Ang.</div>
      </div>`;

  angajati.forEach((a,idx) => {
    const m = a.months[currentMonth];
    const deptObj = depts.find(d=>d.id===a.dept);
    const bg = idx%2===0?'var(--white)':'var(--bg)';
    ensureFix(a);
    
    const aAAA = m.venitR||0;
    const aEAA = m.alteVenitR||0;
    const aDAA = m.daaVal||0;
    const aFacturat = aAAA + aEAA;
    const aTotalProd = aAAA + aEAA + aDAA;
    const aPct = a.fix.pctVenit||0;
    const aVenitAng = aPct > 0 ? Math.round(aTotalProd * aPct / 100) : 0;
    const aCard = a.fix.salariuNet || 0;
    const aTichete = a.fix.bonificatii.reduce((x,b)=>x+(b.suma||0),0);
    const aTaxe = a.fix.taxe || 0;
    const cc = calcAngCost(a.fix);
    const aCash = aVenitAng - aCard - aTaxe - aTichete;
    const aCashCol = aCash >= 0 ? 'var(--green)' : 'var(--danger)';
    const aProfit = aTotalProd - aVenitAng - cc.totalCostFirma;
    const aProfitCol = aProfit >= 0 ? 'var(--green)' : 'var(--danger)';

    html += '<div style="display:grid;grid-template-columns:1.3fr .4fr .5fr .4fr .5fr .4fr .5fr .6fr .7fr .3fr .6fr .5fr .5fr .5fr .6fr .7fr;gap:0;padding:8px 14px;border-bottom:1px solid var(--border);background:'+bg+';align-items:center;font-size:.72rem;min-width:1500px;" onmouseover="this.style.background=&apos;var(--red-light)&apos;" onmouseout="this.style.background=&apos;'+bg+'&apos;">'+
      '<div><div style="font-weight:700;color:var(--dark);font-size:.76rem;cursor:pointer;text-decoration:underline;" onclick="openAngajatModal('+a.id+')">'+a.nume+'</div><div style="display:flex;gap:3px;margin-top:2px;"><span style="font-size:.54rem;font-weight:600;padding:1px 5px;border-radius:8px;background:var(--red-light);color:var(--red);">'+a.functie+'</span>'+(deptObj?'<span style="font-size:.54rem;font-weight:600;padding:1px 5px;border-radius:8px;border:1px solid var(--border);color:var(--dark);">'+deptObj.n+'</span>':'')+'</div></div>'+
      '<div style="text-align:right;font-weight:700;color:var(--dark);">'+(m.oreAAA||0)+'</div>'+
      '<div style="text-align:right;font-weight:800;color:var(--dark);">'+fmt(aAAA)+'</div>'+
      '<div style="text-align:right;font-weight:600;color:var(--muted);">'+(m.oreEAA||0)+'</div>'+
      '<div style="text-align:right;font-weight:600;color:var(--muted);">'+fmt(aEAA)+'</div>'+
      '<div style="text-align:right;font-weight:600;color:var(--muted);">'+(m.daaOre||0)+'</div>'+
      '<div style="text-align:right;font-weight:600;color:var(--muted);">'+fmt(aDAA)+'</div>'+
      '<div style="text-align:right;font-weight:800;color:var(--dark);">'+fmt(aFacturat)+'</div>'+
      '<div style="text-align:right;font-weight:900;color:var(--dark);">'+fmt(aTotalProd)+'</div>'+
      '<div style="text-align:center;font-weight:700;color:var(--red);font-size:.65rem;">'+aPct+'%</div>'+
      '<div style="text-align:right;font-weight:800;color:var(--red);">'+fmt(aVenitAng)+'</div>'+
      '<div style="text-align:right;font-weight:700;color:var(--dark);">'+fmt(aCard)+'</div>'+
      '<div style="text-align:right;font-weight:700;color:var(--dark);">'+fmt(aTichete)+'</div>'+
      '<div style="text-align:right;font-weight:700;color:var(--dark);">'+fmt(aTaxe)+'</div>'+
      '<div style="text-align:right;font-weight:900;color:'+aCashCol+';">'+fmt(aCash)+'</div>'+
      '<div style="text-align:right;font-weight:900;color:'+aProfitCol+';">'+fmt(aProfit)+'</div></div>';
  });

  // Total sor
  const tDaaOre = angajati.reduce((s,a)=>s+(a.months[currentMonth].daaOre||0),0);
  const tDaaVal = angajati.reduce((s,a)=>s+(a.months[currentMonth].daaVal||0),0);
  const tFacturat = totalAAA + totalEAA;
  const tProfit = totalVenitTot - totalVenitAng - totalCostFirma;
  const tProfitCol = tProfit >= 0 ? 'var(--green)' : 'var(--danger)';
  html += '<div style="display:grid;grid-template-columns:1.3fr .4fr .5fr .4fr .5fr .4fr .5fr .6fr .7fr .3fr .6fr .5fr .5fr .5fr .6fr .7fr;gap:0;padding:12px 14px;background:var(--red-light);border-top:2px solid var(--red);font-size:.74rem;min-width:1500px;">'+
    '<div style="font-weight:800;color:var(--red);">TOTAL</div>'+
    '<div style="text-align:right;font-weight:800;">'+tOreAAA+'</div>'+
    '<div style="text-align:right;font-weight:800;">'+fmt(totalAAA)+'</div>'+
    '<div style="text-align:right;font-weight:800;color:var(--muted);">'+tOreEAA+'</div>'+
    '<div style="text-align:right;font-weight:800;color:var(--muted);">'+fmt(totalEAA)+'</div>'+
    '<div style="text-align:right;font-weight:800;color:var(--muted);">'+tDaaOre+'</div>'+
    '<div style="text-align:right;font-weight:800;color:var(--muted);">'+fmt(tDaaVal)+'</div>'+
    '<div style="text-align:right;font-weight:900;">'+fmt(tFacturat)+'</div>'+
    '<div style="text-align:right;font-weight:900;">'+fmt(totalVenitTot)+'</div>'+
    '<div style="text-align:center;font-weight:700;color:var(--red);">—</div>'+
    '<div style="text-align:right;font-weight:900;color:var(--red);">'+fmt(totalVenitAng)+'</div>'+
    '<div style="text-align:right;font-weight:800;">'+fmt(tCard)+'</div>'+
    '<div style="text-align:right;font-weight:800;">'+fmt(tTichete)+'</div>'+
    '<div style="text-align:right;font-weight:800;">'+fmt(totalTaxeFix)+'</div>'+
    '<div style="text-align:right;font-weight:900;color:'+tCashCol+';">'+fmt(tCash)+'</div>'+
    '<div style="text-align:right;font-weight:900;color:'+tProfitCol+';">'+fmt(tProfit)+'</div></div></div>';

  // === PER ANGAJAT KAPACITÁS ÉS HATÉKONYSÁG ===
  const mnap = munkanapok[currentMonth] || 22;
  const tarifOra = kapacitas.tarifOra || 186;
  const oreZi = kapacitas.oreZi || 8;
  const kapOreMax = kapacitas.maxOrePost || 160; // max ore/hó
  const kapOreMin = kapacitas.minOrePost || 140; // min ore/hó
  
  html += '<div style="margin-top:14px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
  html += '<div style="font-size:.82rem;font-weight:700;color:var(--red);text-transform:uppercase;">Kapacitás és Hatékonyság — '+months[currentMonth]+'</div>';
  html += '<div style="font-size:.65rem;color:var(--muted);">Min: '+kapOreMin+'h | Max: '+kapOreMax+'h | Tarif: '+tarifOra+' RON/h</div>';
  html += '</div>';
  
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
  
  angajati.forEach((a) => {
    const m = a.months[currentMonth];
    ensureFix(a);
    const isAdmin = a.dept === 'admin' || a.dept === 'auxiliar';
    const isVehicle = (a.nume||'').match(/Y.?A24|RENT/i);
    if(isAdmin || isVehicle) return;
    
    const dTarif = kapacitas.depts[a.dept]?.tarif || tarifOra;
    
    // Kapacitás (168h max, 140h min)
    const kapRONmax = kapOreMax * dTarif;
    const kapRONmin = kapOreMin * dTarif;
    
    // Realizat ORE (AAA + EAA + DAA)
    const realOreAAA = m.oreAAA || 0;
    const realOreEAA = m.oreEAA || 0;
    const realOreDAA = m.daaOre || 0;
    const realOreTot = realOreAAA + realOreEAA + realOreDAA;
    
    // Realizat RON (AAA + EAA + DAA)
    const realAAA = m.venitR || 0;
    const realEAA = m.alteVenitR || 0;
    const realDAA = m.daaVal || 0;
    const realRON = realAAA + realEAA + realDAA;
    
    // Kihasználtság % (ore vs max 168h)
    const kihaszPct = kapOreMax > 0 ? Math.round(realOreTot / kapOreMax * 100) : 0;
    const kihaszCol = kihaszPct >= 80 ? 'var(--green)' : kihaszPct >= 60 ? 'var(--orange)' : 'var(--danger)';
    const underMin = realOreTot < kapOreMin;
    
    // Hatékonyság % (RON vs max RON)
    const hatPct = kapRONmax > 0 ? Math.round(realRON / kapRONmax * 100) : 0;
    const hatCol = hatPct >= 80 ? 'var(--green)' : hatPct >= 60 ? 'var(--orange)' : 'var(--danger)';
    
    // RON/óra tényleges
    const ronOra = realOreTot > 0 ? Math.round(realRON / realOreTot) : 0;
    
    // Cost angajat
    const costAng = (a.fix.salariuNet||0) + (a.fix.taxe||0) + a.fix.bonificatii.reduce((x,b)=>x+(b.suma||0),0);
    const profitReal = realRON - costAng;
    const profitCol = profitReal >= 0 ? 'var(--green)' : 'var(--danger)';
    
    // Cost/Revenue %
    const costRevPct = realRON > 0 ? Math.round(costAng / realRON * 100) : 0;
    const crCol = costRevPct <= 30 ? 'var(--green)' : costRevPct <= 45 ? 'var(--orange)' : 'var(--danger)';
    
    // Szabad kapacitás
    const szabadOre = kapOreMax - realOreTot;
    const szabadRON = szabadOre > 0 ? szabadOre * dTarif : 0;
    
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);border-top:3px solid var(--red);padding:12px;cursor:pointer;" onclick="openAngajatModal('+a.id+')">';
    
    // Név + dept
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
    html += '<div style="font-size:.82rem;font-weight:800;color:var(--dark);">'+a.nume+'</div>';
    html += '<span style="font-size:.55rem;font-weight:600;padding:2px 6px;border-radius:6px;background:var(--red-light);color:var(--red);">'+a.functie+'</span>';
    html += '</div>';
    
    // Ore bontás: AAA | EAA | DAA
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px;">';
    html += '<div style="text-align:center;background:var(--bg);border-radius:4px;padding:3px;"><div style="font-size:.48rem;color:var(--red);font-weight:700;">AAA</div><div style="font-size:.72rem;font-weight:800;">'+realOreAAA+'h</div><div style="font-size:.5rem;color:var(--muted);">'+fmt(realAAA)+'</div></div>';
    html += '<div style="text-align:center;background:var(--bg);border-radius:4px;padding:3px;"><div style="font-size:.48rem;color:var(--muted);font-weight:700;">EAA</div><div style="font-size:.72rem;font-weight:800;">'+realOreEAA+'h</div><div style="font-size:.5rem;color:var(--muted);">'+fmt(realEAA)+'</div></div>';
    html += '<div style="text-align:center;background:var(--bg);border-radius:4px;padding:3px;"><div style="font-size:.48rem;color:var(--muted);font-weight:700;">DAA</div><div style="font-size:.72rem;font-weight:800;">'+realOreDAA+'h</div><div style="font-size:.5rem;color:var(--muted);">'+fmt(realDAA)+'</div></div>';
    html += '</div>';
    
    // Kihasználtság progress bar (168h max, 140h min jelölve)
    html += '<div style="margin-bottom:6px;">';
    html += '<div style="display:flex;justify-content:space-between;font-size:.58rem;margin-bottom:2px;"><span style="color:var(--muted);">Kihasználtság ('+realOreTot+'/'+kapOreMax+'h)</span><span style="font-weight:800;color:'+kihaszCol+';">'+kihaszPct+'%</span></div>';
    html += '<div style="position:relative;height:8px;background:var(--border);border-radius:4px;overflow:hidden;">';
    html += '<div style="height:100%;width:'+Math.min(kihaszPct,100)+'%;background:'+kihaszCol+';border-radius:4px;"></div>';
    // Min 140h jelölő
    const minPct = Math.round(kapOreMin/kapOreMax*100);
    html += '<div style="position:absolute;left:'+minPct+'%;top:0;height:100%;width:2px;background:var(--dark);opacity:.3;"></div>';
    html += '</div>';
    html += '<div style="font-size:.45rem;color:var(--muted);display:flex;justify-content:space-between;margin-top:1px;"><span>'+(underMin?'⚠ Sub min '+kapOreMin+'h':'Min: '+kapOreMin+'h OK')+'</span><span>Max: '+kapOreMax+'h</span></div>';
    html += '</div>';
    
    // Hatékonyság progress bar (RON)
    html += '<div style="margin-bottom:8px;">';
    html += '<div style="display:flex;justify-content:space-between;font-size:.58rem;margin-bottom:2px;"><span style="color:var(--muted);">Producție ('+fmt(realRON)+'/'+fmt(kapRONmax)+')</span><span style="font-weight:800;color:'+hatCol+';">'+hatPct+'%</span></div>';
    html += '<div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="height:100%;width:'+Math.min(hatPct,100)+'%;background:'+hatCol+';border-radius:4px;"></div></div>';
    html += '</div>';
    
    // KPI számok
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">';
    html += '<div style="text-align:center;background:var(--bg);border-radius:6px;padding:4px;"><div style="font-size:.48rem;color:var(--muted);">RON/oră</div><div style="font-size:.78rem;font-weight:800;">'+ronOra+'</div></div>';
    html += '<div style="text-align:center;background:var(--bg);border-radius:6px;padding:4px;"><div style="font-size:.48rem;color:var(--muted);">Cost/Rev</div><div style="font-size:.78rem;font-weight:800;color:'+crCol+';">'+costRevPct+'%</div></div>';
    html += '<div style="text-align:center;background:var(--bg);border-radius:6px;padding:4px;"><div style="font-size:.48rem;color:var(--muted);">Szabad</div><div style="font-size:.78rem;font-weight:800;color:var(--danger);">'+szabadOre+'h</div></div>';
    html += '<div style="text-align:center;background:var(--bg);border-radius:6px;padding:4px;"><div style="font-size:.48rem;color:'+profitCol+';">Profit</div><div style="font-size:.78rem;font-weight:900;color:'+profitCol+';">'+fmt(profitReal)+'</div></div>';
    html += '</div>';
    
    html += '</div>';
  });
  
  html += '</div></div>';

  document.getElementById('salarii-list').innerHTML = html;
};

// Bonificatii quick edit from table (sets first bonificatie or creates one)
function updAngBonifTotal(id, val) {
  const a = angajati.find(x=>x.id===id);
  if(!a) return;
  ensureFix(a);
  const v = Number(val);
  if(a.fix.bonificatii.length === 0) {
    a.fix.bonificatii.push({nume:'Bonificatie', suma:v});
  } else {
    a.fix.bonificatii[0].suma = v;
  }
  renderSalarii(); renderSumar(); scheduleSave();
}
window.updAngBonifTotal = updAngBonifTotal;

const updAng = (id, field, val) => {
  const a = angajati.find(x => x.id === id);
  if (a) { a.months[currentMonth][field] = Number(val); renderSalarii(); renderSumar(); }
};
window.updAng = updAng;

// === ANGAJAT MODAL ===
function openAngajatModal(id){
  const a=angajati.find(x=>x.id===id);if(!a)return;
  const f=ensureFix(a);const cc=calcAngCost(f);
  const tp=f.deptAlloc.reduce((s,d)=>s+d.pct,0);
  const m=a.months[currentMonth];
  const venitTot=(m.venitR||0)+(m.alteVenitR||0)+(m.daaVal||0);
  const venitAng=Math.round(venitTot*f.pctVenit/100);
  const pctColor=f.pctVenit>45?'var(--danger)':f.pctVenit>40?'var(--orange)':'var(--green)';
  const ov=document.createElement('div');ov.className='asm-ov';ov.id='angModal';

  let h='<div class="asm-mod" style="max-width:720px;max-height:90vh;overflow-y:auto;">';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div><div style="font-size:.78rem;font-weight:700;color:var(--red);text-transform:uppercase;">FISA ANGAJAT</div><div style="font-size:1.3rem;font-weight:800;color:var(--dark);">'+a.nume+'</div></div><button onclick="closeAngModal()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 12px;cursor:pointer;font-size:1rem;">x</button></div>';
  // Date personale
  h+='<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid var(--border);"><div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:10px;">Date personale</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
  h+='<div><label style="font-size:.7rem;color:var(--muted);">Nume</label><input type="text" value="'+a.nume+'" onchange="updAngFix('+a.id+',&apos;nume&apos;,this.value)" style="padding:6px 8px;font-size:.85rem;font-weight:700;"></div>';
  h+='<div><label style="font-size:.7rem;color:var(--muted);">Functie</label><input type="text" value="'+a.functie+'" onchange="updAngFix('+a.id+',&apos;functie&apos;,this.value)" style="padding:6px 8px;font-size:.85rem;"></div>';
  h+='<div><label style="font-size:.7rem;color:var(--muted);">CNP</label><input type="text" value="'+f.cnp+'" onchange="updAngFix('+a.id+',&apos;fix.cnp&apos;,this.value)" style="padding:6px 8px;font-size:.85rem;"></div>';
  h+='<div><label style="font-size:.7rem;color:var(--muted);">Telefon</label><input type="text" value="'+f.telefon+'" onchange="updAngFix('+a.id+',&apos;fix.telefon&apos;,this.value)" style="padding:6px 8px;font-size:.85rem;"></div>';
  h+='<div><label style="font-size:.7rem;color:var(--muted);">Email</label><input type="text" value="'+f.email+'" onchange="updAngFix('+a.id+',&apos;fix.email&apos;,this.value)" style="padding:6px 8px;font-size:.85rem;"></div>';
  h+='<div><label style="font-size:.7rem;color:var(--muted);">Contract</label><input type="text" value="'+f.contractNr+'" onchange="updAngFix('+a.id+',&apos;fix.contractNr&apos;,this.value)" style="padding:6px 8px;font-size:.85rem;"></div>';
  h+='<div><label style="font-size:.7rem;color:var(--muted);">Data angajare</label><input type="text" value="'+f.dataAngajare+'" onchange="updAngFix('+a.id+',&apos;fix.dataAngajare&apos;,this.value)" placeholder="DD.MM.YYYY" style="padding:6px 8px;font-size:.85rem;"></div>';
  h+='</div></div>';
  // Salariu: Net, Taxe, Brut, % din Venit
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:12px;">';
  h+='<div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);text-align:center;"><div style="font-size:.7rem;font-weight:700;color:var(--red);margin-bottom:6px;">SALARIU NET</div><input type="number" value="'+f.salariuNet+'" onchange="updAngFix('+a.id+',&apos;fix.salariuNet&apos;,this.value);reopenAngModal('+a.id+');" style="width:100%;padding:8px;font-size:1.1rem;font-weight:800;text-align:center;"></div>';
  h+='<div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);text-align:center;"><div style="font-size:.7rem;font-weight:700;color:var(--red);margin-bottom:6px;">TAXE</div><input type="number" value="'+f.taxe+'" onchange="updAngFix('+a.id+',&apos;fix.taxe&apos;,this.value);reopenAngModal('+a.id+');" style="width:100%;padding:8px;font-size:1.1rem;font-weight:800;text-align:center;"></div>';
  h+='<div style="background:var(--bg);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid var(--red);text-align:center;"><div style="font-size:.7rem;font-weight:700;color:var(--red);margin-bottom:6px;">BRUT</div><div style="font-size:1.3rem;font-weight:900;padding:8px 0;">'+fmt(cc.salariuBrut)+' RON</div></div>';
  h+='<div style="background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);border-top:3px solid '+pctColor+';text-align:center;"><div style="font-size:.7rem;font-weight:700;color:'+pctColor+';margin-bottom:6px;">% DIN VENIT</div><div style="display:flex;align-items:center;justify-content:center;gap:4px;"><input type="number" value="'+f.pctVenit+'" onchange="updAngFix('+a.id+',&apos;fix.pctVenit&apos;,this.value);reopenAngModal('+a.id+');" style="width:60px;padding:6px;font-size:1rem;font-weight:800;text-align:center;" min="0" max="50" step="0.5"><span style="font-size:.9rem;font-weight:700;">%</span></div><div style="font-size:.9rem;font-weight:800;margin-top:6px;">= '+fmt(venitAng)+' RON</div><div style="font-size:.6rem;color:var(--muted);margin-top:2px;">din '+fmt(venitTot)+' venit</div></div>';
  h+='</div>';
  // Bonificatii
  h+='<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid var(--border);"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;">Bonificatii</div><div style="font-size:.85rem;font-weight:800;">Total: '+fmt(cc.totalBonificatii)+' RON</div></div>';
  f.bonificatii.forEach((b,i)=>{
    h+='<div style="display:grid;grid-template-columns:2fr 1fr 40px;gap:6px;padding:5px 0;border-bottom:1px solid var(--border);align-items:center;"><input type="text" value="'+(b.nume||'')+'" onchange="updBonificatie('+a.id+','+i+',&apos;nume&apos;,this.value);reopenAngModal('+a.id+');" placeholder="Descriere..." style="padding:5px 8px;font-size:.82rem;"><input type="number" value="'+(b.suma||0)+'" onchange="updBonificatie('+a.id+','+i+',&apos;suma&apos;,this.value);reopenAngModal('+a.id+');" style="padding:5px 8px;font-size:.85rem;font-weight:700;text-align:right;"><button onclick="removeBonificatie('+a.id+','+i+');reopenAngModal('+a.id+');" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 6px;cursor:pointer;color:var(--danger);font-size:.75rem;">x</button></div>';
  });
  h+='<button onclick="addBonificatie('+a.id+');reopenAngModal('+a.id+');" style="margin-top:8px;padding:6px 14px;background:var(--red);color:#fff;border:none;border-radius:16px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;">+ Bonificatie</button></div>';
  // COST FUNCTIONARE FIRMA
  h+='<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid var(--border);border-left:3px solid var(--red);"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;">Cost Functionare Firma</div><div style="font-size:.85rem;font-weight:800;">Total: '+fmt(cc.totalCostFirma)+' RON</div></div>';
  f.costFirma.forEach((cf,i)=>{
    h+='<div style="display:grid;grid-template-columns:2fr 1fr 40px;gap:6px;padding:5px 0;border-bottom:1px solid var(--border);align-items:center;"><input type="text" value="'+(cf.nume||'')+'" onchange="updCostFirma('+a.id+','+i+',&apos;nume&apos;,this.value);reopenAngModal('+a.id+');" placeholder="Cost..." style="padding:5px 8px;font-size:.82rem;"><input type="number" value="'+(cf.suma||0)+'" onchange="updCostFirma('+a.id+','+i+',&apos;suma&apos;,this.value);reopenAngModal('+a.id+');" style="padding:5px 8px;font-size:.85rem;font-weight:700;text-align:right;"><button onclick="removeCostFirma('+a.id+','+i+');reopenAngModal('+a.id+');" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 6px;cursor:pointer;color:var(--danger);font-size:.75rem;">x</button></div>';
  });
  h+='<button onclick="addCostFirma('+a.id+');reopenAngModal('+a.id+');" style="margin-top:8px;padding:6px 14px;background:var(--red);color:#fff;border:none;border-radius:16px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;">+ Cost firma</button></div>';
  // Departamente
  h+='<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid var(--border);"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;">Departamente</div><div style="font-size:.75rem;font-weight:700;color:'+(tp===100?'var(--green)':'var(--danger)')+';">'+tp+'%</div></div>';
  f.deptAlloc.forEach((da,i)=>{
    const br=Math.round(cc.salariuBrut*da.bonus/100);
    h+='<div style="display:grid;grid-template-columns:2fr .8fr .8fr 1fr 40px;gap:6px;padding:5px 0;border-bottom:1px solid var(--border);align-items:center;"><select onchange="updDeptAlloc('+a.id+','+i+',&apos;dept&apos;,this.value);reopenAngModal('+a.id+');" style="padding:5px 8px;font-size:.82rem;">'+depts.map(d=>'<option value="'+d.id+'" '+(d.id===da.dept?'selected':'')+'>'+d.n+'</option>').join('')+'</select><input type="number" value="'+da.pct+'" onchange="updDeptAlloc('+a.id+','+i+',&apos;pct&apos;,this.value);reopenAngModal('+a.id+');" style="width:100%;padding:5px;font-size:.85rem;text-align:right;font-weight:700;"><input type="number" value="'+da.bonus+'" onchange="updDeptAlloc('+a.id+','+i+',&apos;bonus&apos;,this.value);reopenAngModal('+a.id+');" style="width:100%;padding:5px;font-size:.85rem;text-align:right;font-weight:700;"><div style="text-align:right;font-weight:800;font-size:.85rem;">'+(br>0?'+'+fmt(br):'0')+' RON</div>'+(f.deptAlloc.length>1?'<button onclick="removeDeptAlloc('+a.id+','+i+');reopenAngModal('+a.id+');" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 6px;cursor:pointer;color:var(--danger);font-size:.75rem;">x</button>':'<div></div>')+'</div>';
  });
  h+='<button onclick="addDeptAlloc('+a.id+');reopenAngModal('+a.id+');" style="margin-top:8px;padding:6px 14px;background:var(--red);color:#fff;border:none;border-radius:16px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;">+ Departament</button></div>';
  // COST TOTAL + MUNKALAP + PROFIT POST DE LUCRU
  const mo = currentMonth;
  const mData = a.months[mo];
  const mAAA = mData.venitR||0, mEAA = mData.alteVenitR||0, mDAA = mData.daaVal||0;
  const mFacturat = mAAA + mEAA;
  const mTotalProd = mAAA + mEAA + mDAA;
  const modalVenitAng = f.pctVenit > 0 ? Math.round(mTotalProd * f.pctVenit / 100) : 0;
  const modalCash = modalVenitAng - (f.salariuNet||0) - (f.taxe||0) - cc.totalBonificatii;
  const modalCashCol = modalCash >= 0 ? 'var(--green)' : 'var(--danger)';
  
  // Cheltuieli firma per poszt
  const totalPosztok = Object.keys(kapacitas.depts).filter(k=>!kapacitas.depts[k].nonprod).reduce((s,k)=>s+kapacitas.depts[k].posztok,0) || 1;
  const cheltFixHavi = facturi.filter(f=>(f.tip||'fix')==='fix').reduce((s,f)=>s+(f.months?.[mo]?.r||0),0);
  const cheltFlexHavi = facturi.filter(f=>f.tip==='flex').reduce((s,f)=>s+(f.months?.[mo]?.r||0),0);
  const cheltFixPostz = Math.round(cheltFixHavi / totalPosztok);
  const cheltFlexPostz = Math.round(cheltFlexHavi / totalPosztok);
  
  // Cheltuieli angajat = Venit Angajat (amit a cég kifizet)
  const cheltAngajat = modalVenitAng;
  
  // Profit post de lucru
  const profitPostz = mTotalProd - cheltAngajat - cheltFixPostz - cheltFlexPostz;
  const profitPostzCol = profitPostz >= 0 ? 'var(--green)' : 'var(--danger)';
  
  // MUNKALAP szekció
  h+='<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid var(--border);border-top:3px solid var(--red);">';
  h+='<div style="font-size:.75rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:10px;">Munkalap — '+months[mo]+'</div>';
  
  // AAA / EAA / DAA
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">';
  h+='<div style="background:var(--white);border-radius:8px;padding:10px;border:1px solid var(--border);text-align:center;"><div style="font-size:.6rem;font-weight:700;color:var(--red);">AAA — Facturat</div><div style="font-size:1.1rem;font-weight:900;color:var(--dark);margin-top:4px;">'+fmt(mAAA)+' RON</div><div style="font-size:.58rem;color:var(--muted);">'+(mData.oreAAA||0)+' ore</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:10px;border:1px solid var(--border);text-align:center;"><div style="font-size:.6rem;font-weight:700;color:var(--muted);">EAA — Proforma</div><div style="font-size:1.1rem;font-weight:900;color:var(--dark);margin-top:4px;">'+fmt(mEAA)+' RON</div><div style="font-size:.58rem;color:var(--muted);">'+(mData.oreEAA||0)+' ore</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:10px;border:1px solid var(--border);text-align:center;"><div style="font-size:.6rem;font-weight:700;color:var(--muted);">DAA — Deschis</div><div style="font-size:1.1rem;font-weight:900;color:var(--dark);margin-top:4px;">'+fmt(mDAA)+' RON</div><div style="font-size:.58rem;color:var(--muted);">'+(mData.daaOre||0)+' ore | '+(mData.daaDevize||0)+' dev.</div></div>';
  h+='</div>';
  
  // Facturat / Total / % / Venit Ang / Cash
  h+='<div style="display:grid;grid-template-columns:1fr 1fr .4fr 1fr 1fr;gap:8px;margin-bottom:10px;">';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);text-align:center;"><div style="font-size:.58rem;font-weight:700;color:var(--dark);">Facturat</div><div style="font-size:.95rem;font-weight:900;">'+fmt(mFacturat)+'</div><div style="font-size:.5rem;color:var(--muted);">AAA+EAA</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);border-top:3px solid var(--red);text-align:center;"><div style="font-size:.58rem;font-weight:700;color:var(--red);">Productie</div><div style="font-size:1rem;font-weight:900;">'+fmt(mTotalProd)+'</div><div style="font-size:.5rem;color:var(--muted);">AAA+EAA+DAA</div></div>';
  h+='<div style="display:flex;align-items:center;justify-content:center;"><div style="font-size:.95rem;font-weight:900;color:var(--red);">x'+f.pctVenit+'%</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);border-top:3px solid var(--red);text-align:center;"><div style="font-size:.58rem;font-weight:700;color:var(--red);">Venit Angajat</div><div style="font-size:1rem;font-weight:900;color:var(--red);">'+fmt(modalVenitAng)+'</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);border-top:3px solid '+modalCashCol+';text-align:center;"><div style="font-size:.58rem;font-weight:700;color:'+modalCashCol+';">CASH</div><div style="font-size:1rem;font-weight:900;color:'+modalCashCol+';">'+fmt(modalCash)+'</div><div style="font-size:.48rem;color:var(--muted);">VA−Card−Taxe−Bon</div></div>';
  h+='</div>';
  h+='</div>';
  
  // PROFIT POST DE LUCRU
  h+='<div style="background:var(--red-light);border-radius:10px;padding:14px;border:2px solid var(--red);margin-bottom:12px;">';
  h+='<div style="font-size:.72rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:10px;">Profit Post de Lucru</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1.2fr;gap:6px;text-align:center;">';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);"><div style="font-size:.55rem;color:var(--dark);font-weight:600;">Venit Post</div><div style="font-size:.95rem;font-weight:900;color:var(--dark);">'+fmt(mTotalProd)+'</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);"><div style="font-size:.55rem;color:var(--danger);font-weight:600;">Chelt. Fixe</div><div style="font-size:.95rem;font-weight:800;color:var(--danger);">−'+fmt(cheltFixPostz)+'</div><div style="font-size:.45rem;color:var(--muted);">'+fmt(cheltFixHavi)+'/'+totalPosztok+'</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);"><div style="font-size:.55rem;color:var(--danger);font-weight:600;">Chelt. Flex</div><div style="font-size:.95rem;font-weight:800;color:var(--danger);">−'+fmt(cheltFlexPostz)+'</div><div style="font-size:.45rem;color:var(--muted);">'+fmt(cheltFlexHavi)+'/'+totalPosztok+'</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);"><div style="font-size:.55rem;color:var(--danger);font-weight:600;">Venit Angajat</div><div style="font-size:.95rem;font-weight:800;color:var(--danger);">−'+fmt(cheltAngajat)+'</div><div style="font-size:.45rem;color:var(--muted);">productie x '+f.pctVenit+'%</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:8px;border:1px solid var(--border);"><div style="font-size:.55rem;color:var(--muted);">Total Chelt.</div><div style="font-size:.95rem;font-weight:900;color:var(--danger);">'+fmt(cheltAngajat+cheltFixPostz+cheltFlexPostz)+'</div></div>';
  h+='<div style="background:var(--white);border-radius:8px;padding:10px;border:2px solid '+profitPostzCol+';"><div style="font-size:.58rem;color:'+profitPostzCol+';font-weight:700;">PROFIT POST</div><div style="font-size:1.1rem;font-weight:900;color:'+profitPostzCol+';">'+fmt(profitPostz)+'</div></div>';
  h+='</div></div>';
  // Buttons
  h+='<div style="display:flex;justify-content:space-between;margin-top:14px;"><button onclick="if(confirm(&apos;Sterge '+a.nume+'?&apos;)){deleteAngajat('+a.id+');}" style="padding:8px 20px;background:var(--white);color:var(--danger);border:1.5px solid var(--danger);border-radius:20px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;">Sterge</button><button onclick="closeAngModal();" style="padding:10px 30px;background:var(--red);color:#fff;border:none;border-radius:20px;font-weight:700;font-size:.88rem;cursor:pointer;font-family:inherit;">Salveaza</button></div>';
  h+='</div>';
  ov.innerHTML=h;
  document.body.appendChild(ov);
}
function closeAngModal(){const m=document.getElementById('angModal');if(m)m.remove();renderSalarii();if(currentPage==='programare')renderGantt();scheduleSave();}
function reopenAngModal(id){const m=document.getElementById('angModal');if(m)m.remove();openAngajatModal(id);scheduleSave();}
function updAngFix(id,path,val){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);if(path==='nume')a.nume=val;else if(path==='functie')a.functie=val;else if(path.startsWith('fix.')){a.fix[path.split('.')[1]]=isNaN(Number(val))?val:Number(val);}}
function updDeptAlloc(id,idx,field,val){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);if(field==='dept')a.fix.deptAlloc[idx].dept=val;if(field==='pct')a.fix.deptAlloc[idx].pct=Number(val);if(field==='bonus')a.fix.deptAlloc[idx].bonus=Number(val);}
function addDeptAlloc(id){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);a.fix.deptAlloc.push({dept:'tehnic',pct:0,bonus:0});}
function removeDeptAlloc(id,idx){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);a.fix.deptAlloc.splice(idx,1);}
function deleteAngajat(id){angajati=angajati.filter(a=>a.id!==id);closeAngModal();renderSalarii();renderSumar();if(currentPage==='programare')renderGantt();scheduleSave();}
function addAngajat(){const n={id:nextAngajatId++,nume:'Angajat Nou',functie:'Mecanic',dept:'tehnic',fix:{salariuNet:0,taxe:0,bonificatii:[],cnp:'',telefon:'',email:'',dataAngajare:'',contractNr:'',deptAlloc:[{dept:'tehnic',pct:100,bonus:0}]},months:Array(12).fill(0).map(()=>({oreP:160,oreR:0,oreAAA:0,oreEAA:0,venitR:0,alteVenitR:0,salR:0,bonR:0,alteBonR:0,cardR:0,taxeR:0,zileP:22,zileR:0,zileLib:0,venitAng:0}))};angajati.push(n);renderSalarii();scheduleSave();openAngajatModal(n.id);}
function addBonificatie(id){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);a.fix.bonificatii.push({nume:'',suma:0});}
function removeBonificatie(id,idx){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);a.fix.bonificatii.splice(idx,1);}
function updBonificatie(id,idx,field,val){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);if(field==='nume')a.fix.bonificatii[idx].nume=val;if(field==='suma')a.fix.bonificatii[idx].suma=Number(val);}
function addCostFirma(id){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);a.fix.costFirma.push({nume:'',suma:0});}
function removeCostFirma(id,idx){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);a.fix.costFirma.splice(idx,1);}
function updCostFirma(id,idx,field,val){const a=angajati.find(x=>x.id===id);if(!a)return;ensureFix(a);if(field==='nume')a.fix.costFirma[idx].nume=val;if(field==='suma')a.fix.costFirma[idx].suma=Number(val);}
window.addCostFirma=addCostFirma;window.removeCostFirma=removeCostFirma;window.updCostFirma=updCostFirma;

window.openAngajatModal=openAngajatModal;window.closeAngModal=closeAngModal;window.reopenAngModal=reopenAngModal;window.updAngFix=updAngFix;window.updDeptAlloc=updDeptAlloc;window.addDeptAlloc=addDeptAlloc;window.removeDeptAlloc=removeDeptAlloc;window.deleteAngajat=deleteAngajat;window.addAngajat=addAngajat;window.addBonificatie=addBonificatie;window.removeBonificatie=removeBonificatie;window.updBonificatie=updBonificatie;

// === ASM PARSERS ===
const A24_PATTERN = /A24/i;
const RENT_PATTERN = /RENT/i;
const TRANSPORT_CLIENTS = ['A24 ROAD PATROL SRL', 'GOLDFIT SERVICE SRL'];

let asmFiles = {stat:null,pers:null,lista:null,prog:null,sinteza:null,achizitii:null};
let asmParsed = {stat:null,pers:null,lista:null,prog:null,sinteza:null,achizitii:null};

function readXls(buf){
  const wb = XLSX.read(buf,{type:'array',cellDates:true});
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});
  console.log('XLS loaded:', rows.length, 'rows');
  return rows;
}

function detectFileType(rows){
  if(!rows||rows.length<2) return null;
  const h = rows[0].map(c=>String(c||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
  if(h.some(c=>c.includes('utilizator'))&&h.some(c=>c.includes('valoare'))) return 'stat';
  if(h.some(c=>c.includes('nume mecanic'))&&h.some(c=>c.includes('descriere'))) return 'pers';
  if(h.some(c=>c.includes('nr. deviz'))&&h.some(c=>c.includes('stare'))) return 'lista';
  if(h.some(c=>c.includes('mecanic'))&&h.some(c=>c.includes('de la ora'))) return 'prog';
  // Sinteza (cont debitor / cont creditor / suma)
  if(h.some(c=>c.includes('cont debitor'))&&h.some(c=>c.includes('cont creditor'))) return 'sinteza';
  // Vanzari+Achizitii (valoare receptie)
  if(h.some(c=>c.includes('valoare receptie')||c.includes('valoare recept'))) return 'achizitii';
  return null;
}

function parseStatVanzari(rows){
  const hdr=rows[0]; const ci={};
  hdr.forEach((h,i)=>{
    const l=String(h||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(l.includes('utilizator'))ci.util=i;
    if((l.includes('data document')||l.includes('data doc'))&&!l.includes('sursa'))ci.data=i;
    if(l.includes('client'))ci.cli=i;if(l.includes('tip document'))ci.tip=i;
    if(l.includes('valoare servicii'))ci.serv=i;
    if(l.includes('discount servicii'))ci.dS=i;
    if(l.includes('valoare articole'))ci.art=i;
    if(l.includes('adaos articole'))ci.adaos=i;
    if(l.includes('discount articole'))ci.dA=i;
    if(l.includes('valoare avans'))ci.avans=i;
    if(l.includes('valoare vanzare')&&!l.includes('tva'))ci.vanz=i;
    if(l.includes('vanzare cu tva'))ci.vTVA=i;
  });
  const n=r=>{const v=r;return typeof v==='number'?v:parseFloat(String(v||'0').replace(/[^\d.\-]/g,''))||0;};
  let month=-1;
  const txns=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i]; const c0=String(r[0]||'').toLowerCase();
    if(c0.includes('castig')||c0.includes('statistic')) continue;
    if(!r[ci.util]&&!r[ci.vanz]) continue;
    if(month<0&&ci.data!==undefined){
      const dv=r[ci.data];
      if(dv instanceof Date&&!isNaN(dv)){month=dv.getMonth();}
      else{
        const s=String(dv||'');
        const m1=s.match(/(\d{4})-(\d{2})/);if(m1)month=parseInt(m1[2])-1;
        const m2=s.match(/(\d{2})\.(\d{2})\.(\d{4})/);if(!m1&&m2)month=parseInt(m2[2])-1;
        const m3=s.match(/(\d{2})\/(\d{2})\/(\d{4})/);if(!m1&&!m2&&m3)month=parseInt(m3[1])-1;
      }
    }
    const cli=String(r[ci.cli]||'');
    const isTransport=TRANSPORT_CLIENTS.includes(cli);
    txns.push({cli,isTransport,tip:String(r[ci.tip]||''),serv:n(r[ci.serv]),dS:ci.dS!==undefined?n(r[ci.dS]):0,
      art:n(r[ci.art]),adaos:ci.adaos!==undefined?n(r[ci.adaos]):0,dA:ci.dA!==undefined?n(r[ci.dA]):0,
      avans:ci.avans!==undefined?n(r[ci.avans]):0,vanz:n(r[ci.vanz]),vTVA:ci.vTVA!==undefined?n(r[ci.vTVA]):0});
  }
  const sum=(arr,fn)=>arr.reduce((s,t)=>s+fn(t),0);
  const calc=arr=>({
    nManop:sum(arr,t=>t.serv+t.dS), artNyer:sum(arr,t=>t.adaos+t.dA),
    artVetel:sum(arr,t=>t.art-t.adaos),
    profit:sum(arr,t=>t.serv+t.dS+t.adaos+t.dA), vanz:sum(arr,t=>t.vanz), vTVA:sum(arr,t=>t.vTVA),
    nArtElad:sum(arr,t=>t.art+t.dA), tx:arr.length
  });
  const atelier=txns.filter(t=>!t.isTransport);
  const transport=txns.filter(t=>t.isTransport);
  return{month,txns,atelier:calc(atelier),transport:calc(transport),total:calc(txns)};
}

function parsePersManopere(rows){
  const hdr=rows[0];const ci={};
  hdr.forEach((h,i)=>{
    const l=String(h||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(l.includes('nume mecanic'))ci.mech=i;if(l.includes('data exec'))ci.data=i;
    if(l.includes('nr. deviz'))ci.deviz=i;if(l.includes('stare deviz'))ci.stare=i;
    if(l.includes('val. f. tva')||l.includes('val. fara tva'))ci.netto=i;
    if(l.includes('val. cu tva cu disc'))ci.tva=i;
    if(l.includes('norma de timp')&&!l.includes('total'))ci.ore=i;
    if(l.includes('tarif'))ci.tarif=i;
    if(l.includes('categorie'))ci.cat=i;
  });
  const n=v=>typeof v==='number'?v:parseFloat(String(v||'0').replace(/[^\d.\-]/g,''))||0;
  const data=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i];const mech=String(r[ci.mech]||'');
    if(mech.includes('Lista mecanicilor')||!mech) continue;
    const deviz=String(r[ci.deviz]||'');const pfx=deviz.substring(0,3);
    const isRent=RENT_PATTERN.test(mech);const isTransport=A24_PATTERN.test(mech)||isRent;
    data.push({mech,deviz,pfx,stare:String(r[ci.stare]||''),isTransport,netto:n(r[ci.netto]),tva:n(r[ci.tva]),ore:n(r[ci.ore])});
  }
  const byMech={};
  data.forEach(d=>{
    if(!byMech[d.mech]) byMech[d.mech]={mech:d.mech,isTransport:d.isTransport,AAA:{n:0,d:new Set(),o:0},EAA:{n:0,d:new Set(),o:0},DAA:{n:0,d:new Set(),o:0}};
    const m=byMech[d.mech];
    if(m[d.pfx]){m[d.pfx].n+=d.netto;m[d.pfx].d.add(d.deviz);m[d.pfx].o+=d.ore;}
  });
  return{data,byMech:Object.values(byMech).map(m=>({...m,AAA:{n:m.AAA.n,d:m.AAA.d.size,o:m.AAA.o},EAA:{n:m.EAA.n,d:m.EAA.d.size,o:m.EAA.o},DAA:{n:m.DAA.n,d:m.DAA.d.size,o:m.DAA.o},total:m.AAA.n+m.EAA.n+m.DAA.n})).sort((a,b)=>b.total-a.total)};
}

// === UI ===
function openAsmImport(){
  asmFiles={stat:null,pers:null,lista:null,prog:null,sinteza:null,achizitii:null};
  asmParsed={stat:null,pers:null,lista:null,prog:null,sinteza:null,achizitii:null};
  const ov=document.createElement('div');ov.className='asm-ov';ov.id='asmOv';
  ov.innerHTML=`<div class="asm-mod">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <h2 style="margin:0;color:#c84040">📥 Import ASM — 4 fișiere</h2>
      <button onclick="closeAsm()" style="background:none;border:1px solid #dbe2ea;border-radius:8px;padding:4px 12px;cursor:pointer;font-size:1rem">✕</button>
    </div>
    <div class="asm-drop" id="asmDrop">
      <div style="font-size:2.5rem;margin-bottom:8px">📂</div>
      <div style="font-weight:700;font-size:1rem;color:#1f2937">Trage toate 4 fișierele .xls aici</div>
      <div style="font-size:.82rem;color:#94a3b8;margin-top:4px">Stat vânzări + PersonalManopere + Lista devize + Programări + Sinteza + Achiziții</div>
      <input type="file" id="asmFi" accept=".xls,.xlsx" multiple>
    </div>
    <div class="asm-files" id="asmFileStatus">
      <div class="asm-file missing"><span class="ico">📊</span><span class="fname">Statistică vânzări</span></div>
      <div class="asm-file missing"><span class="ico">👷</span><span class="fname">PersonalManopere</span></div>
      <div class="asm-file missing"><span class="ico">📋</span><span class="fname">Lista devizelor</span></div>
      <div class="asm-file missing"><span class="ico">📅</span><span class="fname">Programări</span></div>
    </div>
    <div id="asmPreview"></div>
    <div id="asmMsg" class="asm-msg"></div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{if(e.target===ov)closeAsm();});
  const drop=document.getElementById('asmDrop'),fi=document.getElementById('asmFi');
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('over');});
  drop.addEventListener('dragleave',e=>{e.preventDefault();drop.classList.remove('over');});
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('over');handleAsmFiles(e.dataTransfer.files);});
  fi.addEventListener('change',e=>{handleAsmFiles(e.target.files);});
}

function closeAsm(){const el=document.getElementById('asmOv');if(el)el.remove();}

function handleAsmFiles(fileList){
  const msg=document.getElementById('asmMsg');msg.className='asm-msg';msg.style.display='none';
  let pending=fileList.length;
  Array.from(fileList).forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const rows=readXls(new Uint8Array(e.target.result));
        const type=detectFileType(rows);
        if(type){asmFiles[type]=file.name;asmParsed[type]=rows;updateFileStatus();}
      }catch(err){msg.className='asm-msg err';msg.style.display='block';msg.textContent='❌ '+err.message;}
      pending--;if(pending<=0)tryBuildPreview();
    };
    reader.readAsArrayBuffer(file);
  });
}

function updateFileStatus(){
  const names={stat:'Statistică vânzări',pers:'PersonalManopere',lista:'Lista devizelor',prog:'Programări',sinteza:'Sinteza (Cash Flow)',achizitii:'Achiziții piese'};
  const icons={stat:'📊',pers:'👷',lista:'📋',prog:'📅'};
  document.getElementById('asmFileStatus').innerHTML=Object.entries(names).map(([k,v])=>
    `<div class="asm-file ${asmFiles[k]?'loaded':'missing'}"><span class="ico">${icons[k]}</span><span class="fname">${asmFiles[k]||v}</span>${asmFiles[k]?'<span style="color:#10b981;font-weight:800">✓</span>':''}</div>`
  ).join('');
}

function tryBuildPreview(){
  if(!asmParsed.stat) return; // minimum: stat kell
  const stat=parseStatVanzari(asmParsed.stat);
  const pers=asmParsed.pers?parsePersManopere(asmParsed.pers):null;
  const moName=stat.month>=0?months[stat.month]:'?';
  const a=stat.atelier,t=stat.transport,tot=stat.total;

  let mechHtml='';
  if(pers){
    const atelierMechs=pers.byMech.filter(m=>!m.isTransport);
    const transportMechs=pers.byMech.filter(m=>m.isTransport);
    mechHtml=`<div class="asm-res" style="margin-top:10px"><div class="asm-res-h">👷 Mechanikus produktivitás (${moName}, csak március)</div><div class="asm-res-b">
      <div style="font-weight:700;font-size:.82rem;color:#2E7D32;margin-bottom:4px">ATELIER (${atelierMechs.length} fő)</div>
      ${atelierMechs.slice(0,8).map(m=>`<div class="asm-r"><span class="l">${m.mech}</span><span class="v" style="color:#2E7D32">${fmt(m.AAA.n)} <span style="font-size:.7rem;color:#94a3b8">F</span> + ${fmt(m.EAA.n)} <span style="font-size:.7rem;color:#F57F17">pipe</span></span></div>`).join('')}
      <div style="font-weight:700;font-size:.82rem;color:#1565C0;margin:8px 0 4px">TRANSPORT (${transportMechs.length} jármű)</div>
      ${transportMechs.map(m=>`<div class="asm-r"><span class="l">${m.mech}</span><span class="v" style="color:#1565C0">${fmt(m.AAA.n)}</span></div>`).join('')}
    </div></div>`;
  }

  document.getElementById('asmPreview').innerHTML=`
    <div class="asm-summary">
      <div class="asm-card" style="border-color:#c8404040;background:#fef2f2"><div class="lbl">Cég Profit</div><div class="num" style="color:#c84040">${fmt(tot.profit)}</div></div>
      <div class="asm-card" style="border-color:#2E7D3240;background:#f0fdf4"><div class="lbl">Atelier Profit</div><div class="num" style="color:#2E7D32">${fmt(a.profit)}</div></div>
      <div class="asm-card" style="border-color:#1565C040;background:#E3F2FD"><div class="lbl">Transport Profit</div><div class="num" style="color:#1565C0">${fmt(t.profit)}</div></div>
    </div>
    <div class="asm-res"><div class="asm-res-h">📊 ${moName} — ${tot.tx} tranzakció → Facturat + Proformă per részleg</div><div class="asm-res-b">
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:4px 12px;font-size:.85rem">
        <div style="font-weight:800;color:#64748b">Részleg</div><div style="font-weight:700;color:#3b82f6;text-align:right">Facturat (AAA)</div><div style="font-weight:700;color:#f59e0b;text-align:right">Proformă (EAA)</div>
        <div style="font-weight:700">🔧 Tehnic</div><div style="text-align:right;color:#3b82f6;font-weight:700">${fmt(a.nManop)}</div><div style="text-align:right;color:#f59e0b">(din PersonalManopere)</div>
        <div style="font-weight:700">🔨 Body (Sunil)</div><div style="text-align:right;color:#8b5cf6">(din PersonalManopere)</div><div style="text-align:right;color:#f59e0b">(din PersonalManopere)</div>
        <div style="font-weight:700">🎨 Paint (Ganes, Chis)</div><div style="text-align:right;color:#7c3aed">(din PersonalManopere)</div><div style="text-align:right;color:#f59e0b">(din PersonalManopere)</div>
        <div style="font-weight:700">🚚 Transport</div><div style="text-align:right;color:#10b981">${fmt(t.nManop+t.nArtElad)}</div><div style="text-align:right;color:#f59e0b">(din PersonalManopere)</div>
        <div style="font-weight:700">👔 Admin</div><div style="text-align:right;color:#64748b">(David Szk.)</div><div style="text-align:right;color:#94a3b8">—</div>
        <div style="font-weight:700">🏭 Auxiliar</div><div style="text-align:right;color:#f59e0b">(Bardos)</div><div style="text-align:right;color:#94a3b8">—</div>
        <div style="font-weight:700">🛡️ Garanții</div><div style="text-align:right;color:#ef4444">(ASIGURĂRI DAUNE)</div><div style="text-align:right;color:#94a3b8">—</div>
        <div style="font-weight:700">⚙️ Piese</div><div style="text-align:right;color:#06b6d4;font-weight:800">${fmt(a.artNyer)}</div><div style="text-align:right;color:#94a3b8">—</div>
      </div>
      <div style="margin-top:12px;padding-top:10px;border-top:2px solid #e2e8f0">
        <div class="asm-r asm-big"><span class="l" style="font-weight:800">CÉG PROFIT</span><span class="v" style="color:#c84040">${fmt(tot.profit)} RON</span></div>
        <div class="asm-r"><span class="l">Forgalom</span><span class="v">${fmt(tot.vanz)} / ${fmt(tot.vTVA)} TVA</span></div>
      </div>
    </div></div>
    ${mechHtml}
    <div class="asm-acts">
      <button onclick="closeAsm()" style="padding:8px 16px;border:1px solid #dbe2ea;border-radius:10px;background:#fff;cursor:pointer;font-weight:600">Anulează</button>
      <button onclick="applyAsmData()" style="padding:8px 20px;border:none;border-radius:10px;background:#15803d;color:#fff;cursor:pointer;font-weight:700;font-size:.95rem">✓ Importă ${moName} în panel</button>
    </div>`;
}

// =====================================================
// MECHANIKUS → RÉSZLEG BEOSZTÁS (fix)
// =====================================================
const MECH_DEPT = {
  // TEHNIC (Mecanica)
  '01.ARNOLD TAMAS': 'tehnic',
  '02ABIN  02. ABIN': 'tehnic',
  '05.FERENC SZKALICZKI': 'tehnic',
  '09.ROBERT SZKALICZKI': 'tehnic',
  // LĂCĂTUȘ — BODY
  '04.SUNIL  SUNIL': 'body',
  // LĂCĂTUȘ — PAINT
  '03.GANES KUMAR': 'paint',
  '06.SZILARD CHIS': 'paint',
  // ADMIN
  '07.DAVID  SZKALICZKI': 'admin',
  // AUXILIAR
  '16BARDOS  LEHEL ': 'auxiliar',
  // TRANSPORT (Y-A24 járművek automatikusan)
};

function getMechDept(name) {
  if (RENT_PATTERN.test(name)) return 'rentacar';
  if (A24_PATTERN.test(name)) return 'transport';
  const exact = MECH_DEPT[name];
  if (exact) return exact;
  // Fallback: név alapján próbálkozás
  const up = name.toUpperCase();
  if (up.includes('ARNOLD') || up.includes('ABIN') || up.includes('KHANAL')) return 'tehnic';
  if (up.includes('SUNIL')) return 'body';
  if (up.includes('GANES') || up.includes('KUMAR')) return 'paint';
  if (up.includes('SZILARD') && up.includes('CHIS')) return 'paint';
  if (up.includes('DAVID') && up.includes('SZKALICZKI')) return 'admin';
  if (up.includes('YVONNE')) return 'admin';
  if (up.includes('MARIUS') || up.includes('VARGA')) return 'transport';
  if (up.includes('BARDOS') || up.includes('LEHEL')) return 'auxiliar';
  return 'tehnic'; // default
}

function applyAsmData(){
  console.log('🚀 applyAsmData called, asmParsed:', {stat:!!asmParsed.stat, pers:!!asmParsed.pers});
  const stat=parseStatVanzari(asmParsed.stat);
  const mo=stat.month;
  console.log('📅 Detected month:', mo, months[mo]||'?');
  console.log('📊 Stat totals:', stat.total);
  if(mo<0||mo>11){document.getElementById('asmMsg').className='asm-msg err';document.getElementById('asmMsg').style.display='block';document.getElementById('asmMsg').textContent='❌ Nu s-a detectat luna! Month='+mo;return;}
  const a=stat.atelier, t=stat.transport, tot=stat.total;

  // === 8 RÉSZLEG — mechanikus név alapján bontva ===
  let tehnicFact=0, tehnicProf=0, bodyFact=0, bodyProf=0, paintFact=0, paintProf=0;
  let transportFact=0, transportProf=0;
  let rentacarFact=0, rentacarProf=0;
  let auxiliarFact=0, garantiiFact=0, adminFact=0;

  if(asmParsed.pers){
    const pers=parsePersManopere(asmParsed.pers);

    // Mechanikus alapú bontás — soronként, nyers adatból
    const persRaw=asmParsed.pers;const hdrG=persRaw[0];const ciG={};
    hdrG.forEach((h,i)=>{const l=String(h||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(l.includes('nume mecanic'))ciG.mech=i;if(l.includes('nr. deviz'))ciG.deviz=i;
      if(l.includes('val. f. tva'))ciG.netto=i;if(l.includes('categorie'))ciG.cat=i;});
    const nG=v=>typeof v==='number'?v:parseFloat(String(v||'0').replace(/[^\d.\-]/g,''))||0;

    for(let i=1;i<persRaw.length;i++){
      const r=persRaw[i];const mech=String(r[ciG.mech]||'');
      if(mech.includes('Lista mecanicilor')||!mech) continue;
      const cat=String(r[ciG.cat]||'').toUpperCase();
      const deviz=String(r[ciG.deviz]||'');const pfx=deviz.substring(0,3);
      const val=nG(r[ciG.netto]);
      const dept=getMechDept(mech);

      // 1) Mechanikus részlegbe MINDIG (Body/Paint/Tehnic/stb)
      if(pfx==='AAA'){
        if(dept==='tehnic') tehnicFact+=val;
        else if(dept==='body') bodyFact+=val;
        else if(dept==='paint') paintFact+=val;
        else if(dept==='transport') transportFact+=val;
        else if(dept==='rentacar') rentacarFact+=val;
        else if(dept==='admin') adminFact+=val;
        else if(dept==='auxiliar') auxiliarFact+=val;
      }
      if(pfx==='EAA'){
        if(dept==='tehnic') tehnicProf+=val;
        else if(dept==='body') bodyProf+=val;
        else if(dept==='paint') paintProf+=val;
        else if(dept==='transport') transportProf+=val;
        else if(dept==='rentacar') rentacarProf+=val;
      }

      // 2) Garanții = kézzel töltendő (cégköltség, nem számolódik automatikusan)
    }

    // Angajați frissítés — Y-A24 + RENT A CAR + normál mechanikusok
    const ya24Mechs = pers.byMech.filter(m=>A24_PATTERN.test(m.mech) && !RENT_PATTERN.test(m.mech));
    const rentMechs = pers.byMech.filter(m=>RENT_PATTERN.test(m.mech));
    const normalMechs = pers.byMech.filter(m=>!A24_PATTERN.test(m.mech) && !RENT_PATTERN.test(m.mech));
    
    // Y-A24 Transport összesítés 1 sorba
    if(ya24Mechs.length > 0) {
      let ang = angajati.find(a=>a.nume==='TRANSPORT Y-A24');
      if(!ang){ang={id:nextAngajatId++,nume:'TRANSPORT Y-A24',functie:'Transport',dept:'transport',fix:{salariuNet:0,taxe:0,pctVenit:0,bonificatii:[],cnp:'',telefon:'',email:'',dataAngajare:'',contractNr:'',deptAlloc:[{dept:'transport',pct:100,bonus:0}]},months:Array(12).fill(0).map(()=>({oreP:160,oreR:0,oreAAA:0,oreEAA:0,venitR:0,alteVenitR:0,salR:0,bonR:0,alteBonR:0,cardR:0,taxeR:0,zileP:22,zileR:0,zileLib:0,venitAng:0}))};angajati.push(ang);}
      ang.dept='transport';
      let tAAA_o=0,tEAA_o=0,tAAA_n=0,tEAA_n=0,tDAA_n=0,tDAA_d=0,tDAA_o=0;
      ya24Mechs.forEach(m=>{
        tAAA_o+=m.AAA.o; tEAA_o+=m.EAA.o;
        tAAA_n+=m.AAA.n; tEAA_n+=m.EAA.n;
        tDAA_n+=m.DAA.n; tDAA_d+=m.DAA.d; tDAA_o+=m.DAA.o;
      });
      ang.months[mo].oreR=Math.round(tAAA_o+tEAA_o);
      ang.months[mo].oreAAA=Math.round(tAAA_o);
      ang.months[mo].oreEAA=Math.round(tEAA_o);
      ang.months[mo].venitR=Math.round(tAAA_n);
      ang.months[mo].alteVenitR=Math.round(tEAA_n);
      ang.months[mo].daaVal=Math.round(tDAA_n);
      ang.months[mo].daaDevize=tDAA_d;
      ang.months[mo].daaOre=Math.round(tDAA_o);
    }

    // RENT A CAR összesítés 1 sorba
    if(rentMechs.length > 0) {
      let ang = angajati.find(a=>a.nume==='RENT A CAR');
      if(!ang){ang={id:nextAngajatId++,nume:'RENT A CAR',functie:'Rent a Car',dept:'rentacar',fix:{salariuNet:0,taxe:0,pctVenit:0,bonificatii:[],cnp:'',telefon:'',email:'',dataAngajare:'',contractNr:'',deptAlloc:[{dept:'rentacar',pct:100,bonus:0}]},months:Array(12).fill(0).map(()=>({oreP:160,oreR:0,oreAAA:0,oreEAA:0,venitR:0,alteVenitR:0,salR:0,bonR:0,alteBonR:0,cardR:0,taxeR:0,zileP:22,zileR:0,zileLib:0,venitAng:0}))};angajati.push(ang);}
      ang.dept='rentacar';
      let rAAA_o=0,rEAA_o=0,rAAA_n=0,rEAA_n=0,rDAA_n=0,rDAA_d=0,rDAA_o=0;
      rentMechs.forEach(m=>{
        rAAA_o+=m.AAA.o; rEAA_o+=m.EAA.o;
        rAAA_n+=m.AAA.n; rEAA_n+=m.EAA.n;
        rDAA_n+=m.DAA.n; rDAA_d+=m.DAA.d; rDAA_o+=m.DAA.o;
      });
      ang.months[mo].oreR=Math.round(rAAA_o+rEAA_o);
      ang.months[mo].oreAAA=Math.round(rAAA_o);
      ang.months[mo].oreEAA=Math.round(rEAA_o);
      ang.months[mo].venitR=Math.round(rAAA_n);
      ang.months[mo].alteVenitR=Math.round(rEAA_n);
      ang.months[mo].daaVal=Math.round(rDAA_n);
      ang.months[mo].daaDevize=rDAA_d;
      ang.months[mo].daaOre=Math.round(rDAA_o);
    }

    // Normál mechanikusok
    normalMechs.forEach(m=>{
      const dept = getMechDept(m.mech);
      const angDept = dept==='body'?'lacatus':dept==='paint'?'lacatus':dept;
      const angFunctie = dept==='body'?'Body':dept==='paint'?'Paint':dept==='tehnic'?'Mecanic':dept==='admin'?'Admin':'Auxiliar';
      let ang=angajati.find(a=>a.nume===m.mech);
      if(!ang){ang={id:nextAngajatId++,nume:m.mech,functie:angFunctie,dept:angDept,fix:{salariuNet:0,taxe:0,bonificatii:0,cnp:'',telefon:'',email:'',dataAngajare:'',contractNr:'',deptAlloc:[{dept:angDept,pct:100,bonus:0}]},months:Array(12).fill(0).map(()=>({oreP:160,oreR:0,oreAAA:0,oreEAA:0,venitR:0,alteVenitR:0,salR:0,bonR:0,alteBonR:0,cardR:0,taxeR:0,zileP:22,zileR:0,zileLib:0,venitAng:0}))};angajati.push(ang);}
      ang.dept=angDept;
      ang.months[mo].oreR=Math.round(m.AAA.o+m.EAA.o);
      ang.months[mo].oreAAA=Math.round(m.AAA.o);
      ang.months[mo].oreEAA=Math.round(m.EAA.o);
      ang.months[mo].venitR=Math.round(m.AAA.n);
      ang.months[mo].alteVenitR=Math.round(m.EAA.n);
      ang.months[mo].daaVal=Math.round(m.DAA.n);
      ang.months[mo].daaDevize=m.DAA.d;
      ang.months[mo].daaOre=Math.round(m.DAA.o);

    });
  }

  // FELÜLÍRÁS — nem duplikál!
  console.log('✅ Values to apply:', {tehnicFact,tehnicProf,bodyFact,bodyProf,paintFact,paintProf,transportFact,transportProf,adminFact,auxiliarFact,garantiiFact,artNyer:a.artNyer,statTransport:t.nManop+t.nArtElad});
  venituri.tehnicFacturat[mo]={p:venituri.tehnicFacturat[mo].p, r:Math.round(tehnicFact)};
  venituri.tehnicProforma[mo]={p:venituri.tehnicProforma[mo].p, r:Math.round(tehnicProf)};
  venituri.bodyFacturat[mo]={p:venituri.bodyFacturat[mo].p, r:Math.round(bodyFact)};
  venituri.bodyProforma[mo]={p:venituri.bodyProforma[mo].p, r:Math.round(bodyProf)};
  venituri.paintFacturat[mo]={p:venituri.paintFacturat[mo].p, r:Math.round(paintFact)};
  venituri.paintProforma[mo]={p:venituri.paintProforma[mo].p, r:Math.round(paintProf)};
  // Transport: STAT A24 ROAD PATROL + GOLDFIT ügyfél számlák (manop+piese)
  venituri.transportFacturat[mo]={p:venituri.transportFacturat[mo].p, r:Math.round(t.nManop+t.artNyer)};
  venituri.transportProforma[mo]={p:venituri.transportProforma[mo].p, r:0};
  // Rent a Car: PersonalManopere Y-A24 járművek munkája
  venituri.rentacarFacturat[mo]={p:venituri.rentacarFacturat[mo].p, r:Math.round(transportFact+rentacarFact)};
  venituri.rentacarProforma[mo]={p:venituri.rentacarProforma[mo].p, r:Math.round(transportProf+rentacarProf)};
  venituri.admin[mo]={p:venituri.admin[mo].p, r:Math.round(adminFact)};
  venituri.auxiliar[mo]={p:venituri.auxiliar[mo].p, r:Math.round(auxiliarFact)};
  venituri.garantii[mo]={p:venituri.garantii[mo].p, r:Math.round(garantiiFact)};
  venituri.comertPiese[mo]={p:venituri.comertPiese[mo].p, r:Math.round(a.artNyer)};

  // CASH FLOW — automatikus átvétel az ASM-ből
  cfMonths[mo].facturat = Math.round(tot.vTVA);
  cfMonths[mo].achizitiiPiese = Math.round(tot.artVetel);
  cfMonths[mo].nManop = Math.round(tot.nManop);
  cfMonths[mo].artNyer = Math.round(tot.artNyer);
  // EAA + DAA manoperă a pipeline-hoz
  if(asmParsed.pers){
    const persAll = parsePersManopere(asmParsed.pers);
    cfMonths[mo].eaaManop = Math.round(persAll.byMech.reduce((s,m)=>s+m.EAA.n,0));

  }
  console.log('💵 Cash Flow set:', JSON.stringify(cfMonths[mo]));

  // === PROG.XLSX → Munkaordine importálás a Gantt-ba ===
  if(asmParsed.prog) {
    const progRows = asmParsed.prog;
    const phdr = progRows[0];
    const pci = {};
    phdr.forEach((h,i) => {
      const hl = String(h||'').toLowerCase().trim();
      if(hl.includes('data')) pci.data = i;
      if(hl.includes('mecanic')) pci.mech = i;
      if(hl.includes('descriere')) pci.desc = i;
      if(hl.includes('de la')) pci.oraS = i;
      if(hl.includes('până') || hl.includes('pana')) pci.oraE = i;
      if(hl.includes('post')) pci.post = i;
      if(hl.includes('înmatr') || hl.includes('inmatr') || hl.includes('nr.')) pci.nrAuto = i;
      if(hl.includes('client')) pci.client = i;
    });
    
    // Név mapping: "01.ARNOLD TAMAS" → "TAMAS ARNOLD" (angajati név formátum)
    function normMechName(raw) {
      if(!raw) return '';
      let n = String(raw).replace(/^\d+\.?\s*/,'').replace(/\d+\.\s*/g,'').trim();
      // "ARNOLD TAMAS" vagy "ABIN  02. ABIN" → tisztítás
      n = n.replace(/\s+/g,' ').trim();
      // Ha dupla név (pl "02ABIN  02. ABIN"), vegyük az utolsó részt
      if(n.includes('  ')) n = n.split(/\s{2,}/).pop().trim();
      return n.toUpperCase();
    }
    
    function findAngajatByProg(mechRaw) {
      const nm = normMechName(mechRaw);
      if(!nm) return null;
      // Próbáljuk pontos match
      let ang = angajati.find(a => normMechName(a.nume) === nm);
      if(ang) return ang;
      // Részleges match (tartalmazza)
      const parts = nm.split(' ');
      ang = angajati.find(a => {
        const an = a.nume.toUpperCase();
        return parts.every(p => an.includes(p));
      });
      if(ang) return ang;
      // Bármely szó match
      ang = angajati.find(a => {
        const an = a.nume.toUpperCase();
        return parts.some(p => p.length > 3 && an.includes(p));
      });
      return ang;
    }
    
    // Összevonás: ugyanaz a nap + mecanic + rendszám = 1 WO
    const progMap = {};
    for(let i=1; i<progRows.length; i++) {
      const r = progRows[i];
      let rawDate = r[pci.data];
      if(!rawDate) continue;
      // Date parseolás
      let dStr = '';
      if(typeof rawDate === 'number') {
        // Excel serial date
        const d = new Date((rawDate - 25569) * 86400000);
        dStr = d.toISOString().split('T')[0];
      } else {
        const d = new Date(rawDate);
        if(!isNaN(d)) dStr = d.toISOString().split('T')[0];
      }
      if(!dStr) continue;
      
      const mech = String(r[pci.mech]||'');
      const nrAuto = String(r[pci.nrAuto]||'').trim();
      const client = String(r[pci.client]||'').trim();
      const desc = String(r[pci.desc]||'').trim();
      const oraS = String(r[pci.oraS]||'08:00').trim();
      const oraE = String(r[pci.oraE]||'09:00').trim();
      
      const key = dStr + '|' + mech + '|' + nrAuto;
      if(!progMap[key]) {
        progMap[key] = { dStr, mech, nrAuto, client, descs:[], oraS, oraE };
      }
      progMap[key].descs.push(desc);
      // Legkorábbi start, legkésőbbi end
      if(oraS < progMap[key].oraS) progMap[key].oraS = oraS;
      if(oraE > progMap[key].oraE) progMap[key].oraE = oraE;
    }
    
    // Munkaordine generálás
    const progWOs = Object.values(progMap);
    let progCount = 0;
    progWOs.forEach(pw => {
      const ang = findAngajatByProg(pw.mech);
      if(!ang) return;
      // Skip transport / rent
      if(/Y.?A24|RENT/i.test(pw.mech)) return;
      
      // Ellenőrzés: már létezik-e ilyen WO?
      const exists = munkaordine.find(w => w.data === pw.dStr && w.mechanic === ang.nume && w.nrAuto === pw.nrAuto);
      if(exists) return;
      
      // Ore számítás
      const sh = parseInt(pw.oraS.split(':')[0])||8, sm = parseInt(pw.oraS.split(':')[1])||0;
      const eh = parseInt(pw.oraE.split(':')[0])||17, em = parseInt(pw.oraE.split(':')[1])||0;
      const ore = Math.round(((eh*60+em) - (sh*60+sm)) / 60 * 10) / 10;
      
      munkaordine.push({
        id: 'WO-'+nextWoId++,
        devizNr: '',
        client: pw.client,
        auto: pw.nrAuto,
        nrAuto: pw.nrAuto,
        desc: pw.descs.slice(0,3).join(' + ').substring(0,60),
        normaTimp: ore > 0 ? ore : 1,
        mechanic: ang.nume,
        postLucru: '',
        data: pw.dStr,
        oraStart: pw.oraS,
        oraEnd: pw.oraE,
        prioritate: 'normal',
        status: 'programat',
        valoare: 0,
        createdAt: new Date().toISOString(),
        fromASM: true
      });
      progCount++;
    });
    console.log('📋 Prog import: '+progCount+' munkaordine créées from prog.xlsx');
  }

  // === SINTEZA → Cash Flow import ===
  if(asmParsed.sinteza) {
    const sRows = asmParsed.sinteza;
    const shdr = sRows[0];
    const sci = {};
    shdr.forEach((h,i) => {
      const hl = String(h||'').toLowerCase().trim();
      if(hl.includes('cont debitor')||hl.includes('debitor')) sci.deb = i;
      if(hl.includes('cont creditor')||hl.includes('creditor')) sci.cred = i;
      if(hl.includes('suma')||hl.includes('sumă')) sci.suma = i;
    });
    
    const cf = cfSinteza[mo];
    cf.imported = true;
    cf.incasariBank = 0; cf.incasariCasa = 0; cf.alteBevételek = 0;
    cf.platiPiese = 0; cf.platiSalarii = 0; cf.platiTaxe = 0;
    cf.platiHitel = 0; cf.platiAlte = 0; cf.transferuri = 0;
    
    for(let i=1; i<sRows.length; i++) {
      const r = sRows[i];
      const deb = String(r[sci.deb]||'').trim();
      const cred = String(r[sci.cred]||'').trim();
      let suma = typeof r[sci.suma] === 'number' ? r[sci.suma] : parseFloat(String(r[sci.suma]||'0').replace(/[^\d.\-]/g,''))||0;
      
      if(!deb || !cred || !suma) continue;
      
      // BEVÉTELEK (pénz jön BE a bankra/pénztárba)
      if(deb.startsWith('5121') && cred.startsWith('4111')) cf.incasariBank += suma;
      else if(deb.startsWith('5311') && cred.startsWith('4111')) cf.incasariCasa += suma;
      else if(deb.startsWith('5121') && !cred.startsWith('4111')) cf.alteBevételek += suma;
      else if(deb.startsWith('5311') && !cred.startsWith('4111') && !cred.startsWith('5')) {/* skip internal */}
      
      // KIADÁSOK (pénz megy KI)
      else if(deb.startsWith('401') && (cred.startsWith('5121')||cred.startsWith('5311'))) cf.platiPiese += suma;
      else if(deb.startsWith('421') && (cred.startsWith('5121')||cred.startsWith('5311'))) cf.platiSalarii += suma;
      else if((deb.startsWith('4315')||deb.startsWith('436')||deb.startsWith('4423')||deb.startsWith('4426')) && cred.startsWith('5121')) cf.platiTaxe += suma;
      else if((deb.startsWith('5191')||deb.startsWith('1621')) && cred.startsWith('5121')) cf.platiHitel += suma;
      else if(deb.startsWith('581') && cred.startsWith('5121')) cf.transferuri += suma;
      else if((deb.startsWith('6')||deb.startsWith('542')) && (cred.startsWith('5121')||cred.startsWith('5311'))) cf.platiAlte += suma;
    }
    
    console.log('💰 Sinteza import:', JSON.stringify(cf));
    
    // Auto-create cheltuieli from Sinteza 6xx accounts
    const costMap = {
      '605':  {nume:'Energie + Apă', tip:'fix', dept:'tehnic'},
      '626':  {nume:'Poștă + Telecom', tip:'fix', dept:'conducere'},
      '627':  {nume:'Servicii bancare', tip:'fix', dept:'finante'},
      '628':  {nume:'Alte servicii (chirie, asig.)', tip:'fix', dept:'conducere'},
      '604':  {nume:'Materiale nestocate', tip:'flex', dept:'tehnic'},
      '607':  {nume:'Cheltuieli mărfuri', tip:'flex', dept:'tehnic'},
      '6581': {nume:'Amenzi, penalități', tip:'flex', dept:'finante'}
    };
    
    for(let i=1; i<sRows.length; i++) {
      const r = sRows[i];
      const deb = String(r[sci.deb]||'').trim();
      const cred = String(r[sci.cred]||'').trim();
      let suma = typeof r[sci.suma] === 'number' ? r[sci.suma] : parseFloat(String(r[sci.suma]||'0').replace(/[^\d.\-]/g,''))||0;
      if(!deb.startsWith('6') || !suma || suma < 0) continue;
      // Skip 6028 (piese consumption — internal, not cash expense)
      if(deb.startsWith('6028')) continue;
      
      const contPrefix = deb.split('.')[0];
      const cm = costMap[contPrefix];
      if(!cm) continue;
      
      // Find or create factura
      let fac = facturi.find(f => f.nume === cm.nume && f.dept === cm.dept);
      if(!fac) {
        fac = {id: nextFacturaId++, dept: cm.dept, nume: cm.nume, tip: cm.tip, months: Array(12).fill(0).map(()=>({p:0,r:0}))};
        facturi.push(fac);
      }
      fac.tip = cm.tip;
      fac.months[mo].r = Math.round((fac.months[mo].r||0) + suma);
    }
    console.log('📊 Cheltuieli auto-created from Sinteza');
  }

  // === ACHIZIȚII → Részletes beszállítói lista ===
  if(asmParsed.achizitii) {
    const aRows = asmParsed.achizitii;
    const ahdr = aRows[0];
    const aci = {};
    ahdr.forEach((h,i) => {
      const hl = String(h||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(hl.includes('data')) aci.data = i;
      if(hl.includes('doc')) aci.doc = i;
      if(hl.includes('valoare receptie')||hl.includes('valoare recept')) aci.val = i;
      if(hl.includes('suma din')) aci.suma = i;
      if(hl.includes('valoare tva')) aci.tva = i;
    });
    
    cfAchizitii = [];
    // Beszállító felismerés + csoport
    const supplierMap = [
      // RULAJ PIESE — minden ami raktárba megy
      {p:'FTGAX',n:'AUTONET IMPORT',g:'rulaj'},{p:'FTDSX',n:'AUTONET IMPORT',g:'rulaj'},{p:'FTDSAX',n:'AUTONET IMPORT',g:'rulaj'},
      {p:'FSMX',n:'AUTONET IMPORT',g:'rulaj'},{p:'FBX',n:'AUTONET IMPORT',g:'rulaj'},{p:'FOSX',n:'AUTONET IMPORT',g:'rulaj'},
      {p:'FBVX',n:'AUTONET IMPORT',g:'rulaj'},{p:'FSMERPX',n:'AUTONET (retur)',g:'rulaj'},
      {p:'2260',n:'AD AUTO TOTAL',g:'rulaj'},{p:'1260',n:'AD AUTO TOTAL',g:'rulaj'},
      {p:'9269',n:'MATEROM',g:'rulaj'},{p:'9268',n:'MATEROM',g:'rulaj'},{p:'9410',n:'MATEROM',g:'rulaj'},
      {p:'1040',n:'MATEROM AUTOMOTIVE',g:'rulaj'},
      {p:'1526',n:'INTER CARS',g:'rulaj'},
      {p:'128547',n:'AUTO PARTNER',g:'rulaj'},{p:'124095',n:'AUTO PARTNER',g:'rulaj'},{p:'155549',n:'AUTO PARTNER',g:'rulaj'},{p:'158683',n:'AUTO PARTNER',g:'rulaj'},
      {p:'260300',n:'AUTOLAK',g:'rulaj'},{p:'260301',n:'AUTOLAK',g:'rulaj'},{p:'2987',n:'AUTOLAK',g:'rulaj'},
      {p:'37583',n:'AUGSBURG',g:'rulaj'},{p:'37761',n:'AUGSBURG',g:'rulaj'},{p:'37763',n:'AUGSBURG',g:'rulaj'},
      {p:'3072',n:'EMSCO AUTO',g:'rulaj'},{p:'186333',n:'RAVENOL',g:'rulaj'},
      {p:'87359',n:'VAR SERVICE',g:'rulaj'},{p:'153680',n:'SSV AUTO',g:'rulaj'},
      {p:'260355',n:'AUTOPRO NORD',g:'rulaj'},{p:'6643',n:'GENERAL TEHNO',g:'rulaj'},
      {p:'5379',n:'COM JANI',g:'rulaj'},{p:'6306',n:'VLADADEL',g:'rulaj'},
      {p:'260407',n:'POINTS NETWORK',g:'rulaj'},{p:'25267',n:'SURUBTRADE',g:'rulaj'},
      {p:'832788',n:'KOFF',g:'rulaj'},{p:'11174',n:'LUCIP',g:'rulaj'},
      {p:'57860',n:'EQT SHOP',g:'rulaj'},{p:'823265',n:'HIDROMIX',g:'rulaj'},
      // CHELTUIELI PRODUCTIE — munkával kapcsolatos
      {p:'440705',n:'CLEANTECH',g:'cheltuieli'},{p:'8960',n:'MEWA TEXTIL',g:'cheltuieli'},
      {p:'452',n:'APRIL91',g:'cheltuieli'},{p:'679',n:'APRIL91',g:'cheltuieli'},
      {p:'96',n:'COMPACT SPEED',g:'cheltuieli'},{p:'6500',n:'DEDEMAN',g:'cheltuieli'},
      {p:'19',n:'SUCIU BOGDAN',g:'cheltuieli'},
      // RENT A CAR — leasing
      {p:'14282',n:'RCI LEASING',g:'rentacar'},{p:'26585',n:'RCI BROKER',g:'rentacar'},
      // TRANSPORT — üzemanyag, útdíj
      {p:'6426',n:'OMV PETROM',g:'transport'},
      {p:'2600097',n:'CNAIR',g:'transport'},{p:'2600101',n:'CNAIR',g:'transport'},{p:'2600122',n:'CNAIR',g:'transport'},
      // ADMIN — fix működési költség
      {p:'4004',n:'EDENRED',g:'admin'},{p:'5800',n:'ELECTRICA',g:'admin'},
      {p:'1066',n:'AQASERV',g:'admin'},{p:'260300447',n:'ORANGE',g:'admin'},{p:'260300477',n:'ORANGE',g:'admin'},
      {p:'513735',n:'ORANGE COMM',g:'admin'},
      {p:'12630',n:'METROCERT',g:'admin'},{p:'260762',n:'SYSTEMA CERT',g:'admin'},
      {p:'264871',n:'BIROTECH',g:'admin'},{p:'21035',n:'PRODBAND',g:'admin'},{p:'21078',n:'PRODBAND',g:'admin'},
      {p:'10916',n:'FAN COURIER',g:'admin'},
      {p:'38634',n:'AUDATEX',g:'admin'},{p:'111006',n:'ELCOMSERV',g:'admin'},
      {p:'17809',n:'ROMSERVICE',g:'admin'},{p:'0882',n:'INTEREDU',g:'admin'},
      {p:'23224',n:'TELEVOX',g:'admin'}
    ];
    function matchSupplier(doc) {
      var d = String(doc||'');
      for(var s=0; s<supplierMap.length; s++) {
        if(d.startsWith(supplierMap[s].p)) return {n:supplierMap[s].n, g:supplierMap[s].g};
      }
      return {n:'', g:'rulaj'};
    }
    
    for(let i=1; i<aRows.length; i++) {
      const r = aRows[i];
      const dataRaw = r[aci.data];
      if(!dataRaw || String(dataRaw).toLowerCase().includes('total')) continue;
      
      let dStr = '';
      if(typeof dataRaw === 'number') {
        const d = new Date((dataRaw - 25569) * 86400000);
        dStr = d.toISOString().split('T')[0];
      } else {
        const d = new Date(dataRaw);
        if(!isNaN(d)) dStr = d.toISOString().split('T')[0];
        else dStr = String(dataRaw).substring(0,10);
      }
      
      const docNr = String(r[aci.doc]||'');
      const sup = matchSupplier(docNr);
      const val = typeof r[aci.val] === 'number' ? r[aci.val] : parseFloat(String(r[aci.val]||'0').replace(/[^\d.\-]/g,''))||0;
      const suma = typeof r[aci.suma] === 'number' ? r[aci.suma] : parseFloat(String(r[aci.suma]||'0').replace(/[^\d.\-]/g,''))||0;
      const tva = aci.tva !== undefined && typeof r[aci.tva] === 'number' ? r[aci.tva] : 0;
      
      cfAchizitii.push({
        data: dStr,
        doc: docNr,
        furnizor: sup.n,
        grup: sup.g,
        valoare: val,
        sumaPos: suma,
        tva: tva
      });
    }
    console.log('🛒 Achiziții import: '+cfAchizitii.length+' tételek');
  }

  renderSumar();render();
  const msg=document.getElementById('asmMsg');
  msg.className='asm-msg ok';msg.style.display='block';
  msg.innerHTML=`✅ <strong>${months[mo]}</strong> importálva!<br>
    🔧 Tehnic: ${fmt(tehnicFact)} F + ${fmt(tehnicProf)} P<br>
    🔨 Body: ${fmt(bodyFact)} F + ${fmt(bodyProf)} P · 🎨 Paint: ${fmt(paintFact)} F + ${fmt(paintProf)} P<br>
    🚚 Transport: ${fmt(t.nManop+t.nArtElad+transportFact)} F + ${fmt(transportProf)} P<br>
    ⚙️ Piese nyereség: ${fmt(a.artNyer)} · Profit: <strong>${fmt(tot.profit)} RON</strong><br>
    💵 <strong>Cash Flow:</strong> Facturi emise: ${fmt(tot.vTVA)} · Achiziții piese: ${fmt(tot.artVetel)}`;
  setTimeout(closeAsm,5000);
}

// =====================================================
// SAVE / LOAD — localStorage
// =====================================================
const STORAGE_KEY = 'redassistance-panel-v16';

function saveAllData() {
  try {
    const data = {
      venituri, facturi, angajati, cfSoldInitial, cfMonths, cfSinteza, cfAchizitii, planTargets, kapacitas, munkanapok,
      nextFacturaId, nextAngajatId, munkaordine, nextWoId,
      ui: { period, currentPage, currentDept, currentMonth, showAnualStats },
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const el = document.getElementById('saveStatus');
    if(el) el.textContent = '💾 Salvat: ' + new Date().toLocaleTimeString('ro-RO');
    console.log('💾 Saved at', data.savedAt);
  } catch(e) { console.warn('Save failed:', e); }
}

function loadAllData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { console.log('📂 No saved data, starting fresh'); return false; }
    const data = JSON.parse(raw);
    
    // Venituri — merge: megőrizzük az összes kategóriát, betöltjük ami van
    if (data.venituri) {
      Object.keys(venituri).forEach(key => {
        if (data.venituri[key]) {
          for (let i = 0; i < 12; i++) {
            if (data.venituri[key][i]) {
              venituri[key][i] = { p: data.venituri[key][i].p || 0, r: data.venituri[key][i].r || 0 };
            }
          }
        }
      });
    }
    
    // Facturi
    if (Array.isArray(data.facturi) && data.facturi.length) {
      facturi = data.facturi.map(f => ({
        id: f.id || 1, dept: f.dept || 'tehnic', nume: f.nume || '', tip: f.tip || 'fix',
        months: Array.from({length:12}, (_, i) => ({ p: (f.months?.[i]?.p) || 0, r: (f.months?.[i]?.r) || 0 }))
      }));
    }
    
    // Angajati
    if (Array.isArray(data.angajati) && data.angajati.length) {
      angajati = data.angajati.map(a => ({
        id: a.id || 1, nume: a.nume || '', functie: a.functie || '', dept: a.dept || 'tehnic',
        fix: a.fix || null,
        months: Array.from({length:12}, (_, i) => ({
          oreP: a.months?.[i]?.oreP ?? 160, oreR: a.months?.[i]?.oreR ?? 0,
          oreAAA: a.months?.[i]?.oreAAA ?? 0, oreEAA: a.months?.[i]?.oreEAA ?? 0,
          venitR: a.months?.[i]?.venitR ?? 0, alteVenitR: a.months?.[i]?.alteVenitR ?? 0,
          salR: a.months?.[i]?.salR ?? 0, bonR: a.months?.[i]?.bonR ?? 0,
          alteBonR: a.months?.[i]?.alteBonR ?? 0, cardR: a.months?.[i]?.cardR ?? 0,
          taxeR: a.months?.[i]?.taxeR ?? 0, zileP: a.months?.[i]?.zileP ?? 22, zileR: a.months?.[i]?.zileR ?? 0,
          zileLib: a.months?.[i]?.zileLib ?? 0, venitAng: a.months?.[i]?.venitAng ?? 0
        }))
      }));
    }
    
    // CashFlow — new structure
    if (typeof data.cfSoldInitial === 'number') cfSoldInitial = data.cfSoldInitial;
    if (Array.isArray(data.cfMonths)) {
      for (let i = 0; i < 12; i++) {
        if (data.cfMonths[i]) {
          cfMonths[i] = { facturat: data.cfMonths[i].facturat || 0, platit: data.cfMonths[i].platit || 0, achizitiiPiese: data.cfMonths[i].achizitiiPiese || 0, nManop: data.cfMonths[i].nManop || 0, artNyer: data.cfMonths[i].artNyer || 0, eaaManop: data.cfMonths[i].eaaManop || 0 };
        }
      }
    }
    // CashFlow Sinteza
    if (Array.isArray(data.cfSinteza)) {
      for (let i = 0; i < 12; i++) {
        if (data.cfSinteza[i]) Object.assign(cfSinteza[i], data.cfSinteza[i]);
      }
    }
    if (Array.isArray(data.cfAchizitii)) cfAchizitii = data.cfAchizitii;
    
    // Egyéb
    if (data.planTargets) Object.assign(planTargets, data.planTargets);
    if (data.kapacitas) { Object.assign(kapacitas, data.kapacitas); }
    if (Array.isArray(data.munkanapok) && data.munkanapok.length === 12) munkanapok = data.munkanapok;
    if (data.nextFacturaId) nextFacturaId = data.nextFacturaId;
    if (data.nextAngajatId) nextAngajatId = data.nextAngajatId;
    if (Array.isArray(data.munkaordine)) munkaordine = data.munkaordine;
    if (data.nextWoId) nextWoId = data.nextWoId;
    
    // UI state
    if (data.ui) {
      if (data.ui.period) period = data.ui.period;
      if (data.ui.currentPage) currentPage = data.ui.currentPage;
      if (data.ui.currentDept) currentDept = data.ui.currentDept;
      // currentMonth: mindig az aktuális hónap indításkor
      if (data.ui.showAnualStats) showAnualStats = data.ui.showAnualStats;
    }
    
    console.log('📂 Loaded saved data from', data.savedAt);
    return true;
  } catch(e) { console.warn('Load failed:', e); return false; }
}

// Auto-save: minden módosítás után
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveAllData, 300);
}

// === INIT ===
window.openAsmImport = openAsmImport;
window.closeAsm = closeAsm;
window.handleAsmFiles = handleAsmFiles;
window.tryBuildPreview = tryBuildPreview;
window.applyAsmData = applyAsmData;
setInterval(updateTimestamp, 60000);
updateTimestamp();

// LOAD SAVED DATA
loadAllData();

// FORCE INITIAL RENDER
console.log('🟢 Initializing... Month:', months[currentMonth]);
renderSumar();
render();
console.log('✅ Init complete!');
