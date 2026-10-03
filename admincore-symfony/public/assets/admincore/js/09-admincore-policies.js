
/* ==== Admin Core — irányelvek, szabályzatok, NC-lapok: címzés + megtekintés + nyomtatás ==== */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function nl2p(t){return String(t||'').split(/\n{2,}/).map(function(p){return '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>';}).join('');}
var DEPT_LABEL={atelier:'Műhely / Atelier',receptie:'Recepció',admin:'Adminisztráció',conducere:'Vezetés','receptie-daune':'Recepció / kár',financiar:'Pénzügy',calitate:'Minőség',hr:'HR',all:'Mindenki'};
var TYPE_LABEL={directiva:'Irányelv',regulament:'Szabályzat','instructiune de lucru':'Munkautasítás',procedura:'Eljárás',formular:'Űrlap'};

window.ADMIN_DOCS={
  /* címzés kiírása egy dokumentumhoz */
  addressee:function(d,A){
    var parts=[];
    if(d.department) parts.push('<span class="adm-tag">'+esc(DEPT_LABEL[d.department]||d.department)+'</span>');
    if(d.dept_code){var dp=A.depts.find(function(x){return x.dept_code===d.dept_code;});parts.push('<span class="adm-tag">'+esc(d.dept_code+(dp?' · '+dp.title_hu:''))+'</span>');}
    if(d.resp_id){var r=A.core.find(function(x){return x.id===d.resp_id;});if(r)parts.push('<span class="adm-tag">'+esc(r.title_hu||r.title_ro)+'</span>');}
    if(d.employee_id){var e=A.emps.find(function(x){return x.id===d.employee_id;});if(e)parts.push('<span class="adm-tag ok">'+esc(e.name)+'</span>');}
    return parts.join(' ')||'<span class="adm-tag">nincs címzés</span>';
  },

  /* lista + megnyitás */
  list:function(A,re,title,typeKey){
    var self=this;
    var docs=A.docs.filter(function(d){return re.test(d.doc_type||'');});
    var h='<div class="adm-hint">Minden irányelvnek van címzettje: osztály, feladatkör, személy. Hatályos = aláírt és oktatott (art. 243). Kattints a sorra a teljes szöveghez és nyomtatáshoz.</div>';
    h+='<div class="adm-tools"><button type="button" class="adm-btn" data-doc-new="'+esc(typeKey)+'">+ Új '+esc(title.toLowerCase())+'</button></div>';
    h+='<div class="adm-card"><h3>'+esc(title)+' · '+docs.length+'</h3><table class="adm-t"><thead><tr><th>Kód / Cím</th><th>Típus</th><th>Kinek szól</th><th>Verzió</th><th>Állapot</th></tr></thead><tbody>';
    docs.forEach(function(d){
      h+='<tr data-doc-open="'+esc(d.id)+'" style="cursor:pointer"><td><b>'+esc(d.doc_code?d.doc_code+' — ':'')+(window.RA_I18N?window.RA_I18N.html('hr_documents',d.id,'title',d.title):esc(d.title))+'</b></td><td>'+esc(TYPE_LABEL[d.doc_type]||d.doc_type)+'</td><td>'+self.addressee(d,A)+'</td><td>v'+esc(d.version||1)+'</td><td>'+(d.is_active?'<span class="adm-tag ok">hatályos</span>':'<span class="adm-tag warn">vázlat</span>')+'</td></tr>';
    });
    h+='</tbody></table></div>';
    return h;
  },

  /* teljes dokumentum nézet (olvasás + nyomtatás) */
  view:function(d,A){
    var self=this;
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal adm-doc"><div class="adm-dochead"><div><div class="adm-eb">'+esc(TYPE_LABEL[d.doc_type]||d.doc_type)+' · v'+esc(d.version||1)+(d.is_active?' · HATÁLYOS':' · VÁZLAT')+'</div><h2>'+esc(d.doc_code?d.doc_code+' — ':'')+esc(d.title)+'</h2><div style="margin-top:6px">'+self.addressee(d,A)+'</div></div>'+
      '<div class="adm-f" style="margin:0"><button type="button" class="adm-btn ghost" data-doc-print="'+esc(d.id)+'">Nyomtatás</button><button type="button" class="adm-btn ghost" data-doc-edit="'+esc(d.id)+'">Szerkesztés</button><button type="button" class="adm-btn" data-doc-close>Bezár</button></div></div>'+
      '<div class="adm-docbody">'+nl2p(d.content||'(nincs tartalom)')+'</div>'+
      '<div class="adm-docfoot">Létrehozta: '+esc(d.created_by||'—')+' · '+esc((d.created_at||'').slice(0,10))+'</div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-doc-close]'))m.remove();});
  },

  /* nyomtatható lap — A4, fejléc a címzéssel, aláírási sor (art. 243) */
  print:function(d,A){
    var addr=[];
    if(d.department)addr.push('Osztály: '+(DEPT_LABEL[d.department]||d.department));
    if(d.dept_code){var dp=A.depts.find(function(x){return x.dept_code===d.dept_code;});addr.push('Alosztály: '+d.dept_code+(dp?' · '+dp.title_hu:''));}
    if(d.resp_id){var r=A.core.find(function(x){return x.id===d.resp_id;});if(r)addr.push('Feladatkör: '+(r.title_hu||r.title_ro));}
    if(d.employee_id){var e=A.emps.find(function(x){return x.id===d.employee_id;});if(e)addr.push('Személy: '+e.name);}
    var w=window.open('','_blank');if(!w)return;
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(d.title)+'</title><style>'+
      'body{font:12.5px/1.55 system-ui,sans-serif;color:#111;margin:0;padding:16mm 18mm}@page{size:A4;margin:12mm}'+
      '.eb{color:#E11D2E;font-weight:700;letter-spacing:.14em;font-size:10px}h1{font-size:19px;margin:4px 0 2px}.meta{color:#555;font-size:11px;margin-bottom:6mm;border-bottom:2px solid #E11D2E;padding-bottom:3mm}'+
      '.addr{background:#F4F1EC;border:1px solid #ddd;border-radius:6px;padding:8px 12px;margin-bottom:6mm;font-size:12px}.addr b{color:#E11D2E}'+
      'p{margin:0 0 3mm}.sig{margin-top:12mm;border-top:1px solid #333;padding-top:3mm;font-size:11px}.sig table{width:100%;border-collapse:collapse}.sig td{padding:6mm 4px 2mm;border-bottom:1px solid #999;width:33%}'+
      '</style></head><body><div class="eb">SC SZKALICZKI SERVICE SRL · '+esc((TYPE_LABEL[d.doc_type]||d.doc_type).toUpperCase())+'</div><h1>'+esc(d.doc_code?d.doc_code+' — ':'')+esc(d.title)+'</h1>'+
      '<div class="meta">Verzió '+esc(d.version||1)+' · '+(d.is_active?'HATÁLYOS':'VÁZLAT')+' · '+esc((d.created_at||'').slice(0,10))+' · '+esc(d.created_by||'')+'</div>'+
      '<div class="addr"><b>KINEK SZÓL:</b> '+(addr.length?esc(addr.join(' · ')):'—')+'</div>'+
      nl2p(d.content||'')+
      '<div class="sig"><b>Átvétel és oktatás igazolása (art. 243):</b><table><tr><td>Munkavállaló neve, aláírása</td><td>Oktatta (aláírás)</td><td>Dátum</td></tr><tr><td></td><td></td><td></td></tr></table></div>'+
      '<script>setTimeout(function(){window.print();},300);<\/script></body></html>');
    w.document.close();
  },

  /* új / szerkesztés — címzéssel, mentés hr_documents-be */
  edit:function(sb,A,typeKey,existing,prefill){
    var d=existing||{doc_type:typeKey||'directiva',title:'',doc_code:'',content:'',department:'atelier',dept_code:'',resp_id:'',employee_id:'',is_active:false,version:1};
    if(prefill)Object.assign(d,prefill);
    var deptOpts=Object.keys(DEPT_LABEL).map(function(k){return '<option value="'+k+'"'+(d.department===k?' selected':'')+'>'+esc(DEPT_LABEL[k])+'</option>';}).join('');
    var subOpts='<option value="">— nincs —</option>'+A.depts.map(function(x){return '<option value="'+esc(x.dept_code)+'"'+(d.dept_code===x.dept_code?' selected':'')+'>'+esc(x.dept_code+' · '+x.title_hu)+'</option>';}).join('');
    var respOpts='<option value="">— nincs —</option>'+A.core.map(function(x){return '<option value="'+esc(x.id)+'"'+(d.resp_id===x.id?' selected':'')+'>'+esc(x.dept_code+' · '+(x.title_hu||x.title_ro))+'</option>';}).join('');
    var empOpts='<option value="">— mindenki az osztályon —</option>'+A.emps.map(function(x){return '<option value="'+esc(x.id)+'"'+(d.employee_id===x.id?' selected':'')+'>'+esc(x.name)+'</option>';}).join('');
    var typeOpts=Object.keys(TYPE_LABEL).map(function(k){return '<option value="'+k+'"'+(d.doc_type===k?' selected':'')+'>'+esc(TYPE_LABEL[k])+'</option>';}).join('');
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal" style="width:min(820px,100%)"><h2>'+(existing?'Szerkesztés':'Új dokumentum')+'</h2>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px">'+
      '<label>Típus<select id="dType">'+typeOpts+'</select></label><label>Kód<input id="dCode" value="'+esc(d.doc_code||'')+'" placeholder="IRD-XXX-01"></label>'+
      '<label style="grid-column:1/-1">Cím<input id="dTitle" value="'+esc(d.title||'')+'"></label>'+
      '<label>Kinek szól — osztály<select id="dDept">'+deptOpts+'</select></label><label>Alosztály<select id="dSub">'+subOpts+'</select></label>'+
      '<label>Feladatkör<select id="dResp">'+respOpts+'</select></label><label>Személy<select id="dEmp">'+empOpts+'</select></label>'+
      '<label style="grid-column:1/-1">Tartalom<textarea id="dContent" rows="12">'+esc(d.content||'')+'</textarea></label>'+
      '<label><input type="checkbox" id="dActive"'+(d.is_active?' checked':'')+'> Hatályos (aláírt, oktatott)</label></div>'+
      '<div id="dErr" class="adm-warn"></div><div class="adm-f"><button type="button" class="adm-btn ghost" id="dC">Mégse</button><button type="button" class="adm-btn" id="dS">Mentés</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('#dC').onclick=function(){m.remove();};
    m.querySelector('#dS').onclick=async function(){
      var title=m.querySelector('#dTitle').value.trim(),content=m.querySelector('#dContent').value.trim();
      if(!title||!content){m.querySelector('#dErr').textContent='Cím és tartalom kötelező.';return;}
      var row={doc_type:m.querySelector('#dType').value,title:title,doc_code:m.querySelector('#dCode').value.trim()||null,content:content,
        department:m.querySelector('#dDept').value,dept_code:m.querySelector('#dSub').value||null,resp_id:m.querySelector('#dResp').value||null,
        employee_id:m.querySelector('#dEmp').value||null,is_active:m.querySelector('#dActive').checked,updated_at:new Date().toISOString()};
      var r;
      if(existing){row.version=(existing.version||1)+1;r=await sb.from('hr_documents').update(row).eq('id',existing.id).select().single();}
      else{row.created_by=(window.RA_SB&&window.RA_SB.me&&window.RA_SB.me.full_name)||null;row.shop_id='00000000-0000-0000-0000-000000000001';r=await sb.from('hr_documents').insert(row).select().single();}
      if(r.error){m.querySelector('#dErr').textContent='Hiba: '+r.error.message;return;}
      if(existing){var i=A.docs.findIndex(function(x){return x.id===existing.id;});if(i>=0)A.docs[i]=r.data;}else A.docs.unshift(r.data);
      m.remove(); if(window.ADMIN)window.ADMIN.render();
    };
  },

  /* NC-lap: teljes nézet + nyomtatás + "irányelv ebből" */
  ncView:function(n,A,sb){
    var self=this;
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal adm-doc"><div class="adm-dochead"><div><div class="adm-eb">FIȘĂ DE NECONFORMITATE · NC #'+n.nr_crt+'</div><h2>'+esc(n.angajat||'—')+' · '+esc(n.data_constatare||'')+'</h2>'+
      '<div style="margin-top:6px"><span class="adm-tag '+(n.gravitate==='majora'||n.gravitate==='critica'?'bad':'')+'">'+esc(n.gravitate||'')+'</span> <span class="adm-tag '+(n.status==='deschisa'?'warn':'ok')+'">'+esc(n.status||'')+'</span> <span class="adm-tag">'+esc(n.categorie||'')+'</span> <span class="adm-tag">rep. '+(n.repetare||1)+'</span></div></div>'+
      '<div class="adm-f" style="margin:0"><button type="button" class="adm-btn ghost" data-nc-print="'+n.nr_crt+'">Nyomtatás</button><button type="button" class="adm-btn ghost" data-nc-todoc="'+n.nr_crt+'">→ Irányelv ebből</button><button type="button" class="adm-btn" data-doc-close>Bezár</button></div></div>'+
      '<div class="adm-docbody">'+
      '<h4>Rögzített tény</h4>'+nl2p(n.descriere)+
      (n.regula_ref?'<h4>Hivatkozott szabály</h4><p>'+esc(n.regula_ref)+'</p>':'')+
      (n.masura_verificare?'<h4>Műszaki verifikálás</h4>'+nl2p(n.masura_verificare):'')+
      (n.masura_preventiva?'<h4>Megelőző intézkedés</h4>'+nl2p(n.masura_preventiva):'')+
      (n.observatii?'<h4>Megjegyzés / besorolás</h4>'+nl2p(n.observatii):'')+
      '</div><div class="adm-docfoot">Constatat de: '+esc(n.constatat_de||'—')+' · Pénzbírság tilos (art. 249) · 12 hónap után törlődik (art. 248 al. 3)</div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-doc-close]'))m.remove();});
  },
  ncPrint:function(n){
    var w=window.open('','_blank');if(!w)return;
    function sec(t,v){return v?'<h3>'+t+'</h3>'+nl2p(v):'';}
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>NC '+n.nr_crt+'</title><style>body{font:12.5px/1.55 system-ui;color:#111;padding:16mm 18mm;margin:0}@page{size:A4;margin:12mm}.eb{color:#E11D2E;font-weight:700;letter-spacing:.14em;font-size:10px}h1{font-size:18px;margin:4px 0 6mm;border-bottom:2px solid #E11D2E;padding-bottom:3mm}h3{font-size:12px;color:#E11D2E;margin:5mm 0 1.5mm}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:4mm}td{border:1px solid #999;padding:2mm}td.k{background:#f4f4f4;width:36%;font-weight:600}p{margin:0 0 2mm}.sig{margin-top:10mm;display:grid;grid-template-columns:1fr 1fr;gap:8mm;font-size:11px}.sig div{border-top:1px solid #333;padding-top:2mm}.foot{margin-top:8mm;font-size:10.5px;color:#555}</style></head><body>'+
      '<div class="eb">SC SZKALICZKI SERVICE SRL · FIȘĂ DE NECONFORMITATE</div><h1>NC #'+n.nr_crt+' · '+esc(n.angajat||'')+'</h1>'+
      '<table><tr><td class="k">Data constatării</td><td>'+esc(n.data_constatare||'')+'</td></tr><tr><td class="k">Categorie</td><td>'+esc(n.categorie||'')+'</td></tr><tr><td class="k">Gravitate</td><td>'+esc(n.gravitate||'')+'</td></tr><tr><td class="k">Repetare (12 luni)</td><td>'+(n.repetare||1)+'</td></tr><tr><td class="k">Regula de referință</td><td>'+esc(n.regula_ref||'—')+'</td></tr><tr><td class="k">Status</td><td>'+esc(n.status||'')+'</td></tr></table>'+
      sec('Fapte constatate (fără calificative)',n.descriere)+sec('Verificare tehnică',n.masura_verificare)+sec('Măsură preventivă',n.masura_preventiva)+sec('Observații / încadrare',n.observatii)+
      '<h3>Poziția angajatului</h3><p style="min-height:18mm;border:1px dashed #999;padding:2mm"></p>'+
      '<div class="sig"><div>Constatator: '+esc(n.constatat_de||'')+'</div><div>Conducător autorizat</div></div>'+
      '<div class="foot">Decizia o ia numai conducătorul autorizat, după procedura art. 251. Amenda este interzisă (art. 249). Sancțiunea se radiază după 12 luni (art. 248 al. 3).</div>'+
      '<script>setTimeout(function(){window.print();},300);<\/script></body></html>');
    w.document.close();
  }
};
})();

