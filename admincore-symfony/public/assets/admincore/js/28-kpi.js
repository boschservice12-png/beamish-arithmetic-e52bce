/* ==== RA_KPI — Mért KPI-k (stat_def/stat_ertek + szerelőnkénti KPI) az Admin Core-ban ====
   „A KPI-t MÉRNI kell, nem beírni” (Feladat-egyeztetés V2.0). Forrás: az ASM-import után automatikusan
   futó f_stat_szamol (kért/elért) és f_asm_rollup (szerelőnként). Itt csak olvasunk; az „Újraszámolás”
   ugyanazt a függvényt hívja. Hozzáférés: iroda (a bizalmas sorokat csak az owner látja — RLS). */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sb(){return window.RA_SB&&window.RA_SB.client;}
var view=false, ho=null, honapok=[], kpi=[], szerelok=[], koteg=null, lastErr='', busy=false, piros='';
var DIV={1:'Szervezet, HR',2:'Marketing, értékesítés',3:'Pénzügy és kontroll',4:'Termelés',5:'Minőség',6:'Ügyfélkapcsolat',7:'Ügyvezetés'};
var LAMPA={zold:['● rendben','ok'],sarga:['● figyelni','warn'],piros:['● beavatkozni','bad'],nincs_cel:['nincs kért érték',''],nincs_adat:['nincs adat',''],nem_termelo:['nem termelő','']};
var HONAP=['jan.','febr.','márc.','ápr.','máj.','jún.','júl.','aug.','szept.','okt.','nov.','dec.'];
function hoNev(h){var d=new Date(h+'T00:00:00');return d.getFullYear()+'. '+HONAP[d.getMonth()];}
function n(v,dig){if(v==null||v==='')return '—';var x=Number(v);return x.toLocaleString('hu-HU',{maximumFractionDigits:dig==null?0:dig});}

function injectNav(){var b0=window.RA_NAV&&window.RA_NAV.box&&window.RA_NAV.box();if(!b0||b0.querySelector('[data-adm9]'))return;
  var b=document.createElement('button');b.type='button';b.className='adm-item';b.setAttribute('data-adm9','1');
  b.innerHTML='<span>KPI · mért</span><span class="adm-b" id="kpiB">'+esc(piros)+'</span>';b0.appendChild(b);}

async function load(){var s=sb();if(!s){lastErr='nincs kapcsolat';return;}lastErr='';
  try{
    if(!honapok.length){
      var hk=await s.from('v_kpi_honap').select('ho').order('ho',{ascending:false});
      if(hk.error)throw hk.error;
      honapok=Array.from(new Set((hk.data||[]).map(function(x){return x.ho;})));
      // alapértelmezés: a legutolsó hónap, amelyben van mért érték (nem a jövőbeli üres hónap)
      var mert=await s.from('v_kpi_honap').select('ho').not('elert','is',null).order('ho',{ascending:false}).limit(1);
      ho=ho||(mert.data&&mert.data[0]&&mert.data[0].ho)||honapok[0]||null;
    }
    if(!ho){kpi=[];szerelok=[];koteg=null;return;}
    var r=await Promise.all([
      s.from('v_kpi_honap').select('*').eq('ho',ho).order('sorrend'),
      s.from('v_szerelo_kpi_honap').select('*').eq('ho',ho).order('ore_o2',{ascending:false}),
      s.from('asm_import_batch').select('id,forras,imported_at,imported_by_name,sorok,parositatlan').eq('ho',ho).order('id',{ascending:false}).limit(1)
    ]);
    var errs=r.map(function(x,i){return x&&x.error?('#'+i+' '+x.error.message):null;}).filter(Boolean);if(errs.length)lastErr=errs.join(' | ');
    kpi=r[0].data||[];szerelok=r[1].data||[];koteg=(r[2].data||[])[0]||null;
  }catch(ex){lastErr=String(ex&&ex.message||ex);}
  // a menü újrarajzolása új gombot készít → a számot megjegyezzük, az injectNav innen tölti
  piros=String(kpi.filter(function(x){return x.allapot==='piros';}).length||'');
  var b=document.getElementById('kpiB');if(b)b.textContent=piros;
}

