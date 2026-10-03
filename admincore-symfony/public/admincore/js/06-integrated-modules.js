
/* Integrated demo modules: no external page dependencies. */
var EXTRA={
 ro:{demo:'MODEL DEMONSTRATIV — conținut propus, de validat înainte de utilizare. Nu reprezintă date reale sau procedură juridică.',departments:'Departamente',tasks:'Responsabilități — deschide fișa',result:'Rezultat verificabil',steps:'Pași de lucru',owner:'Responsabil demonstrativ',edit:'Deschide fișa editabilă',pending:'De stabilit',purpose:'Executarea controlată a activității',job:'1. Verifică solicitarea și datele de intrare.\n2. Planifică responsabilul, resursele și termenul.\n3. Execută activitatea și înregistrează rezultatul.\n4. Verifică și predă rezultatul; raportează abaterile.',evaluation:'Rezultat complet, corect, trasabil și predat la termen. Abaterile au responsabil și termen de corecție.',evidence:'Dovadă: înregistrare datată, responsabil și confirmarea verificării.',kpis:['Finalizări la termen / total scadent (%)','Rezultate acceptate fără corecție / total verificate (%)','Înregistrări complete / total verificate (%)','Abateri restante (număr)'],close:'Închide',handover:'Predare HR',handoverText:'Verifică fișele de responsabilitate, persoanele desemnate și criteriile de acceptare. Confirmarea operațională și aprobarea rămân umane.'},
 hu:{demo:'BEMUTATÓMODELL — javasolt mintatartalom, használat előtt jóváhagyandó. Nem valós adat és nem jogi eljárásrend.',departments:'Osztályok',tasks:'Felelősségek — részletlap megnyitása',result:'Ellenőrizhető eredmény',steps:'Végrehajtás lépései',owner:'Bemutatófelelős',edit:'Szerkeszthető adatlap megnyitása',pending:'Meghatározandó',purpose:'A tevékenység szabályozott végrehajtása',job:'1. Ellenőrizd az igényt és a bemeneti adatokat.\n2. Tervezd meg a felelőst, erőforrást és határidőt.\n3. Végezd el a feladatot és rögzítsd az eredményt.\n4. Ellenőrizd és add át az eredményt; jelezd az eltéréseket.',evaluation:'Teljes, pontos, visszakövethető és határidőre átadott eredmény. Az eltérésekhez felelős és javítási határidő tartozik.',evidence:'Bizonyíték: dátumozott bejegyzés, felelős és az ellenőrzés igazolása.',kpis:['Határidőre kész / összes esedékes (%)','Javítás nélkül elfogadott / összes ellenőrzött (%)','Teljes bejegyzések / összes ellenőrzött (%)','Lejárt eltérések (darab)'],close:'Bezárás',handover:'HR-átadás',handoverText:'Ellenőrizd a felelősségi lapokat, a kijelölt személyeket és az elfogadási feltételeket. A működési átvétel és jóváhagyás emberi feladat marad.'},
 en:{demo:'DEMONSTRATION MODEL — proposed sample content, subject to approval before use. Not real data or a legal procedure.',departments:'Departments',tasks:'Responsibilities — open card',result:'Verifiable result',steps:'Execution steps',owner:'Demo owner',edit:'Open editable card',pending:'To be defined',purpose:'Controlled execution of the activity',job:'1. Check the request and input data.\n2. Plan the owner, resources and deadline.\n3. Execute the activity and record the result.\n4. Check and hand over the result; report deviations.',evaluation:'Complete, accurate, traceable result delivered on time. Deviations have an owner and a correction deadline.',evidence:'Evidence: dated record, owner and verification confirmation.',kpis:['On-time completions / all due items (%)','Accepted without correction / all checked (%)','Complete records / all checked (%)','Overdue deviations (count)'],close:'Close',handover:'HR handover',handoverText:'Check responsibility cards, assigned people and acceptance criteria. Operational acceptance and approval remain human decisions.'}
};
var OUTPUTS={
'7.1':['Strategie aprobată și obiective măsurabile','Jóváhagyott stratégia és mérhető célok','Approved strategy and measurable goals'],
'7.2':['Plan de resurse și decizii de alocare documentate','Erőforrásterv és dokumentált elosztási döntések','Resource plan and documented allocation decisions'],
'7.3':['Raport de management și decizii urmărite','Vezetői jelentés és nyomon követett döntések','Management report and tracked decisions'],
'1.1':['Plan de personal și dosare actualizate','Létszámterv és naprakész személyi dossziék','Workforce plan and current personnel files'],
'1.2':['Plan de formare și competențe evaluate','Képzési terv és értékelt kompetenciák','Training plan and assessed competencies'],
'1.3':['Comunicări confirmate și abateri documentate','Visszaigazolt közlések és dokumentált eltérések','Acknowledged communications and documented deviations'],
'2.1':['Analiză de piață și plan de marketing','Piacelemzés és marketingterv','Market analysis and marketing plan'],
'2.2':['Ofertă documentată și comandă confirmată','Dokumentált ajánlat és visszaigazolt megrendelés','Documented quote and confirmed order'],
'2.3':['Campanie publicată și rezultate măsurate','Közzétett kampány és mért eredmények','Published campaign and measured results'],
'3.1':['Rapoarte reconciliate și buget urmărit','Egyeztetett jelentések és követett költségvetés','Reconciled reports and tracked budget'],
'3.2':['Facturi, încasări reconciliate și creanțe urmărite','Számlák, egyeztetett befizetések és követett követelések','Invoices, reconciled receipts and tracked receivables'],
'3.3':['Plăți verificate și inventar actualizat','Ellenőrzött kifizetések és frissített leltár','Verified payments and updated inventory'],
'4.1':['Plan de lucru cu resurse și termene confirmate','Munkaterv visszaigazolt erőforrásokkal és határidőkkel','Work plan with confirmed resources and deadlines'],
'4.2':['Lucrare executată și operații documentate','Elvégzett munka és dokumentált műveletek','Completed work and documented operations'],
'4.3':['Predare confirmată și mișcări de stoc înregistrate','Igazolt átadás és rögzített készletmozgás','Confirmed handover and recorded stock movements'],
'5.1':['Control documentat și rezultat acceptat sau blocat','Dokumentált ellenőrzés és elfogadott vagy zárolt eredmény','Documented inspection and accepted or blocked result'],
'5.2':['Proceduri actualizate și instruire verificată','Aktuális eljárások és ellenőrzött oktatás','Current procedures and verified training'],
'5.3':['Cauză identificată și corecție verificată','Feltárt ok és ellenőrzött javító intézkedés','Identified cause and verified corrective action'],
'6.1':['Solicitare soluționată și client informat','Rendezett ügy és tájékoztatott ügyfél','Resolved request and informed customer'],
'6.2':['Contacte de urmărire documentate și feedback evaluat','Dokumentált utánkövetés és értékelt visszajelzés','Documented follow-ups and evaluated feedback'],
'6.3':['Parteneriat evaluat și plan de extindere aprobat','Értékelt partnerség és jóváhagyott bővítési terv','Evaluated partnership and approved expansion plan']
};
orderedDivisions().forEach(function(d){d.dept.forEach(function(dp){dp.li.forEach(function(task,i){
 var k=d.n+'|'+dp.code+'|'+i;
 if(DETAIL_DEFAULTS[k])return;
 var def={who:d.head,assigned:d.head};
 ['ro','hu','en'].forEach(function(lang,j){var e=EXTRA[lang],title=tlang(task,lang);def[lang]={purpose:e.purpose+': '+title+'. '+tlang(d.d,lang),final:title+' — '+OUTPUTS[dp.code][j]+'\n'+e.evidence,evaluation:e.evaluation,job:title+'\n'+e.job,kpis:e.kpis.slice(),targets:[e.pending,e.pending,e.pending,e.pending]};});
 DETAIL_DEFAULTS[k]=def;
});});});
/* Keep explicit saved values (including blanks); initialize only absent fields. */
ensureDetail=function(r,k){var def=DETAIL_DEFAULTS[k]||{};if(r.who===undefined)r.who=def.who||'';if(r.assigned===undefined)r.assigned=def.assigned||'';r.lang=r.lang||{};['ro','hu','en'].forEach(function(lang){var src=def[lang]||{},x=r.lang[lang]||(r.lang[lang]={});['purpose','final','evaluation','job','kpis','targets'].forEach(function(f){if(x[f]===undefined)x[f]=JSON.parse(JSON.stringify(src[f]!==undefined?src[f]:(f==='kpis'||f==='targets'?['','','','']:lang==='hu'&&f==='final'?r.vfp||'':lang==='hu'&&f==='job'?r.desc||'':'')));});});};
var originalLoad=loadModalLang;
loadModalLang=function(){originalLoad();document.getElementById('kpiNote').textContent=EXTRA[pmLang].demo+' '+PMTXT[pmLang].note;};
var originalGrid=renderGrid;
renderGrid=function(){originalGrid();document.querySelectorAll('.open-l').forEach(function(a,i){a.removeAttribute('href');a.setAttribute('role','button');a.tabIndex=0;a.onclick=function(){openModule(orderedDivisions()[i].n);};a.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();a.click();}};});document.querySelectorAll('.dept-h').forEach(function(h){var code=h.querySelector('.code').textContent;h.tabIndex=0;h.setAttribute('role','button');h.onclick=function(){openModule(Number(code.split('.')[0]),code);};h.onkeydown=function(e){if(e.key==='Enter'){h.click();}};});};
function showModule(title,html){document.getElementById('moduleTitle').textContent=title;document.getElementById('moduleBody').innerHTML='<p class="demo-note">'+esc(EXTRA[appLang].demo)+'</p>'+html;document.getElementById('moduleClose').title=EXTRA[appLang].close;document.getElementById('moduleBack').classList.add('open');document.getElementById('moduleClose').focus();}
var activeModule=null;
function openModule(n,code){activeModule={n:n,code:code};var d=orderedDivisions().find(function(x){return x.n===n;}),e=EXTRA[appLang],dp=code?d.dept.find(function(x){return x.code===code;}):null;
 var html='<h3>'+esc(PMTXT[appLang].purpose)+'</h3><p>'+esc(tx(d.d))+'</p><h3>'+esc(e.owner)+'</h3><button type="button" data-head="'+n+'">'+esc(personName('head|'+n,d.head)||'—')+' ✎</button><h3>'+esc(e.result)+'</h3><p>'+esc(dp?OUTPUTS[code][['ro','hu','en'].indexOf(appLang)]:tx(d.vfp))+'</p>';
 if(dp){html+='<h3>'+esc(e.tasks)+'</h3>';dp.li.concat((ST.store['custom|'+n+'|'+code]||{}).list||[]).forEach(function(task,i){var key=n+'|'+code+'|'+i;if((ST.store[key]||{}).deleted)return;html+='<button data-card-key="'+esc(key)+'" data-card-task="'+esc(task)+'" data-card-div="'+n+'">'+esc(tx(task))+' →</button>';});}
 else{html+='<h3>'+esc(e.departments)+'</h3>'+d.dept.map(function(x){return '<button data-department="'+x.code+'">'+x.code+' · '+esc(tx(x.t))+' →</button>';}).join('')+'<h3>'+esc(u('kpi'))+'</h3><p>'+d.kpi.map(function(x){return esc(tx(x));}).join('<br>')+'</p><h3>'+esc(u('output'))+'</h3><p>'+esc(tx(d.out))+'</p>';}
 showModule((code?code+' · '+tx(dp.t):n+' · '+tx(d.t)),html);
}
document.getElementById('moduleBody').onclick=function(e){var dp=e.target.closest('[data-department]'),c=e.target.closest('[data-card-key]');if(dp){var code=dp.getAttribute('data-department');openModule(Number(code.split('.')[0]),code);}if(c){openModal(c.getAttribute('data-card-key'),c.getAttribute('data-card-div'),c.getAttribute('data-card-task'));}};
document.getElementById('moduleClose').onclick=function(){document.getElementById('moduleBack').classList.remove('open');};
document.getElementById('moduleBack').onclick=function(e){if(e.target===this)document.getElementById('moduleClose').click();};
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(document.getElementById('pmBack').classList.contains('open'))document.getElementById('pmX').click();else if(document.getElementById('moduleBack').classList.contains('open'))document.getElementById('moduleClose').click();}});
var back=document.querySelector('.back');back.removeAttribute('href');back.style.cursor='pointer';back.onclick=function(){showModule(EXTRA[appLang].handover,'<p>'+esc(EXTRA[appLang].handoverText)+'</p><button data-department="1.1">1.1 · '+esc(tx('Administrare HR'))+' →</button>');return false;};
document.addEventListener('click',function(e){var p=e.target.closest('[data-person]');if(p){var role=p.getAttribute('data-person');editPerson('person|'+role,role==='owners'?'RED Assistance Group':'Alex Popescu');}});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches('span[data-head]')){e.preventDefault();e.target.click();}});
var nameRender=render;
render=function(){nameRender();document.querySelectorAll('span[data-head]').forEach(function(el){el.tabIndex=0;el.setAttribute('role','button');});};
render();
