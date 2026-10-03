
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sb(){return window.RA_SB&&window.RA_SB.client;} function me(){return window.RA_SB&&window.RA_SB.me;}
var view=false, tab='ma', posts=[], roles=[], items=[], emps=[], today=new Date().toISOString().slice(0,10), naplo=[], myEmp=null, sel=null, betolt=[], blap=[], bnap=[], bsel=null;
var LEP=[['l1_toborzas','l1_igazolo','1. Toborzás'],['l2_poszt_tech','l2_igazolo','2. Poszt technológiája'],['l3_kalapozas','l3_igazolo','3. Kalapozás'],['l4_gyakornoksag','l4_igazolo','4. Gyakornokság'],['l5_posztra','l5_igazolo','5. Posztra helyezés']];
var KAD={napi:'napi',heti:'heti',ketheti:'kétheti',havi:'havi',eves:'éves',allando:'állandó'}, SZ={feladatado:'feladatadó',elvegzo:'elvégző',vizsgalo:'vizsgáló'}, TIP={ellenorzo_pont:'ellenőrző pont',iranyelv:'irányelv',szabaly:'szabály'};
function injectNav(){var n=window.RA_NAV&&window.RA_NAV.box&&window.RA_NAV.box();if(!n||n.querySelector('[data-adm5]'))return;var b=document.createElement('button');b.type='button';b.className='adm-item';b.setAttribute('data-adm5','1');b.innerHTML='<span>Munkaposztok · verifikálás</span><span class="adm-b" id="verB"></span>';n.appendChild(b);}
var lastErr='';
async function load(){var s=sb();if(!s){lastErr='Nincs Supabase kapcsolat (RA_SB.client hiányzik).';return;}
  lastErr='';
  try{
  var uid=me()&&me().id;
  var r=await Promise.all([s.from('hr_munkaposzt').select('*').order('kod'),s.from('hr_munkaposzt_szemely').select('*'),s.from('hr_verif_lista').select('*').order('munkaposzt').order('sorszam'),
    s.from('employees').select('id,name,department').is('deleted_at',null).eq('is_active',true).order('name'),s.rpc('f_verif_generalas',{p_datum:today}),s.from('v_verif_ma').select('*').eq('esedekes',today).order('munkaposzt').order('sorszam'),
    uid?s.from('profiles').select('employee_id').eq('id',uid).maybeSingle():Promise.resolve({data:null}),s.from('hr_poszt_betoltes').select('*'),s.from('hr_betanulasi_lap').select('*').eq('aktiv',true).order('munkaposzt').order('sorszam'),s.from('hr_betanulasi_naplo').select('*')]);
  var errs=r.map(function(x,i){return x&&x.error?('#'+i+' '+x.error.message):null;}).filter(Boolean);
  if(errs.length)lastErr=errs.join(' | ');
  posts=r[0].data||[];roles=r[1].data||[];items=r[2].data||[];emps=r[3].data||[];naplo=r[5].data||[];myEmp=r[6].data&&r[6].data.employee_id;betolt=r[7].data||[];blap=r[8].data||[];bnap=r[9].data||[];
  }catch(ex){lastErr=String(ex&&ex.message||ex);console.error('RA_VERIF load',ex);}
  var b=document.getElementById('verB');if(b)b.textContent=naplo.filter(function(x){return x.allapot==='nyitott'||x.allapot==='elvegezve';}).length||'';}