function tag(a){var t=LAMPA[a]||[a||'—',''];return '<span class="adm-tag '+t[1]+'">'+esc(t[0])+'</span>';}

function paint(){var root=document.getElementById('adminRoot');if(!root||!view)return;
  var c={zold:0,sarga:0,piros:0,nincs:0};kpi.forEach(function(x){if(c[x.allapot]!=null)c[x.allapot]++;else c.nincs++;});
  var h='<div class="adm-h"><span class="adm-eb">IRÁNYÍTÁS · MÉRT KPI</span><h2>KPI — valós adatból mérve</h2></div>'+
    (lastErr?'<div class="adm-warn">'+esc(lastErr)+'</div>':'')+
    '<div class="adm-hint"><b>A KPI-t mérni kell, nem beírni.</b> Az értékek az ASM-importból és a pénzügyi forrásokból számolódnak, minden import után automatikusan. <b>Kért</b> = kapacitás, 6 havi átlag, jóváhagyott terv vagy 0 (egyeztetésnél) — a mutató típusa szerint.</div>'+
    '<div class="adm-tools" style="gap:8px;align-items:center;flex-wrap:wrap"><label>Hónap: <select id="kpiHo">'+
      honapok.map(function(h){return '<option value="'+h+'"'+(h===ho?' selected':'')+'>'+hoNev(h)+'</option>';}).join('')+'</select></label>'+
      '<button type="button" class="adm-btn ghost" id="kpiUj"'+(busy?' disabled':'')+'>'+(busy?'Számolás…':'Újraszámolás')+'</button>'+
      (koteg?'<span class="adm-hint" style="margin:0">ASM-import: #'+koteg.id+' · '+esc(koteg.forras)+' · '+esc(koteg.imported_by_name||'')+' · '+esc(String(koteg.imported_at||'').slice(0,16).replace('T',' '))+' · '+n(koteg.sorok)+' tétel</span>':'<span class="adm-warn" style="margin:0">Ehhez a hónaphoz nincs ASM-import.</span>')+
    '</div>';
  if(koteg&&koteg.parositatlan&&koteg.parositatlan.length)h+='<div class="adm-warn">Dolgozóhoz nem párosított ASM-nevek (a szerelő-KPI-ból kimaradnak): '+esc(koteg.parositatlan.join(', '))+'</div>';
  h+='<div class="adm-stats"><div class="'+(c.piros?'bad':'')+'"><b>'+c.piros+'</b>Beavatkozni</div><div><b>'+c.sarga+'</b>Figyelni</div><div><b>'+c.zold+'</b>Rendben</div><div><b>'+c.nincs+'</b>Nincs cél / adat</div></div>';

  // divíziónként
  var divs={};kpi.forEach(function(x){(divs[x.divizio]=divs[x.divizio]||[]).push(x);});
  Object.keys(divs).sort().forEach(function(d){
    h+='<div class="adm-card"><h3>'+d+'. divízió — '+esc(DIV[d]||'')+'</h3><table class="adm-t"><thead><tr><th>Mutató</th><th>Osztály</th><th style="text-align:right">Elért</th><th style="text-align:right">Kért</th><th style="text-align:right">%</th><th>Állapot</th><th>Megjegyzés</th></tr></thead><tbody>'+
      divs[d].map(function(x){return '<tr><td><b>'+esc(x.nev_hu)+'</b>'+(x.bizalmas?' <span class="adm-tag">bizalmas</span>':'')+'<br><small>'+esc(x.elert_forras||'')+'</small></td>'+
        '<td>'+esc(x.dept_code||'')+(x.osztaly?' '+esc(x.osztaly):'')+'</td>'+
        '<td style="text-align:right">'+n(x.elert,2)+' <small>'+esc(x.egyseg)+'</small></td><td style="text-align:right">'+n(x.kert,2)+'</td>'+
        '<td style="text-align:right">'+(x.teljesules_pct!=null?n(x.teljesules_pct,1)+'%':'—')+'</td><td>'+tag(x.allapot)+'</td>'+
        '<td><small>'+esc(x.elert_megj||x.kert_megj||'')+'</small></td></tr>';}).join('')+'</tbody></table></div>';
  });
  if(!kpi.length)h+='<div class="adm-card"><p>Ehhez a hónaphoz még nincs mért KPI. Töltsd be az ASM-exportot a pénzügyi panelben (Import ASM), utána itt automatikusan megjelenik.</p></div>';

  // szerelőnként
  h+='<div class="adm-card"><h3>Szerelőnként — normaóra a 140 / 160 órás küszöbhöz</h3><table class="adm-t"><thead><tr><th>Szerelő</th><th>Osztály</th><th style="text-align:right">Normaóra (O2)</th><th style="text-align:right">AAA / EAA / DAA / CAA</th><th style="text-align:right">Munkadíj</th><th style="text-align:right">Tarifa</th><th style="text-align:right">Számlázási arány</th><th>Állapot</th></tr></thead><tbody>'+
    (szerelok.map(function(x){return '<tr><td><b>'+esc(x.nev||x.szerelo)+'</b>'+(x.nev?'':' <small>(ASM-név, nincs dolgozóhoz kötve)</small>')+'</td><td>'+esc(x.osztaly||'')+'</td>'+
      '<td style="text-align:right"><b>'+n(x.ore_o2,1)+'</b> / '+n(x.kuszob)+'</td><td style="text-align:right"><small>'+n(x.ore_aaa,1)+' / '+n(x.ore_eaa,1)+' / '+n(x.ore_daa,1)+' / '+n(x.ore_caa,1)+'</small></td>'+
      '<td style="text-align:right">'+n(x.manopera)+' lei</td><td style="text-align:right">'+n(x.tarifa)+'</td><td style="text-align:right">'+(x.szamlazasi_arany!=null?n(x.szamlazasi_arany*100,1)+'%':'—')+'</td><td>'+tag(x.allapot)+'</td></tr>';}).join('')||'<tr><td colspan="8">Nincs szerelőnkénti adat ehhez a hónaphoz.</td></tr>')+
    '</tbody></table><p class="adm-hint">AAA = számlázva · EAA = proforma (nyitott) · DAA = garancia/belső · CAA = egyéb. Számlázási arány = AAA ÷ összes normaóra.</p></div>';
  root.innerHTML=h;
}

