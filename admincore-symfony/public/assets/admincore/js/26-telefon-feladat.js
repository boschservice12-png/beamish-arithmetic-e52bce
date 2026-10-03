
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sb(){return window.RA_SB&&window.RA_SB.client;}
var view=false, filt='', ST={sent:['Elküldve',''],read:['Elolvasva','warn'],accepted:['Elfogadva',''],done:['Kész','ok'],back:['Visszaküldve','bad'],withdrawn:['Visszavonva','']};
function injectNav(){
  var n=window.RA_NAV&&window.RA_NAV.box&&window.RA_NAV.box(); if(!n||n.querySelector('[data-adm8]'))return;
  var b=document.createElement('button'); b.type='button'; b.className='adm-item'; b.setAttribute('data-adm8','telf');
  b.innerHTML='<span>Feladatok a telefonra</span>'; n.appendChild(b);
}
var nyitott=function(f){return ['sent','read','accepted'].indexOf(f.status)>=0;};
var kesik=function(f){return nyitott(f)&&f.hatarido&&new Date(f.hatarido)<new Date();};
function d(s){return s?new Date(s).toLocaleString('hu-HU',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'';}
async function paint(){
  var root=document.getElementById('adminRoot'); if(!root||!view)return;
  var s=sb(); if(!s){root.innerHTML='<div class="adm-hint">Nincs kapcsolat.</div>';return;}
  root.innerHTML='<div class="adm-hint">Betöltés…</div>';
  var r1=await s.rpc('f_szerelok'), r2=await s.from('employees').select('id,tel_feladat_on'),
      r3=await s.from('tel_feladat').select('id,kuldo_nev,employee_id,cim,hatarido,status,pct,valasz,created_at,updated_at').order('updated_at',{ascending:false}).limit(300);
  if(r3.error){root.innerHTML='<div class="adm-warn">'+esc(r3.error.message)+'</div>';return;}
  var on={};(r2.data||[]).forEach(function(e){on[e.id]=e.tel_feladat_on;});
  var P=(r1.data||[]).filter(function(e){return e.has_pin;}), nev={};P.forEach(function(e){nev[e.id]=e.name;});
  var F=r3.data||[];
  var k=[['Nyitott',F.filter(nyitott).length,''],['Késik',F.filter(kesik).length,'bad'],['Visszaküldve',F.filter(function(f){return f.status==='back';}).length,'bad'],['Kész',F.filter(function(f){return f.status==='done';}).length,'ok']];
  var L=F.filter(function(f){return !filt||f.employee_id===filt;}).sort(function(a,b){return (kesik(b)-kesik(a))||(nyitott(b)-nyitott(a));});
  root.innerHTML='<div class="adm-h"><span class="adm-eb">TERMELÉS</span><h2>Feladatok a telefonra</h2></div>'+
   '<div class="adm-hint">A Teendőimből a szerelők telefonjára küldött feladatok. Nem mért munka, nem kerül ASM-be. A régi e-mailes út mellette változatlanul megy.</div>'+
   '<div class="adm-card" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">'+k.map(function(x){return '<div><div style="font-size:26px;font-weight:700">'+x[1]+'</div>'+(x[2]&&x[1]?'<span class="adm-tag '+x[2]+'">'+x[0]+'</span>':'<span class="adm-hint">'+x[0]+'</span>')+'</div>';}).join('')+'</div>'+
   '<div class="adm-card"><table class="adm-t"><thead><tr><th>Szerelő</th><th>Részleg</th><th>Nyitott</th><th>Késik</th><th>Kaphat telefonos feladatot</th></tr></thead><tbody>'+
   P.map(function(e){var m=F.filter(function(f){return f.employee_id===e.id;}),kk=m.filter(kesik).length,o=on[e.id]!==false;
     return '<tr><td><b>'+esc(e.name)+'</b></td><td>'+esc(e.department)+'</td><td>'+m.filter(nyitott).length+'</td><td>'+(kk?'<span class="adm-tag bad">'+kk+'</span>':'0')+'</td>'+
     '<td><button type="button" class="adm-btn'+(o?'':' ghost')+'" data-telon="'+e.id+'" data-v="'+(o?'0':'1')+'">'+(o?'✔ bekapcsolva':'kikapcsolva')+'</button></td></tr>';}).join('')+
   '</tbody></table></div>'+
   '<div class="adm-card"><div class="adm-tools" style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><b>Feladatnapló</b><select id="telfFilt" style="margin-left:auto;font:inherit;padding:5px 8px;border-radius:8px"><option value="">Mindenki</option>'+
     P.map(function(e){return '<option value="'+e.id+'"'+(filt===e.id?' selected':'')+'>'+esc(e.name)+'</option>';}).join('')+'</select></div>'+
   (L.length?'<table class="adm-t"><thead><tr><th>Feladat</th><th>Kitől → kinek</th><th>Határidő</th><th>Állapot</th><th></th></tr></thead><tbody>'+
   L.map(function(f){var st=ST[f.status]||[f.status,''];return '<tr><td><b>'+esc(f.cim)+'</b>'+(f.valasz?'<div class="adm-hint">↩ '+esc(f.valasz)+'</div>':'')+'</td>'+
     '<td>'+esc(f.kuldo_nev)+' → '+esc(nev[f.employee_id]||'?')+'</td><td>'+(kesik(f)?'<span class="adm-warn">'+d(f.hatarido)+' · késik</span>':d(f.hatarido))+'</td>'+
     '<td><span class="adm-tag '+st[1]+'">'+st[0]+(f.status==='accepted'?' · '+f.pct+'%':'')+'</span></td>'+
     '<td>'+(nyitott(f)?'<button type="button" class="adm-btn ghost" data-telvissza="'+f.id+'">Visszavon</button>':'')+'</td></tr>';}).join('')+'</tbody></table>'
     :'<div class="adm-hint">Még nincs telefonra küldött feladat. A Teendőimben a felelősnél válassz szerelőt, és nyomd meg a „📱 Küldés a telefonra” gombot.</div>')+'</div>';
}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='telfFilt'){filt=e.target.value;paint();}},true);
document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-adm8]'); if(b){e.preventDefault();e.stopPropagation();view=true;try{if(window.RA_NAV&&window.RA_NAV.open)window.RA_NAV.open();}catch(_){}
    document.querySelectorAll('#adminNav .adm-item').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); paint(); return;}
  if(e.target.closest('#adminNav .adm-item')) view=false;
  var t=e.target.closest('[data-telon]'); if(t){var r=await sb().rpc('f_tf_iroda_kapcsol',{p_emp:t.getAttribute('data-telon'),p_on:t.getAttribute('data-v')==='1'});if(r.error)alert(r.error.message);paint();return;}
  var v=e.target.closest('[data-telvissza]'); if(v){var r2=await sb().rpc('f_tf_iroda_visszavon',{p_id:v.getAttribute('data-telvissza')});if(r2.error)alert(r2.error.message);paint();return;}
},true);
function boot(){ if(!document.getElementById('adminNav')){setTimeout(boot,500);return;} if(window.RA_NAV&&window.RA_NAV.add)window.RA_NAV.add(injectNav); injectNav(); }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
