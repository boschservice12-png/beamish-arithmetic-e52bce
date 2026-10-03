
/* ==== Admin-sáv a szervezési tábla mellé. Supabase-ből, RedAssistance-stílusban. ====
   Tábla = a fő nézet (a fájl saját render-je). Admin modulok = a bal sáv nézetei. */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function daysAgo(d){return d?Math.floor((Date.now()-new Date(d))/86400000):null;}
var A={emps:[],depts:[],core:[],ncs:[],docs:[],kpi:[],pts:[],rules:[]};
var view='emps';

/* ---- Supabase adat ---- */
async function load(sb){
  var r;
  r=await sb.from('employees').select('id,name,department,role,is_active').eq('is_active',true).order('name'); A.emps=r.data||[];
  r=await sb.from('admin_dept').select('*').order('dept_code'); A.depts=r.data||[];
  r=await sb.from('admin_core').select('*').order('sort_order'); A.core=r.data||[];
  r=await sb.from('crai_neconformitati').select('*').order('nr_crt',{ascending:false}); A.ncs=r.data||[];
  r=await sb.from('hr_documents').select('*').order('created_at',{ascending:false}); A.docs=r.data||[];
  r=await sb.from('org_kpi_entries').select('*'); A.kpi=r.data||[];
  r=await sb.from('org_i18n').select('*'); if(window.RA_I18N)window.RA_I18N.load(r.data||[]);
  r=await sb.from('crai_knowledge').select('id,km_code,system,title,version,scope,languages,tags,content_md,status,source_note,updated_at').order('km_code'); A.km=(r.data||[]).filter(function(k){return k.status!=='archived';});
  r=await sb.from('org_employee_points').select('*'); A.pts=r.data||[];
  r=await sb.from('org_point_rules').select('*'); A.rules=r.data||[];
}
function empName(id){var e=A.emps.find(function(x){return x.id===id;});return e?e.name:'—';}

/* ---- sáv ---- */
var MENU=[
 ['board','','Szervezési tábla','Tablă organizațională'],
 ['emps','','Alkalmazottak','Angajați'],
 ['fise','','Munkaköri leírások','Fișe de post'],
 ['km','','CRAI tudás','Cunoștințe CRAI'],
 ['ncr','','Nemmegfelelőségek','Neconformități'],
 ['dir','','Irányelvek','Directive'],
 ['reg','','Szabályzatok','Regulamente'],
 ['kpi','','KPI és teljesítmény','KPI & Performanță'],
 ['pts','','Pontok és bónusz','Puncte & Bonusuri'],
 ['i18n','','Fordítások','Traduceri']
];
function badge(k){
  return {emps:A.emps.length,fise:A.core.length,km:(A.km||[]).length,ncr:A.ncs.length,
    dir:A.docs.filter(function(d){return /direct|instruc/i.test(d.doc_type||'');}).length,
    reg:A.docs.filter(function(d){return /regul/i.test(d.doc_type||'');}).length,
    kpi:A.kpi.length,pts:A.pts.length,i18n:(window.RA_I18N?window.RA_I18N.gaps(A).length:0)}[k];
}
function lang(){return window.appLang||'hu';}
function renderNav(){
  var n=document.getElementById('adminNav'); if(!n)return;
  n.innerHTML=MENU.map(function(m){
    var b=badge(m[0]); return '<button type="button" class="adm-item'+(view===m[0]?' on':'')+'" data-adm="'+m[0]+'"><span>'+esc(lang()==='ro'?m[3]:m[2])+'</span>'+(b!==undefined?'<span class="adm-b">'+b+'</span>':'')+'</button>';
  }).join('');
}

