
/* Admin Core teljes ablak mód — alapértelmezés bekapcsolva, gombbal váltható. */
(function(){
'use strict';
var KEY='ac-full-mode';
function on(){ return localStorage.getItem(KEY)!=='0'; }
function apply(){ document.body.classList.toggle('ac-full', on()); var b=document.getElementById('acSize');
  if(b) b.textContent = on() ? '⤡ Oldalsáv' : '⤢ Teljes ablak'; }
function addBtn(){
  var head=document.querySelector('#adminDrawer .adm-dhead'); if(!head||document.getElementById('acSize'))return;
  var box=head.lastElementChild; if(!box)return;
  var b=document.createElement('button'); b.type='button'; b.id='acSize';
  b.onclick=function(){ localStorage.setItem(KEY, on()?'0':'1'); apply(); };
  box.insertBefore(b, box.firstChild); apply();
  if(!document.getElementById('acFin')){var f=document.createElement('button');f.type='button';f.id='acFin';f.setAttribute('data-finwin','1');
    f.style.cssText='border:1px solid #D81F26;background:transparent;border-radius:8px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;color:#D81F26;margin-left:6px';
    f.textContent='💰 Centru financiar ↗'; box.insertBefore(f, b.nextSibling);
    document.addEventListener('click',function(e){var x=e.target.closest('[data-finwin]');if(x){e.preventDefault();e.stopPropagation();
      window.open('finance-dashboard.html','ra_finance','width=1400,height=900');}},true);}
}
function tick(){ addBtn();
  var d=document.getElementById('adminDrawer');
  if(d){ document.body.classList.toggle('ac-full', on() && !d.hasAttribute('hidden')); }
}
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  var d=document.getElementById('adminDrawer');
  if(d&&!d.hasAttribute('hidden')&&!document.querySelector('.adm-back,.ik-panel')){ var x=document.getElementById('adminClose'); if(x)x.click(); }
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){tick();setInterval(tick,600);});
else {tick();setInterval(tick,600);}
})();