document.addEventListener('change',async function(e){if(!view||e.target.id!=='kpiHo')return;ho=e.target.value;await load();paint();});
document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-adm9]');if(b){e.preventDefault();e.stopPropagation();view=true;try{if(window.RA_NAV&&window.RA_NAV.open)window.RA_NAV.open();}catch(_){}
    document.querySelectorAll('#adminNav .adm-item').forEach(function(x){x.classList.remove('on');});b.classList.add('on');await load();paint();return;}
  if(e.target.closest('#adminNav [data-adm]')&&!e.target.closest('#raNavExtra'))view=false;
  if(!view)return;
  if(e.target.closest('#kpiUj')&&ho&&!busy){busy=true;paint();
    var r=await sb().rpc('f_stat_szamol',{p_ho:ho});busy=false;
    if(r.error)lastErr='Újraszámolás: '+r.error.message;
    await load();paint();}
});
// belépés után egyszer a háttérben is betölt → a „beavatkozni” jelvény a nézet megnyitása nélkül is látszik
function prefetch(){if(!sb()){setTimeout(prefetch,1500);return;}if(!view&&!honapok.length)load();}
function boot(){if(!document.getElementById('adminNav')){setTimeout(boot,500);return;}if(window.RA_NAV&&window.RA_NAV.add)window.RA_NAV.add(injectNav);injectNav();prefetch();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