/* ==== Admin Core — Import: NC, irányelv, szabályzat, tanulási útmutató fájlból ====
   Fogad: .html .htm .md .txt .pdf .docx  |  Kinyeri a szöveget, felismeri a kódot/típust,
   előtölti az űrlapot. Semmit nem ment automatikusan — te ellenőrzöd és mented. */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* kód → típus felismerés a te elnevezési rendszered szerint */
var CODE_RULES=[
  [/^NC-\d{4}-\d{4}/i,'nc'],
  [/^SES-\d{4}-\d{4}/i,'nc'],
  [/^RG-[A-Z]+-\d+/i,'regulament'],
  [/^IRD-[A-Z]+-\d+/i,'directiva'],
  [/^IL-[A-Z0-9-]+-\d+/i,'instructiune de lucru'],
  [/^INS-[A-Z]+-\d+/i,'instructiune de lucru'],     // tanulási útmutató
  [/^PR-[A-Z0-9-]+-\d+/i,'procedura'],
  [/^FCL-[A-Z]+-\d+|^FCP-\d+|^HR-[A-Z]+-\d+/i,'formular'],
  [/^OB-[A-Z0-9]+-\d+/i,'procedura'],
  [/^KM-[A-Z0-9-]+\d+/i,'instructiune de lucru']
];
function detect(text,filename){
  var head=(filename||'')+'\n'+text.slice(0,600);
  var codeM=head.match(/\b(NC-\d{4}-\d{4}|SES-\d{4}-\d{4}|RG-[A-Z]+-\d+|IRD-[A-Z]+-\d+|IL-[A-Z0-9-]+-\d+|INS-[A-Z]+-\d+|PR-[A-Z0-9-]+-\d+|FCL-[A-Z]+-\d+|FCP-\d+|HR-[A-Z]+-\d+|OB-[A-Z0-9]+-\d+|KM-[A-Z0-9-]+\d+)\b/i);
  var code=codeM?codeM[1].toUpperCase():'';
  var type='directiva';
  for(var i=0;i<CODE_RULES.length;i++){if(CODE_RULES[i][0].test(code)){type=CODE_RULES[i][1];break;}}
  if(!code){ if(/neconformitate|nemmegfelel/i.test(head))type='nc'; else if(/regulament|szabályzat/i.test(head))type='regulament'; else if(/instruc|útmutató|tanítási|ghid/i.test(head))type='instructiune de lucru'; else if(/procedur|eljárás/i.test(head))type='procedura'; }
  // cím: az első értelmes sor
  var lines=text.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length>8&&l.length<160;});
  var title=(lines[0]||filename||'').replace(/\s+/g,' ');
  return {code:code,type:type,title:title};
}

