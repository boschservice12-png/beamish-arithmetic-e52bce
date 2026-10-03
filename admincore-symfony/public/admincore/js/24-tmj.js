
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sb(){return window.RA_SB&&window.RA_SB.client;} function me(){return window.RA_SB&&window.RA_SB.me;}
var view=false, rows=[], emps=[], depts=[], myEmp=null, lastErr='';
var ST={beadva:['beadva — döntésre vár','warn'],engedelyezve:['ENGEDÉLYEZVE','ok'],nem_engedelyezve:['nem engedélyezve','bad'],visszakuldve:['visszaküldve — hiányos','']};
function injectNav(){var n=window.RA_NAV&&window.RA_NAV.box&&window.RA_NAV.box();if(!n||n.querySelector('[data-adm6]'))return;var b=document.createElement('button');b.type='button';b.className='adm-item';b.setAttribute('data-adm6','1');b.innerHTML='<span>Javaslatok (TMJ)</span><span class="adm-b" id="tmjB"></span>';n.appendChild(b);}
async function load(){var s=sb();if(!s){lastErr='nincs kapcsolat';return;}lastErr='';
  try{var uid=me()&&me().id;var r=await Promise.all([s.from('hr_tmj').select('*').order('created_at',{ascending:false}),s.from('employees').select('id,name').is('deleted_at',null).eq('is_active',true).order('name'),s.from('admin_dept').select('dept_code,nev_hu').order('dept_code'),uid?s.from('profiles').select('employee_id').eq('id',uid).maybeSingle():Promise.resolve({data:null})]);
    var errs=r.map(function(x,i){return x&&x.error?('#'+i+' '+x.error.message):null;}).filter(Boolean);if(errs.length)lastErr=errs.join(' | ');
    rows=r[0].data||[];emps=r[1].data||[];depts=r[2].data||[];myEmp=r[3].data&&r[3].data.employee_id;}catch(ex){lastErr=String(ex&&ex.message||ex);}
  var b=document.getElementById('tmjB');if(b)b.textContent=rows.filter(function(x){return x.allapot==='beadva';}).length||'';}
function en(id){var e=emps.find(function(x){return x.id===id;});return e?e.name:'—';}
function paint(){var root=document.getElementById('adminRoot');if(!root||!view)return;var open=rows.filter(function(x){return x.allapot==='beadva';}).length;
  var h='<div class="adm-h"><span class="adm-eb">VEZETÉS · BÁZIS 2 / 8. LAP</span><h2>Teljes munkatársi javaslat</h2></div>'+(lastErr?'<div class="adm-warn">'+esc(lastErr)+'</div>':'')+
   '<div class="adm-hint"><b>Soha ne old meg a beosztottad problémáját.</b> Aki problémát hoz, ezt a lapot kapja: helyzet röviden · minden szükséges info · megoldási javaslat. A vezető egyetlen dolga: engedélyezve / nem engedélyezve. Engedélyezéskor automatikusan intézkedés lesz a napi döntésnaplóban, a beadó nevére.</div>'+
   '<div class="adm-stats"><div class="'+(open?'bad':'')+'"><b>'+open+'</b>Döntésre vár</div><div><b>'+rows.filter(function(x){return x.allapot==='engedelyezve';}).length+'</b>Engedélyezve</div><div><b>'+rows.filter(function(x){return x.allapot==='nem_engedelyezve';}).length+'</b>Elutasítva</div><div><b>'+rows.length+'</b>Összes</div></div>';
  h+='<div class="adm-card"><h3>Új javaslat</h3><div class="adm-tools" style="flex-wrap:wrap;gap:8px"><select id="tjBe">'+emps.map(function(e){return '<option value="'+e.id+'" '+(e.id===myEmp?'selected':'')+'>'+esc(e.name)+'</option>';}).join('')+'</select><select id="tjD"><option value="">osztály…</option>'+depts.map(function(d){return '<option value="'+d.dept_code+'">'+d.dept_code+' '+esc(d.nev_hu)+'</option>';}).join('')+'</select><input type="date" id="tjH" title="javasolt határidő"></div>'+
   '<div class="adm-f" style="margin-top:8px"><label>1. Helyzet röviden</label><textarea id="tjHe" rows="2" style="width:100%"></textarea></div>'+
   '<div class="adm-f"><label>2. A megoldáshoz szükséges összes info</label><textarea id="tjI" rows="3" style="width:100%"></textarea></div>'+
   '<div class="adm-f"><label>3. Megoldási javaslat — <i>te hogyan oldanád meg?</i></label><textarea id="tjJ" rows="3" style="width:100%"></textarea></div>'+
   '<button type="button" class="adm-btn" id="tjAdd">Beadás</button> <span id="tjMsg" class="adm-hint"></span></div>';
  h+='<div class="adm-card"><table class="adm-t"><thead><tr><th>#</th><th>Dátum</th><th>Beadó</th><th>Oszt.</th><th>Helyzet</th><th>Javaslat</th><th>Állapot</th><th></th></tr></thead><tbody>'+
   (rows.map(function(x){var st=ST[x.allapot]||[x.allapot,''];var act=x.allapot==='beadva'?'<button type="button" class="adm-btn" data-tok="'+x.id+'">Engedélyezve</button> <button type="button" class="adm-btn ghost" data-tno="'+x.id+'">Nem</button> <button type="button" class="adm-btn ghost" data-tback="'+x.id+'">Vissza (hiányos)</button>':(x.allapot==='engedelyezve'?(x.iranyelv_doc_code?'<span class="adm-tag ok">'+esc(x.iranyelv_doc_code)+'</span>':'<button type="button" class="adm-btn ghost" data-tir="'+x.id+'">Irányelv belőle</button>'):'');
     return '<tr><td>'+x.sorszam+'</td><td>'+esc(x.datum)+'</td><td>'+esc(en(x.beado))+'</td><td>'+esc(x.dept_code||'')+'</td><td><small>'+esc(x.helyzet)+'</small></td><td><small>'+esc(x.javaslat)+'</small>'+(x.hatarido?'<br><small>határidő: '+esc(x.hatarido)+'</small>':'')+'</td><td><span class="adm-tag '+st[1]+'">'+st[0]+'</span>'+(x.donto?'<br><small>'+esc(en(x.donto))+(x.dontes_megjegyzes?' — '+esc(x.dontes_megjegyzes):'')+'</small>':'')+'</td><td>'+act+'</td></tr>';}).join('')||'<tr><td colspan="8" class="adm-hint">Még nincs javaslat.</td></tr>')+'</tbody></table></div>';
  root.innerHTML=h;document.getElementById('tjAdd').onclick=add;}
