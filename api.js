/* ============================================================
   RPW — API réteg (contract)  v1  [ÉLES v56]
   ------------------------------------------------------------
   A receptio ablak EGYETLEN Supabase-érintkezési pontja.
   A teljes rendszerben CSAK ez a fájl ismeri a Supabase-t:
   a projektet, a `rpw_jobs` táblát és a `rpw-photos` Storage bucketet.

   A window nem tartalmaz `sb`-t.
   Később e függvények MÖGÉ Symfony REST kerül → a window nem változik.

   FONTOS: a viselkedés bájtra a mostani — ugyanaz a timestamp-őr,
   ugyanaz a 4s timeout, a fotók ugyanúgy Storage-ba mennek.
   ============================================================ */
(function(){
  'use strict';

  // ── Supabase (a teljes rendszerben CSAK itt) ──
  var SB_URL='https://pxypbbvqinbwesfikkdb.supabase.co';
  var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eXBiYnZxaW5id2VzZmlra2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjMwNzIsImV4cCI6MjA4NjU5OTA3Mn0.WZBdbr-YBxLq1ALnHY2weFQ7j2JhUUj6hOUGkuuErnQ';
  var sb=supabase.createClient(SB_URL,SB_KEY);
  var TABLE='rpw_jobs';
  var STORAGE_BUCKET='rpw-photos';

  var saveTimer=null;

  // ── Gyors, SZINKRON cache-olvasás (azonnali első render) ──
  // (A window ezután fixPhases/migrateLegacy-t futtat rá — az marad nála.)
  function peek(id){
    try{
      var raw=localStorage.getItem('rpw_job_'+id);
      return raw?JSON.parse(raw):null;
    }catch(e){return null}
  }

  // ── Hiteles betöltés: szerver + timestamp-őr ──
  // Visszaad: az ELFOGADANDÓ job objektum (ha a szerver újabb / nincs helyi),
  //           vagy null (ha a helyi a frissebb → a window megtartja a cache-t).
  // Adoptáláskor a cache-t és a timestampet itt írjuk.
  async function loadJob(id){
    var res=await sb.from(TABLE).select('id,data,updated_at').eq('id',id).single();
    if(res.error)throw res.error;
    var localCache=null,lts=null;
    try{localCache=localStorage.getItem('rpw_job_'+id);lts=localStorage.getItem('rpw_job_ts_'+id)}catch(e){}
    var sNew=Date.parse(res.data.updated_at||0)||0, lNew=Date.parse(lts||0)||0;
    if(!localCache||!lts||sNew>lNew){
      var job=res.data.data;
      try{
        localStorage.setItem('rpw_job_'+id,JSON.stringify(job));
        localStorage.setItem('rpw_job_ts_'+id,res.data.updated_at||new Date().toISOString());
      }catch(e){}
      return job;
    }
    return null;
  }

  // ── Mentés: cache + timestamp AZONNAL, Supabase upsert DEBOUNCE 600ms ──
  // (Pontosan a régi saveJ teste: Promise.race 4s timeout, fire-and-forget.)
  function saveJob(job){
    if(!job)return;
    try{
      localStorage.setItem('rpw_job_'+job.id,JSON.stringify(job));
      localStorage.setItem('rpw_job_ts_'+job.id,new Date().toISOString());
    }catch(e){}
    clearTimeout(saveTimer);
    saveTimer=setTimeout(function(){
      try{
        var p=sb.from(TABLE).upsert({id:job.id,data:job,updated_at:new Date().toISOString()});
        var t=new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout'))},4000)});
        Promise.race([p,t]).catch(function(e){console.warn('SB offline:',e.message)});
      }catch(e){console.error('Save:',e)}
    },600);
  }

  // ── Fotó feltöltés Storage-ba → visszaadja a public URL-t ──
  async function uploadPhoto(jobId,key,blob){
    var path=jobId+'/'+key+'.jpg';
    var up=await sb.storage.from(STORAGE_BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:true});
    if(up.error)throw up.error;
    return sb.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // ── Fotó törlés Storage-ból ──
  async function deletePhoto(jobId,key){
    var path=jobId+'/'+key+'.jpg';
    await sb.storage.from(STORAGE_BUCKET).remove([path]);
  }

  // ── A contract kifelé ──
  window.API={
    peek:peek,
    loadJob:loadJob,
    saveJob:saveJob,
    uploadPhoto:uploadPhoto,
    deletePhoto:deletePhoto
  };
})();
