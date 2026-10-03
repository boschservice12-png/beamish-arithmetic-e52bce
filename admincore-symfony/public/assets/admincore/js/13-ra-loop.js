
/* ==== RA_LOOP — a szervezési tábla működési rétege ====
   Öt új nézet az admin-sávban: Napi kör · Működési hurok · Szerepszétválasztás ·
   Besorolás A–D · Árva szabályok. A window.ADMIN-t bővíti, nem írja felül. */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var L={loop:[],sep:[],sepx:[],cls:[],reads:[],dont:[]};
var view2='pult', who=null, today=new Date().toISOString().slice(0,10);
var BL=['BL-01 nincs alkatrész','BL-02 nincs szerszám vagy adapter','BL-03 nincs mérőeszköz',
'BL-04 nincs gyártói dokumentáció','BL-05 nincs írásos jóváhagyás','BL-06 biztonsági kockázat',
'BL-07 nincs kiosztott munka','BL-08 belső feladat vagy oktatás','BL-09 saját garanciális visszajavítás',
'BL-10 más részlegre várás'];
var MENU2=[['pult','Vezetői pult','Panou de conducere'],['azi','Napi kör','Rondul zilnic'],['loop','Működési hurok','Bucla operațională'],
['sep','Szerepszétválasztás','Separarea rolurilor'],['clasa','Besorolás A–D','Clasificare A–D'],
['arva','Árva szabályok','Reguli fără gazdă']];