async function add(){var g=function(i){return (document.getElementById(i).value||'').trim();},m=document.getElementById('tjMsg');
  var r=await sb().from('hr_tmj').insert({beado:g('tjBe'),dept_code:g('tjD')||null,hatarido:g('tjH')||null,helyzet:g('tjHe'),info:g('tjI'),javaslat:g('tjJ')});
  if(r.error){m.innerHTML='<span class="adm-warn">'+esc(r.error.message)+'</span>';return;}await load();paint();}
document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-adm6]');if(b){e.preventDefault();e.stopPropagation();view=true;try{if(window.RA_NAV&&window.RA_NAV.open)window.RA_NAV.open();}catch(_){}document.querySelectorAll('#adminNav .adm-item').forEach(function(x){x.classList.remove('on');});b.classList.add('on');await load();paint();return;}
  if(e.target.closest('#adminNav [data-adm]')&&!e.target.closest('#raNavExtra'))view=false;
  var s=sb();if(!s||!view)return;
  var dec=async function(id,allapot){if(!myEmp)return alert('Nincs alkalmazott a fiókodhoz.');var mm=allapot==='engedelyezve'?(prompt('Megjegyzés (opcionális)')||null):prompt(allapot==='visszakuldve'?'Mi hiányzik?':'Miért nem?');if(mm===null&&allapot!=='engedelyezve')return;
    var r=await s.from('hr_tmj').update({allapot:allapot,donto:myEmp,dontes_megjegyzes:mm}).eq('id',id);if(r.error)alert(r.error.message);await load();paint();};
  var ok=e.target.closest('[data-tok]');if(ok){dec(ok.getAttribute('data-tok'),'engedelyezve');return;}
  var no=e.target.closest('[data-tno]');if(no){dec(no.getAttribute('data-tno'),'nem_engedelyezve');return;}
  var ir=e.target.closest('[data-tir]');if(ir){var x=rows.find(function(r){return r.id===ir.getAttribute('data-tir');});if(!x)return;
    var cim=prompt('Irányelv címe',x.helyzet.slice(0,60));if(cim===null)return;
    var el=prompt('Elosztási kód — mely posztoknak? (vesszővel: MEC, LAK, FEN, REC, ADM, HR, SOF, VEG)','MEC');if(el===null)return;
    var ki=prompt('Kiértékelés — ez azt eredményezte, hogy…',x.info.slice(0,200));if(ki===null)return;
    var r=await s.rpc('f_iranyelv_uj',{p_cim:cim,p_elosztas:el.split(',').map(function(v){return v.trim().toUpperCase();}).filter(Boolean),p_megfigyeles:x.helyzet,p_kiertekeles:ki,p_dontes:x.javaslat,p_dept:x.dept_code,p_tmj:x.id,p_szerzo:en(x.beado)});
    if(r.error)alert(r.error.message);else alert('Irányelv létrehozva: '+r.data+' — inaktív, amíg az oktatás alá nincs írva.');await load();paint();return;}
  var bk=e.target.closest('[data-tback]');if(bk){dec(bk.getAttribute('data-tback'),'visszakuldve');return;}
},true);
function boot(){if(!document.getElementById('adminNav')){setTimeout(boot,500);return;}if(window.RA_NAV&&window.RA_NAV.add)window.RA_NAV.add(injectNav);injectNav();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
