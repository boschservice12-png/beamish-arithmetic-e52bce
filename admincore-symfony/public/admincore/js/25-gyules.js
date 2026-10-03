
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sb(){return window.RA_SB&&window.RA_SB.client;} function me(){return window.RA_SB&&window.RA_SB.me;}
function monday(d){d=new Date(d);var w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);}
var view=false, het=monday(new Date()), prep=[], emps=[], cst=[], gy=null, myEmp=null, lastErr='';
var P=[['1_flopp','1. Floppok és kezelésük','zűrök, hibák — kihangosítva, tényként'],['2_siker','2. Bejelentések','sikerek, dicséretek'],['3_stat','3. Statisztikák','ők mutassák'],['4_kvota','4. Kvóták','a heti darab'],['5_csataterv','5. Csatatervek','mivel készült a munkatárs']];
function injectNav(){var n=window.RA_NAV&&window.RA_NAV.box&&window.RA_NAV.box();if(!n||n.querySelector('[data-adm7]'))return;var b=document.createElement('button');b.type='button';b.className='adm-item';b.setAttribute('data-adm7','1');b.innerHTML='<span>Heti gyűlés · H 12:30</span>';n.appendChild(b);}
async function load(){var s=sb();if(!s)return;lastErr='';try{var uid=me()&&me().id;
  var r=await Promise.all([s.rpc('f_heti_gyules_elokeszites',{p_het:het}),s.from('employees').select('id,name,department').is('deleted_at',null).eq('is_active',true).order('name'),s.from('hr_csataterv').select('*').in('het_kezdete',[het,prevWeek()]),s.from('hr_heti_gyules').select('*').eq('datum',het).maybeSingle(),uid?s.from('profiles').select('employee_id').eq('id',uid).maybeSingle():Promise.resolve({data:null})]);
  var errs=r.map(function(x,i){return x&&x.error?('#'+i+' '+x.error.message):null;}).filter(Boolean);if(errs.length)lastErr=errs.join(' | ');
  prep=r[0].data||[];emps=r[1].data||[];cst=r[2].data||[];gy=r[3].data||null;myEmp=r[4].data&&r[4].data.employee_id;}catch(ex){lastErr=String(ex&&ex.message||ex);}}
function prevWeek(){var d=new Date(het+'T12:00:00');d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);}
function en(id){var e=emps.find(function(x){return x.id===id;});return e?e.name:'—';}
function paint(){var root=document.getElementById('adminRoot');if(!root||!view)return;
  var h='<div class="adm-h"><span class="adm-eb">BÁZIS 2 / 17. LAP</span><h2>Heti munkatársi gyűlés — hétfő 12:30</h2></div>'+(lastErr?'<div class="adm-warn">'+esc(lastErr)+'</div>':'')+
   '<div class="adm-hint"><b>Nem problémamegoldó időzítés.</b> Fix időpont, öt pont, ebben a sorrendben. Az előkészítés a rendszerből jön az előző hétről; a jegyzőkönyvbe azt írod, ami elhangzott. <i>Ez az a pont, ahol a várvédők lelkét ápolod.</i></div>'+
   '<div class="adm-tools"><button type="button" class="adm-btn ghost" data-gw="-1">‹ előző hét</button><b style="font-family:var(--mono,monospace)">'+esc(het)+'</b><button type="button" class="adm-btn ghost" data-gw="1">következő hét ›</button>'+(gy&&gy.lezarva?'<span class="adm-tag ok">lezárva</span>':'')+'</div>';
  P.forEach(function(p){var rows=prep.filter(function(x){return x.pont===p[0];});var saved=gy?gy[{'1_flopp':'floppok','2_siker':'sikerek','3_stat':'statisztikak','4_kvota':'kvotak','5_csataterv':'csatatervek'}[p[0]]]:'';
    h+='<div class="adm-card"><h3>'+p[1]+' <small style="opacity:.6">'+p[2]+'</small></h3>'+(rows.length?'<ul style="margin:6px 0 10px 18px">'+rows.map(function(r){return '<li>'+esc(r.sor)+'</li>';}).join('')+'</ul>':'<div class="adm-hint">— az előző hétről nincs adat ehhez a ponthoz</div>')+
      (p[0]==='5_csataterv'?csatatervBlock():'')+
      '<div class="adm-f"><label>Jegyzőkönyv — ami elhangzott</label><textarea data-gyf="'+p[0]+'" rows="2" style="width:100%" '+(gy&&gy.lezarva?'disabled':'')+'>'+esc(saved||'')+'</textarea></div></div>';});
  h+='<div class="adm-tools"><button type="button" class="adm-btn" id="gySave" '+(gy&&gy.lezarva?'disabled':'')+'>Jegyzőkönyv mentése</button> <button type="button" class="adm-btn ghost" id="gyClose" '+(gy&&gy.lezarva?'disabled':'')+'>Gyűlés lezárása</button> <span id="gyMsg" class="adm-hint"></span></div>';
  root.innerHTML=h;
  var save=async function(close){var row={datum:het,vezette:myEmp||null,lezarva:!!close};document.querySelectorAll('[data-gyf]').forEach(function(t){row[{'1_flopp':'floppok','2_siker':'sikerek','3_stat':'statisztikak','4_kvota':'kvotak','5_csataterv':'csatatervek'}[t.getAttribute('data-gyf')]]=t.value||null;});
    var r=await sb().from('hr_heti_gyules').upsert(row,{onConflict:'datum'});document.getElementById('gyMsg').innerHTML=r.error?'<span class="adm-warn">'+esc(r.error.message)+'</span>':'<span class="adm-tag ok">✔ mentve</span>';await load();paint();};
  document.getElementById('gySave').onclick=function(){save(false);};document.getElementById('gyClose').onclick=function(){if(confirm('Lezárod a gyűlést? Utána nem szerkeszthető.'))save(true);};}