/* szövegkinyerés fájltípus szerint */
async function extract(file){
  var name=file.name.toLowerCase();
  if(/\.(html?|md|txt|csv)$/.test(name)){
    var raw=await file.text();
    if(/\.html?$/.test(name)){var d=new DOMParser().parseFromString(raw,'text/html');d.querySelectorAll('script,style').forEach(function(x){x.remove();});raw=d.body?d.body.innerText:d.documentElement.textContent;}
    return raw.replace(/\n{3,}/g,'\n\n').trim();
  }
  if(/\.pdf$/.test(name)){
    if(!window.pdfjsLib){await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';}
    var buf=await file.arrayBuffer(); var pdf=await window.pdfjsLib.getDocument({data:buf}).promise; var out=[];
    for(var p=1;p<=pdf.numPages;p++){var pg=await pdf.getPage(p);var tc=await pg.getTextContent();out.push(tc.items.map(function(i){return i.str;}).join(' '));}
    return out.join('\n\n').trim();
  }
  if(/\.docx$/.test(name)){
    if(!window.mammoth)await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js');
    var r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()}); return r.value.trim();
  }
  throw new Error('Nem támogatott formátum: '+file.name+' (html, md, txt, pdf, docx)');
}
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('nem tölthető: '+src));};document.head.appendChild(s);});}

/* NC-mezők kinyerése a te NC-lap szerkezetéből (RO/HU címkék) */
function parseNC(text){
  function grab(labels){for(var i=0;i<labels.length;i++){var m=text.match(new RegExp(labels[i]+'\\s*[:：]?\\s*([^\\n]{2,400})','i'));if(m)return m[1].trim();}return '';}
  var dm=text.match(/(?:Data constat[ăa]rii|D[áa]tum|Data)\s*[:：]?\s*(20\d{2}-\d{2}-\d{2}|\d{2}\.\d{2}\.20\d{2})/i);
  var date=dm?dm[1]:((text.match(/\b(20\d{2}-\d{2}-\d{2}|\d{2}\.\d{2}\.20\d{2})\b/)||[])[1]||'');
  if(/^\d{2}\.\d{2}\.20\d{2}$/.test(date)){var p=date.split('.');date=p[2]+'-'+p[1]+'-'+p[0];}
  return {
    angajat:grab(['Angajat','Munkavállaló','Szerelő','Tehnician','Nume']),
    data_constatare:date,
    descriere:grab(['Fapte constatate','Descriere','Rögzített tény','Tények','Constatare']),
    regula_ref:grab(['Regula de referință','Hivatkozott szabály','Regula']),
    masura_preventiva:grab(['Măsură preventivă','Megelőző intézkedés','Masura preventiva']),
    observatii:grab(['Observații','Încadrare','Besorolás','Megjegyzés','Clasa'])
  };
}