/* ---- nézetek ---- */
function card(t,inner){return '<div class="adm-card"><h3>'+esc(t)+'</h3>'+inner+'</div>';}
function table(head,rows){return '<table class="adm-t"><thead><tr>'+head.map(function(x){return '<th>'+esc(x)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';}
function td(v){return '<td>'+v+'</td>';}

function vEmps(){
  var rows=A.emps.map(function(e){
    var o=A.core.filter(function(c){return c.owner_id===e.id;}).length, r=A.core.filter(function(c){return c.reviewer_id===e.id;}).length;
    var nc=A.ncs.filter(function(n){return n.angajat===e.name && daysAgo(n.data_constatare)<=365;}).length;
    return '<tr>'+td('<b>'+esc(e.name)+'</b>')+td(esc(e.department||''))+td(esc(e.role||''))+td(o)+td(r)+td(nc?'<span class="adm-warn">'+nc+'</span>':'0')+'</tr>';
  });
  return card('Alkalmazottak · '+A.emps.length, table(['Név','Terület','Poszt','Felelős','Ellenőrző','NC (12 hó)'],rows));
}
function vFise(){
  var rows=filt(A.core,function(c){return c.dept_code;}).map(function(c){var d=A.depts.find(function(x){return x.dept_code===c.dept_code;})||{};
    return '<tr>'+td(esc(c.dept_code))+td('<b>'+(window.RA_I18N?window.RA_I18N.html('admin_core',c.id,'title',c.title_hu||c.title_ro):esc(c.title_hu||c.title_ro))+'</b>')+td(esc(empName(c.owner_id)))+td(window.RA_I18N?window.RA_I18N.html('admin_dept',c.dept_code,'vfp',d.vfp_hu||''):esc(d.vfp_hu||''))+td('<small>'+(window.RA_I18N?window.RA_I18N.html('admin_dept',c.dept_code,'kpi',d.kpi_hu||''):esc(d.kpi_hu||''))+'</small>')+'</tr>';});
  return card('Munkaköri leírások · '+A.core.length+' feladatkör', table(['Alosztály','Feladatkör','Felelős','Értékes végtermék','Mérés (KPI)'],rows));
}
function vNcr(){
  var byP={},byC={},open=0;
  var NCS=filt(A.ncs,function(n){return n.dept_code;});
  NCS.forEach(function(n){var p=n.angajat||'—';(byP[p]=byP[p]||{t:0,l:0,o:0,last:null});byP[p].t++;if(daysAgo(n.data_constatare)<=365)byP[p].l++;if(n.status==='deschisa'){open++;byP[p].o++;}if(!byP[p].last||n.data_constatare>byP[p].last)byP[p].last=n.data_constatare;var c=n.categorie||'—';byC[c]=(byC[c]||0)+1;});
  var h='<div class="adm-hint">Forrás: CRAI regiszter. Ismétlés csak 12 hónapon belül (art. 248 al. 3). Pénzbírság tilos (art. 249). Elemzés → ok → irányelv/szabály.</div>';
  h+='<div class="adm-stats"><div><b>'+NCS.length+'</b>Összes</div><div class="bad"><b>'+open+'</b>Nyitott</div><div><b>'+Object.keys(byC).length+'</b>Kategória</div></div>';
  var pr=Object.keys(byP).sort(function(a,b){return byP[b].l-byP[a].l;}).map(function(p){var r=byP[p];var s=r.l>=3?'<span class="adm-tag bad">⚠ ismétlődő minta → irányelv</span>':r.l>=2?'<span class="adm-tag warn">figyelem</span>':'—';return '<tr>'+td('<b>'+esc(p)+'</b>')+td(r.t)+td('<b>'+r.l+'</b>')+td(r.o)+td(esc(r.last||''))+td(s)+'</tr>';});
  h+=card('Ismétlés személyenként (12 hónap)', table(['Dolgozó','Összes','12 hónapon belül','Nyitott','Utolsó','Jelzés'],pr));
  var cr=Object.keys(byC).sort(function(a,b){return byC[b]-byC[a];}).map(function(c){return '<tr>'+td(esc(c))+td('<b>'+byC[c]+'</b>')+td(byC[c]>=3?'<span class="adm-tag warn">→ szabályzat / IL jelölt</span>':'')+'</tr>';});
  h+=card('Kategóriák — hol hiányzik a szabály', table(['Kategória','Db','Jelzés'],cr));
  h+='<div class="adm-tools"><button type="button" class="adm-btn" id="admNcFlow">+ Új NC — leírás → formalizálás</button> <button type="button" class="adm-btn ghost" id="admNcNew">űrlap kézzel</button></div>';
  h+=card('Regiszter', NCS.map(function(n){return '<div class="adm-nc" data-nc-open="'+n.nr_crt+'" style="cursor:pointer"><b>NC #'+n.nr_crt+'</b> · '+esc(n.angajat||'')+' · '+esc(n.data_constatare||'')+'<div>'+esc(n.descriere||'')+'</div><div><span class="adm-tag '+(n.gravitate==='majora'||n.gravitate==='critica'?'bad':'')+'">'+esc(n.gravitate||'')+'</span> <span class="adm-tag '+(n.status==='deschisa'?'warn':'ok')+'">'+esc(n.status||'')+'</span> <small>'+esc(n.categorie||'')+' · rep. '+(n.repetare||1)+'</small></div></div>';}).join(''));
  return h;
}
function vDocs(re,title){
  var rows=A.docs.filter(function(d){return re.test(d.doc_type||'');}).map(function(d){return '<tr>'+td('<b>'+esc(d.title)+'</b>')+td(esc(d.doc_type||''))+td(esc(d.department||''))+td(esc(d.version||''))+td(d.is_active?'<span class="adm-tag ok">hatályos</span>':'<span class="adm-tag">vázlat</span>')+'</tr>';});
  return '<div class="adm-hint">Forrás: hr_documents (CRAI). Hatályos = aláírt, oktatott (art. 243).</div>'+card(title+' · '+rows.length, table(['Cím','Típus','Terület','Verzió','Állapot'],rows));
}
function vKpi(){
  var rows=A.depts.map(function(d){return '<tr>'+td(esc(d.dept_code))+td('<b>'+(window.RA_I18N?window.RA_I18N.html('admin_dept',d.dept_code,'title',d.title_hu):esc(d.title_hu))+'</b>')+td(window.RA_I18N?window.RA_I18N.html('admin_dept',d.dept_code,'kpi',d.kpi_hu||''):esc(d.kpi_hu||''))+td(esc(empName(d.leader_id)))+'</tr>';});
  return '<div class="adm-hint">A KPI-definíció alosztályonként (admin_dept). Mért érték csak forrással — havi rögzítés (org_kpi_entries: '+A.kpi.length+' sor).</div>'+card('KPI-definíciók · 21 alosztály', table(['Alosztály','Cím','Mérés (KPI)','Vezető'],rows));
}
function vPts(){
  var sum={};A.pts.forEach(function(p){sum[p.employee_id]=(sum[p.employee_id]||0)+(p.points||0);});
  var rows=A.emps.map(function(e){return '<tr>'+td('<b>'+esc(e.name)+'</b>')+td(sum[e.id]||0)+td((sum[e.id]||0)*10+' RON')+'</tr>';});
  return '<div class="adm-hint">Pontszabályok: '+A.rules.length+'. 1 pont = 10 RON (org_bonus_config). Havi elszámolás, nem napi pontozás.</div>'+card('Pontok és bónusz', table(['Dolgozó','Pont','Bónusz'],rows));
}

function filt(list,keyFn){var f=window.ADMIN&&window.ADMIN.filter;if(!f||!f.code)return list;return list.filter(function(x){return keyFn(x)===f.code;});}
function filterBar(){var f=window.ADMIN&&window.ADMIN.filter;if(!f||!f.code)return '';var d=A.depts.find(function(x){return x.dept_code===f.code;});return '<div class="adm-filter">Szűrve: <b>'+esc(f.code+(d?' · '+d.title_hu:''))+'</b> <button type="button" class="adm-btn ghost" id="admFilterOff" style="padding:3px 10px;font-size:12px">× összes</button></div>';}
function render(){
  renderNav();
  var root=document.getElementById('adminRoot'); if(!root||!view)return;
  
  var map={emps:vEmps,fise:vFise,km:function(){var f=window.ADMIN&&window.ADMIN.filter;return window.ADMIN_CRAI.view(A,f&&f.code);},ncr:vNcr,dir:function(){return window.ADMIN_DOCS.list(Object.assign({},A,{docs:filt(A.docs,function(d){return d.dept_code;})}),/direct|instruc|proced/i,'Irányelvek és utasítások','directiva');},reg:function(){return window.ADMIN_DOCS.list(Object.assign({},A,{docs:filt(A.docs,function(d){return d.dept_code;})}),/regul/i,'Szabályzatok','regulament');},kpi:vKpi,pts:vPts,i18n:function(){return window.RA_I18N.view(A,window.RA_SB&&window.RA_SB.client);}};
  root.innerHTML='<div class="adm-h"><span class="adm-eb">ADMIN CORE</span><h2>'+esc((MENU.find(function(m){return m[0]===view;})||[])[lang()==='ro'?3:2]||'')+'</h2></div>'+map[view]();
}

/* ---- NC felvétel a CRAI-ba ---- */
function ncModal(sb){
  var opts=A.emps.map(function(e){return '<option>'+esc(e.name)+'</option>';}).join('');
  var cats=['calitate_lucrare','documentatie_raportare','securitate_ssm','scule_echipamente','piese_ambalare','ordine_curatenie','gestionare_deseuri','alta'];
  var m=document.createElement('div');m.className='adm-back';
  m.innerHTML='<div class="adm-modal"><h2>Új NC — CRAI regiszter</h2>'+
   '<label>Dolgozó<select id="nEmp">'+opts+'</select></label><label>Dátum<input id="nDate" type="date" value="'+new Date().toISOString().slice(0,10)+'"></label>'+
   '<label>Kategória<select id="nCat">'+cats.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></label>'+
   '<label>Alosztály<select id="nDept">'+A.depts.map(function(d){return '<option value="'+esc(d.dept_code)+'">'+esc(d.dept_code+' · '+d.title_hu)+'</option>';}).join('')+'</select></label>'+
   '<label>Súlyosság<select id="nGrav"><option value="minora">minoră</option><option value="medie">medie</option><option value="majora" selected>majoră</option><option value="critica">critică</option></select></label>'+
   '<label class="full">Tény (jelző nélkül)<textarea id="nFacts" rows="3"></textarea></label>'+
   '<label>Hivatkozott szabály<input id="nRule" placeholder="FCL-MEC-01"></label>'+
   '<label class="full">Megelőző intézkedés → irányelv<textarea id="nPrev" rows="2"></textarea></label>'+
   '<div id="nErr" class="adm-warn"></div><div class="adm-f"><button type="button" class="adm-btn ghost" id="nC">Mégse</button><button type="button" class="adm-btn" id="nS">Mentés a CRAI-ba</button></div></div>';
  document.body.appendChild(m);
  m.querySelector('#nC').onclick=function(){m.remove();};
  m.querySelector('#nS').onclick=async function(){
    var facts=m.querySelector('#nFacts').value.trim();if(!facts){m.querySelector('#nErr').textContent='A tény kötelező.';return;}
    var emp=m.querySelector('#nEmp').value; var live=A.ncs.filter(function(n){return n.angajat===emp&&daysAgo(n.data_constatare)<=365;}).length;
    var row={data_constatare:m.querySelector('#nDate').value,angajat:emp,dept_code:m.querySelector('#nDept').value,categorie:m.querySelector('#nCat').value,gravitate:m.querySelector('#nGrav').value,repetare:Math.min(9,live+1),regula_ref:m.querySelector('#nRule').value.trim()||null,descriere:facts,masura_preventiva:m.querySelector('#nPrev').value.trim()||null,constatat_de:(window.RA_SB&&window.RA_SB.me&&window.RA_SB.me.full_name)||null,limba_comunicare:'RO',status:'deschisa',tarif_ora:'180'};
    var r=await sb.from('crai_neconformitati').insert(row).select('nr_crt').single();
    if(r.error){m.querySelector('#nErr').textContent='Hiba: '+r.error.message;return;}
    A.ncs.unshift(Object.assign({nr_crt:r.data.nr_crt},row)); m.remove(); render();
  };
}

document.addEventListener('click',function(e){
  if(e.target.closest('#adminOpen')){e.preventDefault();window.ADMIN.filter=null;document.getElementById('adminDrawer').hidden=false;document.getElementById('adminScrim').hidden=false;window.ADMIN.render();return;}
  if(e.target.id==='i18nGo'&&window.RA_I18N&&window.RA_SB){window.RA_I18N.startDialog(A,window.RA_SB.client);return;}
  if(e.target.id==='i18nApprove'&&window.RA_I18N&&window.RA_SB){window.RA_I18N.approveAll(window.RA_SB.client);return;}
  if(e.target.id==='admNcFlow'&&window.RA_SB&&window.ADMIN_NCFLOW){window.ADMIN_NCFLOW.open(window.RA_SB.client,A);return;}
  if(e.target.id==='admImport'&&window.RA_SB&&window.ADMIN_IMPORT){window.ADMIN_IMPORT.open(window.RA_SB.client,A);return;}
  if(e.target.id==='admFilterOff'){window.ADMIN.filter=null;render();return;}
  if(e.target.closest('#adminClose')||e.target.id==='adminScrim'){window.ADMIN.filter=null;document.getElementById('adminDrawer').hidden=true;document.getElementById('adminScrim').hidden=true;return;}
  var b=e.target.closest('[data-adm]'); if(b){view=b.getAttribute('data-adm');render();return;}
  if(e.target.id==='admNcNew'&&window.RA_SB)ncModal(window.RA_SB.client);
  var sb=window.RA_SB&&window.RA_SB.client;
  var t;
  if((t=e.target.closest('[data-km-open]'))){var kk=(A.km||[]).find(function(x){return x.km_code===t.getAttribute('data-km-open');});if(kk)window.ADMIN_CRAI.open(kk);return;}
  if((t=e.target.closest('[data-km-print]'))){var kp=(A.km||[]).find(function(x){return x.km_code===t.getAttribute('data-km-print');});if(kp)window.ADMIN_CRAI.print(kp);return;}
  if((t=e.target.closest('[data-doc-open]'))){var d=A.docs.find(function(x){return x.id===t.getAttribute('data-doc-open');});if(d)window.ADMIN_DOCS.view(d,A);return;}
  if((t=e.target.closest('[data-doc-print]'))){var d2=A.docs.find(function(x){return x.id===t.getAttribute('data-doc-print');});if(d2)window.ADMIN_DOCS.print(d2,A);return;}
  if((t=e.target.closest('[data-doc-edit]'))){var d3=A.docs.find(function(x){return x.id===t.getAttribute('data-doc-edit');});var bk=t.closest('.adm-back');if(bk)bk.remove();if(d3)window.ADMIN_DOCS.edit(sb,A,d3.doc_type,d3);return;}
  if((t=e.target.closest('[data-doc-new]'))){window.ADMIN_DOCS.edit(sb,A,t.getAttribute('data-doc-new'));return;}
  if((t=e.target.closest('[data-nc-open]'))){var n=A.ncs.find(function(x){return String(x.nr_crt)===t.getAttribute('data-nc-open');});if(n)window.ADMIN_DOCS.ncView(n,A,sb);return;}
  if((t=e.target.closest('[data-nc-print]'))){var n2=A.ncs.find(function(x){return String(x.nr_crt)===t.getAttribute('data-nc-print');});if(n2)window.ADMIN_DOCS.ncPrint(n2);return;}
  if((t=e.target.closest('[data-nc-todoc]'))){var n3=A.ncs.find(function(x){return String(x.nr_crt)===t.getAttribute('data-nc-todoc');});var bk2=t.closest('.adm-back');if(bk2)bk2.remove();
    if(n3){var emp=A.emps.find(function(x){return x.name===n3.angajat;});
      window.ADMIN_DOCS.edit(sb,A,'directiva',null,{title:'Irányelv — '+(n3.categorie||'')+' (NC #'+n3.nr_crt+')',doc_code:'IRD-',employee_id:emp?emp.id:'',
        content:'FORRÁS: NC #'+n3.nr_crt+' ('+(n3.data_constatare||'')+')\n\nTÉNY:\n'+(n3.descriere||'')+'\n\nOK / GYÖKÉROK:\n'+(n3.observatii||'')+'\n\nSZABÁLY (megelőző intézkedés):\n'+(n3.masura_preventiva||'')+'\n\nKINEK SZÓL: '+(n3.angajat||'')+' és az érintett alosztály\nHATÁLYBALÉPÉS: aláírás és oktatás után (art. 243)'});}
    return;}
});
window.ADMIN={load:load,render:render,filter:null,kmQuery:'',setView:function(v){view=v;if(v===null){renderNav();if(window.RA_NAV&&window.RA_NAV.redraw)window.RA_NAV.redraw();return;}render();},data:A};
document.addEventListener('input',function(e){if(e.target.id==='kmQ'){window.ADMIN.kmQuery=e.target.value;var root=document.getElementById('adminRoot');var f=window.ADMIN.filter;var pos=e.target.selectionStart;root.innerHTML=(typeof filterBar==='function'?filterBar():'')+window.ADMIN_CRAI.view(A,f&&f.code);var q=document.getElementById('kmQ');if(q){q.focus();q.setSelectionRange(pos,pos);}}});
var _origLoad=load; load=async function(sb){await _origLoad(sb); if(window.BOARD_CHAIN)window.BOARD_CHAIN.setData(A);}; window.ADMIN.load=load;
})();

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){var n=document.getElementById('adminNav');if(n&&window.ADMIN)window.ADMIN.render();});
