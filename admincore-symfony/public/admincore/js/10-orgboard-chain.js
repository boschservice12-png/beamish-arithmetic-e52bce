
/* ==== Szervezési tábla — értelmi lánc az alosztályokon és feladatkörökön ====
   alosztály: cél · VFP · vezető · [NC n] [irányelv n] [szabályzat n]
   feladatkör: felelős → ellenőrző · leírás · irányelv · NC */
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

var UI={
 nc:{ro:'NC',hu:'NC',en:'NC'},dir:{ro:'Directivă',hu:'Irányelv',en:'Directive'},rule:{ro:'Regulament',hu:'Szabályzat',en:'Rule'},km:{ro:'Cunoștințe',hu:'Tudás',en:'Knowledge'},
 open:{ro:'deschise',hu:'nyitott',en:'open'},purpose:{ro:'Scop',hu:'Cél',en:'Purpose'},vfp:{ro:'Produs final valoros',hu:'Értékes végtermék',en:'Valuable final product'},
 leader:{ro:'Responsabil dept.',hu:'Vezető',en:'Lead'},kpi:{ro:'Măsurare',hu:'Mérés',en:'Measure'},
 does:{ro:'Execută',hu:'Elvégzi',en:'Performs'},checks:{ro:'Verifică',hu:'Ellenőrzi',en:'Verifies'},
 fisa:{ro:'Fișă',hu:'Leírás',en:'Job description'}};
function L(k){var l=(window.appLang||'hu');return (UI[k]&&UI[k][l])||(UI[k]&&UI[k].hu)||k;}
var C={depts:[],core:[],ncs:[],docs:[],emps:[],km:[]};
function empName(id){var e=C.emps.find(function(x){return x.id===id;});return e?e.name:'';}
function isRule(d){return d.doc_type==='regulament';}
function isDir(d){return /directiva|instructiune|procedura/.test(d.doc_type||'');}