window.ADMIN_IMPORT={
  open:function(sb,A){
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal" style="width:min(760px,100%)"><h2>Import — NC · irányelv · szabályzat · tanulási útmutató</h2>'+
      '<div class="adm-hint">Húzd ide vagy válaszd ki a fájlt (HTML, PDF, DOCX, MD, TXT). A rendszer felismeri a kódot (NC-2026-…, RG-…, IRD-…, IL-…, INS-…) és a típust, előtölti az űrlapot. Semmit nem ment magától — te ellenőrzöd és mented.</div>'+
      '<div id="impDrop" class="adm-drop">Fájl kiválasztása vagy húzás ide<input type="file" id="impFile" multiple accept=".html,.htm,.md,.txt,.pdf,.docx" style="display:none"></div>'+
      '<div id="impList"></div><div id="impErr" class="adm-warn"></div>'+
      '<div class="adm-f"><button type="button" class="adm-btn ghost" id="impC">Bezár</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('#impC').onclick=function(){m.remove();};
    var drop=m.querySelector('#impDrop'),inp=m.querySelector('#impFile');
    drop.onclick=function(){inp.click();};
    drop.ondragover=function(e){e.preventDefault();drop.classList.add('over');};
    drop.ondragleave=function(){drop.classList.remove('over');};
    drop.ondrop=function(e){e.preventDefault();drop.classList.remove('over');handle(e.dataTransfer.files);};
    inp.onchange=function(){handle(inp.files);};
    async function handle(files){
      var list=m.querySelector('#impList');
      for(var i=0;i<files.length;i++){
        var f=files[i]; var row=document.createElement('div'); row.className='adm-imp'; row.innerHTML='<b>'+esc(f.name)+'</b> <span class="adm-tag">olvasás…</span>'; list.appendChild(row);
        try{
          var text=await extract(f); var d=detect(text,f.name);
          row.innerHTML='<b>'+esc(f.name)+'</b> <span class="adm-tag ok">'+esc(d.type==='nc'?'NC':d.type)+'</span> <span class="adm-tag">'+esc(d.code||'kód nélkül')+'</span> · '+text.length+' karakter <button type="button" class="adm-btn" style="padding:4px 10px;font-size:12px;margin-left:8px" data-imp-open>Megnyitás és mentés</button>';
          (function(text,d,f){row.querySelector('[data-imp-open]').onclick=function(){
            if(d.type==='nc'){var nc=parseNC(text);var emp=A.emps.find(function(e){return nc.angajat&&e.name&&nc.angajat.toLowerCase().indexOf(e.name.toLowerCase())>=0;});
              window.ADMIN_IMPORT.ncForm(sb,A,{no:d.code,employee:emp?emp.name:nc.angajat,date:nc.data_constatare,facts:nc.descriere||text.slice(0,1500),rule:nc.regula_ref,prevent:nc.masura_preventiva,obs:nc.observatii,raw:text});}
            else{window.ADMIN_DOCS.edit(sb,A,d.type,null,{doc_type:d.type,doc_code:d.code,title:d.title,content:text,is_active:false});}
            m.remove();
          };})(text,d,f);
        }catch(e){row.innerHTML='<b>'+esc(f.name)+'</b> <span class="adm-tag bad">'+esc(e.message)+'</span>';}
      }
    }
  },
  /* NC előtöltött űrlap importból (a valódi crai_neconformitati sémára) */
  ncForm:function(sb,A,pre){
    var opts=A.emps.map(function(e){return '<option'+(pre.employee&&e.name===pre.employee?' selected':'')+'>'+esc(e.name)+'</option>';}).join('');
    var cats=['calitate_lucrare','documentatie_raportare','securitate_ssm','scule_echipamente','piese_ambalare','ordine_curatenie','gestionare_deseuri','alta'];
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal" style="width:min(760px,100%)"><h2>NC import — ellenőrzés és mentés a CRAI-ba</h2><div class="adm-hint">Papír-NC száma: <b>'+esc(pre.no||'—')+'</b> (az observatii-ba kerül; az nr_crt automatikus).</div>'+
      '<label>Dolgozó<select id="nEmp">'+opts+'</select></label><label>Dátum<input id="nDate" type="date" value="'+esc(pre.date||new Date().toISOString().slice(0,10))+'"></label>'+
      '<label>Alosztály<select id="nDept">'+A.depts.map(function(d){return '<option value="'+esc(d.dept_code)+'"'+(d.dept_code==='4.2'?' selected':'')+'>'+esc(d.dept_code+' · '+d.title_hu)+'</option>';}).join('')+'</select></label>'+
      '<label>Kategória<select id="nCat">'+cats.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></label>'+
      '<label>Súlyosság<select id="nGrav"><option value="minora">minoră</option><option value="medie">medie</option><option value="majora" selected>majoră</option><option value="critica">critică</option></select></label>'+
      '<label>Tény<textarea id="nFacts" rows="4">'+esc(pre.facts||'')+'</textarea></label>'+
      '<label>Hivatkozott szabály<input id="nRule" value="'+esc(pre.rule||'')+'"></label>'+
      '<label>Megelőző intézkedés<textarea id="nPrev" rows="2">'+esc(pre.prevent||'')+'</textarea></label>'+
      '<label>Megjegyzés / besorolás<textarea id="nObs" rows="2">'+esc((pre.no?'Fișă NC pe hârtie '+pre.no+'. ':'')+(pre.obs||''))+'</textarea></label>'+
      '<div id="nErr" class="adm-warn"></div><div class="adm-f"><button type="button" class="adm-btn ghost" id="nC">Mégse</button><button type="button" class="adm-btn" id="nS">Mentés a CRAI-ba</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('#nC').onclick=function(){m.remove();};
    m.querySelector('#nS').onclick=async function(){
      var facts=m.querySelector('#nFacts').value.trim();if(!facts){m.querySelector('#nErr').textContent='A tény kötelező.';return;}
      var emp=m.querySelector('#nEmp').value;
      var live=A.ncs.filter(function(n){return n.angajat===emp&&(Date.now()-new Date(n.data_constatare))/86400000<=365;}).length;
      var row={data_constatare:m.querySelector('#nDate').value,angajat:emp,dept_code:m.querySelector('#nDept').value,categorie:m.querySelector('#nCat').value,gravitate:m.querySelector('#nGrav').value,repetare:Math.min(9,live+1),regula_ref:m.querySelector('#nRule').value.trim()||null,descriere:facts,masura_preventiva:m.querySelector('#nPrev').value.trim()||null,observatii:m.querySelector('#nObs').value.trim()||null,constatat_de:(window.RA_SB&&window.RA_SB.me&&window.RA_SB.me.full_name)||null,limba_comunicare:'RO',status:'deschisa',tarif_ora:'180'};
      var r=await sb.from('crai_neconformitati').insert(row).select('nr_crt').single();
      if(r.error){m.querySelector('#nErr').textContent='Hiba: '+r.error.message;return;}
      A.ncs.unshift(Object.assign({nr_crt:r.data.nr_crt},row)); m.remove(); if(window.ADMIN)window.ADMIN.render(); if(window.BOARD_CHAIN)window.BOARD_CHAIN.setData(A);
    };
  }
};
})();

