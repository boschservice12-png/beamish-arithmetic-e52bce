
(function(){
'use strict';
var SB_URL=window.ADMINCORE_CFG.supabaseUrl, SB_KEY=window.ADMINCORE_CFG.supabaseKey;
var sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:false}});
var KIND={off:{e:'🌴',hu:'Szabadnap',cls:'hr',area:'HR'},tool:{e:'🔧',hu:'Szerszám',cls:'ws',area:'Műhely'},aid:{e:'🧰',hu:'Segédeszköz',cls:'ws',area:'Műhely'}};
var ST={new:['Új','wait'],ok:['Jóváhagyva','ok'],no:['Elutasítva','no'],given:['Kiadva','ok']};
var ROLE={owner:'tulajdonos',hr:'HR',workshop:'műhely'};
// Alap kötelességkör, ha a munkalap még üres (szerkeszthető, kiadás előtt)
var DUTY=['A kiosztott munkát a telefonon indítja és zárja (START / SZÜNET / KÉSZ) – az idő mért, nem beírt.','Megálláskor mindig megadja a szünet okát (alkatrész, szerszám, dokumentáció…).','Extra munkát csak a recepció jóváhagyása után kezd el.','A kész munkát végellenőrzésre adja – más személy ellenőrzi, mért értékkel.','A műszak végén a rampát és a szerszámokat rendben, a helyükön hagyja.','Hibát, balesetveszélyt, hiányt azonnal jelez az irodának a telefonon.','Hiányzásnál a helyettese veszi át a munkáját; szabadnapot előre kér (Yvonne).'];
var key=null, me=null, tab='inbox', req=[], docs=[], sheets=[], msgs=[], cimz=[], mech=null, wsel=null, draft={}, poll=null;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function $(id){return document.getElementById(id);}
function fDate(s){if(!s)return '';try{return new Date(s).toLocaleString('hu-HU',{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return '';}}
function toast(s){document.querySelectorAll('.toast').forEach(function(x){x.remove();});var t=document.createElement('div');t.className='toast';t.textContent=s;document.body.appendChild(t);setTimeout(function(){t.remove();},2600);}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}
function canRule(){return me.szerep==='owner'||me.szerep==='hr';}
function canGuide(){return me.szerep==='owner';}
function canSheet(){return me.szerep==='owner'||me.szerep==='hr';}
function fail(r){if(r&&r.error){if(/bad-key/.test(r.error.message)){logout();return true;}toast('Hiba: '+r.error.message);return true;}return false;}

/* ───── BELÉPÉS: személyes iroda-kulcs (ugyanaz, mint a „Küldés a telefonra” kulcs) ───── */
function loginScreen(msg){clearInterval(poll);
  var box=function(inner){$('app').innerHTML='<form class="login" id="lf"><div class="eb">RedAssistance · iroda</div><h1>Teendőim</h1>'+inner+'<div class="err" id="le">'+esc(msg||'')+'</div></form>';};
  var enter=function(k){key=k;lsSet('ra_tf_key',k);sb.rpc('f_tf_ki',{p_key:k}).then(function(r){if(r.error||!r.data||!r.data[0]){lsSet('ra_tf_key',null);key=null;loginScreen('Sikertelen belépés.');return;}me=r.data[0];start();});};
  /* 1) Név */
  box('<div class="muted" style="font-size:14px">Ki vagy?</div><div id="nl" style="display:grid;gap:8px"><div class="muted">…</div></div><a href="#" id="kk" class="muted" style="font-size:13px">Belépés iroda-kulccsal</a>');
  sb.rpc('f_tf_irodasok').then(function(r){var L=r.data||[];$('nl').innerHTML=L.length?L.map(function(x){return '<button type="button" class="btn" data-ne="'+x.employee_id+'">'+esc(x.nev)+'</button>';}).join(''):'<div class="err">Nincs elérhető név.</div>';
    $('nl').querySelectorAll('[data-ne]').forEach(function(b){b.onclick=function(){pinStep(b.getAttribute('data-ne'),b.textContent);};});});
  $('kk').onclick=function(e){e.preventDefault();msg='';
    box('<div class="muted" style="font-size:14px">Add meg a személyes iroda-kulcsodat.</div><input id="lk" type="password" autocomplete="current-password" placeholder="Iroda-kulcs" required><button class="btn pri" type="submit">Belépés</button>');
    $('lk').focus();$('lf').onsubmit=async function(e){e.preventDefault();var k=$('lk').value.trim();if(!k)return;var r=await sb.rpc('f_tf_ki',{p_key:k});
      if(r.error||!r.data||!r.data[0]){$('le').textContent='Érvénytelen kulcs.';return;}key=k;me=r.data[0];lsSet('ra_tf_key',k);start();};};
  /* 2) PIN (induló: 1234) */
  function pinStep(emp,nev){msg='';box('<div class="muted" style="font-size:14px">'+esc(nev)+' · PIN</div><input id="lp" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="PIN" required><button class="btn pri" type="submit">Belépés</button><a href="#" id="bk" class="muted" style="font-size:13px">‹ Vissza</a>');
    $('bk').onclick=function(e){e.preventDefault();loginScreen();};$('lp').focus();
    $('lf').onsubmit=async function(e){e.preventDefault();var r=await sb.rpc('f_pin_login',{p_emp:emp,p_pin:$('lp').value.trim(),p_device:'teendoim'});
      if(r.error||!r.data||!r.data[0]){$('le').textContent='Rossz PIN.';$('lp').value='';return;}
      var tok=r.data[0].token, m=await sb.rpc('f_pin_must_change',{p_token:tok});
      if(m.data===true)newPin(tok,nev);else enter(tok);};}
  /* 3) Kötelező saját PIN az induló 1234 után */
  function newPin(tok,nev){box('<div class="muted" style="font-size:14px">'+esc(nev)+' · Válassz új, saját PIN-t (4 számjegy, nem 1234)</div><input id="n1" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="Új PIN" required><input id="n2" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="Új PIN még egyszer" required><button class="btn pri" type="submit">Mentés és belépés</button>');
    $('n1').focus();
    $('lf').onsubmit=async function(e){e.preventDefault();var a=$('n1').value.trim(),b=$('n2').value.trim();
      if(!/^[0-9]{4}$/.test(a)||a==='1234'){$('le').textContent='4 számjegy kell, és nem lehet 1234.';return;}
      if(a!==b){$('le').textContent='A két PIN nem egyezik.';return;}
      var r=await sb.rpc('f_change_own_pin',{p_token:tok,p_new:a});if(r.error){$('le').textContent='Hiba: '+r.error.message;return;}
      enter(tok);};}
}
function logout(){lsSet('ra_tf_key',null);key=null;me=null;loginScreen('Kijelentkeztél.');}
async function start(){$('app').innerHTML='<div class="wrap"><div class="empty">Betöltés…</div></div>';await refresh();clearInterval(poll);poll=setInterval(function(){if(!document.hidden&&!busy())refresh();},20000);}
function busy(){var a=document.activeElement;return a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.value;}

/* ───── ADATOK ───── */
async function refresh(){
  var r=await Promise.all([sb.rpc('f_tf_keresek',{p_key:key}),sb.rpc('f_tf_dokok',{p_key:key}),sb.rpc('f_tf_munkalapok',{p_key:key}),sb.rpc('f_tf_uzenetek',{p_key:key}),sb.rpc('f_tf_cimzettek',{p_key:key})]);
  for(var i=0;i<r.length;i++)if(fail(r[i]))return;
  req=r[0].data||[];docs=r[1].data||[];sheets=r[2].data||[];msgs=r[3].data||[];cimz=r[4].data||[];
  if(!mech&&sheets[0])mech=sheets[0].employee_id;
  if(!wsel&&sheets[0])wsel=sheets[0].employee_id;
  render();}

/* ───── KÉPERNYŐ ───── */
function render(){
  var nNew=req.filter(function(x){return x.status==='new';}).length;
  var nUns=sheets.filter(function(s){return s.kiadva_at&&!s.atvette_at;}).length;
  var nMsg=msgs.filter(function(m){return m.uj;}).length;
  var T=[['inbox','📥 Kérések',req.length,nNew],['rule','📕 Szabályok és irányelvek',docs.filter(function(d){return d.cat==='rule';}).length,0],
    ['guide','🛠 Javítási útmutatók',docs.filter(function(d){return d.cat==='guide';}).length,0],['sheet','🗂 Munkalapok',nUns,0],['msg','💬 Üzenetek',nMsg,nMsg]];
  $('app').innerHTML='<div class="wrap"><div class="win"><div class="ahdr"><div><div class="eb">Admin · iroda</div><h1>Teendőim</h1></div>'+
    '<div class="who"><span>Belépve: <b>'+esc(me.nev)+'</b> · '+esc(ROLE[me.szerep]||me.szerep)+'</span><button class="btn" id="rf" title="Frissítés">↻</button><button class="btn out" id="lo">Kilépés</button></div></div>'+
    '<nav class="tabs">'+T.map(function(x){return '<button class="tab '+(x[0]===tab?'on':'')+'" data-tab="'+x[0]+'">'+x[1]+'<span class="c '+(x[3]?'hot':'')+'">'+x[2]+'</span></button>';}).join('')+'</nav>'+
    '<div class="apane" id="apane"></div></div></div>';
  var P=$('apane');
  if(tab==='inbox')P.innerHTML=inboxPane();
  if(tab==='rule'||tab==='guide')P.innerHTML=docsPane(tab);
  if(tab==='sheet')P.innerHTML=sheetPane();
  if(tab==='msg'){P.innerHTML=msgPane();var c=$('chat');if(c)c.scrollTop=c.scrollHeight;
    if(msgs.some(function(m){return m.uj&&m.employee_id===mech;}))sb.rpc('f_tf_uzenet_olvastam',{p_key:key,p_emp:mech}).then(function(){msgs.forEach(function(m){if(m.employee_id===mech)m.uj=false;});});}
}
function inboxPane(){
  var who=me.szerep==='hr'?'Neked a HR-kérések jönnek (szabadnap).':me.szerep==='workshop'?'Neked a műhelykérések jönnek (szerszám, segédeszköz).':'Tulajdonosként minden kérést látsz és dönthetsz.';
  return '<div class="muted">'+who+' Az elmúlt 14 nap és minden nyitott kérés.</div>'+(req.length?req.map(function(r){var K=KIND[r.tipus]||{e:'❔',hu:r.tipus,cls:'',area:''},S=ST[r.status]||[r.status,''];
    return '<div class="item"><div class="ico '+K.cls+'">'+K.e+'</div><div><div class="t">'+esc(K.hu)+': '+esc(r.cim)+'</div><div class="m"><span>'+esc(r.employee)+'</span><span>'+fDate(r.created_at)+'</span><span class="pill '+(K.cls==='hr'?'hr':'wait')+'">'+K.area+'</span></div></div>'+
      '<span class="pill '+S[1]+'">'+S[0]+'</span>'+(r.indok?'<div class="note">'+esc(r.indok)+'</div>':'')+
      (r.status!=='new'&&(r.valasz||r.dontotte)?'<div class="note">↩ '+esc(r.dontotte||'')+(r.valasz?': '+esc(r.valasz):'')+'</div>':'')+
      (r.status==='new'?'<div class="acts"><input id="ans-'+r.id+'" placeholder="Válasz (nem kötelező)" style="flex:1;min-width:180px"><button class="btn ok" data-r="ok" data-id="'+r.id+'">✓ Jóváhagyom</button><button class="btn out" data-r="no" data-id="'+r.id+'">Elutasítom</button>'+(r.tipus!=='off'?'<button class="btn" data-r="given" data-id="'+r.id+'">Kiadva</button>':'')+'</div>':'')+'</div>';}).join(''):'<div class="empty">Nincs kérés.</div>');}
function docsPane(cat){
  var can=cat==='guide'?canGuide():canRule();
  var types=cat==='guide'?['Javítási útmutató']:(me.szerep==='hr'?['Irányelv','Szabály']:['Szabály','Irányelv']);
  var L=docs.filter(function(d){return d.cat===cat;});
  var form=can?'<div class="box"><div class="form"><label>Típus<select id="dT">'+types.map(function(x){return '<option>'+x+'</option>';}).join('')+'</select></label>'+
    '<label>Kinek<select id="dTo"><option value="">Minden szerelő</option>'+cimz.map(function(e){return '<option value="'+e.id+'">'+esc(e.name)+'</option>';}).join('')+'</select></label>'+
    '<label class="full">Cím<input id="dC" maxlength="300" placeholder="'+(cat==='guide'?'pl. DSG olajcsere – lépések és nyomaték':'pl. RG-PROD-01 · Extra munka csak jóváhagyás után indul')+'"></label>'+
    '<label class="full">Szöveg<textarea id="dS" rows="5" placeholder="A telefonon ez jelenik meg a szerelőnek."></textarea></label></div>'+
    '<div style="margin-top:10px"><button class="btn pri" data-a="pub" data-cat="'+cat+'">'+(cat==='guide'?'🛠':'📕')+' Kiadás a telefonokra</button></div></div>'
    :'<div class="muted">'+(cat==='guide'?'Javítási útmutatót Ferenc ad ki.':'Szabályt Ferenc, irányelvet és szabályt Yvonne ad ki.')+' Itt látod, ki olvasta el.</div>';
  return form+(L.length?L.map(function(d){var y=d.olvasta||[],n=d.nem_olvasta||[],tot=y.length+n.length;
    return '<div class="item"><div class="ico '+(cat==='guide'?'ws':'hr')+'">'+(cat==='guide'?'🛠':'📕')+'</div><div><div class="t">'+esc(d.tipus)+': '+esc(d.cim)+'</div><div class="m"><span>'+esc(d.kuldo)+' adta ki</span><span>'+fDate(d.created_at)+'</span><span>'+(d.cimzett?esc(d.cimzett):'minden szerelő')+'</span></div></div>'+
      '<span class="pill '+(n.length===0?'ok':'wait')+'">'+y.length+'/'+tot+' olvasta</span>'+
      '<div class="reads">'+y.map(function(x){return '<span class="y">✓ '+esc(x)+'</span>';}).join('')+n.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>'+
      (me.szerep==='owner'||d.kuldo===me.nev?'<div class="acts"><button class="btn sm out" data-a="unpub" data-id="'+d.id+'">Visszavonás</button></div>':'')+'</div>';}).join(''):'<div class="empty">Még nincs kiadott dokumentum.</div>');}
function sheetPane(){
  var S=sheets.find(function(s){return s.employee_id===wsel;});if(!S)return '<div class="empty">Nincs szerelő PIN-kóddal.</div>';
  var can=canSheet(), D=draft[wsel]||(S.pontok&&S.pontok.length?S.pontok.slice():DUTY.slice());draft[wsel]=D;
  var st=!S.kiadva_at?['Még nincs kiadva','']:S.atvette_at?['Átvette és elfogadta · '+fDate(S.atvette_at),'ok']:['Kiadva '+fDate(S.kiadva_at)+' ('+esc(S.kiadta||'')+') · még nem vette át','wait'];
  return '<div class="form"><label>Munkalap<select id="wSel">'+sheets.map(function(s){return '<option value="'+s.employee_id+'"'+(s.employee_id===wsel?' selected':'')+'>'+esc(s.name)+(s.atvette_at?' ✓':s.kiadva_at?' ⏳':'')+'</option>';}).join('')+'</select></label>'+
    '<label>Állapot<span class="pill '+st[1]+'" style="justify-self:start;margin-top:6px">'+st[0]+'</span></label></div>'+
    '<div class="item" style="grid-template-columns:44px minmax(0,1fr)"><div class="ico">🗂</div><div><div class="t">'+esc(S.name)+(S.poszt?' · '+esc(S.poszt):'')+'</div><div class="m">'+(S.helyettes?'<span>Helyettes: '+esc(S.helyettes)+'</span>':'<span>Helyettes nincs megadva</span>')+'</div></div></div>'+
    '<div class="box"><div class="t" style="font-weight:600;margin-bottom:8px">Feladat- és kötelességkör</div><ol class="duty">'+D.map(function(d,i){return '<li>'+esc(d)+(can?' <button class="btn sm" data-a="deld" data-i="'+i+'" aria-label="Törlés">✕</button>':'')+'</li>';}).join('')+'</ol>'+
    (can?'<div class="send" style="margin-top:10px"><input id="dNew" placeholder="Új kötelesség hozzáadása…"><button class="btn" data-a="addd">+ Hozzáad</button></div>'+
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn pri" data-a="sendsheet">🗂 Kiadás átvételre a telefonra</button><button class="btn" data-a="savesheet">Mentés kiadás nélkül</button><span class="muted" style="font-size:13px">Kiadás után a szerelőnek újra át kell vennie.</span></div>'
      :'<div class="muted" style="margin-top:8px;font-size:13px">A munkalapot Yvonne (HR) vagy Ferenc szerkeszti.</div>')+'</div>';}
function msgPane(){
  var th=msgs.filter(function(m){return m.employee_id===mech;});
  var unr={};msgs.forEach(function(m){if(m.uj)unr[m.employee_id]=(unr[m.employee_id]||0)+1;});
  var name=(sheets.find(function(s){return s.employee_id===mech;})||{}).name||'';
  return '<div class="form"><label>Beszélgetés ezzel a szerelővel<select id="mSel">'+sheets.map(function(s){return '<option value="'+s.employee_id+'"'+(s.employee_id===mech?' selected':'')+'>'+esc(s.name)+(unr[s.employee_id]?' ('+unr[s.employee_id]+' új)':'')+'</option>';}).join('')+'</select></label></div>'+
    '<div class="chat" id="chat">'+(th.length?th.map(function(m){return '<div class="bub '+(m.irodatol?'me':'them')+'">'+esc(m.szoveg)+'<small>'+esc(m.irodatol?m.szerzo:m.employee)+' · '+fDate(m.created_at)+'</small></div>';}).join(''):'<div class="empty">Még nincs üzenet (30 nap).</div>')+'</div>'+
    '<div class="send"><input id="mTxt" maxlength="2000" placeholder="Üzenet '+esc(name)+' telefonjára…"><button class="btn pri" data-a="msg">Küldés</button></div>'+
    '<div class="muted" style="font-size:13px">Szerelőnként egy közös szál – Ferenc, Yvonne és David ugyanazt látja.</div>';}

/* ───── MŰVELETEK ───── */
document.addEventListener('change',function(e){
  if(e.target.id==='mSel'){mech=e.target.value;render();}
  if(e.target.id==='wSel'){wsel=e.target.value;render();}});
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='mTxt'){e.preventDefault();var b=document.querySelector('[data-a="msg"]');if(b)b.click();}});
document.addEventListener('click',async function(e){
  if(!me)return;
  if(e.target.id==='lo'){logout();return;}
  if(e.target.id==='rf'){refresh();return;}
  var tb=e.target.closest('[data-tab]');if(tb){tab=tb.getAttribute('data-tab');render();return;}
  var r=e.target.closest('[data-r]');if(r&&!r.disabled){var id=r.getAttribute('data-id'),a=$('ans-'+id);r.disabled=true;
    var q=await sb.rpc('f_tf_keres_dont',{p_key:key,p_id:id,p_status:r.getAttribute('data-r'),p_valasz:a?a.value.trim()||null:null});
    if(!fail(q)){toast(q.data?'Rögzítve – a szerelő telefonján azonnal látszik':'Ehhez a kéréshez nincs jogod');}await refresh();return;}
  var b=e.target.closest('[data-a]');if(!b||b.disabled)return;var A=b.getAttribute('data-a');
  if(A==='pub'){var c=$('dC').value.trim();if(!c){$('dC').focus();return;}b.disabled=true;
    var p=await sb.rpc('f_tf_dok_kiad',{p_key:key,p_cat:b.getAttribute('data-cat'),p_tipus:$('dT').value,p_cim:c,p_szoveg:$('dS').value.trim(),p_cimzett:$('dTo').value||null});
    if(!fail(p))toast('Kiadva – a telefonokon piros szám jelzi');await refresh();return;}
  if(A==='unpub'){if(!confirm('Visszavonod ezt a dokumentumot? A telefonokról eltűnik.'))return;b.disabled=true;
    var u=await sb.rpc('f_tf_dok_visszavon',{p_key:key,p_id:b.getAttribute('data-id')});if(!fail(u))toast('Visszavonva');await refresh();return;}
  if(A==='addd'){var v=$('dNew').value.trim();if(!v)return;draft[wsel].push(v);render();return;}
  if(A==='deld'){draft[wsel].splice(+b.getAttribute('data-i'),1);render();return;}
  if(A==='sendsheet'||A==='savesheet'){if(!draft[wsel].length){toast('Legalább egy kötelesség kell');return;}b.disabled=true;
    var s=await sb.rpc('f_tf_munkalap_ment',{p_key:key,p_emp:wsel,p_pontok:draft[wsel],p_kiad:A==='sendsheet'});
    if(!fail(s)){delete draft[wsel];toast(A==='sendsheet'?'Munkalap kiadva átvételre a telefonra':'Mentve (nincs kiadva)');}await refresh();return;}
  if(A==='msg'){var t=$('mTxt').value.trim();if(!t||!mech)return;b.disabled=true;
    var m=await sb.rpc('f_tf_uzenet_kuld',{p_key:key,p_emp:mech,p_szoveg:t});if(!fail(m))toast('Elküldve a szerelő telefonjára');await refresh();return;}
});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&me&&!busy())refresh();});

(async function(){var k=lsGet('ra_tf_key');if(!k){loginScreen();return;}
  var r=await sb.rpc('f_tf_ki',{p_key:k});if(r.error||!r.data||!r.data[0]){lsSet('ra_tf_key',null);loginScreen();return;}
  key=k;me=r.data[0];start();})();
})();
