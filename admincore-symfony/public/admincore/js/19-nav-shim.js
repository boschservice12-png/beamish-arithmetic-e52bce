
/* ==== RA_NAV_SHIM — a modul-gombok külön konténerben, az alap menü újrarajzolása ne törölje ki ==== */
(function(){
'use strict';
function ensure(){
  var n=document.getElementById('adminNav'); if(!n)return null;
  var x=document.getElementById('raNavExtra');
  if(!x||x.parentNode!==n){ x=document.createElement('div'); x.id='raNavExtra'; x.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin-top:6px'; n.appendChild(x); }
  else if(x!==n.lastChild){ n.appendChild(x); }
  return x;
}
window.RA_NAV={ box:ensure, ensure:ensure, hooks:[], add:function(f){this.hooks.push(f);}, redraw:function(){this.hooks.forEach(function(f){try{f();}catch(e){}});},
  open:function(){ var d=document.getElementById('adminDrawer'), sc=document.getElementById('adminScrim');
    if(d)d.hidden=false; if(sc)sc.hidden=false;
    try{ if(window.ADMIN&&window.ADMIN.setView)window.ADMIN.setView(null); }catch(e){}
    ensure(); this.redraw(); } };
function boot(){ if(!document.getElementById('adminNav')){setTimeout(boot,400);return;}
  ensure();
  try{ new MutationObserver(function(){ ensure(); if(window.RA_NAV.redraw)window.RA_NAV.redraw(); }).observe(document.getElementById('adminNav'),{childList:true}); }catch(e){}
  setInterval(function(){ ensure(); if(window.RA_NAV.redraw)window.RA_NAV.redraw(); },1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