/* ==== Admin Core — NC folyamat: leírás → Claude formalizál → mentés → irányelv/szabály? ====
   A módszertan a CRAI-ból (KM-NECONFORMITATE001 + KM-HR-DISCIPLINAR001). 
   Ma: B út — a felület összeállítja a kérést, a Claude (MCP) formalizál és ír a CRAI-ba, a felület frissül.
   Holnap: A út — ugyanez Edge Function-ön át, gombnyomásra (a kulcs a szerveren). */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var KM={nc:'',disc:''};

async function loadMethod(sb){
  if(KM.nc)return;
  var r=await sb.from('crai_knowledge').select('km_code,content_md').in('km_code',['KM-NECONFORMITATE001','KM-HR-DISCIPLINAR001']);
  (r.data||[]).forEach(function(x){if(x.km_code==='KM-NECONFORMITATE001')KM.nc=x.content_md||'';else KM.disc=x.content_md||'';});
}

/* a Claude-nak szánt kérés — a te módszertanoddal */
function buildPrompt(desc,ctx){
  return 'Te a SC Szkaliczki Service SRL (Bosch Car Service) NC-asszisztense vagy. Az alábbi MÓDSZERTAN szerint dolgozol, szó szerint betartva:\n\n'+
  '=== MÓDSZERTAN: KM-NECONFORMITATE001 v1.8 ===\n'+KM.nc.slice(0,9000)+'\n\n=== KM-HR-DISCIPLINAR001 (fegyelmi útvonal, csak ha releváns) ===\n'+KM.disc.slice(0,4000)+'\n\n'+
  '=== KONTEXTUS ===\nDolgozók: '+ctx.emps.join(', ')+'\nAlosztályok: '+ctx.depts.join(' | ')+'\nKorábbi NC-k (12 hónap, dolgozónként): '+ctx.history+'\n\n'+
  '=== AZ ESET (szabad leírás) ===\n'+desc+'\n\n'+
  '=== FELADAT ===\n1. Formalizáld NC-lappá: TÉNY (jelző nélkül, dátum/tanú/munkalap ha van), KATEGÓRIA (a 8-ból: ordine_curatenie, calitate_lucrare, securitate_ssm, gestionare_deseuri, scule_echipamente, piese_ambalare, documentatie_raportare, alta), GRAVITATE (minora/medie/majora/critica), ALOSZTÁLY (kód), HIVATKOZOTT SZABÁLY, KÉTRÉTEGŰ GYÖKÉROK (a) rendszer, (b) magatartás — az utóbbit nem te döntöd el), MŰSZAKI VERIFIKÁLÁS (V1–Vn), MEGELŐZŐ INTÉZKEDÉS, BESOROLÁS A–D (art. 254 szerint; írott+oktatott szabály nélkül B), ISMÉTLÉS (csak 12 hónapon belül).\n'+
  '2. Ha a tény nem munkaminőség, hanem jelenlét/végrehajtás/hozzáállás, jelezd: SES-referat kell, nem NC.\n'+
  '3. Mentsd a CRAI-ba MCP-n: INSERT crai_neconformitati (data_constatare, angajat, dept_code, categorie, gravitate, repetare, regula_ref, descriere, masura_verificare, masura_preventiva, observatii, constatat_de, limba_comunicare, status, tarif_ora) — nr_crt automatikus, a besorolás az observatii-ba.\n'+
  '4. A mentés után KÉRDEZD MEG: „Ebből IRÁNYELV (IRD-…) vagy SZABÁLYZAT (RG-…) legyen?" — irányelv, ha egy konkrét magatartást/lépést ír elő; szabályzat, ha jogi/fegyelmi következménye van (art. 241–243). Ha a válasz megvan, készítsd el a vázlatot és mentsd hr_documents-be (doc_type, doc_code, title, content, department, dept_code, employee_id, is_active=false), címzéssel: osztály, alosztály, feladatkör, személy.\n'+
  '5. Nyelv: RO master + HU. Pénzbírságot soha nem javasolsz (art. 249). Karakterjelzőt nem írsz.';
}

window.ADMIN_NCFLOW={
  open:async function(sb,A){
    await loadMethod(sb);
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal" style="width:min(820px,100%)"><h2>Új NC — leírás → formalizálás</h2>'+
      '<div class="adm-hint">Írd le szabadon, mi történt: ki, mikor, milyen autó/munkalap, mi a hiba, ki vette észre. <b>Nem kell űrlapot tölteni.</b> A Claude a KM-NECONFORMITATE001 módszertan szerint formalizálja, menti a CRAI-ba, és megkérdezi: irányelv vagy szabály legyen belőle.</div>'+
      '<label>Az eset leírása<textarea id="fDesc" rows="9" placeholder="Pl.: Ma, 2026-09-14 délelőtt Szerelő 3 a MS 27 DMP Citroën vezérlés-cseréjénél nem írta fel a nyomatékot a munkalapra, David vette észre az átvételnél. Munkalap 535360. Nem volt ügyfélhatás."></textarea></label>'+
      '<div class="adm-f"><button type="button" class="adm-btn ghost" id="fC">Mégse</button><button type="button" class="adm-btn" id="fGo">Formalizálás →</button></div>'+
      '<div id="fOut" hidden></div></div>';
    document.body.appendChild(m);
    m.querySelector('#fC').onclick=function(){m.remove();};
    m.querySelector('#fGo').onclick=function(){
      var desc=m.querySelector('#fDesc').value.trim(); if(desc.length<20){alert('Írj legalább egy mondatot az esetről.');return;}
      var hist={};A.ncs.forEach(function(n){if((Date.now()-new Date(n.data_constatare))/86400000<=365){hist[n.angajat]=(hist[n.angajat]||0)+1;}});
      var ctx={emps:A.emps.map(function(e){return e.name;}),depts:A.depts.map(function(d){return d.dept_code+' '+d.title_hu;}),history:Object.keys(hist).map(function(k){return k+': '+hist[k];}).join(', ')||'nincs'};
      var prompt=buildPrompt(desc,ctx);
      var out=m.querySelector('#fOut'); out.hidden=false;
      out.innerHTML='<div class="adm-hint" style="margin-top:12px"><b>A kérés kész.</b> Két mód:<br>'+
        '<b>1) Claude-dal (MCP, most):</b> másold a promptot egy Claude-beszélgetésbe — ő formalizál, ment a CRAI-ba, és megkérdezi: irányelv vagy szabály. Utána itt <b>Frissítés</b>, és az NC megjelenik a táblán.<br>'+
        '<b>2) Automatikus (Edge Function, ha bekötve):</b> gombnyomásra ugyanez, kérdés nélkül másolás.</div>'+
        '<textarea id="fPrompt" rows="8" readonly style="width:100%;font:12px/1.4 var(--mono);padding:10px;border:1px solid var(--ink200);border-radius:8px">'+esc(prompt)+'</textarea>'+
        '<div class="adm-f"><button type="button" class="adm-btn ghost" id="fCopy">Prompt másolása</button><button type="button" class="adm-btn ghost" id="fAuto">Automatikus (Edge)</button><button type="button" class="adm-btn" id="fRefresh">Frissítés (mentés után)</button></div>';
      out.querySelector('#fCopy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(prompt);this.textContent='Másolva ✓';};
      out.querySelector('#fRefresh').onclick=async function(){await window.ADMIN.load(sb);window.ADMIN.render();if(window.BOARD_CHAIN)window.BOARD_CHAIN.setData(window.ADMIN.data);m.remove();};
      out.querySelector('#fAuto').onclick=async function(){
        this.textContent='Küldés…';
        try{
          var r=await sb.functions.invoke('nc-formalize',{body:{prompt:prompt,description:desc}});
          if(r.error)throw r.error;
          var d=r.data||{};
          out.innerHTML='<div class="adm-hint" style="margin-top:12px"><b>Formalizálva és mentve.</b> NC #'+esc(d.nr_crt||'?')+'</div>'+
            '<div class="adm-docbody" style="max-height:40vh">'+esc(d.summary||'').replace(/\\n/g,'<br>')+'</div>'+
            '<div class="adm-hint"><b>Kérdés:</b> ebből irányelv vagy szabályzat legyen?</div>'+
            '<div class="adm-f"><button type="button" class="adm-btn ghost" id="fDir">Irányelv (IRD)</button><button type="button" class="adm-btn ghost" id="fRule">Szabályzat (RG)</button><button type="button" class="adm-btn" id="fDone">Egyik sem, kész</button></div>';
          out.querySelector('#fDone').onclick=async function(){await window.ADMIN.load(sb);window.ADMIN.render();m.remove();};
          out.querySelector('#fDir').onclick=function(){m.remove();window.ADMIN_DOCS.edit(sb,A,'directiva',null,{doc_code:'IRD-',title:'Irányelv — NC #'+(d.nr_crt||''),content:d.directive_draft||d.summary||''});};
          out.querySelector('#fRule').onclick=function(){m.remove();window.ADMIN_DOCS.edit(sb,A,'regulament',null,{doc_code:'RG-',title:'Szabályzat — NC #'+(d.nr_crt||''),content:d.rule_draft||d.summary||''});};
        }catch(e){this.textContent='Automatikus (Edge)';alert('Az NC automatikus formalizálása még nincs bekötve (Edge Function: nc-formalize).\nA fordítás már automatikus — az NC ugyanígy bekapcsolható.\nAddig: prompt másolása → Claude.');}
      };
    };
  }
};
})();

