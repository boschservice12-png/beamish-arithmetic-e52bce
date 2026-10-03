
(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sb(){return window.RA_SB&&window.RA_SB.client;}
var view=false;
function injectNav(){
  var n=window.RA_NAV&&window.RA_NAV.box&&window.RA_NAV.box(); if(!n||n.querySelector('[data-adm3]'))return;
  var b=document.createElement('button'); b.type='button'; b.className='adm-item'; b.setAttribute('data-adm3','pin');
  b.innerHTML='<span>Szerelő PIN</span>'; n.appendChild(b);
}
async function paint(){
  var root=document.getElementById('adminRoot'); if(!root||!view)return;
  var s=sb(); if(!s){root.innerHTML='<div class="adm-hint">Nincs kapcsolat.</div>';return;}
  var r=await s.rpc('f_szerelok'); var L=r.data||[];
  root.innerHTML='<div class="adm-h"><span class="adm-eb">TERMELÉS</span><h2>Szerelő PIN</h2></div>'+
   '<div class="adm-hint">Négy számjegy, személyenként. A PIN hash-elve tárolódik — utólag nem olvasható vissza, csak újra beállítható. A szerelő a telefonján a nevére kattint és beüti.</div>'+
   '<div class="adm-card"><table class="adm-t"><thead><tr><th>Szerelő</th><th>Részleg</th><th>Állapot</th><th>Új PIN</th><th></th></tr></thead><tbody>'+
   L.map(function(e){return '<tr><td><b>'+esc(e.name)+'</b></td><td>'+esc(e.department)+'</td>'+
     '<td>'+(e.has_pin?'<span class="adm-tag ok">van</span>':'<span class="adm-tag bad">nincs</span>')+'</td>'+
     '<td><input type="tel" inputmode="numeric" maxlength="4" pattern="\\d{4}" data-pin="'+e.id+'" style="width:80px;font:inherit;font-size:16px;letter-spacing:6px;text-align:center;padding:6px;border:1px solid rgba(0,0,0,.2);border-radius:8px"></td>'+
     '<td><button type="button" class="adm-btn" data-pinsave="'+e.id+'">Mentés</button> <span class="adm-hint" id="pm-'+e.id+'"></span></td></tr>';}).join('')+
   '</tbody></table></div>';
}
document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-adm3]'); if(b){e.preventDefault();e.stopPropagation();view=true;try{if(window.RA_NAV&&window.RA_NAV.open)window.RA_NAV.open();}catch(_){}
    document.querySelectorAll('#adminNav .adm-item').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); paint(); return;}
  if(e.target.closest('#adminNav .adm-item')) view=false;
  var sv=e.target.closest('[data-pinsave]'); if(!sv)return;
  var id=sv.getAttribute('data-pinsave'), inp=document.querySelector('[data-pin="'+id+'"]'), m=document.getElementById('pm-'+id);
  var pin=(inp.value||'').trim();
  if(!/^\d{4}$/.test(pin)){m.innerHTML='<span class="adm-warn">pontosan 4 számjegy</span>';return;}
  var r=await sb().rpc('f_set_pin',{p_emp:id,p_pin:pin});
  if(r.error){m.innerHTML='<span class="adm-warn">'+esc(r.error.message)+'</span>';return;}
  inp.value=''; m.innerHTML='<span class="adm-tag ok">✔ beállítva</span>'; setTimeout(paint,800);
},true);
function boot(){ if(!document.getElementById('adminNav')){setTimeout(boot,500);return;} if(window.RA_NAV&&window.RA_NAV.add)window.RA_NAV.add(injectNav); injectNav(); }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
