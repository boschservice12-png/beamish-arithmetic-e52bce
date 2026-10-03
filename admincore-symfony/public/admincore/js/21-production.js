
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sb(){return window.RA_SB&&window.RA_SB.client;}
function me(){return window.RA_SB&&window.RA_SB.me;}
var view=false, emps=[], tasks=[], day=new Date().toISOString().slice(0,10), timer=null;
function mm(m){m=Math.max(0,Math.round(m||0));return Math.floor(m/60)+':'+String(m%60).padStart(2,'0');}
var ST={assigned:['kiosztva','#94a3b8'],accepted:['elfogadva','#94a3b8'],in_progress:['FUT','#22c55e'],paused:['szünet','#f59e0b'],done:['VERDE — K6 vár','#3b82f6'],quality_checked:['ALBASTRU','#2563eb'],rework:['újra','#d81f26'],invoiceable:['számlázható','#16a34a'],closed:['zárva','#64748b'],cancelled:['törölve','#64748b']};
function injectNav(){
  var n=document.getElementById('adminNav'); if(!n||n.querySelector('[data-adm4],[data-powin]'))return;
  var b=document.createElement('button'); b.type='button'; b.className='adm-item'; b.setAttribute('data-adm4','prod');
  b.innerHTML='<span>Panou Operațional ↗</span>'; b.setAttribute('data-powin','1'); b.removeAttribute('data-adm4'); n.appendChild(b);
}
async function load(){
  var s=sb(); if(!s)return;
  if(!emps.length){var e=await s.from('employees').select('id,name,department').is('deleted_at',null).eq('is_active',true).in('department',['Technic','Body']).order('name'); emps=e.data||[];}
  var r=await s.from('prod_task').select('*').or('block_date.eq.'+day+',status.in.(in_progress,paused,done,rework)').order('block_date').order('created_at'); tasks=r.data||[];
  var b=document.getElementById('prodB'); if(b)b.textContent=tasks.filter(function(t){return t.status==='in_progress';}).length||'';
}
function empName(id){var e=emps.find(function(x){return x.id===id;});return e?e.name:'—';}
async function paint(){
  var root=document.getElementById('adminRoot'); if(!root||!view)return;
  await load();
  var run=tasks.filter(function(t){return t.status==='in_progress';}).length, qc=tasks.filter(function(t){return t.status==='done';}).length, pz=tasks.filter(function(t){return t.status==='paused';}).length;
  var h='<div class="adm-h"><span class="adm-eb">TERMELÉS</span><h2>Termelés — '+esc(day)+'</h2></div>'+
   '<div class="adm-hint">A szerelő telefonja ide ír. Kiosztás itt, START/SZÜNET/KÉSZ a telefonon, K6 itt — más személytől, mért értékkel. Csak K6 után számlázható.</div>'+
   '<div class="adm-stats"><div><b>'+tasks.length+'</b>Feladat</div><div class="'+(run?'':'')+'"><b>'+run+'</b>Fut most</div><div class="'+(pz?'bad':'')+'"><b>'+pz+'</b>Szünetben</div><div class="'+(qc?'bad':'')+'"><b>'+qc+'</b>K6-ra vár</div></div>';
  // kiosztás
  h+='<div class="adm-card"><h3>Új feladat kiosztása</h3><div class="adm-tools" style="flex-wrap:wrap;gap:8px">'+
   '<input id="pRs" placeholder="rendszám" style="width:110px">'+'<input id="pAu" placeholder="autó" style="width:140px">'+'<input id="pDz" placeholder="deviz nr." style="width:120px">'+
   '<input id="pCim" placeholder="mit kell csinálni" style="flex:1;min-width:200px">'+
   '<select id="pEmp">'+emps.map(function(e){return '<option value="'+e.id+'">'+esc(e.name)+'</option>';}).join('')+'</select>'+
   '<select id="pBl"><option>A</option><option>B</option></select>'+'<input id="pMin" type="number" placeholder="normaperc" style="width:100px">'+
   '<input id="pDay" type="date" value="'+day+'">'+'<button type="button" class="adm-btn" id="pAdd">Kiosztás</button><span id="pMsg" class="adm-hint"></span></div></div>';
  // lista
  var rows=tasks.map(function(t){var st=ST[t.status]||[t.status,'#999'];
    var live=t.status==='in_progress'?'<span data-live="'+t.id+'" data-base="'+t.actual_minutes+'" data-t0="'+Date.now()+'">'+mm(t.actual_minutes)+'</span>':mm(t.actual_minutes);
    var act='';
    if(t.status==='done') act='<button type="button" class="adm-btn" data-qc="'+t.id+'">K6 ellenőrzés</button>';
    else if(t.status==='quality_checked') act='<button type="button" class="adm-btn ghost" data-inv="'+t.id+'">Számlázható</button>';
    else if(t.status==='invoiceable') act='<button type="button" class="adm-btn ghost" data-close="'+t.id+'">Zárás</button>';
    else if(['assigned','accepted'].indexOf(t.status)>=0) act='<button type="button" class="adm-btn ghost" data-cancel="'+t.id+'">✕</button>';
    return '<tr><td><b>'+esc(t.rendszam||'—')+'</b><br><small>'+esc(t.auto||'')+' '+esc(t.deviz_nr||'')+'</small></td><td>'+esc(t.cim)+'</td><td>'+esc(empName(t.employee_id))+'<br><small>'+esc(t.block||'')+' · '+esc(t.block_date)+'</small></td>'+
      '<td><span class="adm-tag" style="background:'+st[1]+'22;color:'+st[1]+'">'+st[0]+'</span></td><td>'+live+' / '+mm(t.est_minutes)+'</td><td>'+(t.qc_value?'<small>'+esc(t.qc_value)+'</small>':'')+'</td><td>'+act+'</td></tr>';});
  h+='<div class="adm-card"><table class="adm-t"><thead><tr><th>Autó</th><th>Feladat</th><th>Szerelő</th><th>Állapot</th><th>Tény / norma</th><th>K6 mért érték</th><th></th></tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="7" class="adm-hint">Ma nincs kiosztott feladat.</td></tr>')+'</tbody></table></div>';
  root.innerHTML=h;
  document.getElementById('pAdd').onclick=addTask;
  clearInterval(timer); timer=setInterval(function(){document.querySelectorAll('[data-live]').forEach(function(x){x.textContent=mm(+x.getAttribute('data-base')+(Date.now()-+x.getAttribute('data-t0'))/60000);});},1000);
}
async function addTask(){
  var g=function(i){return document.getElementById(i).value.trim();}; var m=document.getElementById('pMsg');
  if(!g('pCim')||!g('pMin')){m.textContent='feladat és normaperc kell';return;}
  var r=await sb().from('prod_task').insert({rendszam:g('pRs')||null,auto:g('pAu')||null,deviz_nr:g('pDz')||null,cim:g('pCim'),employee_id:g('pEmp'),block:g('pBl'),est_minutes:+g('pMin'),block_date:g('pDay'),created_by:(me()&&me().email)||'admin'});
  if(r.error){m.textContent=r.error.message;return;} day=g('pDay'); paint();
}
document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-adm4]'); if(b){e.preventDefault();e.stopPropagation();view=true;try{if(window.RA_NAV&&window.RA_NAV.open)window.RA_NAV.open();}catch(_){}document.querySelectorAll('#adminNav .adm-item').forEach(function(x){x.classList.remove('on');});b.classList.add('on');paint();return;}
  if(e.target.closest('#adminNav [data-adm]')&&!e.target.closest('#raNavExtra')){view=false;clearInterval(timer);}
  var s=sb(); if(!s)return;
  var q=e.target.closest('[data-qc]'); if(q){var id=q.getAttribute('data-qc'), t=tasks.find(function(x){return x.id===id;});
    var val=prompt('K6 — mért érték (kötelező). Pl.: fékerő 320/315 daN · nyomaték 120 Nm · próbaút OK 12 km'); if(val===null)return;
    var pass=confirm('Elfogadod? OK = ALBASTRU (megfelelt) · Mégse = ÚJRA (rework)');
    var myEmp=(await s.from('profiles').select('employee_id').eq('id',me().id).maybeSingle()).data; var qcBy=myEmp&&myEmp.employee_id;
    if(!qcBy){alert('A fiókodhoz nincs alkalmazott rendelve (profiles.employee_id) — a K6-hoz kell.');return;}
    var r=await s.from('prod_task').update(pass?{status:'quality_checked',qc_by:qcBy,qc_value:val}:{status:'rework',qc_by:qcBy,qc_value:val,qc_note:'rework'}).eq('id',id);
    if(r.error)alert(r.error.message); paint(); return;}
  var iv=e.target.closest('[data-inv]'); if(iv){var r2=await s.from('prod_task').update({status:'invoiceable'}).eq('id',iv.getAttribute('data-inv')); if(r2.error)alert(r2.error.message); paint(); return;}
  var cl=e.target.closest('[data-close]'); if(cl){var r3=await s.from('prod_task').update({status:'closed',closed_by:(me()&&me().email)||'admin'}).eq('id',cl.getAttribute('data-close')); if(r3.error)alert(r3.error.message); paint(); return;}
  var cn=e.target.closest('[data-cancel]'); if(cn&&confirm('Törlöd a kiosztást?')){var r4=await s.from('prod_task').update({status:'cancelled'}).eq('id',cn.getAttribute('data-cancel')); if(r4.error)alert(r4.error.message); paint(); return;}
},true);
function boot(){ if(!document.getElementById('adminNav')){setTimeout(boot,500);return;} if(window.RA_NAV&&window.RA_NAV.add)window.RA_NAV.add(injectNav); injectNav(); setInterval(function(){ if(view)paint(); },30000); }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
