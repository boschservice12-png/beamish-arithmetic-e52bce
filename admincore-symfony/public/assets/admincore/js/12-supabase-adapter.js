
/* ==== Autószerviz modell → Supabase adapter + bejelentkezés ====
   Az ST.store-t a Supabase admin_core/admin_dept/employees-ből tölti,
   a persist()-et Supabase-írásra köti. A design változatlan. */
(function(){
'use strict';
window.__SB__=true;window.__SB_BOOT__=true;  // a fájl saját auto-indítóját elnémítja, ha figyeli; egyébként ártalmatlan
var SB_URL=window.ADMINCORE_CFG.supabaseUrl;
var SB_KEY=window.ADMINCORE_CFG.supabaseKey;
var sb=null, me=null;
var SHOP='00000000-0000-0000-0000-000000000001';

function loadSDK(){return new Promise(function(res,rej){if(window.supabase){res();return;}var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=res;s.onerror=function(){rej(new Error('SDK'));};document.head.appendChild(s);});}

function loginScreen(msg){
  var d=document.createElement('div');d.id='sbLogin';
  d.style.cssText='position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#fff,#F4F1EC);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif';
  d.innerHTML='<div style="background:#fff;border:1px solid #D7DBE2;border-radius:16px;padding:32px 34px;width:min(400px,92vw);box-shadow:0 10px 40px rgba(0,0,0,.08)">'+
    '<div style="color:#E11D2E;font-weight:800;letter-spacing:.12em;font-size:12px">SZERVEZÉSI TÁBLA</div>'+
    '<h1 style="font-size:23px;margin:6px 0 2px;color:#0F141A;font-weight:600">SC Szkaliczki Service SRL</h1>'+
    '<p style="color:#5C6571;font-size:14px;margin:0 0 20px">Bejelentkezés</p>'+
    '<label style="display:block;font-size:13px;color:#3F4956;margin-bottom:4px">Felhasználó</label>'+
    '<select id="sbUser" style="width:100%;font:inherit;font-size:15px;padding:11px;border:1px solid #D7DBE2;border-radius:9px;margin-bottom:12px">'+
      '<option value="ferenc@szkaliczki.local">Szkaliczki Ferenc — ügyvezető</option>'+
      '<option value="yvonne@szkaliczki.local">Szkaliczki Yvonne — HR és pénzügy</option>'+
      '<option value="david@szkaliczki.local">Szkaliczki David — recepció</option>'+
      '<option value="denisa@szkaliczki.local">Lukaci Denisa — HR és marketing</option>'+
      '<option value="robert@szkaliczki.local">Szkaliczki Robert — adminisztráció</option>'+
      '<option value="gyorgy@szkaliczki.local">Gyárfás György — műhely</option></select>'+
    '<label style="display:block;font-size:13px;color:#3F4956;margin-bottom:4px">Jelszó</label>'+
    '<input id="sbPass" type="password" placeholder="Jelszó" style="width:100%;font:inherit;font-size:15px;padding:11px;border:1px solid #D7DBE2;border-radius:9px;margin-bottom:16px">'+
    '<button id="sbGo" style="width:100%;font:inherit;font-weight:600;font-size:15px;padding:12px;border:0;border-radius:9px;background:#E11D2E;color:#fff;cursor:pointer">Belépés</button>'+
    '<div id="sbErr" style="color:#C81E33;font-size:13px;margin-top:12px;min-height:18px"></div></div>';
  document.body.appendChild(d);
  if(msg)document.getElementById('sbErr').textContent=msg;
  document.getElementById('sbPass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  document.getElementById('sbGo').onclick=doLogin;
  setTimeout(function(){document.getElementById('sbPass').focus();},100);
}
function esc0(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function firstName(n){var p=String(n||'').trim().split(/\s+/);return p.length?p[p.length-1]:'';}
function fold(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function overlay(html){
  var old=document.getElementById('sbPwBox'); if(old)old.remove();
  var d=document.createElement('div');d.id='sbPwBox';
  d.style.cssText='position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#fff,#F4F1EC);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif';
  d.innerHTML='<div style="background:#fff;border:1px solid #D7DBE2;border-radius:16px;padding:30px 32px;width:min(430px,92vw);box-shadow:0 10px 40px rgba(0,0,0,.08)">'+html+'</div>';
  document.body.appendChild(d); return d;
}
var FIELD='width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:11px;border:1px solid #D7DBE2;border-radius:9px;margin-bottom:12px';
function pwScreen(forced){
  var d=overlay(
    '<div style="color:#E11D2E;font-weight:800;letter-spacing:.12em;font-size:12px">'+(forced?'ELSŐ BELÉPÉS':'JELSZÓCSERE')+'</div>'+
    '<h1 style="font-size:22px;margin:6px 0 4px;color:#0F141A;font-weight:600">'+esc0(me.full_name||'')+'</h1>'+
    '<p style="color:#5C6571;font-size:14px;margin:0 0 16px">'+(forced?'A kezdőjelszót le kell cserélni. Addig a rendszer nem nyílik meg.':'Adja meg az új jelszót.')+'</p>'+
    '<label style="display:block;font-size:13px;color:#3F4956;margin-bottom:4px" for="pw1">Új jelszó</label>'+
    '<input id="pw1" type="password" autocomplete="new-password" style="'+FIELD+'">'+
    '<label style="display:block;font-size:13px;color:#3F4956;margin-bottom:4px" for="pw2">Új jelszó még egyszer</label>'+
    '<input id="pw2" type="password" autocomplete="new-password" style="'+FIELD+'">'+
    '<ul style="margin:0 0 14px;padding-left:18px;color:#5C6571;font-size:12.5px;line-height:1.6">'+
      '<li>legalább 10 karakter</li><li>ne tartalmazza a keresztnevét</li><li>ne a kezdőjelszó mintája legyen (név + 2026!)</li><li>senkinek ne mondja el — a rendszer az Ön nevén rögzít</li></ul>'+
    '<button id="pwGo" style="width:100%;font:inherit;font-weight:600;font-size:15px;padding:12px;border:0;border-radius:9px;background:#E11D2E;color:#fff;cursor:pointer">Jelszó mentése</button>'+
    (forced?'<button id="pwOut" style="width:100%;margin-top:8px;font:inherit;font-size:14px;padding:10px;border:1px solid #D7DBE2;border-radius:9px;background:#fff;cursor:pointer">Kilépés</button>'
           :'<button id="pwCancel" style="width:100%;margin-top:8px;font:inherit;font-size:14px;padding:10px;border:1px solid #D7DBE2;border-radius:9px;background:#fff;cursor:pointer">Mégse</button>')+
    '<div id="pwErr" role="alert" style="color:#C81E33;font-size:13px;margin-top:12px;min-height:18px"></div>');
  var err=d.querySelector('#pwErr');
  if(d.querySelector('#pwOut'))d.querySelector('#pwOut').onclick=async function(){await sb.auth.signOut();location.reload();};
  if(d.querySelector('#pwCancel'))d.querySelector('#pwCancel').onclick=function(){ if(!window.RA_SB) location.reload(); else d.remove(); };
  d.querySelector('#pw2').addEventListener('keydown',function(e){if(e.key==='Enter')d.querySelector('#pwGo').click();});
  d.querySelector('#pwGo').onclick=async function(){
    var a=d.querySelector('#pw1').value, b=d.querySelector('#pw2').value, fn=fold(firstName(me.full_name));
    if(a.length<10){err.textContent='Legalább 10 karakter kell.';return;}
    if(a!==b){err.textContent='A két jelszó nem egyezik.';return;}
    if(fn&&fold(a).indexOf(fn)>=0){err.textContent='A jelszó nem tartalmazhatja a keresztnevét.';return;}
    if(/2026!?$/.test(a)&&fn&&fold(a).replace(/[^a-z]/g,'').length<=fn.length+1){err.textContent='Ez túl közel van a kezdőjelszó mintájához.';return;}
    err.style.color='#3F4956'; err.textContent='Mentés…';
    var r=await sb.auth.updateUser({password:a});
    if(r.error){err.style.color='#C81E33';err.textContent='Nem sikerült: '+r.error.message;return;}
    var k=await sb.rpc('f_jelszo_csere_kesz');
    if(k.error){err.style.color='#C81E33';err.textContent='A jelszó mentve, de a zárolás nem oldódott fel: '+k.error.message;return;}
    err.style.color='#1E9D55'; err.textContent='Jelszó mentve.';
    setTimeout(function(){location.reload();},700);
  };
  setTimeout(function(){d.querySelector('#pw1').focus();},100);
}
function noAccessScreen(){
  var d=overlay('<div style="color:#E11D2E;font-weight:800;letter-spacing:.12em;font-size:12px">SZERVEZÉSI TÁBLA</div>'+
    '<h1 style="font-size:22px;margin:6px 0 8px;color:#0F141A;font-weight:600">'+esc0(me.full_name||'')+'</h1>'+
    '<p style="color:#5C6571;font-size:14px;margin:0 0 16px">Ez a felület irodai jogosultsághoz kötött. A műhely-nézet külön készül.</p>'+
    '<button id="naPw" style="width:100%;font:inherit;font-size:14px;padding:10px;border:1px solid #D7DBE2;border-radius:9px;background:#fff;cursor:pointer;margin-bottom:8px">Jelszócsere</button>'+
    '<button id="naOut" style="width:100%;font:inherit;font-weight:600;font-size:15px;padding:12px;border:0;border-radius:9px;background:#E11D2E;color:#fff;cursor:pointer">Kilépés</button>');
  d.querySelector('#naOut').onclick=async function(){await sb.auth.signOut();location.reload();};
  d.querySelector('#naPw').onclick=function(){pwScreen(false);};
}
async function doLogin(){
  var email=document.getElementById('sbUser').value,pass=document.getElementById('sbPass').value,err=document.getElementById('sbErr');
  err.textContent='Bejelentkezés…';
  var r=await sb.auth.signInWithPassword({email:email,password:pass});
  if(r.error){err.textContent='Hibás jelszó vagy felhasználó.';return;}
  location.reload();
}

/* Supabase → ST.store (a fájl scoped kulcs formátumában: m3|div|dept|id) */
async function buildStore(){
  var store={};
  var emps=(await sb.from('employees').select('id,name').eq('is_active',true)).data||[];
  var byId={}; emps.forEach(function(e){byId[e.id]=e.name;});
  // alosztályok (admin_dept) → dept vezető + cél/vfp/kpi
  var depts=(await sb.from('admin_dept').select('*')).data||[];
  depts.forEach(function(d){
    // a fájl a dept vezetőt 'departments|<div>' vagy dept-kulcson tárolja; a leader nevét tesszük be
    store['m3|dept|'+d.dept_code]={name:d.leader_id?byId[d.leader_id]:'',
      purpose:d.purpose_hu,vfp:d.vfp_hu,kpi:d.kpi_hu};
  });
  // feladatkörök (admin_core) → felelős/ellenőrző a scoped kulcson
  var core=(await sb.from('admin_core').select('*').order('sort_order')).data||[];
  core.forEach(function(r){
    var key='m3|'+r.division+'|'+r.dept_code+'|'+r.id;
    store[key]={who:r.owner_id?byId[r.owner_id]:'', reviewer:r.reviewer_id?byId[r.reviewer_id]:'',
      _id:r.id, _owner:r.owner_id, _reviewer:r.reviewer_id};
  });
  store.__employees=emps;  // segéd
  return store;
}

/* persist() átkötése: a fájl ST.store-jából visszaírjuk a felelős/ellenőrző változásokat */
async function pushStore(store){
  var emps=store.__employees||[]; var byName={}; emps.forEach(function(e){byName[e.name]=e.id;});
  var updates=[];
  Object.keys(store).forEach(function(k){
    var m=k.match(/^m3\|(\d)\|([\d.]+)\|(.+)$/); if(!m)return;
    var v=store[k]; if(!v||!v._id)return;
    var newOwner=v.who?byName[v.who]:null, newRev=v.reviewer?byName[v.reviewer]:null;
    if(newOwner!==v._owner || newRev!==v._reviewer){
      updates.push({id:v._id,owner_id:newOwner,reviewer_id:newRev});
      v._owner=newOwner; v._reviewer=newRev;
    }
  });
  for(var i=0;i<updates.length;i++){
    await sb.from('admin_core').update({owner_id:updates[i].owner_id,reviewer_id:updates[i].reviewer_id,updated_at:new Date().toISOString()}).eq('id',updates[i].id);
  }
}

function showBootError(step,err){
  var m=(err&&err.message)||err||'ismeretlen hiba';
  document.body.innerHTML='<div style="padding:40px;font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;background:#fff;border:2px solid #E11D2E;border-radius:16px">'+
    '<h2 style="color:#E11D2E;margin:0 0 12px">Indítási hiba — '+step+'</h2>'+
    '<p style="color:#5C6571;line-height:1.5">A szervezési tábla nem tudott betöltődni. Hibaüzenet:</p>'+
    '<pre style="background:#F4F1EC;padding:12px;border-radius:8px;font-size:13px;overflow:auto;white-space:pre-wrap">'+String(m).replace(/</g,'&lt;')+'</pre>'+
    '<p style="color:#5C6571;line-height:1.5;margin-top:16px"><b>Ellenőrzés:</b></p>'+
    '<ul style="color:#5C6571;line-height:1.6"><li>Internet-kapcsolat él?</li><li>A lap <b>file://</b>-ről (dupla kattintás) vagy <b>Netlify-ról</b> (https://...) nyitottad meg?</li><li>Böngésző F12 → Console fülön mi a piros hibaüzenet?</li></ul>'+
    '<button onclick="location.reload()" style="margin-top:16px;background:#E11D2E;color:#fff;border:0;border-radius:8px;padding:10px 20px;font:600 14px/1 system-ui;cursor:pointer">Újratöltés</button>'+
    '</div>';
}

async function boot(){
  // 1. Supabase SDK ellenőrzés (már a HEAD-ben betöltve kéne lennie)
  if(!window.supabase){
    try{await loadSDK();}
    catch(e){showBootError('Supabase SDK betöltése',e);return;}
  }
  // 2. Client létrehozás
  try{ sb=window.supabase.createClient(SB_URL,SB_KEY); }
  catch(e){showBootError('Supabase kliens létrehozása',e);return;}
  // 3. Session lekérdezés
  var s;
  try{ s=await sb.auth.getSession(); }
  catch(e){showBootError('Session lekérdezése',e);return;}
  if(!s.data.session){loginScreen();return;}
  // 4. Profil lekérés
  var pr;
  try{ pr=await sb.from('profiles').select('role,full_name,must_change_password').eq('id',s.data.session.user.id).single(); }
  catch(e){showBootError('Profil lekérdezése',e);return;}
  me=pr.data||{role:'?'};
  if(me.must_change_password){ pwScreen(true); return; }
  if(['owner','admin','reception'].indexOf(me.role)<0){ noAccessScreen(); return; }
  // az ST.store feltöltése a Supabase-ből, MIELŐTT a fájl render()-e fut
  try{
    var store=await buildStore();
    // a fájl globális ST objektumába írjuk
    if(window.ST){ window.ST.store=store; }
    else { window.ST={store:store}; }
    // persist átkötése
    var origPersist=window.persist;
    window.persist=function(){ pushStore(window.ST.store).catch(function(e){console.error(e);}); return true; };
    // fejléc sáv
    var bar=document.createElement('div');
    bar.style.cssText='position:fixed;top:0;right:0;z-index:9998;background:#0F141A;color:#fff;font:12px system-ui;padding:6px 12px;border-bottom-left-radius:10px';
    bar.innerHTML=esc0(me.full_name||'')+' · '+me.role+' &nbsp; <a href="#" id="sbPw" style="color:#fff;opacity:.8">Jelszó</a> &nbsp; <a href="#" id="sbOut" style="color:#FF8A94">Kilépés</a>';
    document.body.appendChild(bar);
    document.getElementById('sbPw').onclick=function(ev){ev.preventDefault();pwScreen(false);};
    document.getElementById('sbOut').onclick=async function(ev){ev.preventDefault();await sb.auth.signOut();location.reload();};
    window.RA_SB={client:sb,me:me};
    if(typeof window.render==='function') window.render(); try{setBoardZoom(boardZoom);}catch(_){}
    if(window.ADMIN){ await window.ADMIN.load(sb); window.ADMIN.render(); }
    var _r=window.render; window.render=function(){_r(); if(window.BOARD_CHAIN)window.BOARD_CHAIN.decorate();}; var _g=window.renderGrid; if(typeof _g==='function'){window.renderGrid=function(){var x=_g.apply(this,arguments); if(window.BOARD_CHAIN)window.BOARD_CHAIN.decorate(); return x;};}
  }catch(e){console.error(e);alert('Adatbetöltés hiba: '+e.message);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
})();

