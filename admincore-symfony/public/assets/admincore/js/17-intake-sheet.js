
/* ==== 2.2 Felvételi lap — diktálás → intake_sheets (Supabase) ====
   Belépési pontok a szervezési táblán: a 2.2 alosztály fejléce és a
   „Járműátvétel és tünetpontosítás” feladatkör kártyája. */
(function(){
'use strict';
var DEPT='2.2', RESP_HU='Járműátvétel', RESP_RO='Recepția vehiculului';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function lang(){var l=window.appLang||'hu';return {hu:1,ro:1,en:1}[l]?l:'hu';}
var UI={
 btn:{hu:'Felvételi lap',ro:'Fișă recepție',en:'Intake sheet'},
 open:{hu:'nyitott',ro:'deschise',en:'open'},
 title:{hu:'Felvételi lapok — ügyfélkérések',ro:'Fișe de recepție — solicitări client',en:'Intake sheets — customer requests'},
 tNew:{hu:'Felvétel',ro:'Preluare',en:'Intake'},tList:{hu:'Lapok',ro:'Fișe',en:'Sheets'},
 client:{hu:'Ügyfél neve',ro:'Nume client',en:'Customer'},phone:{hu:'Telefon',ro:'Telefon',en:'Phone'},
 plate:{hu:'Rendszám',ro:'Nr. înmatriculare',en:'Plate'},km:{hu:'Km-óra',ro:'Kilometraj',en:'Odometer'},
 taker:{hu:'Felvette',ro:'Preluat de',en:'Taken by'},lng:{hu:'Nyelv (diktálás + nyomtatás)',ro:'Limbă (dictare + tipărire)',en:'Language (dictation + print)'},
 req:{hu:'Kérések',ro:'Solicitări',en:'Requests'},add:{hu:'Hozzáadás',ro:'Adaugă',en:'Add'},
 manual:{hu:'Kérés kézi beírása…',ro:'Scrieți solicitarea…',en:'Type a request…'},
 del:{hu:'Törlés',ro:'Șterge',en:'Delete'},newS:{hu:'Új lap',ro:'Fișă nouă',en:'New sheet'},
 save:{hu:'Mentés',ro:'Salvează',en:'Save'},print:{hu:'Mentés és nyomtatás',ro:'Salvează și tipărește',en:'Save and print'},
 reprint:{hu:'Nyomtatás (másolat)',ro:'Tipărește (copie)',en:'Print (copy)'},
 micIdle:{hu:'Nyomja meg a mikrofont, és diktálja a kéréseket.',ro:'Apăsați microfonul și dictați solicitările.',en:'Press the microphone and dictate the requests.'},
 micOn:{hu:'Hallgatom… beszéljen.',ro:'Ascult… vorbiți.',en:'Listening… speak now.'},
 hint:{hu:'Szünet = új tétel. Hangparancs: „új sor”, „töröld az utolsót”.',ro:'Pauză = rând nou. Comenzi: „rând nou”, „șterge ultimul”.',en:'Pause = new item. Commands: “new line”, “delete last”.'},
 empty:{hu:'Még nincs tétel. Diktáljon, vagy írja be lent.',ro:'Nicio solicitare încă. Dictați sau scrieți mai jos.',en:'No items yet. Dictate or type below.'},
 lock:{hu:'Ez a lap alá van írva — a tartalma zárolt. Módosításhoz új lapot vegyen fel.',ro:'Fișa este semnată — conținutul este blocat. Pentru modificări deschideți o fișă nouă.',en:'This sheet is signed and locked. Start a new sheet to change it.'},
 search:{hu:'Keresés rendszámra vagy ügyfélre',ro:'Căutare după nr. sau client',en:'Search plate or customer'},
 all:{hu:'Minden státusz',ro:'Toate',en:'All statuses'},openF:{hu:'Nyitott (nincs ellenőrizve)',ro:'Deschise (neverificate)',en:'Open (not verified)'},
 refresh:{hu:'Frissítés',ro:'Reîmprospătează',en:'Refresh'},
 hNo:{hu:'Lapszám',ro:'Nr. fișă',en:'Sheet'},hDate:{hu:'Dátum',ro:'Data',en:'Date'},hItems:{hu:'Tétel',ro:'Rânduri',en:'Items'},hSt:{hu:'Státusz',ro:'Status',en:'Status'},hAct:{hu:'Művelet',ro:'Acțiune',en:'Action'},
 aOpen:{hu:'Megnyitás',ro:'Deschide',en:'Open'},aSign:{hu:'Aláírva',ro:'Semnată',en:'Signed'},aVer:{hu:'Ellenőrizve',ro:'Verificată',en:'Verified'},aCan:{hu:'Sztornó',ro:'Anulare',en:'Cancel'},
 none:{hu:'Nincs a szűrésnek megfelelő lap.',ro:'Nicio fișă pentru acest filtru.',en:'No sheets match this filter.'},
 kToday:{hu:'Ma',ro:'Azi',en:'Today'},kOpen:{hu:'Nyitott',ro:'Deschise',en:'Open'},kFirst:{hu:'Elsőre teljes',ro:'Complete din prima',en:'Complete first time'},kVer:{hu:'Ellenőrzésre vár',ro:'De verificat',en:'Awaiting check'},
 noSR:{hu:'Ez a böngésző nem támogatja a diktálást — használjon Chrome-ot vagy Edge-et. A kézi beírás működik.',ro:'Browserul nu suportă dictarea — folosiți Chrome sau Edge. Scrierea manuală funcționează.',en:'This browser cannot dictate — use Chrome or Edge. Typing still works.'}
};
var ST={draft:{hu:'Vázlat',ro:'Ciornă',en:'Draft'},printed:{hu:'Nyomtatva',ro:'Tipărită',en:'Printed'},signed:{hu:'Aláírva',ro:'Semnată',en:'Signed'},verified:{hu:'Ellenőrizve',ro:'Verificată',en:'Verified'},cancelled:{hu:'Sztornó',ro:'Anulată',en:'Cancelled'}};
function L(k){return (UI[k]&&UI[k][lang()])||UI[k].hu;}
function S(k){return (ST[k]&&ST[k][lang()])||k;}
var LOC={hu:'hu-HU',ro:'ro-RO',en:'en-US'};
var PT={
 hu:{title:'Ügyfélkérések — felvételi lap',client:'Ügyfél',phone:'Telefon',plate:'Rendszám',km:'Km-óra',staff:'Felvette',date:'Dátum',resp:'Feladatkör',sc:'Ügyfél aláírása',sr:'Szerviz aláírása',foot:'Az ügyfél a fenti kéréseket szóban megadta, a leírt szöveget átolvasta és aláírásával jóváhagyta.',newl:['új sor','következő tétel'],undo:['töröld az utolsót']},
 ro:{title:'Solicitările clientului — fișă de recepție',client:'Client',phone:'Telefon',plate:'Nr. înmatriculare',km:'Kilometraj',staff:'Recepționat de',date:'Data',resp:'Responsabilitate',sc:'Semnătura clientului',sr:'Semnătura service',foot:'Clientul a formulat verbal solicitările de mai sus, a citit textul și l-a aprobat prin semnătură.',newl:['rând nou','punct următor'],undo:['șterge ultimul']},
 en:{title:'Customer requests — intake sheet',client:'Customer',phone:'Phone',plate:'Plate no.',km:'Odometer',staff:'Taken by',date:'Date',resp:'Responsibility',sc:'Customer signature',sr:'Workshop signature',foot:'The customer stated the requests above verbally, read the text and approved it by signature.',newl:['new line','next item'],undo:['delete last']}
};

var K={ready:false,sb:null,me:null,emps:[],resp:null,openCount:0,cur:null,items:[],tab:'edit',el:null};
function sb(){return window.RA_SB&&window.RA_SB.client;}

async function init(){
  if(K.ready||!sb())return; K.sb=sb();
  var u=(await K.sb.auth.getUser()).data.user; if(!u)return;
  var pr=(await K.sb.from('profiles').select('role,employee_id,full_name').eq('id',u.id).single()).data||{};
  K.me=pr;
  K.emps=(await K.sb.from('employees').select('id,name').eq('is_active',true).is('deleted_at',null).order('name')).data||[];
  var r=(await K.sb.from('admin_core').select('id,dept_code,title_hu,title_ro,title_en,owner_id,reviewer_id').eq('dept_code',DEPT).ilike('title_hu',RESP_HU+'%').limit(1)).data||[];
  K.resp=r[0]||null; K.ready=true;
  await counts();
}
function office(){return K.me&&['owner','admin','reception'].indexOf(K.me.role)>=0;}
async function counts(){
  if(!K.ready||!office())return;
  var c=await K.sb.from('intake_sheets').select('id',{count:'exact',head:true}).in('status',['draft','printed']);
  K.openCount=c.count||0; decorate();
}

/* ---------- belépési pontok a táblán ---------- */
function decorate(){
  if(!office())return;
  var ao=document.getElementById('adminOpen');
  if(ao){var hb=document.getElementById('ikOpen');
    if(!hb){hb=document.createElement('a');hb.id='ikOpen';hb.href='#';hb.className='back chain-ikh';hb.setAttribute('data-intake','head');hb.style.marginLeft='8px';ao.insertAdjacentElement('afterend',hb);}
    var hh='🎙 <span class="chain-ik">'+esc(L('btn'))+'</span>'+(K.openCount?' <span class="adm-cnt chain-ik" style="display:inline-block">'+K.openCount+'</span>':'');
    if(hb.innerHTML!==hh)hb.innerHTML=hh;}
  document.querySelectorAll('.dept').forEach(function(box){
    var c=box.querySelector('.code'); if(!c||c.textContent.trim()!==DEPT)return;
    var nums=box.querySelector('.chain-nums'); if(!nums)return;
    var b=nums.querySelector('.ik-n'); if(!b){b=document.createElement('button');b.type='button';b.className='chain-n ik-n';b.setAttribute('data-intake','dept');nums.appendChild(b);}
    var h=esc(L('btn'))+(K.openCount?'<i class="chain-ik">'+K.openCount+' '+esc(L('open'))+'</i>':'');if(b.innerHTML!==h)b.innerHTML=h;
  });
  document.querySelectorAll('.li[data-k]').forEach(function(li){
    var p=(li.getAttribute('data-k')||'').split('|'); if(p[1]!==DEPT)return;
    var t=((li.querySelector('.txt')||{}).textContent||'').trim();
    if(t.indexOf(RESP_HU)!==0&&t.indexOf(RESP_RO)!==0&&t.indexOf('Receive vehicle')!==0)return;
    var links=li.querySelector('.chain-links'); if(!links)return;
    var b=links.querySelector('.ik-l'); if(!b){b=document.createElement('button');b.type='button';b.className='chain-l ik-l';b.setAttribute('data-intake','task');links.insertBefore(b,links.firstChild);}
    var h='🎙 '+esc(L('btn'))+(K.openCount?' <b class="chain-ik">'+K.openCount+'</b>':'');if(b.innerHTML!==h)b.innerHTML=h;
  });
}
if(window.BOARD_CHAIN){var _d=window.BOARD_CHAIN.decorate;window.BOARD_CHAIN.decorate=function(){var x=_d.apply(this,arguments);try{decorate();}catch(e){console.error(e);}return x;};}
document.addEventListener('click',function(e){var b=e.target.closest('[data-intake]');if(!b)return;e.preventDefault();e.stopPropagation();openPanel();},true);
var tries=0;(function wait(){if(sb()){init().catch(console.error);}else if(tries++<120)setTimeout(wait,500);})();

/* ---------- panel ---------- */
function msg(t,kind){var m=K.el&&K.el.querySelector('#ikMsg');if(!m)return;m.className='ik-msg '+(kind||'ok');m.textContent=t;m.hidden=false;if(kind!=='err')setTimeout(function(){m.hidden=true;},3500);}
function locked(){return K.cur&&['signed','verified','cancelled'].indexOf(K.cur.status)>=0;}
function empName(id){var e=K.emps.find(function(x){return x.id===id;});return e?e.name:'—';}

async function openPanel(){
  if(!K.ready)await init();
  if(!office()){alert('Ehhez a modulhoz irodai jogosultság kell.');return;}
  if(K.el)return;
  var sc=document.createElement('div');sc.className='ik-scrim';
  var p=document.createElement('div');p.className='ik-panel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');
  p.innerHTML='<div class="ik-head"><div class="t"><div class="k">'+esc(DEPT+' · '+(K.resp?(lang()==='ro'?K.resp.title_ro:lang()==='en'?K.resp.title_en:K.resp.title_hu):''))+'</div><h2>'+esc(L('title'))+'</h2><div class="sub">'+esc(L('taker'))+': '+esc(K.resp?empName(K.resp.owner_id):'—')+' → '+esc(L('aVer'))+': '+esc(K.resp?empName(K.resp.reviewer_id):'—')+'</div></div>'+
    '<div class="ik-kpi" id="ikKpi"></div><button class="ik-x" id="ikClose" aria-label="Bezárás">×</button></div>'+
    '<div class="ik-body"><div class="ik-tabs"><button class="ik-tab on" data-t="edit">'+esc(L('tNew'))+'</button><button class="ik-tab" data-t="list">'+esc(L('tList'))+'</button></div>'+
    '<div id="ikMsg" class="ik-msg" hidden></div><div id="ikView"></div></div>';
  document.body.appendChild(sc);document.body.appendChild(p);K.el=p;K.scrim=sc;
  function close(){stopMic();p.remove();sc.remove();K.el=null;counts();if(window.RA_LOOP)window.RA_LOOP.reload();document.removeEventListener('keydown',esck);}
  function esck(e){if(e.key==='Escape')close();}
  document.addEventListener('keydown',esck);
  sc.onclick=close;p.querySelector('#ikClose').onclick=close;
  p.querySelectorAll('.ik-tab').forEach(function(b){b.onclick=function(){p.querySelectorAll('.ik-tab').forEach(function(x){x.classList.toggle('on',x===b);});K.tab=b.dataset.t;view();};});
  if(!K.cur)restoreDraft();
  K.tab='edit';view();kpi();
}
async function kpi(){
  if(!K.el)return;
  var today=new Date().toISOString().slice(0,10);
  var r=await K.sb.from('v_2_2_felveteli_kpi').select('*').eq('nap',today).maybeSingle();
  var ver=await K.sb.from('intake_sheets').select('id',{count:'exact',head:true}).eq('status','signed');
  var d=r.data||{lapok:0,elsore_teljes_pct:null};
  var box=K.el.querySelector('#ikKpi'); if(!box)return;
  box.innerHTML='<span>'+esc(L('kToday'))+'<b>'+(d.lapok||0)+'</b></span>'+
    '<span class="'+(K.openCount?'hot':'')+'">'+esc(L('kOpen'))+'<b>'+K.openCount+'</b></span>'+
    '<span>'+esc(L('kFirst'))+'<b>'+(d.elsore_teljes_pct==null?'—':d.elsore_teljes_pct+'%')+'</b></span>'+
    '<span>'+esc(L('kVer'))+'<b>'+(ver.count||0)+'</b></span>';
}
function view(){if(!K.el)return;stopMic();if(K.tab==='edit')editView();else listView();}

/* ---------- felvétel ---------- */
function editView(){
  var v=K.el.querySelector('#ikView'),c=K.cur,Lk=locked();
  var opts=K.emps.map(function(e){return '<option value="'+e.id+'">'+esc(e.name)+'</option>';}).join('');
  v.innerHTML=
   '<div class="ik-card"><div class="ik-row" style="justify-content:space-between"><div><div style="color:var(--red);font-weight:800;font-size:12px">'+esc(c?c.sheet_no:L('newS'))+'</div>'+
     (c?'<span class="ik-pill ik-st-'+c.status+'">'+esc(S(c.status))+'</span> <small style="color:var(--ink500)">'+new Date(c.created_at).toLocaleString(LOC[lang()])+'</small>':'')+'</div>'+
     '<div style="min-width:180px"><label for="ikLang">'+esc(L('lng'))+'</label><select id="ikLang"><option value="hu">Magyar</option><option value="ro">Română</option><option value="en">English</option></select></div></div></div>'+
   (Lk?'<div class="ik-lock">'+esc(L('lock'))+'</div>':'')+
   '<div class="ik-card ik-grid">'+
     '<div><label for="ikC">'+esc(L('client'))+'</label><input id="ikC" autocomplete="off"></div>'+
     '<div><label for="ikP">'+esc(L('phone'))+'</label><input id="ikP" inputmode="tel" autocomplete="off"></div>'+
     '<div><label for="ikR">'+esc(L('plate'))+'</label><input id="ikR" autocomplete="off" style="text-transform:uppercase"></div>'+
     '<div><label for="ikK">'+esc(L('km'))+'</label><input id="ikK" inputmode="numeric" autocomplete="off"></div>'+
     '<div><label for="ikT">'+esc(L('taker'))+'</label><select id="ikT">'+opts+'</select></div></div>'+
   '<div class="ik-card ik-con" aria-live="polite"><button class="ik-mic" id="ikMic" aria-pressed="false" aria-label="Diktálás"><span class="r"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/></svg></button>'+
     '<div><div style="font-weight:700" id="ikMS">'+esc(SR?L('micIdle'):L('noSR'))+'</div><div class="ik-live" id="ikLive"></div><p class="ik-hint">'+esc(L('hint'))+'</p></div></div>'+
   '<div class="ik-card"><div style="font-weight:700;margin-bottom:6px">'+esc(L('req'))+'</div><ol class="ik-items" id="ikItems"></ol><div class="ik-empty" id="ikEmpty">'+esc(L('empty'))+'</div>'+
     '<div class="ik-row" style="margin-top:10px"><input id="ikMan" placeholder="'+esc(L('manual'))+'" style="flex:1;min-width:180px"><button class="ik-btn" id="ikAdd">'+esc(L('add'))+'</button></div></div>'+
   '<div class="ik-row ik-end"><button class="ik-btn" id="ikNew">'+esc(L('newS'))+'</button><button class="ik-btn" id="ikSave">'+esc(L('save'))+'</button><button class="ik-btn p" id="ikPrint">'+esc(Lk?L('reprint'):L('print'))+'</button></div>';
  var q=function(id){return v.querySelector('#'+id);};
  q('ikC').value=c?c.client_name||'':(K.dr&&K.dr.client_name)||'';
  q('ikP').value=c?c.phone||'':(K.dr&&K.dr.phone)||'';
  q('ikR').value=c?c.plate||'':(K.dr&&K.dr.plate)||'';
  q('ikK').value=c?(c.odometer==null?'':c.odometer):(K.dr&&K.dr.odometer)||'';
  q('ikT').value=c?c.taken_by:(K.me.employee_id||(K.emps[0]&&K.emps[0].id)||'');
  q('ikLang').value=c?c.lang:(K.dr&&K.dr.lang)||lang();
  ['ikC','ikP','ikR','ikK','ikT','ikLang','ikMan','ikAdd','ikSave','ikMic'].forEach(function(id){q(id).disabled=Lk;});
  ['ikC','ikP','ikR','ikK'].forEach(function(id){q(id).oninput=draft;});
  q('ikAdd').onclick=function(){var x=q('ikMan').value.trim();if(x){K.items.push(cap(x));q('ikMan').value='';items();draft();}};
  q('ikMan').onkeydown=function(e){if(e.key==='Enter')q('ikAdd').click();};
  q('ikNew').onclick=function(){if(!K.cur&&K.items.length&&!confirm('A mentetlen tételek elvesznek. Új lapot kezd?'))return;clearDraft();K.cur=null;K.items=[];K.dr=null;editView();};
  q('ikSave').onclick=async function(){var s=await save({});if(s)msg(L('save')+': '+s.sheet_no);};
  q('ikPrint').onclick=async function(){var s=K.cur;if(!locked()){s=await save(K.cur&&K.cur.status!=='draft'?{}:{status:'printed'});if(!s)return;}printSheet(s);};
  q('ikMic').onclick=function(){if(!SR||locked())return;if(on)stopMic();else{want=true;startMic();}};
  q('ikLang').onchange=function(){draft();if(on){stopMic();setTimeout(function(){want=true;startMic();},300);}};
  items();
}
function items(){
  var v=K.el&&K.el.querySelector('#ikItems');if(!v)return;var Lk=locked();v.innerHTML='';
  K.items.forEach(function(t,i){
    var li=document.createElement('li'),ta=document.createElement('textarea'),b=document.createElement('button');
    ta.value=t;ta.rows=1;ta.disabled=Lk;ta.setAttribute('aria-label',(i+1)+'.');ta.oninput=function(){K.items[i]=ta.value;draft();};
    b.className='ik-btn s';b.textContent=L('del');b.disabled=Lk;b.onclick=function(){K.items.splice(i,1);items();draft();};
    li.appendChild(ta);li.appendChild(b);v.appendChild(li);
  });
  K.el.querySelector('#ikEmpty').style.display=K.items.length?'none':'block';
}
function payload(){
  var q=function(id){return K.el.querySelector('#'+id);};
  var km=q('ikK').value.replace(/\D/g,'');
  return {client_name:q('ikC').value.trim()||null,phone:q('ikP').value.trim()||null,plate:q('ikR').value.trim()||null,
    odometer:km?parseInt(km,10):null,taken_by:q('ikT').value,lang:q('ikLang').value,
    items:K.items.map(function(s){return String(s).trim();}).filter(Boolean)};
}
function draft(){if(K.cur||!K.el)return;try{localStorage.setItem('ik_draft',JSON.stringify(payload()));}catch(e){}}
function clearDraft(){try{localStorage.removeItem('ik_draft');}catch(e){}}
function restoreDraft(){try{var d=JSON.parse(localStorage.getItem('ik_draft')||'null');if(d&&((d.items&&d.items.length)||d.client_name)){K.dr=d;K.items=d.items||[];}}catch(e){}}
async function save(extra){
  var p=Object.assign(payload(),extra);
  if(!p.items.length){msg('Legalább egy kérés kell a mentéshez.','err');return null;}
  if(!p.taken_by){msg('Válassza ki, ki vette fel a lapot.','err');return null;}
  var r=K.cur?await K.sb.from('intake_sheets').update(p).eq('id',K.cur.id).select('*').single()
             :await K.sb.from('intake_sheets').insert(p).select('*').single();
  if(r.error){msg('Mentés sikertelen: '+r.error.message,'err');return null;}
  clearDraft();K.dr=null;K.cur=r.data;K.items=(r.data.items||[]).slice();
  await counts();kpi();editView();return r.data;
}
function printSheet(s){
  var t=PT[s.lang]||PT.hu;
  var rt=K.resp?(K.resp.dept_code+' '+(s.lang==='ro'?K.resp.title_ro:s.lang==='en'?K.resp.title_en:K.resp.title_hu)):'';
  document.getElementById('ikSheet').innerHTML=
   '<div class="h"><div><div class="firm">SC Szkaliczki Service SRL · Bosch Car Service · Sângeorgiu de Mureș</div><h3>'+esc(t.title)+'</h3></div><div class="no">'+esc(s.sheet_no)+'</div></div>'+
   '<div class="m"><div><b>'+t.client+':</b> '+esc(s.client_name)+'</div><div><b>'+t.plate+':</b> '+esc(s.plate)+'</div>'+
   '<div><b>'+t.phone+':</b> '+esc(s.phone)+'</div><div><b>'+t.km+':</b> '+esc(s.odometer==null?'':s.odometer)+'</div>'+
   '<div><b>'+t.staff+':</b> '+esc(empName(s.taken_by))+'</div><div><b>'+t.date+':</b> '+new Date(s.created_at).toLocaleString(LOC[s.lang]||'hu-HU')+'</div>'+
   '<div style="grid-column:1/-1"><b>'+t.resp+':</b> '+esc(rt)+'</div></div>'+
   '<ol>'+(s.items||[]).map(function(i){return '<li>'+esc(i)+'</li>';}).join('')+'</ol>'+
   '<div class="s"><div>'+t.sc+'</div><div>'+t.sr+'</div></div><p class="f">'+t.foot+'</p>';
  document.body.classList.add('ik-printing');
  var done=function(){document.body.classList.remove('ik-printing');window.removeEventListener('afterprint',done);};
  window.addEventListener('afterprint',done);
  setTimeout(function(){window.print();setTimeout(done,1500);},60);
}

/* ---------- lapok ---------- */
function listView(){
  var v=K.el.querySelector('#ikView');
  v.innerHTML='<div class="ik-card ik-row"><input id="ikQ" placeholder="'+esc(L('search'))+'" style="flex:1;min-width:180px">'+
   '<select id="ikF" style="width:auto"><option value="">'+esc(L('all'))+'</option><option value="open">'+esc(L('openF'))+'</option>'+
   Object.keys(ST).map(function(k){return '<option value="'+k+'">'+esc(S(k))+'</option>';}).join('')+'</select>'+
   '<button class="ik-btn" id="ikRe">'+esc(L('refresh'))+'</button></div>'+
   '<div class="ik-card ik-tbl"><table><thead><tr><th>'+esc(L('hNo'))+'</th><th>'+esc(L('hDate'))+'</th><th>'+esc(L('plate'))+'</th><th>'+esc(L('client'))+'</th><th>'+esc(L('hItems'))+'</th><th>'+esc(L('taker'))+'</th><th>'+esc(L('hSt'))+'</th><th>'+esc(L('hAct'))+'</th></tr></thead><tbody id="ikRows"></tbody></table></div>';
  v.querySelector('#ikRe').onclick=loadList;v.querySelector('#ikF').onchange=loadList;
  v.querySelector('#ikQ').onkeydown=function(e){if(e.key==='Enter')loadList();};
  loadList();
}
async function loadList(){
  var v=K.el&&K.el.querySelector('#ikView');if(!v)return;
  var q=K.sb.from('intake_sheets').select('*').order('created_at',{ascending:false}).limit(150);
  var f=v.querySelector('#ikF').value,term=v.querySelector('#ikQ').value.trim().replace(/[%,()]/g,'');
  if(f==='open')q=q.in('status',['draft','printed','signed']);else if(f)q=q.eq('status',f);
  if(term)q=q.or('plate.ilike.%'+term.replace(/\s+/g,'').toUpperCase()+'%,client_name.ilike.%'+term+'%');
  var r=await q; if(r.error){msg(r.error.message,'err');return;}
  var rows=r.data||[];
  var canVer=function(s){return s.status==='signed'&&K.me.employee_id!==s.taken_by&&(K.me.role==='owner'||(K.resp&&K.me.employee_id===K.resp.reviewer_id));};
  v.querySelector('#ikRows').innerHTML=rows.length?rows.map(function(s){
    var edit=['draft','printed'].indexOf(s.status)>=0;
    return '<tr><td><b>'+esc(s.sheet_no)+'</b></td><td>'+new Date(s.created_at).toLocaleDateString(LOC[lang()])+'</td><td>'+esc(s.plate||'')+'</td><td>'+esc(s.client_name||'')+'</td><td>'+(s.items||[]).length+'</td><td>'+esc(empName(s.taken_by))+'</td>'+
     '<td><span class="ik-pill ik-st-'+s.status+'">'+esc(S(s.status))+'</span>'+(s.verified_by?'<div style="font-size:11.5px;color:var(--ink500)">'+esc(empName(s.verified_by))+'</div>':'')+'</td>'+
     '<td><div class="ik-row"><button class="ik-btn s" data-a="open" data-id="'+s.id+'">'+esc(L('aOpen'))+'</button>'+
     (edit?'<button class="ik-btn s" data-a="sign" data-id="'+s.id+'">'+esc(L('aSign'))+'</button>':'')+
     (canVer(s)?'<button class="ik-btn s p" data-a="verify" data-id="'+s.id+'">'+esc(L('aVer'))+'</button>':'')+
     (edit?'<button class="ik-btn s" data-a="cancel" data-id="'+s.id+'">'+esc(L('aCan'))+'</button>':'')+'</div></td></tr>';
  }).join(''):'<tr><td colspan="8" class="ik-empty">'+esc(L('none'))+'</td></tr>';
  v.querySelectorAll('[data-a]').forEach(function(b){b.onclick=function(){act(b.dataset.a,rows.find(function(x){return x.id===b.dataset.id;}));};});
}
async function act(a,s){
  if(a==='open'){K.cur=s;K.items=(s.items||[]).slice();K.tab='edit';K.el.querySelectorAll('.ik-tab').forEach(function(x){x.classList.toggle('on',x.dataset.t==='edit');});editView();return;}
  var patch;
  if(a==='sign'){if(s.status==='draft'&&!confirm('A lap még nincs kinyomtatva. Mégis aláírtnak jelöli?'))return;patch={status:'signed'};}
  if(a==='verify')patch={status:'verified',verified_by:K.me.employee_id};
  if(a==='cancel'){var n=prompt('Sztornó oka:');if(!n)return;patch={status:'cancelled',note:n};}
  var r=await K.sb.from('intake_sheets').update(patch).eq('id',s.id);
  if(r.error){msg(r.error.message,'err');return;}
  msg(s.sheet_no+': '+S(patch.status));await counts();kpi();loadList();
}

/* ---------- diktálás ---------- */
function cap(s){s=String(s).trim();return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
var SR=window.SpeechRecognition||window.webkitSpeechRecognition, rec=null, on=false, want=false;
function micUI(v){on=v;var m=K.el&&K.el.querySelector('#ikMic');if(!m)return;m.classList.toggle('on',v);m.setAttribute('aria-pressed',v);
  K.el.querySelector('#ikMS').textContent=v?L('micOn'):L('micIdle');if(!v)K.el.querySelector('#ikLive').textContent='';}
function heard(text){
  var lg=K.el.querySelector('#ikLang').value,t=PT[lg]||PT.hu,low=text.trim().toLowerCase();if(!low)return;
  if(t.undo.some(function(u){return low.indexOf(u)>=0;})){K.items.pop();items();draft();return;}
  var re=new RegExp('\\b(?:'+t.newl.join('|')+')\\b','i');
  text.split(re).map(function(x){return x.trim();}).filter(Boolean).forEach(function(p){K.items.push(cap(p));});
  items();draft();
}
function startMic(){
  rec=new SR();rec.lang=LOC[K.el.querySelector('#ikLang').value]||'hu-HU';rec.continuous=true;rec.interimResults=true;
  rec.onresult=function(e){var im='';for(var i=e.resultIndex;i<e.results.length;i++){var r=e.results[i];if(r.isFinal)heard(r[0].transcript);else im+=r[0].transcript;}var l=K.el&&K.el.querySelector('#ikLive');if(l)l.textContent=im||'…';};
  rec.onerror=function(e){if(e.error==='not-allowed'||e.error==='service-not-allowed'){want=false;msg('A mikrofon tiltva: engedélyezze a böngésző címsorában.','err');}else if(e.error==='network'){want=false;msg('A diktáláshoz internetkapcsolat kell.','err');}};
  rec.onend=function(){if(want&&K.el){try{rec.start();}catch(_){}}else micUI(false);};
  rec.start();micUI(true);
}
function stopMic(){want=false;if(rec){try{rec.stop();}catch(_){}}on=false;}

window.RA_INTAKE={open:openPanel,refresh:counts};
})();