/* ==== Admin Core — CRAI tudáscsatorna: a 57 KM-modul böngészhető, kereshető, olvasható, nyomtatható ==== */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
/* egyszerű markdown → HTML (címsor, lista, vastag, kód, táblázat) */
function md(t){
  var lines=String(t||'').split('\n'),out=[],inList=false,inTable=false;
  function closeList(){if(inList){out.push('</ul>');inList=false;}}
  function closeTable(){if(inTable){out.push('</tbody></table>');inTable=false;}}
  lines.forEach(function(l){
    var s=l.replace(/\s+$/,'');
    if(/^\|.*\|$/.test(s)){ closeList(); var cells=s.slice(1,-1).split('|').map(function(c){return c.trim();}); if(/^[-:| ]+$/.test(s))return;
      if(!inTable){out.push('<table class="km-t"><tbody>');inTable=true;} out.push('<tr>'+cells.map(function(c){return '<td>'+inline(c)+'</td>';}).join('')+'</tr>'); return;}
    closeTable();
    var h=s.match(/^(#{1,4})\s+(.*)/); if(h){closeList();out.push('<h'+(h[1].length+1)+'>'+inline(h[2])+'</h'+(h[1].length+1)+'>');return;}
    if(/^\s*[-*]\s+/.test(s)){if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+inline(s.replace(/^\s*[-*]\s+/,''))+'</li>');return;}
    if(/^\s*\d+\.\s+/.test(s)){if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+inline(s.replace(/^\s*\d+\.\s+/,''))+'</li>');return;}
    closeList(); if(s.trim()==='')return; out.push('<p>'+inline(s)+'</p>');
  });
  closeList();closeTable(); return out.join('\n');
}
function inline(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1');}

/* alosztály ↔ rendszer megfeleltetés (a CRAI system mezője → 4.x / 5.x / 1.x) */
var SYS_DEPT={'VW-EA288':'4.2','MB-W906':'4.2','MB-OM651':'4.2','MB-W903':'4.2','BMW-N20':'4.2','FORD-TDCI':'4.2','VW-AHD':'4.2','VW-CRAFTER':'4.2','PSA-FAP':'4.2','MOTOR':'4.2','FRANE':'4.2','SUSPENSIE':'4.2','CLIMATIZARE':'4.2','ELECTRIC':'4.2','CAROSERIE':'4.2','CURATARE':'4.2',
  'DIAGNOZA':'4.1','DOC-T2':'4.1','DOC-VW':'4.1','DOC-MB':'4.1','DOC-FORD':'4.1','DOC-OPEL':'4.1','DOC-NISSAN':'4.1','DOCUMENTATIE':'4.1','DOC-INDEX':'4.1',
  'PIESE':'4.3','CALITATE':'5.1','CRAI':'5.3','PRODUCTIE':'4.1','HR-RO':'1.3','HR':'1.1','MANAGEMENT':'7.3','VEZETES':'7.1','GOVERNANCE':'7.2','COMERCIAL':'2.2','MARKETING':'2.1'};

window.ADMIN_CRAI={
  deptOf:function(k){return SYS_DEPT[k.system]||'';},
  view:function(A,filterCode){
    var self=this, km=A.km||[];
    var q=(window.ADMIN&&window.ADMIN.kmQuery)||'';
    var list=km.filter(function(k){return !filterCode||self.deptOf(k)===filterCode;});
    if(q){var ql=q.toLowerCase();list=list.filter(function(k){return (k.km_code+' '+k.title+' '+(k.system||'')+' '+(k.tags||[]).join(' ')+' '+(k.content_md||'').slice(0,3000)).toLowerCase().indexOf(ql)>=0;});}
    var bySys={};list.forEach(function(k){(bySys[k.system||'—']=bySys[k.system||'—']||[]).push(k);});
    var h='<div class="adm-hint">CRAI tudásbázis — '+km.length+' modul, '+Object.keys(bySys).length+' rendszer. „Mérj előbb, cserélj után." Kattints a modulra: teljes tartalom + nyomtatás. Az alosztály-számok a táblán ide vezetnek.</div>';
    h+='<div class="adm-tools"><input id="kmQ" type="search" placeholder="Keresés: kód, cím, rendszer, tag, tartalom… (pl. EA288, olajpumpa, DPF)" value="'+esc(q)+'" style="font:inherit;font-size:14px;padding:9px 12px;border:1px solid var(--ink200);border-radius:9px;width:min(520px,100%)"></div>';
    Object.keys(bySys).sort().forEach(function(sys){
      h+='<div class="adm-card"><h3>'+esc(sys)+' <span class="adm-tag">'+bySys[sys].length+'</span> <span class="adm-tag">'+esc(SYS_DEPT[sys]||'—')+'</span></h3><table class="adm-t"><tbody>';
      bySys[sys].forEach(function(k){h+='<tr data-km-open="'+esc(k.km_code)+'" style="cursor:pointer"><td style="width:220px"><b>'+esc(k.km_code)+'</b><br><small>v'+esc(k.version||'')+' · '+esc((k.languages||[]).join('/'))+'</small></td><td>'+esc(k.title)+'<br><small style="color:var(--ink500)">'+esc((k.tags||[]).slice(0,6).join(' · '))+'</small></td></tr>';});
      h+='</tbody></table></div>';
    });
    if(!list.length)h+='<p class="adm-hint">Nincs találat.</p>';
    return h;
  },
  open:function(k){
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal adm-doc" style="width:min(960px,100%)"><div class="adm-dochead"><div><div class="adm-eb">CRAI · '+esc(k.system||'')+' · v'+esc(k.version||'')+' · '+esc(k.status||'')+'</div><h2>'+esc(k.km_code)+' — '+esc(k.title)+'</h2><div style="margin-top:6px">'+(k.tags||[]).map(function(t){return '<span class="adm-tag">'+esc(t)+'</span> ';}).join('')+'</div></div>'+
      '<div class="adm-f" style="margin:0"><button type="button" class="adm-btn ghost" data-km-print="'+esc(k.km_code)+'">Nyomtatás</button><button type="button" class="adm-btn" data-doc-close>Bezár</button></div></div>'+
      '<div class="adm-docbody km-body">'+md(k.content_md)+'</div>'+
      '<div class="adm-docfoot">'+esc(k.source_note||'')+' · frissítve '+esc((k.updated_at||'').slice(0,10))+'</div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-doc-close]'))m.remove();});
  },
  print:function(k){
    var w=window.open('','_blank');if(!w)return;
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(k.km_code)+'</title><style>body{font:12.5px/1.55 system-ui;color:#111;margin:0;padding:14mm 16mm}@page{size:A4;margin:12mm}.eb{color:#E11D2E;font-weight:700;letter-spacing:.14em;font-size:10px}h1{font-size:18px;margin:4px 0 6mm;border-bottom:2px solid #E11D2E;padding-bottom:3mm}h2{font-size:15px;margin:6mm 0 2mm;color:#111}h3{font-size:13px;color:#E11D2E;margin:5mm 0 1.5mm}h4,h5{font-size:12px;margin:4mm 0 1mm}p{margin:0 0 2.5mm}ul{margin:0 0 3mm 5mm}li{margin-bottom:1mm}table{border-collapse:collapse;width:100%;margin:2mm 0 4mm;font-size:11.5px}td{border:1px solid #999;padding:1.5mm 2mm;vertical-align:top}code{background:#f4f4f4;padding:0 3px}.foot{margin-top:8mm;font-size:10.5px;color:#555;border-top:1px solid #ccc;padding-top:2mm}</style></head><body>'+
      '<div class="eb">SC SZKALICZKI SERVICE SRL · CRAI · '+esc(k.system||'')+'</div><h1>'+esc(k.km_code)+' — '+esc(k.title)+'</h1>'+md(k.content_md)+
      '<div class="foot">Verzió '+esc(k.version||'')+' · '+esc(k.source_note||'')+' · NU GHICIM. MĂSURĂM.</div><script>setTimeout(function(){window.print();},300);<\/script></body></html>');
    w.document.close();
  }
};
})();