function en(id){var e=emps.find(function(x){return x.id===id;});return e?e.name:'—';}
function paint(){var root=document.getElementById('adminRoot');if(!root||!view)return;
  var h='<div class="adm-h"><span class="adm-eb">HR</span><h2>Munkaposztok · verifikáló lista</h2></div>'+(lastErr?'<div class="adm-warn">Betöltési hiba: '+esc(lastErr)+'</div>':'')+(!lastErr&&!posts.length?'<div class="adm-warn">A lekérdezés lefutott, de 0 munkaposzt jött vissza — jogosultság (RLS) vagy üres tábla.</div>':'')+
  '<div class="adm-hint">Minden munkaposztnak: <b>általános</b> + <b>specifikus</b> szabályzat, fișa postului, verifikáló lista (ellenőrző pont / irányelv / szabály, kadenciával), és szerepek — feladatadó, elvégző(k), vizsgáló — <b>mindig helyettessel</b>. A vizsgáló lehet a feladatadó, de sosem az, aki elvégezte. Aktív csak az a poszt, amelyiknél mindez megvan.</div>'+
  '<div class="adm-tools">'+[['ma','Ma esedékes'],['posztok','Munkaposztok'],['lista','Listák'],['betoltes','Betöltés · 5 lépés'],['betanulas','Betanulási lap']].map(function(x){return '<button type="button" class="adm-btn'+(tab===x[0]?'':' ghost')+'" data-vtab="'+x[0]+'">'+x[1]+'</button>';}).join(' ')+'</div>';
  if(tab==='ma'){var open=naplo.filter(function(x){return x.allapot==='nyitott';}).length,done=naplo.filter(function(x){return x.allapot==='elvegezve';}).length,ok=naplo.filter(function(x){return x.allapot==='megfelelt';}).length,bad=naplo.filter(function(x){return x.allapot==='hibas';}).length;
    h+='<div class="adm-stats"><div><b>'+naplo.length+'</b>Esedékes ma</div><div class="'+(open?'bad':'')+'"><b>'+open+'</b>Nyitott</div><div><b>'+done+'</b>Elvégezve, vizsgálatra vár</div><div><b>'+ok+'</b>Megfelelt</div><div class="'+(bad?'bad':'')+'"><b>'+bad+'</b>Hibás</div></div>';
    if(!myEmp)h+='<div class="adm-warn">A fiókodhoz nincs alkalmazott rendelve (profiles.employee_id) — elvégezni/vizsgálni nem tudsz, csak nézni.</div>';
    var byP={};naplo.forEach(function(x){(byP[x.poszt]=byP[x.poszt]||[]).push(x);});
    Object.keys(byP).forEach(function(p){h+='<div class="adm-card"><h3>'+esc(p)+' <small style="opacity:.6">elvégző: '+esc(byP[p][0].elvegzok||'—')+' · vizsgáló: '+esc(byP[p][0].vizsgalok||'—')+'</small></h3><table class="adm-t"><thead><tr><th>#</th><th>Ellenőrző pont</th><th>Kadencia</th><th>Állapot</th><th></th></tr></thead><tbody>'+
      byP[p].map(function(x){var st={nyitott:['nyitott','bad'],elvegezve:['elvégezve — vizsgálatra vár','warn'],megfelelt:['megfelelt','ok'],hibas:['HIBÁS','bad'],nem_ertelmezheto:['nem értelmezhető','']}[x.allapot];
        var act='';if(x.allapot==='nyitott')act='<button type="button" class="adm-btn" data-vdone="'+x.naplo_id+'">Elvégeztem</button> <button type="button" class="adm-btn ghost" data-vna="'+x.naplo_id+'">nem értelmezhető</button>';
        else if(x.allapot==='elvegezve')act='<button type="button" class="adm-btn" data-vok="'+x.naplo_id+'">Megfelelt</button> <button type="button" class="adm-btn ghost" data-vbad="'+x.naplo_id+'">Hibás</button>';
        return '<tr><td>'+x.sorszam+'</td><td>'+esc(x.tetel_hu)+(x.forras_doc?' <small style="opacity:.6">'+esc(x.forras_doc)+'</small>':'')+'</td><td>'+KAD[x.kadencia]+'</td><td><span class="adm-tag '+st[1]+'">'+st[0]+'</span>'+(x.elvegezte?'<br><small>'+esc(x.elvegezte)+(x.vizsgalta?' → '+esc(x.vizsgalta):'')+'</small>':'')+(x.megjegyzes?'<br><small>'+esc(x.megjegyzes)+'</small>':'')+'</td><td>'+act+'</td></tr>';}).join('')+'</tbody></table></div>';});
    if(!naplo.length)h+='<div class="adm-hint">Ma nincs esedékes ellenőrző pont (csak aktív posztok, ellenőrző pont típusú tételek).</div>';
  }
  if(tab==='posztok'){h+='<div class="adm-card"><table class="adm-t"><thead><tr><th>Kód</th><th>Munkaposzt</th><th>Osztály</th><th>Általános szab.</th><th>Specifikus szab.</th><th>Fișa</th><th>Szerepek (helyettes)</th><th>Tételek</th><th>Állapot</th></tr></thead><tbody>'+
    posts.map(function(p){var rs=roles.filter(function(r){return r.munkaposzt===p.kod;});var n=items.filter(function(i){return i.munkaposzt===p.kod;}).length;
      var rr=['feladatado','elvegzo','vizsgalo'].map(function(s){var L=rs.filter(function(r){return r.szerep===s;});return L.length?'<b>'+SZ[s]+':</b> '+L.map(function(r){return esc(en(r.employee_id))+' <small>(h: '+esc(en(r.helyettes_id))+')</small>';}).join(', '):'<span class="adm-warn">'+SZ[s]+': nincs</span>';}).join('<br>');
      return '<tr><td><b>'+p.kod+'</b></td><td>'+esc(p.nev_hu)+'<br><small>'+esc(p.nume_ro)+'</small></td><td>'+esc(p.dept_code||'')+'</td><td>'+(p.altalanos_szabalyzat?esc(p.altalanos_szabalyzat):'<span class="adm-tag bad">hiányzik</span>')+'</td><td>'+(p.specifikus_szabalyzat?esc(p.specifikus_szabalyzat):'<span class="adm-tag bad">hiányzik</span>')+'</td><td>'+(p.fisa_postului?esc(p.fisa_postului):'<span class="adm-tag warn">nincs</span>')+'</td><td><small>'+rr+'</small></td><td>'+n+'</td><td>'+(p.aktiv?'<span class="adm-tag ok">aktív</span>':'<span class="adm-tag bad">inaktív</span>')+(p.megjegyzes?'<br><small>'+esc(p.megjegyzes)+'</small>':'')+'<br><button type="button" class="adm-btn ghost" data-kalap="'+p.kod+'" style="margin-top:6px">Kalapdosszié</button></td></tr>';}).join('')+'</tbody></table>'+
    '<div class="adm-hint">Inaktív poszt = hiányzik az általános vagy a specifikus szabályzat, a lista, vagy egy szerep. Az adatbázis nem engedi aktiválni, amíg pótolva nincs.</div></div>';}
  if(tab==='lista'){h+='<div class="adm-tools">'+posts.map(function(p){return '<button type="button" class="adm-btn'+((sel||posts[0].kod)===p.kod?'':' ghost')+'" data-vsel="'+p.kod+'">'+esc(p.nev_hu)+'</button>';}).join(' ')+'</div>';
    var k=sel||posts[0].kod, L=items.filter(function(i){return i.munkaposzt===k;});
    h+='<div class="adm-card"><table class="adm-t"><thead><tr><th>#</th><th>Típus</th><th>Tétel (HU)</th><th>Tétel (RO)</th><th>Kadencia</th><th>Forrás</th><th></th></tr></thead><tbody>'+
      L.map(function(i){return '<tr><td>'+i.sorszam+'</td><td>'+TIP[i.tipus]+'</td><td>'+esc(i.tetel_hu)+'</td><td><small>'+esc(i.tetel_ro||'')+'</small></td><td>'+KAD[i.kadencia]+'</td><td><small>'+esc(i.forras_doc||'')+'</small></td><td><button type="button" class="adm-btn ghost" data-vdel="'+i.id+'">✕</button></td></tr>';}).join('')+'</tbody></table>'+
      '<h3 style="margin-top:14px">Új tétel — '+esc(k)+'</h3><div class="adm-tools" style="flex-wrap:wrap;gap:8px"><select id="vT"><option value="ellenorzo_pont">ellenőrző pont</option><option value="iranyelv">irányelv</option><option value="szabaly">szabály</option></select>'+
      '<input id="vHu" placeholder="tétel magyarul" style="flex:1;min-width:240px"><input id="vRo" placeholder="românește" style="flex:1;min-width:200px"><select id="vK">'+Object.keys(KAD).map(function(x){return '<option value="'+x+'">'+KAD[x]+'</option>';}).join('')+'</select><input id="vDoc" placeholder="forrás doc_code" style="width:130px"><button type="button" class="adm-btn" data-vadd="'+k+'">Hozzáad</button><span id="vMsg" class="adm-hint"></span></div></div>';}
  if(tab==='betoltes'){var done=betolt.filter(function(b){return b.betoltott;}).length;
    h+='<div class="adm-stats"><div><b>'+betolt.length+'</b>Személy × poszt</div><div class="'+(done<betolt.length?'bad':'')+'"><b>'+done+'</b>Betöltött (5/5)</div><div><b>'+(betolt.length-done)+'</b>Nem igazolt</div></div>'+
      '<div class="adm-hint">A poszt csak akkor <b>betöltött</b>, ha mind az öt lépés dátummal és igazolóval áll. Az igazoló nem lehet maga a személy; az 5. csak az 1–4. után. Kattints a cellára: dátum ma, igazoló te.</div>'+
      '<div class="adm-card"><table class="adm-t"><thead><tr><th>Személy</th><th>Poszt</th>'+LEP.map(function(l){return '<th>'+l[2]+'</th>';}).join('')+'<th>Állapot</th></tr></thead><tbody>'+
      betolt.map(function(b){return '<tr><td><b>'+esc(en(b.employee_id))+'</b></td><td>'+esc(b.munkaposzt)+'</td>'+LEP.map(function(l){var d=b[l[0]];return '<td>'+(d?'<span class="adm-tag ok">'+esc(d)+'</span><br><small>'+esc(en(b[l[1]]))+'</small>':'<button type="button" class="adm-btn ghost" data-blep="'+b.id+'" data-lk="'+l[0]+'" data-li="'+l[1]+'">igazolom</button>')+'</td>';}).join('')+
        '<td>'+(b.betoltott?'<span class="adm-tag ok">betöltött</span>':'<span class="adm-tag bad">'+LEP.filter(function(l){return !b[l[0]];}).length+' lépés hiányzik</span>')+'</td></tr>';}).join('')+'</tbody></table></div>';}
  if(tab==='betanulas'){var people=betolt.map(function(b){return {emp:b.employee_id,poszt:b.munkaposzt};});var cur=bsel||(people[0]&&(people[0].emp+'|'+people[0].poszt));
    h+='<div class="adm-hint">Betanulási lap (Bázis 2 / 12. lap): soronként egy lépés, dátummal és <b>mentor</b> aláírással. A mentor nem lehet maga a személy. Ha a lap tele, a Betöltés-fülön a 2–4. lépés igazolható.</div>'+
      '<div class="adm-tools" style="flex-wrap:wrap">'+people.map(function(p){var k=p.emp+'|'+p.poszt;var n=blap.filter(function(l){return l.munkaposzt===p.poszt;}).length,d=bnap.filter(function(x){return x.employee_id===p.emp&&blap.some(function(l){return l.id===x.lap_id&&l.munkaposzt===p.poszt;});}).length;
        return '<button type="button" class="adm-btn'+(k===cur?'':' ghost')+'" data-bsel="'+k+'">'+esc(en(p.emp))+' · '+p.poszt+' <small>'+d+'/'+n+'</small></button>';}).join(' ')+'</div>';
    if(cur){var pe=cur.split('|')[0],pp=cur.split('|')[1],L=blap.filter(function(l){return l.munkaposzt===pp;});
      h+='<div class="adm-card"><h3>'+esc(en(pe))+' — '+esc(pp)+'</h3>'+(L.length?'<table class="adm-t"><thead><tr><th>#</th><th>Lépés</th><th>Forrás</th><th>Igazolja</th><th>Dátum · mentor</th></tr></thead><tbody>'+
        L.map(function(l){var n=bnap.find(function(x){return x.lap_id===l.id&&x.employee_id===pe;});return '<tr><td>'+l.sorszam+'</td><td>'+esc(l.lepes_hu)+'<br><small style="opacity:.6">'+esc(l.lepes_ro||'')+'</small></td><td><small>'+esc(l.forras_doc||'')+'</small></td><td><small>'+(l.betoltes_lepes?l.betoltes_lepes+'. lépés':'')+'</small></td><td>'+(n?'<span class="adm-tag ok">'+esc(n.datum)+'</span> <small>'+esc(en(n.mentor_id))+'</small>':'<button type="button" class="adm-btn ghost" data-bment="'+l.id+'" data-bemp="'+pe+'">mentor aláír</button>')+'</td></tr>';}).join('')+'</tbody></table>':'<div class="adm-hint">Ennek a posztnak még nincs betanulási lapja — a Listák mintájára összeállítandó.</div>')+'</div>';}}
  root.innerHTML=h;}