var _deco=null, _busy=false;
function scheduleDecorate(){if(_busy)return;_busy=true;setTimeout(function(){_busy=false;if(window.BOARD_CHAIN)window.BOARD_CHAIN.decorate();},30);}
window.BOARD_CHAIN={
  watch:function(){
    var grid=document.getElementById('grid')||document.querySelector('.board-shell')||document.body;
    if(_deco)return; _deco=new MutationObserver(function(muts){
      // csak akkor, ha NEM a saját dekorációnk okozta
      var own=muts.every(function(m){return [].slice.call(m.addedNodes).every(function(n){return n.nodeType!==1||/chain-/.test(n.className||'');});});
      if(!own)scheduleDecorate();
    }); _deco.observe(grid,{childList:true,subtree:true});
  },
  setData:function(A){C.depts=A.depts||[];C.core=A.core||[];C.ncs=A.ncs||[];C.docs=A.docs||[];C.emps=A.emps||[];C.km=A.km||[];this.decorate();this.watch();},
  /* alosztály fejléc: számok + cél + VFP + vezető */
  decorate:function(){
    var self=this;
    document.querySelectorAll('.dept').forEach(function(box){
      var codeEl=box.querySelector('.code'); if(!codeEl)return;
      var code=codeEl.textContent.trim();
      var d=C.depts.find(function(x){return x.dept_code===code;}); if(!d)return;
      var nc=C.ncs.filter(function(n){return n.dept_code===code;}), ncOpen=nc.filter(function(n){return n.status==='deschisa';}).length;
      var dirs=C.docs.filter(function(x){return x.dept_code===code&&isDir(x);}), rules=C.docs.filter(function(x){return x.dept_code===code&&isRule(x);});
      var kms=C.km.filter(function(k){return window.ADMIN_CRAI&&window.ADMIN_CRAI.deptOf(k)===code;});
      var old=box.querySelector('.chain-dept'); if(old)old.remove();
      var el=document.createElement('div'); el.className='chain-dept';
      el.innerHTML='<div class="chain-nums">'+
        '<button type="button" class="chain-n nc'+(ncOpen?' hot':'')+'" data-chain="nc" data-code="'+esc(code)+'" title="Nemmegfelelőségek">'+L('nc')+' <b>'+nc.length+'</b>'+(ncOpen?'<i>'+ncOpen+' '+L('open')+'</i>':'')+'</button>'+
        '<button type="button" class="chain-n dir" data-chain="dir" data-code="'+esc(code)+'" title="Directive">'+L('dir')+' <b>'+dirs.length+'</b></button>'+
        '<button type="button" class="chain-n rule" data-chain="rule" data-code="'+esc(code)+'" title="Regulamente">'+L('rule')+' <b>'+rules.length+'</b></button>'+
        '<button type="button" class="chain-n km" data-chain="km" data-code="'+esc(code)+'" title="CRAI">'+L('km')+' <b>'+kms.length+'</b></button></div>'+
        '<div class="chain-vfp"><span class="k">'+esc(L('purpose'))+'</span>'+(window.RA_I18N?window.RA_I18N.html('admin_dept',code,'purpose',d.purpose_hu||'—'):esc(d.purpose_hu||'—'))+'</div>'+
        '<div class="chain-vfp"><span class="k">'+esc(L('vfp'))+'</span><b>'+(window.RA_I18N?window.RA_I18N.html('admin_dept',code,'vfp',d.vfp_hu||'—'):esc(d.vfp_hu||'—'))+'</b></div>'+
        '<div class="chain-vfp"><span class="k">'+esc(L('leader'))+'</span>'+esc(empName(d.leader_id)||'—')+' <span class="k" style="margin-left:10px">'+esc(L('kpi'))+'</span><small>'+esc(d.kpi_hu||'—')+'</small></div>';
      var head=box.querySelector('.dept-h')||box.firstElementChild; head.insertAdjacentElement('afterend',el);
    });
    /* feladatkör-kártya: felelős → ellenőrző, és a lánc gombjai */
    document.querySelectorAll('.li[data-k]').forEach(function(li){
      var k=li.getAttribute('data-k'); var parts=k.split('|'); var code=parts[1];
      // a felelőst a Supabase admin_core-ból: cím alapján párosítjuk (a feladatkör címe)
      var title=(li.querySelector('.txt')||{}).textContent||'';
      var r=C.core.find(function(x){return x.dept_code===code&&((x.title_hu||'').trim()===title.trim()||(x.title_ro||'').trim()===title.trim());});
      var old=li.querySelector('.chain-task'); if(old)old.remove();
      var el=document.createElement('div'); el.className='chain-task';
      var own=r?empName(r.owner_id):'', rev=r?empName(r.reviewer_id):'';
      var dirs=C.docs.filter(function(x){return r&&x.resp_id===r.id;}).length, ncs=C.ncs.filter(function(n){return r&&n.dept_code===code;}).length;
      el.innerHTML='<div class="chain-who"><span class="k">'+esc(L('does'))+'</span><b>'+esc(own||'—')+'</b><span class="arrow">→</span><span class="k">'+esc(L('checks'))+'</span><b>'+esc(rev||'—')+'</b></div>'+
        '<div class="chain-links"><button type="button" class="chain-l" data-chain="fisa" data-resp="'+esc(r?r.id:'')+'" data-code="'+esc(code)+'">'+esc(L('fisa'))+'</button>'+
        '<button type="button" class="chain-l" data-chain="dir" data-code="'+esc(code)+'" data-resp="'+esc(r?r.id:'')+'">'+esc(L('dir'))+(dirs?' <b>'+dirs+'</b>':'')+'</button>'+
        '<button type="button" class="chain-l nc" data-chain="nc" data-code="'+esc(code)+'">'+esc(L('nc'))+(ncs?' <b>'+ncs+'</b>':'')+'</button></div>';
      var meta=li.querySelector('.work-meta'); if(meta)meta.replaceWith(el); else li.appendChild(el);
    });
  }
};
/* kattintás: az Admin Core drawer megfelelő fülét nyitja, szűrve az alosztályra */
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-chain]'); if(!b||!window.ADMIN)return;
  e.preventDefault(); e.stopPropagation();
  var kind=b.getAttribute('data-chain'), code=b.getAttribute('data-code'), resp=b.getAttribute('data-resp');
  window.ADMIN.filter={code:code,resp:resp||null};
  var tab={nc:'ncr',dir:'dir',rule:'reg',fisa:'fise',km:'km'}[kind];
  document.getElementById('adminDrawer').hidden=false; document.getElementById('adminScrim').hidden=false;
  window.ADMIN.setView(tab);
},true);
})();

