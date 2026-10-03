
/* ==== RA_LAUNCH — modul-indító a főfejlécben: kinyitja az Admin Core fiókot és a kért modult ==== */
(function(){
'use strict';
var M=[['adm5','Munkaposztok'],['adm6','Javaslatok (TMJ)'],['adm7','Heti gyűlés'],['adm3','Szerelő PIN'],['adm8','Feladatok a telefonra']];
function inject(){
  var po=document.getElementById('poOpen'); if(!po||document.getElementById('raLaunch'))return;
  var w=document.createElement('span'); w.id='raLaunch'; w.style.cssText='display:inline-flex;gap:6px;margin-left:8px;flex-wrap:wrap';
  w.innerHTML=M.map(function(m){return '<a class="back" href="#" data-launch="'+m[0]+'" style="border-color:#2A6FDB;color:#2A6FDB">'+m[1]+'</a>';}).join('');
  po.parentNode.insertBefore(w, po.nextSibling);
}
document.addEventListener('click',function(e){
  var a=e.target.closest('[data-launch]'); if(!a)return; e.preventDefault(); e.stopPropagation();
  var d=document.getElementById('adminDrawer'), sc=document.getElementById('adminScrim');
  if(d)d.hidden=false; if(sc)sc.hidden=false;
  if(window.RA_NAV&&window.RA_NAV.ensure){window.RA_NAV.ensure();if(window.RA_NAV.redraw)window.RA_NAV.redraw();}
  setTimeout(function(){ var b=document.querySelector('[data-'+a.getAttribute('data-launch')+']'); if(b)b.click(); },60);
},true);
function boot(){ if(!document.getElementById('poOpen')){setTimeout(boot,400);return;} inject(); setInterval(inject,2000); }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