function csatatervBlock(){var people=emps.filter(function(e){return ['Technic','Body','Admin','Conducere','Transport'].indexOf(e.department)>=0;});
  return '<table class="adm-t"><thead><tr><th>Munkatárs</th><th>Melyik számért</th><th>Kvóta</th><th>Terv erre a hétre</th><th>Előző hét eredménye</th><th></th></tr></thead><tbody>'+people.map(function(e){var c=cst.find(function(x){return x.employee_id===e.id&&x.het_kezdete===het;})||{};var pv=cst.find(function(x){return x.employee_id===e.id&&x.het_kezdete===prevWeek();});
    return '<tr><td><b>'+esc(e.name)+'</b></td><td><input data-cs="statisztika" data-ce="'+e.id+'" value="'+esc(c.statisztika||'')+'" placeholder="pl. O2 óra" style="width:120px"></td><td><input data-cs="kvota" data-ce="'+e.id+'" value="'+esc(c.kvota||'')+'" placeholder="33h" style="width:70px"></td><td><input data-cs="terv" data-ce="'+e.id+'" value="'+esc(c.terv||'')+'" placeholder="mit teszek ezen a héten" style="width:260px"></td>'+
      '<td>'+(pv?(pv.eredmeny?'<small>'+esc(pv.eredmeny)+'</small>':'<input data-cr="'+pv.id+'" placeholder="mi lett belőle?" style="width:180px">'):'<small style="opacity:.5">—</small>')+'</td><td><button type="button" class="adm-btn ghost" data-csave="'+e.id+'">ment</button></td></tr>';}).join('')+'</tbody></table>';}
document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-adm7]');if(b){e.preventDefault();e.stopPropagation();view=true;try{if(window.RA_NAV&&window.RA_NAV.open)window.RA_NAV.open();}catch(_){}document.querySelectorAll('#adminNav .adm-item').forEach(function(x){x.classList.remove('on');});b.classList.add('on');await load();paint();return;}
  if(e.target.closest('#adminNav [data-adm]')&&!e.target.closest('#raNavExtra'))view=false;
  var s=sb();if(!s||!view)return;
  var gw=e.target.closest('[data-gw]');if(gw){var d=new Date(het+'T12:00:00');d.setDate(d.getDate()+7*(+gw.getAttribute('data-gw')));het=d.toISOString().slice(0,10);await load();paint();return;}
  var cs=e.target.closest('[data-csave]');if(cs){var id=cs.getAttribute('data-csave');var g=function(k){var el=document.querySelector('[data-cs="'+k+'"][data-ce="'+id+'"]');return el?el.value.trim():'';};
    if(!g('statisztika')||!g('terv')){alert('Melyik számért, és mit teszel — mindkettő kell.');return;}
    var r=await s.from('hr_csataterv').upsert({employee_id:id,het_kezdete:het,statisztika:g('statisztika'),kvota:g('kvota')||null,terv:g('terv')},{onConflict:'employee_id,het_kezdete'});if(r.error)alert(r.error.message);
    var pr=document.querySelector('[data-cr]');document.querySelectorAll('[data-cr]').forEach(async function(inp){if(inp.value.trim()){await s.from('hr_csataterv').update({eredmeny:inp.value.trim(),eredmeny_at:new Date().toISOString()}).eq('id',inp.getAttribute('data-cr'));}});
    await load();paint();return;}
},true);
function boot(){if(!document.getElementById('adminNav')){setTimeout(boot,500);return;}if(window.RA_NAV&&window.RA_NAV.add)window.RA_NAV.add(injectNav);injectNav();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
