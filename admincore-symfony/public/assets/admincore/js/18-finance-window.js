
(function(){if(window.__finwinGlobal)return;window.__finwinGlobal=1;
document.addEventListener('click',function(e){var x=e.target.closest('[data-finwin]');if(!x)return;
  e.preventDefault();e.stopPropagation();
  var w=window.open('finance-dashboard.html','ra_finance','width=1440,height=920');
  if(!w){alert('A böngésző blokkolta a felugró ablakot. Engedélyezd ehhez az oldalhoz.');}},true);
var L={ro:'Financiar',hu:'Pénzügy',en:'Finance'};
function lab(){var l=window.appLang||'ro';var el=document.getElementById('finLabel');if(el)el.textContent=L[l]||L.ro;}
lab();setInterval(lab,1200);
})();
