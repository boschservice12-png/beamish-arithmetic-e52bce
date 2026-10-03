
(function(){
  // 1. file:// protokoll esetén azonnali figyelmeztetés
  if(location.protocol==='file:'){
    window.addEventListener('DOMContentLoaded',function(){
      var b=document.createElement('div');
      b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999999;background:#C81E33;color:#fff;font:600 14px/1.5 system-ui;padding:14px 20px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.3)';
      b.innerHTML='⚠ A fájl helyi fájlként (file://) van megnyitva. Supabase ebben a módban nem működik. '+
                  '<b>Megoldás:</b> tedd fel Netlify-ra és onnan nyisd meg. '+
                  '<a href="#" onclick="this.parentNode.remove();return false" style="color:#FFF;margin-left:12px">×</a>';
      document.body.appendChild(b);
    });
  }
  // 2. Globális hibafogó — minden hibát mutasson a lap tetején, ne csak a konzolban
  window.addEventListener('error',function(ev){
    if(!document.body||document.getElementById('v33ErrBar'))return;
    var b=document.createElement('div');
    b.id='v33ErrBar';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999998;background:#E11D2E;color:#fff;font:600 13px/1.4 system-ui;padding:10px 16px';
    b.innerHTML='⚠ Hiba: '+(ev.message||'?')+' <a href="#" onclick="document.getElementById(\'v33ErrBar\').remove();return false" style="color:#fff;margin-left:12px">×</a>';
    document.body.appendChild(b);
  });
  // 3. Ellenőrzés: Supabase SDK betöltődött-e?
  window.addEventListener('DOMContentLoaded',function(){
    setTimeout(function(){
      if(!window.supabase){
        var b=document.createElement('div');
        b.style.cssText='position:fixed;top:50px;left:0;right:0;z-index:999997;background:#E8A33D;color:#000;font:600 13px/1.4 system-ui;padding:10px 16px;text-align:center';
        b.innerHTML='⚠ A Supabase SDK nem töltődött be a CDN-ről. Internet-kapcsolat? Tűzfal blokkol?';
        document.body.appendChild(b);
      }
    },3000);
  });
})();