document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-adm5]');if(b){e.preventDefault();e.stopPropagation();view=true;try{if(window.RA_NAV&&window.RA_NAV.open)window.RA_NAV.open();}catch(_){}document.querySelectorAll('#adminNav .adm-item').forEach(function(x){x.classList.remove('on');});b.classList.add('on');try{await load();}catch(ex){lastErr=String(ex);}paint();return;}
  if(e.target.closest('#adminNav [data-adm]')&&!e.target.closest('#raNavExtra'))view=false;
  var s=sb();if(!s||!view)return;
  var vt=e.target.closest('[data-vtab]');if(vt){tab=vt.getAttribute('data-vtab');paint();return;}
  var vs=e.target.closest('[data-vsel]');if(vs){sel=vs.getAttribute('data-vsel');paint();return;}
  var up=async function(id,patch){var r=await s.from('hr_verif_naplo').update(patch).eq('id',id);if(r.error)alert(r.error.message);await load();paint();};
  var d=e.target.closest('[data-vdone]');if(d){if(!myEmp)return alert('Nincs alkalmazott a fiókodhoz.');up(d.getAttribute('data-vdone'),{allapot:'elvegezve',elvegezte:myEmp});return;}
  var na=e.target.closest('[data-vna]');if(na){var m=prompt('Miért nem értelmezhető ma?');if(m===null)return;up(na.getAttribute('data-vna'),{allapot:'nem_ertelmezheto',megjegyzes:m});return;}
  var ok=e.target.closest('[data-vok]');if(ok){if(!myEmp)return alert('Nincs alkalmazott a fiókodhoz.');up(ok.getAttribute('data-vok'),{allapot:'megfelelt',vizsgalta:myEmp});return;}
  var bd=e.target.closest('[data-vbad]');if(bd){if(!myEmp)return alert('Nincs alkalmazott a fiókodhoz.');var mm=prompt('Mi a hiba? (ez FNC-01 alapja lehet)');if(mm===null)return;up(bd.getAttribute('data-vbad'),{allapot:'hibas',vizsgalta:myEmp,megjegyzes:mm});return;}
  var kp=e.target.closest('[data-kalap]');if(kp){var kr=await s.rpc('f_kalap',{p_kod:kp.getAttribute('data-kalap')});if(kr.error){alert(kr.error.message);return;}
    var w=window.open('','ra_kalap','width=860,height=1000');if(!w){alert('Felugró ablak blokkolva.');return;}
    var md=String(kr.data||'');var html=md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/_(.+?)_/g,'<i>$1</i>').replace(/^- (.*)$/gm,'<li>$1</li>').replace(/^(\d+)\. (.*)$/gm,'<li>$1. $2</li>').replace(/^---$/gm,'<hr>').replace(/\n\n/g,'<p>');
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kalap</title><style>body{font-family:Georgia,serif;max-width:760px;margin:30px auto;padding:0 20px;color:#111;line-height:1.45}h1{font-size:22px;border-bottom:2px solid #d81f26;padding-bottom:6px}h2{font-size:15px;margin-top:22px;text-transform:uppercase;letter-spacing:.04em;color:#444}li{margin:3px 0;list-style:none}hr{margin:26px 0}@media print{body{margin:0}}</style></head><body>'+html+'<p style="margin-top:30px"><button onclick="window.print()">Nyomtatás</button></p></body></html>');w.document.close();return;}
  var bs=e.target.closest('[data-bsel]');if(bs){bsel=bs.getAttribute('data-bsel');paint();return;}
  var bm=e.target.closest('[data-bment]');if(bm){if(!myEmp)return alert('Nincs alkalmazott a fiókodhoz.');var rr=await s.from('hr_betanulasi_naplo').insert({lap_id:bm.getAttribute('data-bment'),employee_id:bm.getAttribute('data-bemp'),mentor_id:myEmp});if(rr.error)alert(rr.error.message);await load();paint();return;}
  var bl=e.target.closest('[data-blep]');if(bl){if(!myEmp)return alert('Nincs alkalmazott a fiókodhoz.');var patch={};patch[bl.getAttribute('data-lk')]=today;patch[bl.getAttribute('data-li')]=myEmp;
    var rb=await s.from('hr_poszt_betoltes').update(patch).eq('id',bl.getAttribute('data-blep'));if(rb.error)alert(rb.error.message);await load();paint();return;}
  var dl=e.target.closest('[data-vdel]');if(dl&&confirm('Törlöd a tételt?')){var r=await s.from('hr_verif_lista').delete().eq('id',dl.getAttribute('data-vdel'));if(r.error)alert(r.error.message);await load();paint();return;}
  var ad=e.target.closest('[data-vadd]');if(ad){var k=ad.getAttribute('data-vadd'),hu=document.getElementById('vHu').value.trim();if(!hu){document.getElementById('vMsg').textContent='a magyar szöveg kötelező';return;}
    var max=items.filter(function(i){return i.munkaposzt===k;}).reduce(function(m,i){return Math.max(m,i.sorszam);},0);
    var r2=await s.from('hr_verif_lista').insert({munkaposzt:k,sorszam:max+1,tipus:document.getElementById('vT').value,tetel_hu:hu,tetel_ro:document.getElementById('vRo').value.trim()||null,kadencia:document.getElementById('vK').value,forras_doc:document.getElementById('vDoc').value.trim()||null});
    if(r2.error){document.getElementById('vMsg').textContent=r2.error.message;return;}await load();paint();return;}
},true);
function boot(){if(!document.getElementById('adminNav')){setTimeout(boot,500);return;}if(window.RA_NAV&&window.RA_NAV.add)window.RA_NAV.add(injectNav);injectNav();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