function A(){return (window.ADMIN&&window.ADMIN.data)||{};}
function sb(){return window.RA_SB&&window.RA_SB.client;}
function lang(){return window.appLang||'hu';}
function dept(c){return (A().depts||[]).find(function(d){return d.dept_code===c;})||{};}
function loopOf(c){return L.loop.find(function(x){return x.dept_code===c;});}
function empName(id){var e=(A().emps||[]).find(function(x){return x.id===id;});return e?e.name:null;}
function card(t,inner){return '<div class="adm-card"><h3>'+esc(t)+'</h3>'+inner+'</div>';}
function table(head,rows){return '<table class="adm-t"><thead><tr>'+head.map(function(x){return '<th>'+esc(x)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';}
function td(v){return '<td>'+v+'</td>';}
function daysAgo(d){return d?Math.floor((Date.now()-new Date(d))/86400000):null;}

async function loadExtra(){
  var s=sb(); if(!s)return;
  var q=async function(t,sel){try{var r=await s.from(t).select(sel||'*');return r.data||[];}catch(e){return [];}};
  L.loop=await q('admin_dept_loop');
  L.sep =await q('admin_dept_separation');
  L.sepx=await q('admin_dept_sep_exception');
  L.cls =await q('admin_clasificare');
  L.reads=await q('hr_document_reads','doc_code,doc_version');
  L.dont=await q('admin_napi_dontes');
  try{var gj=await s.rpc('f_gazdasagi_jelentes_utolso'); L.gazd=(gj.data||[])[0]||null;}catch(e){L.gazd=null;}
  try{var tu=await s.from('v_termeles_utolso_ho').select('*'); L.term=tu.data||[];}catch(e){L.term=[];}
  /* egy számolás: az adatbázis f_elo_szamlalo — ugyanaz, amit a szervezési tábla kártyái mutatnak */
  L.live={}; L.liveMeres={}; L.liveErr=null;
  try{var lv=await s.rpc('f_elo_szamlalo_iroda'); if(lv.error)throw lv.error;
    (lv.data||[]).forEach(function(x){L.live[x.dept_code]=x.db; L.liveMeres[x.dept_code]=x.meres;});}
  catch(e){L.liveErr=(e&&e.message)||String(e);}
  L.felv=null;
  try{var fv=await s.rpc('f_felveteli_allapot_iroda'); if(!fv.error)L.felv=(fv.data||[])[0]||null;}catch(e){}
  L.cls.sort(function(a,b){return (a.sorrend||0)-(b.sorrend||0);});
}

/* ---- élő számlálók ---- */
function liveCount(code){
  /* nincs saját képlet a böngészőben: a szám az adatbázisból jön (f_elo_szamlalo) */
  if(L.live&&Object.prototype.hasOwnProperty.call(L.live,code)) return L.live[code];
  return null;
}

/* ---- kadencia ---- */
function fw(d){var x=new Date(d),w=x.getDay();if(w===6)x.setDate(x.getDate()+2);if(w===0)x.setDate(x.getDate()+1);return x;}
function fires(cad,d){var w=d.getDay();
  if(cad==='napi')return w>=1&&w<=5;
  if(cad==='heti')return w===1;
  if(cad==='havi')return d.toDateString()===fw(new Date(d.getFullYear(),d.getMonth(),1)).toDateString();
  return d.toDateString()===fw(new Date(d.getFullYear(),Math.floor(d.getMonth()/3)*3,1)).toDateString();}
function dueToday(cad){var d=new Date(today+'T12:00:00');return fires(cad,d);}

/* ================= 1. NAPI KÖR ================= */
function vAzi(){
  var a=A(), leaders={};
  (a.depts||[]).forEach(function(d){if(d.leader_id){var n=empName(d.leader_id); if(n)(leaders[n]=leaders[n]||[]).push(d.dept_code);}});
  var names=Object.keys(leaders).sort();
  if(!names.length) return '<div class="adm-hint">Nincs kitöltött felelős az alosztályokon (admin_dept.leader_id).</div>';
  if(!who||names.indexOf(who)<0) who=names[0];

  var mine=(leaders[who]||[]).map(function(c){var lo=loopOf(c);return lo?Object.assign({},lo,{d:dept(c)}):null;})
    .filter(function(x){return x && dueToday(x.cadenta);});
  mine.forEach(function(m){m.n=liveCount(m.dept_code);});
  mine.sort(function(x,y){var hx=(x.prag&&/abszolút/i.test(x.prag)&&x.n>0)?1:0,hy=(y.prag&&/abszolút/i.test(y.prag)&&y.n>0)?1:0;
    return hy-hx || ((y.n>0)-(x.n>0)) || x.dept_code.localeCompare(y.dept_code);});

  var decided={};
  L.dont.filter(function(x){return x.datum===today&&x.eldontotte===who;}).forEach(function(x){decided[x.dept_code]=x;});
  var open=mine.reduce(function(s,m){return s+(m.n>0?m.n:0);},0);
  var done=mine.filter(function(m){return decided[m.dept_code];}).length;

  var h='<div class="adm-hint">A mai esedékes köröd. Minden kártya döntést kér: <b>rendben</b> csak nyitott tétel nélkül, különben <b>intézkedés</b>, <b>akadály</b> vagy indokolt <b>halasztás</b>. Ok, felelős és határidő nélkül nincs lezárás. A napló: <code>admin_napi_dontes</code>.</div>';
  h+='<div class="adm-tools">'+names.map(function(n){return '<button type="button" class="adm-btn'+(n===who?'':' ghost')+'" data-lw="'+esc(n)+'">'+esc(n)+'</button>';}).join(' ')+'</div>';
  h+='<div class="adm-stats"><div><b>'+mine.length+'</b>Esedékes</div><div class="'+(open?'bad':'')+'"><b>'+open+'</b>Nyitott tétel</div><div><b>'+done+' / '+mine.length+'</b>Lezárva</div></div>';

  if(!mine.length) return h+card('Ma nincs esedékes osztály','<div class="adm-hint">A hét vagy a hónap fordulóján tér vissza.</div>');

  h+=mine.map(function(m){
    var dec=decided[m.dept_code], lock=/abszolút/i.test(m.prag||'')&&m.n>0;
    var t='<div class="adm-nc" style="border-left:3px solid '+(lock?'#D81F26':'#ccc')+'">'+
      '<b>'+esc(m.dept_code)+' · '+esc(m.d.title_hu||'')+'</b> '+
      '<span class="adm-tag'+(m.n>0?' bad':(m.n===0?' ok':''))+'">'+(m.n===null?'nincs forrás':m.n+' nyitott')+'</span>'+
      '<div>'+esc(m.kpi_primar||'')+'</div>'+
      (L.liveMeres&&L.liveMeres[m.dept_code]?'<div><small>Élő szám: '+esc(L.liveMeres[m.dept_code])+'</small></div>':'')+
      (m.dept_code==='2.2'?'<div class="adm-tools"><button type="button" class="adm-btn ghost" data-intake="azi">🎙 Felvételi lapok</button></div>':'')+
      '<div><small>Honnan: '+esc(m.sursa||'')+' · Küszöb: '+esc(m.prag||'—')+' · '+esc(m.cadenta)+'</small></div>'+
      '<div class="adm-hint" style="margin:8px 0">'+esc(m.la_abatere||'')+'</div>';
    if(dec){
      t+='<div class="adm-tag '+(dec.tipus==='halasztas'&&dec.halasztas_sorszam>=2?'bad':'ok')+'">'+esc(dec.tipus)+'</div> <small>'+esc(dec.szoveg)+
         (dec.felelos?' — '+esc(dec.felelos)+(dec.hatarido?', '+esc(dec.hatarido):''):'')+'</small>'+
         (dec.tipus==='halasztas'&&dec.halasztas_sorszam>=2?'<div class="adm-warn">Második halasztás — a 7.3 napirendjére került.</div>':'');
    } else {
      t+='<div class="adm-tools">'+
        '<button type="button" class="adm-btn ghost" data-ld="rendben|'+esc(m.dept_code)+'"'+(lock?' disabled':'')+'>Rendben</button> '+
        '<button type="button" class="adm-btn" data-ld="intezkedes|'+esc(m.dept_code)+'">Intézkedem</button> '+
        '<button type="button" class="adm-btn ghost" data-ld="akadaly|'+esc(m.dept_code)+'">Akadály</button> '+
        '<button type="button" class="adm-btn ghost" data-ld="halasztas|'+esc(m.dept_code)+'">Halasztás</button></div>'+
        (lock?'<div class="adm-warn">Abszolút küszöb és '+m.n+' nyitott tétel — a „rendben" itt nem választható.</div>':'');
    }
    return t+'</div>';
  }).join('');

  var rest=mine.length-done;
  h+='<div class="adm-tools">'+(rest>0?'<span class="adm-warn">'+rest+' kártya vár döntésre. A nap addig nem zárható.</span>'
      :'<span class="adm-tag ok">Minden kártya lezárva.</span>')+'</div>';
  var hal=L.dont.filter(function(x){return x.tipus==='halasztas'&&x.halasztas_sorszam>=2;});
  if(hal.length) h+=card('Második halasztások — 7.3 napirend',
    table(['Alosztály','Ki','Dátum','Indok'],hal.map(function(x){return '<tr>'+td('<b>'+esc(x.dept_code)+'</b>')+td(esc(x.eldontotte))+td(esc(x.datum))+td(esc(x.szoveg))+'</tr>';})));
  return h;
}

async function saveDecision(tipus,code){
  var s=sb(); if(!s){alert('Nincs kapcsolat.');return;}
  var lo=loopOf(code)||{}, d=dept(code);
  var m=document.createElement('div'); m.className='adm-back';
  var emps=(A().emps||[]).map(function(e){return '<option>'+esc(e.name)+'</option>';}).join('');
  var body='';
  if(tipus==='intezkedes') body='<label>Felelős<select id="ldR">'+emps+'</select></label>'+
    '<label>Határidő<input id="ldD" type="date" value="'+new Date(Date.now()+7*864e5).toISOString().slice(0,10)+'"></label>'+
    '<label class="full">Mit teszünk<textarea id="ldT" rows="3" placeholder="Egy mondat. Ez kerül a naplóba."></textarea></label>';
  if(tipus==='akadaly') body='<label>Akadály kódja<select id="ldB">'+BL.map(function(b){return '<option>'+esc(b)+'</option>';}).join('')+'</select></label>'+
    '<label class="full">Megjegyzés<textarea id="ldT" rows="3" placeholder="Mi hiányzik, kitől várjuk."></textarea></label>';
  if(tipus==='halasztas') body='<label class="full">Halasztás indoka — kötelező<textarea id="ldT" rows="3" placeholder="Miért nem ma."></textarea></label>'+
    '<div class="adm-hint">A halasztás nyoma marad. A második ugyanezen az alosztályon a 7.3 napirendjére kerül.</div>';
  if(tipus==='rendben') body='<label class="full">Megjegyzés<textarea id="ldT" rows="2">Nincs nyitott tétel, megnézve.</textarea></label>';
  m.innerHTML='<div class="adm-modal"><h2>'+esc(code+' · '+(d.title_hu||''))+'</h2>'+
    '<div class="adm-hint full">'+esc(lo.la_abatere||'')+'</div>'+body+
    '<div id="ldErr" class="adm-warn"></div><div class="adm-f">'+
    '<button type="button" class="adm-btn ghost" id="ldC">Mégse</button>'+
    '<button type="button" class="adm-btn" id="ldS">Rögzítés a naplóba</button></div></div>';
  document.body.appendChild(m);
  var ta=m.querySelector('#ldT'); if(ta){ if(!ta.id)ta.id='ldT';
    var mb=document.createElement('div'); mb.className='full'; mb.innerHTML=micButton('ldT');
    ta.parentNode.parentNode.insertBefore(mb, ta.parentNode.nextSibling); }
  m.querySelector('#ldC').onclick=function(){if(MIC.rec){try{MIC.rec.stop();}catch(e){}} m.remove();};
  m.querySelector('#ldS').onclick=async function(){
    var txt=(m.querySelector('#ldT').value||'').trim();
    if(!txt){m.querySelector('#ldErr').textContent='A szöveg kötelező — ok nélkül nincs lezárás.';return;}
    var prev=L.dont.filter(function(x){return x.dept_code===code&&x.eldontotte===who&&x.tipus==='halasztas';}).length;
    var row={datum:today,dept_code:code,eldontotte:who,tipus:tipus,szoveg:txt,
      halasztas_sorszam:tipus==='halasztas'?prev+1:0,
      felelos:tipus==='intezkedes'?m.querySelector('#ldR').value:null,
      hatarido:tipus==='intezkedes'?m.querySelector('#ldD').value:null,
      bl_kod:tipus==='akadaly'?m.querySelector('#ldB').value:null};
    var r=await s.from('admin_napi_dontes').upsert(row,{onConflict:'datum,dept_code,eldontotte'}).select().single();
    if(r.error){m.querySelector('#ldErr').textContent=r.error.message;return;}
    L.dont=L.dont.filter(function(x){return !(x.datum===today&&x.dept_code===code&&x.eldontotte===who);});
    L.dont.push(r.data); m.remove(); window.ADMIN.render();
  };
}

/* ================= 2. MŰKÖDÉSI HUROK ================= */
function vLoop(){
  if(!L.loop.length) return '<div class="adm-hint">Nincs működési réteg (admin_dept_loop).</div>';
  var broken=[];
  L.loop.forEach(function(l){(l.output_to||[]).forEach(function(o){
    var t=loopOf(o); if(!t||(t.input_from||[]).indexOf(l.dept_code)<0) broken.push([l.dept_code,o]);});});
  var h='<div class="adm-hint">A tábla megmondja, KI MIT termel. Ez a réteg azt, HOGYAN kapcsolódik és MIKOR nézzük meg. Minden kimenetnek szerepelnie kell a címzett bemenetei között — egyoldalú kapcsolat azt jelenti, hogy valaki termel valamit, amit senki nem vár.</div>';
  var cad={};L.loop.forEach(function(l){cad[l.cadenta]=(cad[l.cadenta]||0)+1;});
  h+='<div class="adm-stats"><div><b>'+L.loop.length+'</b>Osztály a hurokban</div>'+
     '<div><b>'+(cad.napi||0)+'</b>Napi</div><div><b>'+(cad.heti||0)+'</b>Heti</div>'+
     '<div><b>'+(cad.havi||0)+'</b>Havi</div><div><b>'+(cad.negyedeves||0)+'</b>Negyedéves</div>'+
     '<div class="'+(broken.length?'bad':'')+'"><b>'+broken.length+'</b>Szakadás</div></div>';
  if(broken.length) h+=card('Egyoldalú kapcsolatok',table(['Küldő','Címzett','Hiba'],
    broken.map(function(b){return '<tr>'+td('<b>'+esc(b[0])+'</b>')+td(esc(b[1]))+td('a címzett nem jelöli bemenetként')+'</tr>';})));
  ['napi','heti','havi','negyedeves'].forEach(function(c){
    var rows=L.loop.filter(function(l){return l.cadenta===c;}).sort(function(a,b){return a.dept_code.localeCompare(b.dept_code);})
      .map(function(l){var d=dept(l.dept_code), n=liveCount(l.dept_code);
        return '<tr>'+td('<b>'+esc(l.dept_code)+'</b>')+td(esc(d.title_hu||''))+td(esc(empName(d.leader_id)||'— nincs —'))+
          td(esc(l.kpi_primar||'')+(n!==null?' <span class="adm-tag'+(n>0?' bad':' ok')+'">'+n+'</span>':''))+
          td('<small>'+esc(l.sursa||'')+'</small>')+td('<small>'+esc(l.prag||'—')+'</small>')+
          td('<small>'+esc((l.input_from||[]).join(', ')||'—')+' → '+esc((l.output_to||[]).join(', ')||'—')+'</small>')+'</tr>';});
    if(rows.length) h+=card(({napi:'Napi kör — 10 perc',heti:'Heti kör — 30 perc',havi:'Havi kör — 90 perc',negyedeves:'Negyedéves kör'})[c]+' · '+rows.length,
      table(['Kód','Alosztály','Felelős','Elsődleges mutató','Honnan','Küszöb','Bemenet → kimenet'],rows));
  });
  return h;
}

/* ================= 3. SZEREPSZÉTVÁLASZTÁS ================= */
function vSep(){
  if(!L.sep.length) return '<div class="adm-hint">Nincs szabálykészlet (admin_dept_separation).</div>';
  var viol=[];
  L.sep.forEach(function(s){var a=dept(s.dept_a),b=dept(s.dept_b);
    if(a.leader_id&&a.leader_id===b.leader_id){
      var x=L.sepx.find(function(e){return e.dept_a===s.dept_a&&e.dept_b===s.dept_b&&e.lejar>=today;});
      viol.push({s:s,ki:empName(a.leader_id),x:x});}});
  var h='<div class="adm-hint">Aki csinálja, nem veszi át. A szabály dönt, nem a kényelem — ha a szétválasztás kis létszám miatt nem tartható, az kivétel, lejárati dátummal és kompenzáló kontrollal, nem hallgatólagos gyakorlat.</div>';
  h+='<div class="adm-stats"><div><b>'+L.sep.length+'</b>Szabály</div>'+
     '<div class="'+(viol.filter(function(v){return !v.x;}).length?'bad':'')+'"><b>'+viol.filter(function(v){return !v.x;}).length+'</b>Sérül</div>'+
     '<div><b>'+L.sepx.filter(function(e){return e.lejar>=today;}).length+'</b>Aktív kivétel</div></div>';
  h+=card('A szabályok',table(['Nem lehet ugyanaz','Indok','Forrás','Állapot'],L.sep.map(function(s){
    var v=viol.find(function(x){return x.s===s;});
    var st=!v?'<span class="adm-tag ok">tartva</span>':(v.x?'<span class="adm-tag warn">kivétel, lejár '+esc(v.x.lejar)+'</span>':'<span class="adm-tag bad">SÉRÜL — '+esc(v.ki)+'</span>');
    return '<tr>'+td('<b>'+esc(s.dept_a+' ↔ '+s.dept_b)+'</b>')+td(esc(s.indok_hu))+td('<small>'+esc(s.forras)+'</small>')+td(st)+'</tr>';})));
  var lead={}; (A().depts||[]).forEach(function(d){var n=empName(d.leader_id); if(n)(lead[n]=lead[n]||[]).push(d.dept_code);});
  h+=card('Terhelés felelősönként',table(['Felelős','Osztály','napi','heti','havi','negyedéves','Kódok'],
    Object.keys(lead).sort(function(a,b){return lead[b].length-lead[a].length;}).map(function(n){
      var c={napi:0,heti:0,havi:0,negyedeves:0};
      lead[n].forEach(function(k){var l=loopOf(k); if(l)c[l.cadenta]++;});
      return '<tr>'+td('<b>'+esc(n)+'</b>')+td('<b>'+lead[n].length+'</b>')+td(c.napi)+td(c.heti)+td(c.havi)+td(c.negyedeves)+td('<small>'+esc(lead[n].sort().join(', '))+'</small>')+'</tr>';})));
  return h;
}

/* ================= 4. BESOROLÁS A–D ================= */
function clsOf(k1,k2,k3,asc,itn){
  if(k1===null||k2===null||k3===null)return null;
  if(k2===false)return 'A'; if(k3===false)return 'B'; if(k1===false)return 'B';
  if(asc||itn)return 'D'; return 'C';}
function vClasa(){
  var a=A();
  var h='<div class="adm-hint">Nem „céghiba vagy emberhiba" — <b>három mérés, és abból jön ki az osztály</b>. A sorrend kötött, a rendszer számolja. Kitöltetlen kapu = nincs ítélet; nem esik vissza semmire.</div>';
  h+=card('A három kapu',table(['Kapu','Kérdés','Ha NEM'],[
    '<tr>'+td('<b>K1</b>')+td('Bizonyított-e a vétkesség és az okozati összefüggés? (fotó, mérés, tanú, munkalap)')+td('<b>B</b> — a gyanú nem bizonyíték')+'</tr>',
    '<tr>'+td('<b>K2</b>')+td('A szolgálat szokásos kockázatán KÍVÜL van-e? (berágódott csavar, korrodált menet = kockázat)')+td('<b>A</b> — vállalt kockázat')+'</tr>',
    '<tr>'+td('<b>K3</b>')+td('Volt-e leírt ÉS oktatott ÉS aláírt szabály, értett nyelven?')+td('<b>B</b> — rendszerhiba')+'</tr>']));
  if(L.cls.length) h+=card('A négy osztály',table(['','Megnevezés','Ki viseli','Teendő','Jogalap'],
    L.cls.map(function(c){return '<tr>'+td('<b style="font-size:18px">'+esc(c.clasa)+'</b>')+td('<b>'+esc(c.nev_hu)+'</b><br><small>'+esc(c.nume_ro)+'</small>')+
      td(esc(c.viseli_hu))+td(esc(c.teendo_hu))+td('<small>'+esc(c.jogalap)+'</small>')+'</tr>';})));
  var by={A:0,B:0,C:0,D:0,'—':0};
  (a.ncs||[]).forEach(function(n){var c=n.clasa||clsOf(n.poarta_k1===undefined?null:n.poarta_k1,n.poarta_k2===undefined?null:n.poarta_k2,n.poarta_k3===undefined?null:n.poarta_k3,n.ascundere,n.intentie); by[c||'—']++;});
  h+='<div class="adm-stats"><div><b>'+by.A+'</b>A · kockázat</div><div><b>'+by.B+'</b>B · rendszerhiba</div>'+
     '<div><b>'+by.C+'</b>C · mulasztás</div><div class="'+(by.D?'bad':'')+'"><b>'+by.D+'</b>D · eltitkolás</div>'+
     '<div class="'+(by['—']?'bad':'')+'"><b>'+by['—']+'</b>Kapuk kitöltetlen</div></div>';
  if(by['—']) h+='<div class="adm-warn">'+by['—']+' nemmegfelelőségnél nincs kitöltve mind a három kapu, ezért nincs besorolás. Ítélet csak kitöltött kapukkal születhet — nyisd meg a lapot és mérd meg.</div>';
  h+=card('Besorolás-próba — mielőtt rögzítesz',
    '<div class="adm-hint">Állítsd be a három kaput, és nézd meg, mi jön ki. Ez ugyanaz a logika, amit az adatbázis futtat.</div>'+
    '<div class="adm-tools" id="clsCalc">'+
    ['k1|K1 vétkesség bizonyított','k2|K2 kockázaton kívül','k3|K3 volt oktatott szabály','asc|Eltitkolás','itn|Szándék']
      .map(function(x){var p=x.split('|');return '<label style="margin-right:14px"><input type="checkbox" data-cls="'+p[0]+'"> '+esc(p[1])+'</label>';}).join('')+
    '</div><div id="clsOut" class="adm-hint"></div>');
  return h;
}

/* ================= 5. ÁRVA SZABÁLYOK ================= */
function vArva(){
  var a=A();
  var act=(a.docs||[]).filter(function(d){return d.is_active;});
  var orphan=act.filter(function(d){return !d.kontroll_dept_code||!d.kontroll_kadencia||!(d.kontroll_mutato||'').trim();});
  var nocode=act.filter(function(d){return !d.doc_code;});
  var h='<div class="adm-hint">Egy szabály, amit senki nem ellenőriz, olyan mint egy javítás végellenőrzés nélkül. Minden hatályos lapnak meg kell mondania: <b>melyik osztály kadenciájában</b> nézzük, és <b>mit</b> mérünk rajta. Adatbázis-trigger tiltja az új lap hatályosítását enélkül.</div>';
  h+='<div class="adm-stats"><div><b>'+act.length+'</b>Hatályos lap</div>'+
     '<div class="'+(orphan.length?'bad':'')+'"><b>'+orphan.length+'</b>Nincs ellenőrző gazda</div>'+
     '<div class="'+(nocode.length?'bad':'')+'"><b>'+nocode.length+'</b>Nincs kódja</div></div>';
  var byD={}; orphan.forEach(function(d){var k=d.dept_code||'—';(byD[k]=byD[k]||[]).push(d);});
  h+=card('Hol állnak az árvák',table(['Alosztály','Felelős','Db','Ebből kód nélkül'],
    Object.keys(byD).sort().map(function(k){var d=dept(k);
      return '<tr>'+td('<b>'+esc(k)+'</b> '+esc(d.title_hu||''))+td(esc(empName(d.leader_id)||'—'))+
        td('<b>'+byD[k].length+'</b>')+td(byD[k].filter(function(x){return !x.doc_code;}).length)+'</tr>';})));
  h+=card('Akiknek van gazdája — a hurok zárva',table(['Kód','Lap','Ellenőrzi','Kadencia','Mit mér'],
    act.filter(function(d){return d.kontroll_dept_code;}).sort(function(x,y){return (x.kontroll_dept_code||'').localeCompare(y.kontroll_dept_code||'');})
    .map(function(d){return '<tr>'+td('<b>'+esc(d.doc_code||'')+'</b>')+td('<small>'+esc((d.title||'').slice(0,60))+'</small>')+
      td('<b>'+esc(d.kontroll_dept_code)+'</b> '+esc(empName(dept(d.kontroll_dept_code).leader_id)||''))+
      td(esc(d.kontroll_kadencia||''))+td('<small>'+esc(d.kontroll_mutato||'')+'</small>')+'</tr>';})));
  h+=card('Árvák — kódozás és ellenőrzési hely kijelölendő',table(['Lap','Típus','Tulajdonos','Kód'],
    orphan.slice(0,60).map(function(d){return '<tr>'+td('<small>'+esc((d.title||'').slice(0,70))+'</small>')+td(esc(d.doc_type||''))+
      td(esc(d.dept_code||'—'))+td(d.doc_code?esc(d.doc_code):'<span class="adm-tag bad">nincs</span>')+'</tr>';})));
  return h;
}


/* ================= MIKROFON — bebeszélés ================= */
var MIC={rec:null,target:null};
function micSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition);}
function micButton(id){
  if(!micSupported())return '<div class="adm-hint">A böngésző nem támogatja a bebeszélést. Chrome vagy Edge kell hozzá.</div>';
  return '<div class="adm-tools"><button type="button" class="adm-btn ghost" data-mic="'+id+'" data-miclang="ro-RO">🎤 Bebeszélés · RO</button> '+
         '<button type="button" class="adm-btn ghost" data-mic="'+id+'" data-miclang="hu-HU">🎤 Bebeszélés · HU</button> '+
         '<span id="micS-'+id+'" class="adm-hint" style="display:inline-block;margin-left:8px"></span></div>';
}
function micToggle(btn){
  var id=btn.getAttribute('data-mic'), lg=btn.getAttribute('data-miclang');
  var el=document.getElementById(id), st=document.getElementById('micS-'+id);
  if(!el)return;
  if(MIC.rec){ try{MIC.rec.stop();}catch(e){} MIC.rec=null; if(st)st.textContent=''; btn.classList.remove('on'); return; }
  var R=window.SpeechRecognition||window.webkitSpeechRecognition;
  var r=new R(); r.lang=lg; r.interimResults=true; r.continuous=true;
  var base=el.value?el.value+' ':'';
  r.onstart=function(){ if(st)st.textContent='hallgatlak…'; btn.classList.add('on'); };
  r.onerror=function(ev){ if(st)st.textContent='mikrofon hiba: '+ev.error; };
  r.onend=function(){ MIC.rec=null; if(st)st.textContent=''; btn.classList.remove('on'); };
  r.onresult=function(ev){
    var fin='',itm='';
    for(var i=0;i<ev.results.length;i++){ var t=ev.results[i][0].transcript;
      if(ev.results[i].isFinal) fin+=t+' '; else itm+=t; }
    el.value=base+fin+itm;
    el.dispatchEvent(new Event('input',{bubbles:true}));
  };
  MIC.rec=r; try{r.start();}catch(e){ if(st)st.textContent='nem indult: '+e.message; MIC.rec=null; }
}

/* ================= VEZETŐI PULT ================= */
function vPult(){
  var a=A(), d0=new Date(today+'T12:00:00');
  var leaders={}; (a.depts||[]).forEach(function(d){var n=empName(d.leader_id); if(n)(leaders[n]=leaders[n]||[]).push(d.dept_code);});
  var names=Object.keys(leaders).sort();

  var lejartNC=(a.ncs||[]).filter(function(n){return n.remediat!==true&&n.termen&&n.termen<today;});
  var nyitottNC=(a.ncs||[]).filter(function(n){return n.status==='deschisa';});
  var act=(a.docs||[]).filter(function(x){return x.is_active;});
  var setR={}; L.reads.forEach(function(r){setR[r.doc_code]=1;});
  var alairatlan=act.filter(function(x){return x.doc_code&&!setR[x.doc_code];}).length
                + act.filter(function(x){return !x.doc_code;}).length;
  var arva=act.filter(function(x){return !x.kontroll_dept_code||!x.kontroll_kadencia||!(x.kontroll_mutato||'').trim();}).length;
  var sepV=0; L.sep.forEach(function(sx){var A1=dept(sx.dept_a),B1=dept(sx.dept_b);
    if(A1.leader_id&&A1.leader_id===B1.leader_id&&!L.sepx.find(function(e){return e.dept_a===sx.dept_a&&e.dept_b===sx.dept_b&&e.lejar>=today;}))sepV++;});
  var brk=0; L.loop.forEach(function(l){(l.output_to||[]).forEach(function(o){var t=loopOf(o);
    if(!t||(t.input_from||[]).indexOf(l.dept_code)<0)brk++;});});
  var hal2=L.dont.filter(function(x){return x.tipus==='halasztas'&&x.halasztas_sorszam>=2;});
  if(L.live&&L.live['1.3']!=null) alairatlan=L.live['1.3'];
  var FV=L.felv||{nyitott:0,ellenorzesre_var:0,ma_lapok:0,ma_alairt:0,elsore_teljes_pct:null,legregebbi_nyitott:null};

  var esed=0,nyit=0,lez=0, sorok=[];
  names.forEach(function(n){
    var mine=(leaders[n]||[]).map(loopOf).filter(function(x){return x&&dueToday(x.cadenta);});
    var o=0; mine.forEach(function(m){var c=liveCount(m.dept_code); if(c>0)o+=c;});
    var dn=L.dont.filter(function(x){return x.datum===today&&x.eldontotte===n;}).length;
    esed+=mine.length; nyit+=o; lez+=Math.min(dn,mine.length);
    if(mine.length) sorok.push('<tr>'+td('<b>'+esc(n)+'</b>')+td(mine.length)+td(o?'<span class="adm-warn">'+o+'</span>':'0')+
      td(dn+' / '+mine.length)+td(dn>=mine.length?'<span class="adm-tag ok">lezárva</span>':'<span class="adm-tag warn">vár</span>')+
      td('<small>'+esc(mine.map(function(m){return m.dept_code;}).join(', '))+'</small>')+'</tr>');
  });

  var h='<div class="adm-hint">Egy képernyő, amiről el lehet indítani a napot. Minden szám élő, és mindegyik mögött ott a forrás. Ami nincs mérve, az itt sem jelenik meg kitalált értékkel.</div>';
  h+='<div class="adm-stats">'+
    '<div class="'+(nyit?'bad':'')+'"><b>'+nyit+'</b>Nyitott tétel ma</div>'+
    '<div class="'+(lejartNC.length?'bad':'')+'"><b>'+lejartNC.length+'</b>Lejárt intézkedés</div>'+
    '<div class="'+(alairatlan?'bad':'')+'"><b>'+alairatlan+'</b>Aláírás nélküli lap</div>'+
    '<div class="'+(arva?'bad':'')+'"><b>'+arva+'</b>Árva szabály</div>'+
    '<div class="'+(sepV?'bad':'')+'"><b>'+sepV+'</b>Szétválasztás sérül</div>'+
    '<div class="'+(brk?'bad':'')+'"><b>'+brk+'</b>Hurokszakadás</div>'+
    '<div class="'+(hal2.length?'bad':'')+'"><b>'+hal2.length+'</b>2. halasztás</div>'+
    '<div class="'+(FV.nyitott?'bad':'')+'"><b>'+FV.nyitott+'</b>Felvételi lap aláíratlan</div></div>';
  if(L.liveErr) h+='<div class="adm-warn">Az élő számlálók nem töltődtek be ('+esc(L.liveErr)+'). A számok addig nem megbízhatók.</div>';

  var fig=[];
  if(alairatlan) fig.push('<b>'+alairatlan+' hatályos lap aláírás nélkül.</b> Ezek ma senkivel szemben nem érvényesíthetők (art. 243 al. 3) — minden ilyen eset B osztály, a költség a cégen marad.');
  if(lejartNC.length) fig.push('<b>'+lejartNC.length+' megelőző intézkedés lejárt.</b> A hibát megtaláltuk, a megoldást leírtuk — csak nem csinálta meg senki.');
  if(arva) fig.push('<b>'+arva+' hatályos lapnak nincs ellenőrző gazdája.</b> Amit senki nem néz meg, azt nem lehet betartatni.');
  if(brk) fig.push('<b>'+brk+' egyoldalú kapcsolat a hurokban.</b> Valaki termel valamit, amit senki nem vár — vagy vár valamit, amit senki nem termel.');
  if(sepV) fig.push('<b>Szerepszétválasztás sérül '+sepV+' helyen.</b> Kivétel csak lejárati dátummal és kompenzáló kontrollal érvényes.');
  if(FV.nyitott) fig.push('<b>'+FV.nyitott+' felvételi lap nincs aláírva</b>'+(FV.legregebbi_nyitott?' (a legrégebbi: '+esc(FV.legregebbi_nyitott)+')':'')+'. Aláírt lap nélkül a munkalap hiányos — a 2.2 szabálya szerint nem mehet tovább F1-be.');
  if(FV.ellenorzesre_var) fig.push('<b>'+FV.ellenorzesre_var+' aláírt felvételi lap vár ellenőrzésre.</b> A 2.2 „Járműátvétel” feladatkör ellenőrzője zárja le; a felvevő nem ellenőrizheti a sajátját.');
  if(hal2.length) fig.push('<b>'+hal2.length+' kártya másodszor is halasztva.</b> A saját szabályod szerint ezek a 7.3 napirendjére kerülnek.');
  if(fig.length) h+=card('Amire ma oda kell nézni','<ul style="margin:0;padding-left:18px;line-height:1.9">'+fig.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>');
  else h+=card('Amire ma oda kell nézni','<div class="adm-tag ok">Nincs nyitott figyelmeztetés.</div>');

  h+=card('Mai körök felelősönként · '+esed+' esedékes, '+lez+' lezárva',
    sorok.length?table(['Felelős','Esedékes','Nyitott tétel','Döntés','Állapot','Alosztályok'],sorok)
    :'<div class="adm-hint">Ma egyetlen körnek sincs esedékes tétele.</div>');

  if(lejartNC.length) h+=card('Lejárt megelőző intézkedések',
    table(['NC','Határidő','Késés','Miről','Felelős','Alosztály'],lejartNC.sort(function(x,y){return (x.termen||'').localeCompare(y.termen||'');}).map(function(n){
      var kes=Math.floor((d0-new Date(n.termen))/86400000);
      return '<tr>'+td('<b>#'+esc(n.nr_crt)+'</b>')+td(esc(n.termen))+td('<span class="adm-warn">'+kes+' nap</span>')+
        td('<small>'+esc((n.masura_preventiva||n.descriere||'').slice(0,90))+'</small>')+
        td(esc(n.responsabil_remediere||n.angajat||'—'))+td(esc(n.dept_code||'—'))+'</tr>';})));

  var cad={}; L.loop.forEach(function(l){cad[l.cadenta]=(cad[l.cadenta]||0)+1;});
  (function(){
    var g=L.gazd, hu=['jan','feb','márc','ápr','máj','jún','júl','aug','szept','okt','nov','dec'];
    var fmt=function(v){return v==null?'—':Math.round(v).toLocaleString('ro-RO');};
    if(!g){ h+=card('Gazdasági jelentés — pénzügyi panel',
      '<div class="adm-warn">Még nincs beküldött havi jelentés. A pénzügyi panelben az ASM-import után a „Jelentés küldése a rendszerbe" gombbal érkezik ide.</div>'+
      '<div class="adm-tools"><button type="button" class="adm-btn" data-finwin="1">Centru financiar megnyitása ↗</button></div>'); return; }
    var hoL=new Date(g.ho+'T12:00:00'); var lab=hoL.getFullYear()+' '+hu[hoL.getMonth()];
    var rows=(L.term||[]).map(function(t){return '<tr>'+td('<b>'+esc(t.szerelo)+'</b>')+td('<b>'+fmt(t.ore_o2)+'</b>')+td(fmt(t.kuszob))+
      td(t.allapot==='ok'?'<span class="adm-tag ok">'+(t.elteres>=0?'+':'')+fmt(t.elteres)+'</span>':'<span class="adm-tag bad">'+fmt(t.elteres)+'</span>')+
      td(fmt(t.manopera)+' lei')+td(t.lei_per_ora?fmt(t.lei_per_ora):'—')+'</tr>';});
    h+=card('Gazdasági jelentés — '+lab+' <small style="opacity:.6">(pénzügyi panel · '+esc(g.importalta||'')+')</small>',
      '<div class="adm-stats">'+
      '<div><b>'+fmt(g.bevetel_netto)+'</b>Nettó árbevétel</div>'+
      '<div><b>'+(g.munkadij_pct==null?'—':g.munkadij_pct+'%')+'</b>Munkadíj arány</div>'+
      '<div><b>'+(g.fedezet_pct==null?'—':g.fedezet_pct+'%')+'</b>Fedezet</div>'+
      '<div><b>'+fmt(g.normaora_osszes)+'</b>Normaóra</div>'+
      '<div><b>'+(g.realizalt_tarifa?fmt(g.realizalt_tarifa):'—')+'</b>Realizált tarifa lei/ó</div>'+
      '<div class="'+(g.nulla_tarifa_ora>0?'bad':'')+'"><b>'+fmt(g.nulla_tarifa_ora)+'</b>Nulla tarifás óra</div>'+
      '<div class="'+(g.kuszob_alatt>0?'bad':'')+'"><b>'+g.kuszob_alatt+' / '+g.szerelok+'</b>Poszt a küszöb alatt</div></div>'+
      (rows.length?table(['Szerelő','O2 óra','Küszöb','Eltérés','Manopera','lei/óra'],rows):'')+
      '<div class="adm-hint">A lei/óra tarifamix, nem teljesítmény — a poszt mutatója az O2 óra. Küszöb: 140, arányosítva ahol meg van adva.</div>'+
      '<div class="adm-tools"><button type="button" class="adm-btn ghost" data-finwin="1">Centru financiar megnyitása ↗</button></div>');
  })();
  h+=card('A rendszer állapota',table(['Mit','Érték','Forrás'],[
    '<tr>'+td('Alosztály felelőssel')+td('<b>'+(a.depts||[]).filter(function(x){return x.leader_id;}).length+' / '+(a.depts||[]).length+'</b>')+td('<small>admin_dept.leader_id</small>')+'</tr>',
    '<tr>'+td('Kadenciák (napi / heti / havi / negyedéves)')+td('<b>'+(cad.napi||0)+' / '+(cad.heti||0)+' / '+(cad.havi||0)+' / '+(cad.negyedeves||0)+'</b>')+td('<small>admin_dept_loop</small>')+'</tr>',
    '<tr>'+td('Hatályos dokumentum')+td('<b>'+act.length+'</b>')+td('<small>hr_documents.is_active</small>')+'</tr>',
    '<tr>'+td('Ebből ellenőrző gazdával')+td('<b>'+(act.length-arva)+'</b>')+td('<small>kontroll_dept_code</small>')+'</tr>',
    '<tr>'+td('Nyitott nemmegfelelőség')+td('<b>'+nyitottNC.length+'</b>')+td('<small>crai_neconformitati.status</small>')+'</tr>',
    '<tr>'+td('Tudásmodul')+td('<b>'+((a.km||[]).length)+'</b>')+td('<small>crai_knowledge</small>')+'</tr>',
    '<tr>'+td('Felvételi lapok ma (aláírt / összes)')+td('<b>'+FV.ma_alairt+' / '+FV.ma_lapok+'</b>')+td('<small>intake_sheets</small>')+'</tr>',
    '<tr>'+td('2.2 · Elsőre teljes munkalap ma')+td('<b>'+(FV.elsore_teljes_pct==null?'— (nincs mai lap)':FV.elsore_teljes_pct+'%')+'</b>')+td('<small>v_2_2_felveteli_kpi</small>')+'</tr>']));
  h+=card('2.2 · Felvételi lapok','<div class="adm-stats"><div class="'+(FV.nyitott?'bad':'')+'"><b>'+FV.nyitott+'</b>Aláíratlan</div>'+
    '<div class="'+(FV.ellenorzesre_var?'bad':'')+'"><b>'+FV.ellenorzesre_var+'</b>Ellenőrzésre vár</div>'+
    '<div><b>'+FV.ma_lapok+'</b>Ma felvett</div><div><b>'+(FV.elsore_teljes_pct==null?'—':FV.elsore_teljes_pct+'%')+'</b>Elsőre teljes</div></div>'+
    '<div class="adm-tools"><button type="button" class="adm-btn" data-intake="pult">🎙 Felvételi lapok megnyitása</button></div>');

  h+=card('North Star — egy szám, három korlát',
    '<div class="adm-hint">A javaslat: <b>elsőre elfogadott arány (first-pass rate a K6 kapunál)</b>. Vezető mutató, mindenki befolyásolja, és ha nő, magától csökken a visszatérés, az újramunka és a nem számlázható óra. A számlázási arány utólagos és torzítható; a termelt óra mennyiséget mér, nem minőséget.</div>'+
    table(['','Mutató','Állapot'],[
     '<tr>'+td('<b>North Star</b>')+td('Elsőre elfogadott arány (K6)')+td('<span class="adm-tag warn">forrás bekötés alatt — K6 log</span>')+'</tr>',
     '<tr>'+td('Korlát 1')+td('Biztonsági esemény')+td('<span class="adm-tag">cél: 0 abszolút</span>')+'</tr>',
     '<tr>'+td('Korlát 2')+td('B osztályú esetek aránya')+td('<span class="adm-tag warn">csökkenjen — ma '+alairatlan+' aláíratlan lap miatt magas</span>')+'</tr>',
     '<tr>'+td('Korlát 3')+td('Számlázási arány (SZO ÷ O2)')+td('<span class="adm-tag warn">ne romoljon</span>')+'</tr>'])+
    '<div class="adm-hint">Korlátok nélkül minden North Star torzít: az elsőre elfogadott arányt fel lehet vinni azzal is, hogy kevesebbet vállalunk.</div>');
  return h;
}

/* ---- beépülés ---- */
var MAP={pult:vPult,azi:vAzi,loop:vLoop,sep:vSep,clasa:vClasa,arva:vArva};
function injectNav(){
  var n=document.getElementById('adminNav'); if(!n)return;
  if(view2) n.querySelectorAll('[data-adm]').forEach(function(x){x.classList.remove('on');});
  if(n.querySelector('[data-adm2]')){ n.querySelectorAll('[data-adm2]').forEach(function(b){
      b.classList.toggle('on',view2===b.getAttribute('data-adm2'));}); return; }
  var wrap=document.createElement('div');
  wrap.innerHTML='<div class="adm-sep" style="margin:10px 0 4px;padding-top:8px;border-top:1px solid rgba(0,0,0,.08);font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.5">Működés</div>'+
    MENU2.map(function(m){
      var b={pult:'',azi:'',loop:L.loop.length,sep:L.sep.length,clasa:(A().ncs||[]).length,
        arva:(A().docs||[]).filter(function(d){return d.is_active&&!d.kontroll_dept_code;}).length}[m[0]];
      return '<button type="button" class="adm-item'+(view2===m[0]?' on':'')+'" data-adm2="'+m[0]+'"><span>'+esc(lang()==='ro'?m[2]:m[1])+'</span>'+(b!==''&&b!==undefined?'<span class="adm-b">'+b+'</span>':'')+'</button>';}).join('');
  n.appendChild(wrap);
}
function watchNav(){
  var n=document.getElementById('adminNav'); if(!n||n.__loopObs)return; n.__loopObs=1;
  try{ new MutationObserver(function(){ if(!n.querySelector('[data-adm2]')) injectNav(); })
        .observe(n,{childList:true}); }catch(e){ setInterval(function(){ if(!n.querySelector('[data-adm2]')) injectNav(); },800); }
}
function paint(){
  if(!view2)return;
  var root=document.getElementById('adminRoot'); if(!root)return;
  var t=(MENU2.find(function(m){return m[0]===view2;})||[])[lang()==='ro'?2:1]||'';
  root.innerHTML='<div class="adm-h"><span class="adm-eb">MŰKÖDÉS</span><h2>'+esc(t)+'</h2></div>'+MAP[view2]();
}
function hook(){
  if(!window.ADMIN||window.ADMIN.__loop)return false;
  window.ADMIN.__loop=true;
  var oSet=window.ADMIN.setView; window.ADMIN.setView=function(v){view2=null; oSet(v); injectNav();};
  window.RA_LOOP={reload:async function(){try{await loadExtra();}catch(e){} if(window.ADMIN)window.ADMIN.render();}};
  var oLoad=window.ADMIN.load, oRender=window.ADMIN.render;
  window.ADMIN.load=async function(s){ await oLoad(s); try{await loadExtra();}catch(e){console.warn('RA_LOOP',e);} };
  window.ADMIN.render=function(){ oRender(); injectNav(); watchNav(); paint(); };
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-adm2]');
    if(b){e.preventDefault();e.stopPropagation();view2=b.getAttribute('data-adm2');
      document.querySelectorAll('#adminNav [data-adm]').forEach(function(x){x.classList.remove('on');});
      injectNav();paint();return;}
    if(e.target.closest('[data-adm]')){view2=null;setTimeout(injectNav,0);setTimeout(injectNav,60);}
    var w=e.target.closest('[data-lw]'); if(w){who=w.getAttribute('data-lw');paint();return;}
    var mc=e.target.closest('[data-mic]'); if(mc){e.preventDefault();e.stopPropagation();micToggle(mc);return;}
    var d=e.target.closest('[data-ld]'); if(d&&!d.disabled){var p=d.getAttribute('data-ld').split('|');saveDecision(p[0],p[1]);return;}
  },true);
  document.addEventListener('change',function(e){
    if(!e.target.closest||!e.target.closest('#clsCalc'))return;
    var g={};document.querySelectorAll('[data-cls]').forEach(function(c){g[c.getAttribute('data-cls')]=c.checked;});
    var c=clsOf(g.k1,g.k2,g.k3,g.asc,g.itn);
    var why=g.k2===false?'A K2 nem teljesült: a szolgálat szokásos kockázata. A cég viseli, eljárás nélkül.'
      :g.k3===false?'A K3 nem teljesült: nem volt leírt ÉS oktatott ÉS aláírt szabály. A hiányzó dokumentumot megírjuk — a munkavállalót nem éri következmény.'
      :g.k1===false?'A K1 nem teljesült: a vétkesség nem bizonyított. A gyanú nem bizonyíték, a kár a cégen marad.'
      :(g.itn?'Mindhárom kapu teljesült ÉS szándékos — kártérítési és fegyelmi út párhuzamosan.'
      :g.asc?'Mindhárom kapu teljesült ÉS eltitkolás — az eltitkolás önálló, súlyosabb tény (AG2).'
      :'Mindhárom kapu teljesült, eltitkolás és szándék nélkül. Notă de constatare, min. 30 nap.');
    var o=document.getElementById('clsOut');
    if(o)o.innerHTML='<b style="font-size:20px">'+esc(c||'—')+'</b> · '+esc(c?why:'Mindhárom kaput ki kell tölteni. Kitöltetlen kapu = nincs ítélet.');
  },true);
  return true;
}
(function boot(){ if(!hook()){setTimeout(boot,400);return;}
  injectNav(); watchNav();
  if(window.RA_SB&&window.RA_SB.client){loadExtra().then(function(){window.ADMIN.render();});}
  else { var t=setInterval(function(){ if(window.RA_SB&&window.RA_SB.client){clearInterval(t);
          loadExtra().then(function(){window.ADMIN.render();}); } },700); }
})();
})();