/* ==== Fordítás-réteg — minden bevitt szöveg RO / HU / EN ====
   Forrás: org_i18n (tbl,row_id,field,lang). Jóváhagyott = tiszta; javasolt = jelölve (prompt 16. pont).
   Hiánynál a forrásnyelv jelenik meg, jelöléssel — sosem üres, sosem kitalált. */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var MAP={}, LANGNAME={ro:'română',hu:'magyar',en:'English'};
function lang(){return window.appLang||'hu';}
function key(t,r,f,l){return t+'|'+r+'|'+f+'|'+l;}

window.RA_I18N={
  rows:[],
  load:function(rows){ MAP={}; this.rows=rows||[]; (rows||[]).forEach(function(x){MAP[key(x.tbl,x.row_id,x.field,x.lang)]=x;}); },
  /* szöveg a jelenlegi nyelven; ha nincs → forrás + jelölés */
  t:function(tbl,rowId,field,fallback,fallbackLang){
    var l=lang(), hit=MAP[key(tbl,String(rowId),field,l)];
    if(hit&&hit.text) return {text:hit.text, approved:hit.is_approved!==false, missing:false, lang:l};
    return {text:fallback||'', approved:true, missing:true, lang:fallbackLang||'ro'};
  },
  /* megjelenítés: javasolt fordítás vagy hiány jelölve */
  html:function(tbl,rowId,field,fallback,fallbackLang){
    var r=this.t(tbl,rowId,field,fallback,fallbackLang);
    if(r.missing&&r.text) return esc(r.text)+' <span class="i18n-flag" title="Nincs fordítás ezen a nyelven — az eredeti szöveg látszik">'+esc((r.lang||'').toUpperCase())+'</span>';
    if(!r.approved) return esc(r.text)+' <span class="i18n-flag sug" title="Javasolt fordítás, még nem jóváhagyott">javasolt</span>';
    return esc(r.text);
  },
  /* hiánytérkép */
  gaps:function(A){
    var out=[], L=['ro','hu','en'];
    function add(tbl,rowId,field,label,src){
      L.forEach(function(l){ if(!MAP[key(tbl,String(rowId),field,l)]) out.push({tbl:tbl,row_id:String(rowId),field:field,lang:l,label:label,source:src}); });
    }
    (A.depts||[]).forEach(function(d){
      add('admin_dept',d.dept_code,'title',d.dept_code+' cím',d.title_hu||d.title_ro);
      add('admin_dept',d.dept_code,'purpose',d.dept_code+' cél',d.purpose_hu||d.purpose_ro);
      add('admin_dept',d.dept_code,'vfp',d.dept_code+' értékes végtermék',d.vfp_hu||d.vfp_ro);
      add('admin_dept',d.dept_code,'kpi',d.dept_code+' mérés',d.kpi_hu||d.kpi_ro);
    });
    (A.core||[]).forEach(function(c){ add('admin_core',c.id,'title',c.dept_code+' feladatkör',c.title_hu||c.title_ro); });
    (A.docs||[]).forEach(function(d){ add('hr_documents',d.id,'title','Dokumentum cím',d.title); add('hr_documents',d.id,'content','Dokumentum tartalom',(d.content||'').slice(0,400)); });
    (A.ncs||[]).forEach(function(n){ add('crai_neconformitati',n.nr_crt,'descriere','NC #'+n.nr_crt+' tény',n.descriere); });
    return out;
  },
  /* Claude-prompt a hiányzó fordításokhoz (kötegelt) */
  prompt:function(items){
    var byLang={}; items.forEach(function(i){(byLang[i.lang]=byLang[i.lang]||[]).push(i);});
    var p='Fordítsd le az alábbi szövegeket a SC Szkaliczki Service SRL (Bosch Car Service) szervezési rendszeréhez.\n\n'+
      'SZABÁLYOK:\n- Szakmai, autószerviz-terminológia; a román a mesterpéldány.\n- A dokumentumkódokat (RG-, IRD-, IL-, NC-, FCL-, KM-) NEM fordítod.\n- Jogszabály-hivatkozást (art. 243, 248, 251, 254) nem fordítasz.\n- Tömör, munkahelyi nyelv; nem marketing.\n- A jelentés pontos legyen, nem a szó szerinti forma.\n\n';
    Object.keys(byLang).forEach(function(l){
      p+='=== CÉLNYELV: '+(LANGNAME[l]||l)+' ('+l+') ===\n';
      byLang[l].forEach(function(i){ p+='['+i.tbl+'|'+i.row_id+'|'+i.field+'] '+(i.source||'').replace(/\n/g,' ').slice(0,600)+'\n'; });
      p+='\n';
    });
    p+='=== MENTÉS (MCP, Supabase zwsjfzqtskicrukidaog) ===\nMinden fordítást írj be:\nINSERT INTO org_i18n (tbl,row_id,field,lang,text,source_lang,translated_by,is_approved)\nVALUES (...,\'claude\',false)\nON CONFLICT (tbl,row_id,field,lang) DO UPDATE SET text=excluded.text, updated_at=now();\n\nAz is_approved maradjon false — a tulajdonos hagyja jóvá a felületen.';
    return p;
  },
  /* nézet: fordítási hiánytérkép + indítás */
  view:function(A,sb){
    var self=this, gaps=this.gaps(A);
    var byLang={ro:0,hu:0,en:0}; gaps.forEach(function(g){byLang[g.lang]++;});
    var total=(A.depts.length*4+A.core.length+A.docs.length*2+A.ncs.length)*3;
    var h='<div class="adm-hint">Minden bevitt szöveg három nyelven: română · magyar · English. A román a mesterpéldány. Hiányzó fordításnál az eredeti szöveg jelenik meg, nyelvjelöléssel — soha nem üres és soha nem kitalált. A Claude fordítása „javasolt" marad, amíg jóvá nem hagyod.</div>';
    h+='<div class="adm-stats">'+['ro','hu','en'].map(function(l){
      return '<div'+(byLang[l]?' class="bad"':'')+'><b>'+byLang[l]+'</b>hiányzó · '+esc(LANGNAME[l])+'</div>';}).join('')+
      '<div><b>'+(total-gaps.length)+'</b>kész / '+total+'</div></div>';
    h+='<div class="adm-tools"><button type="button" class="adm-btn" id="i18nGo">Fordítás indítása ('+gaps.length+')</button>'+
       '<button type="button" class="adm-btn ghost" id="i18nApprove">Javasolt fordítások jóváhagyása</button></div>';
    var sug=this.rows.filter(function(x){return x.is_approved===false;}).length;
    if(sug)h+='<div class="adm-hint" style="border-left-color:var(--warn-600)"><b>'+sug+'</b> javasolt fordítás vár jóváhagyásra.</div>';
    // hiánylista csoportosítva
    var byT={}; gaps.forEach(function(g){(byT[g.tbl]=byT[g.tbl]||[]).push(g);});
    Object.keys(byT).forEach(function(t){
      h+='<div class="adm-card"><h3>'+esc(t)+' <span class="adm-tag">'+byT[t].length+'</span></h3><table class="adm-t"><thead><tr><th>Mező</th><th>Nyelv</th><th>Eredeti</th></tr></thead><tbody>';
      byT[t].slice(0,40).forEach(function(g){ h+='<tr><td>'+esc(g.label)+'</td><td><span class="adm-tag">'+esc(g.lang)+'</span></td><td>'+esc((g.source||'').slice(0,110))+'</td></tr>'; });
      if(byT[t].length>40)h+='<tr><td colspan="3" class="adm-cap">… és további '+(byT[t].length-40)+'</td></tr>';
      h+='</tbody></table></div>';
    });
    if(!gaps.length)h+='<div class="adm-card"><h3>Minden szöveg lefordítva</h3></div>';
    return h;
  },
  startDialog:function(A,sb){
    var gaps=this.gaps(A); if(!gaps.length){alert('Nincs hiányzó fordítás.');return;}
    var self=this, batch=gaps.slice(0,80), prompt=this.prompt(batch);
    var m=document.createElement('div');m.className='adm-back';
    m.innerHTML='<div class="adm-modal" style="width:min(820px,100%)"><h2>Fordítás — '+batch.length+' szöveg</h2>'+
      '<div class="adm-hint">Két mód. <b>1) Claude (MCP):</b> másold a promptot egy beszélgetésbe — lefordítja és beírja az org_i18n-be. Utána Frissítés. <b>2) Automatikus:</b> Edge Function (ha bekötve).</div>'+
      '<textarea id="i18nP" rows="10" readonly style="width:100%;font-family:var(--font-mono);font-size:12px;padding:10px;border:1px solid var(--border-strong);border-radius:6px">'+esc(prompt)+'</textarea>'+
      '<div class="adm-f"><button type="button" class="adm-btn ghost" id="i18nCopy">Prompt másolása</button><button type="button" class="adm-btn ghost" id="i18nAuto">Automatikus (Edge)</button><button type="button" class="adm-btn" id="i18nRef">Frissítés</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',function(e){if(e.target===m)m.remove();});
    m.querySelector('#i18nCopy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(prompt);this.textContent='Másolva';};
    m.querySelector('#i18nRef').onclick=async function(){await window.ADMIN.load(sb);window.ADMIN.render();m.remove();};
    m.querySelector('#i18nAuto').onclick=async function(){
      var btn=this, all=self.gaps(A), done=0, failed=null;
      btn.disabled=true;
      var log=document.createElement('div'); log.className='adm-hint'; log.style.marginTop='10px'; m.querySelector('.adm-modal').appendChild(log);
      while(all.length){
        var chunk=all.splice(0,60);
        btn.textContent='Fordítás… ('+done+'/'+(done+chunk.length+all.length)+')';
        log.innerHTML='Küldés: '+chunk.length+' szöveg. Kész: <b>'+done+'</b>. Hátra: '+all.length+'.';
        try{
          var r=await sb.functions.invoke('translate',{body:{items:chunk}});
          if(r.error) throw r.error;
          var d=r.data||{};
          if(d.error){ failed=d; break; }
          done+=(d.saved||0);
        }catch(e){ failed={error:'halozat',message:String(e&&e.message||e)}; break; }
      }
      btn.disabled=false; btn.textContent='Automatikus (Edge)';
      if(failed){
        var msg = failed.error==='nincs_kulcs'
          ? 'Az automatikus fordításhoz be kell állítani a Claude API-kulcsot a Supabase-en:\nEdge Functions → Secrets → új secret: ANTHROPIC_API_KEY.\nA kulcs a szerveren marad, a böngészőbe soha nem kerül.\nAddig használd a prompt-másolást.'
          : 'A fordítás megállt: '+(failed.message||failed.detail||failed.error)+'\nAmi elkészült ('+done+' szöveg), az mentve van.';
        log.innerHTML='<b>Megállt.</b> Mentve: '+done+'.';
        alert(msg);
      } else {
        log.innerHTML='<b>Kész.</b> '+done+' fordítás mentve, jóváhagyásra vár.';
      }
      await window.ADMIN.load(sb); window.ADMIN.render();
      if(window.BOARD_CHAIN) window.BOARD_CHAIN.setData(window.ADMIN.data);
      if(!failed) setTimeout(function(){m.remove();},1500);
    };
  },
  approveAll:async function(sb){
    if(!confirm('Minden javasolt fordítás jóváhagyása?'))return;
    await sb.from('org_i18n').update({is_approved:true}).eq('is_approved',false);
    await window.ADMIN.load(sb); window.ADMIN.render();
  }
};
})();

