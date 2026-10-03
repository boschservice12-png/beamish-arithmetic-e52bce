
/* Organizing board three-model layer.
   Model 1 preserves the existing board. Model 2 is a clearly marked WISE/Hubbard
   reference model. Model 3 is a practical automotive-service adaptation. */
(function(){
var legacyOrdered=orderedDivisions;
var legacyEnsure=ensureDetail;
var WISE_PDF='https://www.scientologycourses.org/hu/tools-for-life-furl/data/scientology-courses/files/docs/seven-division-org-board_hu.pdf?cb=1&download=1';
var WISE_PAGE='https://www.scientologycourses.org/hu/tools-for-life/organizing/steps/seven-division-organizing-board.html';

function M(ro,hu,en){return {ro:ro,hu:hu,en:en};}
function X(ro,hu,en,detail){return {title:M(ro,hu,en),detail:detail||null};}
function D(code,title,purpose,vfp,kpis,tasks){return {code:code,t:title,purpose:purpose,vfp:vfp,kpis:kpis,li:tasks};}
function V(n,title,desc,depts,vfp,kpis,out){return {n:n,c:DIV_COLOR[n],t:title,d:desc,head:'',link:'#',dept:depts,vfp:vfp,kpi:kpis,out:out};}
function L(value,lang){
  lang=lang||appLang;
  if(value===null||value===undefined)return '';
  if(typeof value==='string')return tlang(value,lang);
  // Never substitute another language for an explicitly empty translation.
  return value[lang]===undefined?'':value[lang];
}

var WISE_DIVISIONS=[
 V(7,
  M('Conducere executivă','Ügyvezetői osztály','Executive Division'),
  M('Stabilește direcția, coordonează și supraveghează întreaga organizație.','Meghatározza az irányt, összehangolja és felügyeli az egész szervezetet.','Sets direction, coordinates and supervises the whole organization.'),
  [
   D('7.1',M('Biroul sursei / al proprietarilor','Forrás- / tulajdonosi iroda','Source / Owners Office'),
    M('Păstrează scopul, principiile și deciziile fundamentale ale organizației.','Őrzi a szervezet célját, alapelveit és alapvető döntéseit.','Safeguards the organization’s purpose, principles and fundamental decisions.'),
    M('Direcție și politici aprobate, clare și aplicabile.','Jóváhagyott, világos és alkalmazható irányelvek.','Approved, clear and usable direction and policies.'),
    [M('Revizuiri de politici la termen','Határidős irányelv-felülvizsgálatok','Policy reviews completed on time'),M('Decizii strategice documentate','Dokumentált stratégiai döntések','Documented strategic decisions'),M('Abateri strategice nerezolvate','Rendezetlen stratégiai eltérések','Unresolved strategic deviations')],
    [X('Menținerea scopului și a politicilor aprobate','A cél és a jóváhagyott irányelvek fenntartása','Maintain the purpose and approved policies'),X('Aprobarea obiectivelor majore','A fő célok jóváhagyása','Approve major objectives'),X('Asigurarea autorității și resurselor','Hatáskör és erőforrás biztosítása','Provide authority and resources')]),
   D('7.2',M('Biroul afacerilor externe','Külső ügyek irodája','External Affairs Office'),
    M('Administrează relațiile juridice, instituționale și riscurile externe.','Kezeli a jogi, hatósági és külső kockázati kapcsolatokat.','Manages legal, institutional and external-risk relations.'),
    M('Relații externe conforme și riscuri ținute sub control.','Szabályos külső kapcsolatok és ellenőrzött kockázatok.','Compliant external relations and controlled risks.'),
    [M('Obligații legale îndeplinite la termen','Határidőre teljesített jogi kötelezettségek','Legal obligations met on time'),M('Cazuri externe deschise','Nyitott külső ügyek','Open external cases'),M('Riscuri fără plan de tratare','Kezelési terv nélküli kockázatok','Risks without a treatment plan')],
    [X('Gestionarea juridică și a conformității','Jogi és megfelelőségi ügyek kezelése','Manage legal and compliance matters'),X('Relația cu autoritățile și organizațiile','Hatósági és szakmai kapcsolatok','Maintain authority and professional relations'),X('Controlul riscurilor externe','Külső kockázatok ellenőrzése','Control external risks')]),
   D('7.3',M('Biroul directorului executiv','Ügyvezető igazgató irodája','Executive Director Office'),
    M('Planifică, coordonează și urmărește executarea activității organizației.','Tervezi, koordinálja és nyomon követi a szervezet működésének végrehajtását.','Plans, coordinates and tracks execution across the organization.'),
    M('Organizație coordonată, solvabilă, productivă și în dezvoltare.','Összehangolt, fizetőképes, termelékeny és fejlődő szervezet.','A coordinated, solvent, productive and expanding organization.'),
    [M('Obiective de management realizate','Teljesített vezetői célok','Management objectives achieved'),M('Decizii restante','Lejárt vezetői döntések','Overdue management decisions'),M('Rezultat operațional','Működési eredmény','Operating result')],
    [X('Planificarea și coordonarea activității','A működés tervezése és összehangolása','Plan and coordinate operations'),X('Revizuirea rapoartelor de management','Vezetői jelentések felülvizsgálata','Review management reports'),X('Urmărirea solvabilității, producției și dezvoltării','Fizetőképesség, termelés és fejlődés követése','Track solvency, production and expansion')])
  ],
  M('O organizație coordonată care își atinge obiectivele.','Összehangolt szervezet, amely eléri a céljait.','A coordinated organization that achieves its goals.'),
  [M('Rezultat organizațional','Szervezeti eredmény','Organizational result'),M('Obiective realizate (%)','Teljesített célok (%)','Objectives achieved (%)'),M('Decizii restante','Lejárt döntések','Overdue decisions')],
  M('Direcție, decizii și coordonare pentru diviziile 1–6.','Irány, döntések és koordináció az 1–6. divízió számára.','Direction, decisions and coordination for Divisions 1–6.')),
 V(1,
  M('Comunicare','Kommunikációs osztály','Communication Division'),
  M('Asigură personalul, comunicarea internă și informațiile de control necesare funcționării.','Biztosítja a működéshez szükséges személyzetet, belső kommunikációt és ellenőrzési információt.','Provides the personnel, internal communication and control information required for operation.'),
  [
   D('1.1',M('Transmitere și personal','Továbbítási és személyzeti alosztály','Routing and Personnel Department'),
    M('Aduce, plasează, instruiește și administrează oamenii potriviți.','Megtalálja, elhelyezi, betanítja és adminisztrálja a megfelelő embereket.','Recruits, places, trains and administers the right people.'),
    M('Posturi acoperite cu persoane pregătite și documentate.','Felkészült és dokumentált emberekkel betöltött posztok.','Posts filled with prepared and documented people.'),
    [M('Posturi acoperite (%)','Betöltött posztok (%)','Posts filled (%)'),M('Dosare complete (%)','Teljes személyi dossziék (%)','Complete personnel files (%)'),M('Timp până la integrare','Beillesztési idő','Time to onboarding')],
    [X('Planificarea necesarului de personal','Létszámigény tervezése','Plan staffing requirements'),X('Recrutare și plasare pe post','Toborzás és posztra helyezés','Recruit and place people on posts'),X('Integrare și instruire pe post','Beléptetés és posztbetanítás','Onboard and train for the post')]),
   D('1.2',M('Comunicare','Kommunikációs alosztály','Communications Department'),
    M('Dirijează rapid și corect comunicările și documentele.','Gyorsan és pontosan továbbítja a kommunikációt és a dokumentumokat.','Routes communications and documents quickly and accurately.'),
    M('Comunicări ajunse la destinatar, confirmate și regăsibile.','Célba ért, visszaigazolt és visszakereshető közlések.','Communications delivered, acknowledged and retrievable.'),
    [M('Comunicări la termen (%)','Határidős közlések (%)','Communications delivered on time (%)'),M('Erori de transmitere','Továbbítási hibák','Routing errors'),M('Confirmări de primire (%)','Átvételi visszaigazolások (%)','Acknowledgements (%)')],
    [X('Dirijarea comunicărilor interne','Belső kommunikáció továbbítása','Route internal communications'),X('Controlul documentelor și mesajelor','Dokumentumok és üzenetek ellenőrzése','Control documents and messages'),X('Confirmarea predărilor între posturi','Posztok közötti átadások igazolása','Confirm handovers between posts')]),
   D('1.3',M('Inspecții și rapoarte','Vizsgálatok és jelentések alosztálya','Inspections and Reports Department'),
    M('Colectează statisticile, verifică funcționarea și semnalează abaterile.','Összegyűjti a statisztikákat, ellenőrzi a működést és jelzi az eltéréseket.','Collects statistics, inspects operation and reports deviations.'),
    M('Date de conducere corecte și bariere identificate.','Pontos vezetői adatok és azonosított akadályok.','Accurate management data and identified barriers.'),
    [M('Rapoarte la termen (%)','Határidős jelentések (%)','Reports on time (%)'),M('Date complete (%)','Teljes adatok (%)','Complete data (%)'),M('Abateri restante','Lejárt eltérések','Overdue deviations')],
    [X('Colectarea statisticilor și graficelor','Statisztikák és grafikonok gyűjtése','Collect statistics and graphs'),X('Inspecții și audituri interne','Belső ellenőrzések és auditok','Run internal inspections and audits'),X('Investigarea barierelor și abaterilor','Akadályok és eltérések kivizsgálása','Investigate barriers and deviations')])
  ],
  M('O organizație cu oameni potriviți, comunicare rapidă și date corecte.','Megfelelő emberekkel, gyors kommunikációval és pontos adatokkal működő szervezet.','An organization with the right people, fast communication and accurate data.'),
  [M('Posturi acoperite (%)','Betöltött posztok (%)','Posts filled (%)'),M('Comunicări la termen (%)','Határidős közlések (%)','Communications on time (%)'),M('Rapoarte complete (%)','Teljes jelentések (%)','Complete reports (%)')],
  M('Personal și informații pregătite pentru restul organizației.','Felkészült személyzet és információ a szervezet többi része számára.','Prepared personnel and information for the rest of the organization.')),
 V(2,
  M('Diseminare','Terjesztési osztály','Dissemination Division'),
  M('Face cunoscute produsele și transformă interesul în solicitări înregistrate.','Ismertté teszi a termékeket, és a figyelmet nyilvántartott érdeklődéssé alakítja.','Makes products known and converts interest into registered demand.'),
  [
   D('2.1',M('Promovare și marketing','Promóciós és marketingalosztály','Promotion and Marketing Department'),
    M('Cercetează piața și creează promovare relevantă și măsurabilă.','Felméri a piacot, és releváns, mérhető promóciót hoz létre.','Researches the market and creates relevant, measurable promotion.'),
    M('Campanii publicate pentru publicul corect, cu rezultate măsurate.','A megfelelő közönségnek közzétett, mért eredményű kampányok.','Campaigns published to the right audience with measured results.'),
    [M('Solicitări generate','Létrehozott érdeklődések','Enquiries generated'),M('Cost per solicitare','Érdeklődésenkénti költség','Cost per enquiry'),M('Conversie campanie (%)','Kampánykonverzió (%)','Campaign conversion (%)')],
    [X('Cercetarea pieței și a publicului','Piac- és közönségkutatás','Research market and audiences'),X('Planificarea și executarea campaniilor','Kampányok tervezése és végrehajtása','Plan and execute campaigns'),X('Măsurarea și optimizarea promovării','Promóció mérése és optimalizálása','Measure and optimize promotion')]),
   D('2.2',M('Publicații','Kiadványok alosztálya','Publications Department'),
    M('Produce, actualizează și pune la dispoziție materialele de comunicare.','Előállítja, frissíti és elérhetővé teszi a kommunikációs anyagokat.','Produces, updates and makes communication materials available.'),
    M('Materiale corecte, actuale și disponibile la nevoie.','Pontos, aktuális és szükség esetén elérhető anyagok.','Accurate, current materials available when needed.'),
    [M('Materiale actualizate (%)','Aktuális anyagok (%)','Materials up to date (%)'),M('Termen de realizare','Elkészítési idő','Production lead time'),M('Erori de conținut','Tartalmi hibák','Content errors')],
    [X('Crearea și actualizarea materialelor','Anyagok létrehozása és frissítése','Create and update materials'),X('Controlul stocului și versiunilor','Készlet- és verzióellenőrzés','Control stock and versions'),X('Distribuirea materialelor aprobate','Jóváhagyott anyagok terjesztése','Distribute approved materials')]),
   D('2.3',M('Înregistrare','Regisztrációs alosztály','Registration Department'),
    M('Înregistrează persoanele interesate și urmărește trecerea lor spre servicii.','Nyilvántartja az érdeklődőket, és követi szolgáltatásig vezető útjukat.','Registers prospects and follows their progress toward services.'),
    M('Solicitări înregistrate, urmărite și transformate în comenzi.','Nyilvántartott, követett és megrendeléssé alakított érdeklődések.','Enquiries registered, followed up and converted into orders.'),
    [M('Solicitări înregistrate (%)','Nyilvántartott érdeklődések (%)','Enquiries registered (%)'),M('Timp de răspuns','Válaszidő','Response time'),M('Conversie în comandă (%)','Megrendelési konverzió (%)','Conversion to order (%)')],
    [X('Înregistrarea solicitărilor și datelor','Érdeklődések és adatok rögzítése','Register enquiries and data'),X('Urmărirea persoanelor interesate','Érdeklődők utánkövetése','Follow up prospects'),X('Confirmarea serviciului sau comenzii','Szolgáltatás vagy megrendelés visszaigazolása','Confirm service or order')])
  ],
  M('Cerere cunoscută, înregistrată și transformată în activitate.','Ismert, nyilvántartott és tevékenységgé alakított igény.','Demand made known, registered and converted into activity.'),
  [M('Solicitări noi','Új érdeklődések','New enquiries'),M('Conversie (%)','Konverzió (%)','Conversion (%)'),M('Cost de achiziție','Ügyfélszerzési költség','Acquisition cost')],
  M('Solicitări și comenzi clare pentru finanțe și producție.','Világos igények és megrendelések a pénzügy és termelés számára.','Clear enquiries and orders for finance and production.')),
 V(3,
  M('Finanțe','Pénzügyi osztály','Finance Division'),
  M('Administrează veniturile, plățile, evidențele, activele și echipamentele.','Kezeli a bevételeket, kifizetéseket, nyilvántartásokat, vagyontárgyakat és felszereléseket.','Manages income, disbursements, records, assets and equipment.'),
  [
   D('3.1',M('Venituri','Bevételi alosztály','Income Department'),
    M('Planifică și înregistrează corect banii care intră și conturile clienților.','Megtervezi és pontosan nyilvántartja a bejövő pénzt és az ügyfélszámlákat.','Plans and records incoming money and customer accounts accurately.'),
    M('Venituri înregistrate și creanțe urmărite.','Nyilvántartott bevételek és követett követelések.','Recorded income and tracked receivables.'),
    [M('Încasări față de plan (%)','Bevétel a tervhez képest (%)','Income vs plan (%)'),M('Creanțe restante','Lejárt követelések','Overdue receivables'),M('Încasări reconciliate (%)','Egyeztetett bevételek (%)','Reconciled receipts (%)')],
    [X('Planificarea veniturilor','Bevételek tervezése','Plan income'),X('Înregistrarea încasărilor și conturilor','Befizetések és számlák rögzítése','Record receipts and accounts'),X('Urmărirea creanțelor','Követelések utánkövetése','Follow up receivables')]),
   D('3.2',M('Plăți','Kifizetési alosztály','Disbursements Department'),
    M('Planifică și execută plățile aprobate fără a pune în pericol lichiditatea.','Megtervezi és végrehajtja a jóváhagyott kifizetéseket a likviditás veszélyeztetése nélkül.','Plans and executes approved payments without endangering liquidity.'),
    M('Plăți corecte, aprobate, la termen și documentate.','Pontos, jóváhagyott, határidős és dokumentált kifizetések.','Accurate, approved, timely and documented payments.'),
    [M('Plăți la termen (%)','Határidős kifizetések (%)','Payments on time (%)'),M('Plăți fără aprobare','Jóváhagyás nélküli kifizetések','Unapproved payments'),M('Abatere față de buget (%)','Költségvetési eltérés (%)','Budget variance (%)')],
    [X('Planificarea bugetului de plăți','Kifizetési költségvetés tervezése','Plan the payment budget'),X('Aprobarea și executarea plăților','Kifizetések jóváhagyása és végrehajtása','Approve and execute payments'),X('Salarizare și obligații recurente','Bér és ismétlődő kötelezettségek','Handle payroll and recurring obligations')]),
   D('3.3',M('Evidențe, active și echipamente','Nyilvántartások, vagyontárgyak és felszerelések alosztálya','Records, Assets and Equipment Department'),
    M('Păstrează evidențe financiare, active și echipamente complete și verificabile.','Teljes és ellenőrizhető pénzügyi, eszköz- és felszerelés-nyilvántartást vezet.','Maintains complete, verifiable financial, asset and equipment records.'),
    M('Evidențe reconciliate și active protejate și disponibile.','Egyeztetett nyilvántartások, védett és rendelkezésre álló eszközök.','Reconciled records and protected, available assets.'),
    [M('Active inventariate (%)','Leltározott eszközök (%)','Assets inventoried (%)'),M('Diferențe de inventar','Leltáreltérések','Inventory variances'),M('Închidere contabilă la termen','Határidős könyvelési zárás','Accounting close on time')],
    [X('Contabilitate și raportare','Könyvelés és jelentés','Accounting and reporting'),X('Registrul activelor și inventarul','Eszköznyilvántartás és leltár','Maintain asset register and inventory'),X('Întreținerea și protejarea echipamentelor','Felszerelések karbantartása és védelme','Maintain and protect equipment')])
  ],
  M('Finanțe controlate, evidențe exacte și active disponibile.','Ellenőrzött pénzügyek, pontos nyilvántartások és rendelkezésre álló eszközök.','Controlled finances, accurate records and available assets.'),
  [M('Flux de numerar','Cash-flow','Cash flow'),M('Abatere bugetară (%)','Költségvetési eltérés (%)','Budget variance (%)'),M('Închidere la termen','Határidős zárás','Close completed on time')],
  M('Resurse financiare și materiale aprobate pentru producție.','Jóváhagyott pénzügyi és anyagi erőforrások a termelés számára.','Approved financial and material resources for production.')),
 V(4,
  M('Producție','Termelési osztály','Production Division'),
  M('Pregătește și produce rapid, în volum și la calitatea cerută.','Előkészít, majd gyorsan, megfelelő mennyiségben és minőségben termel.','Prepares and produces rapidly, in volume and at the required quality.'),
  [
   D('4.1',M('Servicii pentru producție','Termeléskiszolgáló alosztály','Production Services Department'),
    M('Prognozează cererea și pregătește programul, capacitatea și resursele.','Előrejelzi az igényt, és előkészíti az ütemtervet, kapacitást és erőforrásokat.','Forecasts demand and prepares schedule, capacity and resources.'),
    M('Plan de producție realist, cu resurse și termene confirmate.','Reális termelési terv, visszaigazolt erőforrásokkal és határidőkkel.','A realistic production plan with confirmed resources and deadlines.'),
    [M('Planuri complete (%)','Teljes tervek (%)','Complete plans (%)'),M('Încărcare capacitate (%)','Kapacitáskihasználás (%)','Capacity utilization (%)'),M('Lipsuri înainte de start','Indulás előtti hiányok','Pre-start shortages')],
    [X('Prognoza cererii','Igény előrejelzése','Forecast demand'),X('Planificarea capacității și termenelor','Kapacitás és határidők tervezése','Plan capacity and deadlines'),X('Asigurarea resurselor de pornire','Induló erőforrások biztosítása','Secure start resources')]),
   D('4.2',M('Activitate','Aktivitási alosztály','Activity Department'),
    M('Transformă planul într-un flux de lucru pregătit și controlat.','A tervet előkészített és ellenőrzött munkafolyamattá alakítja.','Turns the plan into a prepared and controlled workflow.'),
    M('Lucrări pregătite, lansate și urmărite fără blocaje.','Előkészített, elindított és akadály nélkül követett munkák.','Jobs prepared, released and tracked without blockage.'),
    [M('Lucrări pornite la termen (%)','Határidőben indított munkák (%)','Jobs started on time (%)'),M('Blocaje active','Aktív akadályok','Active blockers'),M('Lucrări în curs peste limită','Határértéken túli folyamatban lévő munka','Work in progress over limit')],
    [X('Pregătirea comenzilor de lucru','Munkalapok előkészítése','Prepare work orders'),X('Pregătirea materialelor și posturilor','Anyagok és munkahelyek előkészítése','Prepare materials and workstations'),X('Coordonarea fluxului în lucru','Folyamatban lévő munkák koordinálása','Coordinate work in progress')]),
   D('4.3',M('Producție','Termelési alosztály','Production Department'),
    M('Execută activitatea principală și documentează rezultatul.','Végrehajtja a fő tevékenységet és dokumentálja az eredményt.','Executes the core activity and documents the result.'),
    M('Produs sau serviciu finalizat, documentat și predat.','Befejezett, dokumentált és átadott termék vagy szolgáltatás.','A completed, documented and handed-over product or service.'),
    [M('Finalizări la termen (%)','Határidőre befejezett munkák (%)','Completed on time (%)'),M('Productivitate','Termelékenység','Productivity'),M('Reparații / refaceri','Utómunka / újramunka','Rework')],
    [X('Executarea lucrării','A munka végrehajtása','Execute the job'),X('Înregistrarea operațiilor și consumurilor','Műveletek és felhasználás rögzítése','Record operations and consumption'),X('Predarea rezultatului pentru control','Eredmény átadása ellenőrzésre','Hand over result for inspection')])
  ],
  M('Produse și servicii realizate rapid, în volum și la calitatea cerută.','Gyorsan, megfelelő mennyiségben és minőségben elkészült termékek és szolgáltatások.','Products and services delivered rapidly, in volume and at the required quality.'),
  [M('Productivitate','Termelékenység','Productivity'),M('Finalizat la termen (%)','Határidőre kész (%)','Completed on time (%)'),M('Lucrări finalizate','Befejezett munkák','Completed jobs')],
  M('Rezultat finalizat pentru verificarea calității.','Minőségellenőrzésre kész eredmény.','Completed result ready for quality verification.')),
 V(5,
  M('Calificare','Kvalifikációs osztály','Qualifications Division'),
  M('Verifică rezultatele, corectează cauzele calității slabe și certifică acceptarea.','Ellenőrzi az eredményeket, kijavítja a gyenge minőség okait és igazolja az elfogadást.','Checks results, corrects causes of poor quality and certifies acceptance.'),
  [
   D('5.1',M('Examinări','Vizsgáztatások alosztálya','Examinations Department'),
    M('Testează produsul sau serviciul față de criterii definite.','Meghatározott feltételek alapján vizsgálja a terméket vagy szolgáltatást.','Tests the product or service against defined criteria.'),
    M('Rezultat verificat, acceptat sau blocat cu motiv documentat.','Ellenőrzött, elfogadott vagy dokumentált indokkal zárolt eredmény.','A checked result, accepted or blocked with a documented reason.'),
    [M('Acceptat din prima (%)','Elsőre elfogadott (%)','First-pass acceptance (%)'),M('Controale complete (%)','Teljes ellenőrzések (%)','Complete inspections (%)'),M('Defecte detectate','Feltárt hibák','Defects detected')],
    [X('Control la intrare','Bejövő ellenőrzés','Incoming inspection'),X('Control în proces','Folyamatközi ellenőrzés','In-process inspection'),X('Control final și acceptare','Végellenőrzés és elfogadás','Final inspection and acceptance')]),
   D('5.2',M('Revizuire','Felülvizsgálati alosztály','Review Department'),
    M('Identifică de ce rezultatul sau performanța nu respectă standardul și corectează cauza.','Feltárja, miért nem felel meg az eredmény vagy teljesítmény, és kijavítja az okot.','Finds why a result or performance misses the standard and corrects the cause.'),
    M('Cauză identificată, corecție aplicată și eficacitate verificată.','Feltárt ok, végrehajtott korrekció és igazolt hatásosság.','Cause identified, correction applied and effectiveness verified.'),
    [M('Cauze închise la termen (%)','Határidőre lezárt okok (%)','Causes closed on time (%)'),M('Recurențe','Ismétlődések','Recurrences'),M('Acțiuni restante','Lejárt intézkedések','Overdue actions')],
    [X('Analiza cauzei abaterilor','Eltérések okának elemzése','Analyze causes of deviations'),X('Corectarea procesului sau instruirii','Folyamat vagy képzés javítása','Correct process or training'),X('Verificarea eficacității','Hatásosság ellenőrzése','Verify effectiveness')]),
   D('5.3',M('Certificate și recunoașteri','Bizonyítványok és elismerések alosztálya','Certificates and Awards Department'),
    M('Certifică rezultatele acceptate și menține evidența confirmărilor.','Igazolja az elfogadott eredményeket és vezeti az elismerések nyilvántartását.','Certifies accepted results and maintains confirmation records.'),
    M('Rezultate certificate și evidență completă a acceptării.','Igazolt eredmények és az elfogadás teljes nyilvántartása.','Certified results and a complete acceptance record.'),
    [M('Certificate emise la termen (%)','Határidőre kiadott igazolások (%)','Certificates issued on time (%)'),M('Dosare complete (%)','Teljes igazolási dossziék (%)','Complete certification files (%)'),M('Corecții de certificat','Igazolásjavítások','Certificate corrections')],
    [X('Emiterea certificării rezultatului','Eredmény igazolásának kiadása','Issue result certification'),X('Păstrarea evidenței acceptării','Elfogadási nyilvántartás vezetése','Maintain acceptance records'),X('Recunoașterea rezultatelor bune','Jó eredmények elismerése','Recognize good results')])
  ],
  M('Fiecare rezultat care părăsește organizația respectă standardul stabilit.','Minden, a szervezetet elhagyó eredmény megfelel a meghatározott színvonalnak.','Every result leaving the organization meets the defined standard.'),
  [M('Acceptat din prima (%)','Elsőre elfogadott (%)','First-pass acceptance (%)'),M('Reclamații de calitate','Minőségi reklamációk','Quality complaints'),M('Acțiuni corective închise (%)','Lezárt javító intézkedések (%)','Corrective actions closed (%)')],
  M('Rezultat verificat și certificat pentru client.','Ellenőrzött és igazolt eredmény az ügyfél számára.','Verified and certified result for the customer.')),
 V(6,
  M('Public','Közönségosztály','Public Division'),
  M('Informează publicul, extinde distribuția și transformă rezultatele bune în încredere și creștere.','Tájékoztatja a közönséget, bővíti a terjesztést, és a jó eredményeket bizalommá és növekedéssé alakítja.','Informs the public, expands distribution and turns good results into trust and growth.'),
  [
   D('6.1',M('Informarea publicului','Közönséginformációs alosztály','Public Information Department'),
    M('Prezintă clar organizația, serviciile și rezultatele sale.','Világosan bemutatja a szervezetet, szolgáltatásait és eredményeit.','Clearly presents the organization, its services and results.'),
    M('Public informat corect și solicitări relevante.','Pontosan tájékoztatott közönség és releváns érdeklődések.','Accurately informed public and relevant enquiries.'),
    [M('Acoperire relevantă','Releváns elérés','Relevant reach'),M('Solicitări din informare','Tájékoztatásból érkező érdeklődések','Enquiries from information'),M('Corectitudinea informațiilor (%)','Információpontosság (%)','Information accuracy (%)')],
    [X('Prezentarea organizației și serviciilor','A szervezet és szolgáltatások bemutatása','Present organization and services'),X('Publicarea informațiilor aprobate','Jóváhagyott információk közzététele','Publish approved information'),X('Răspunsul la întrebările publicului','Közönségkérdések megválaszolása','Answer public enquiries')]),
   D('6.2',M('Distribuție','Kiszállítási alosztály','Distribution Department'),
    M('Dezvoltă canale și puncte prin care serviciile ajung la public.','Csatornákat és pontokat fejleszt, amelyeken át a szolgáltatások elérik a közönséget.','Develops channels and points through which services reach the public.'),
    M('Canale active care livrează constant clienți și rezultate.','Aktív csatornák, amelyek folyamatosan ügyfeleket és eredményeket hoznak.','Active channels that consistently deliver customers and results.'),
    [M('Canale active','Aktív csatornák','Active channels'),M('Rezultate pe canal','Csatornánkénti eredmény','Results per channel'),M('Cost de distribuție','Terjesztési költség','Distribution cost')],
    [X('Crearea punctelor de distribuție','Terjesztési pontok létrehozása','Create distribution points'),X('Dezvoltarea partenerilor și canalelor','Partnerek és csatornák fejlesztése','Develop partners and channels'),X('Măsurarea performanței canalelor','Csatornateljesítmény mérése','Measure channel performance')]),
   D('6.3',M('Succes','Siker alosztály','Success Department'),
    M('Înregistrează, verifică și comunică succesele și satisfacția.','Rögzíti, ellenőrzi és kommunikálja a sikereket és az elégedettséget.','Records, verifies and communicates successes and satisfaction.'),
    M('Succese verificabile, clienți mulțumiți și recomandări.','Ellenőrizhető sikerek, elégedett ügyfelek és ajánlások.','Verifiable successes, satisfied customers and referrals.'),
    [M('Satisfacție client','Ügyfél-elégedettség','Customer satisfaction'),M('Recomandări','Ajánlások','Referrals'),M('Succese documentate (%)','Dokumentált sikerek (%)','Documented successes (%)')],
    [X('Colectarea feedbackului și succeselor','Visszajelzések és sikerek gyűjtése','Collect feedback and successes'),X('Verificarea și documentarea rezultatelor','Eredmények ellenőrzése és dokumentálása','Verify and document results'),X('Publicarea succeselor aprobate','Jóváhagyott sikerek közzététele','Publish approved successes')])
  ],
  M('Public informat, clienți mulțumiți și o bază în creștere.','Tájékozott közönség, elégedett ügyfelek és növekvő ügyfélbázis.','An informed public, satisfied customers and a growing base.'),
  [M('Satisfacție client','Ügyfél-elégedettség','Customer satisfaction'),M('Clienți recurenți (%)','Visszatérő ügyfelek (%)','Returning customers (%)'),M('Recomandări','Ajánlások','Referrals')],
  M('Feedback și informații de piață pentru următorul ciclu.','Visszajelzés és piaci információ a következő működési ciklushoz.','Feedback and market information for the next operating cycle.'))
];

var HR_PLAN_DETAIL={
 ro:{purpose:'Asigurarea unei evidențe corecte și actualizate a personalului și planificarea necesarului de angajați în funcție de activitatea firmei.',final:'Plan de personal\nRegistru de personal actualizat\nSituația posturilor ocupate și vacante\nNecesar de personal identificat și justificat',evaluation:'Corectitudine, actualizare la timp și respectarea termenelor legale și interne.',job:'1. Colectează volumul de lucru și capacitatea disponibilă.\n2. Calculează necesarul de personal pe post și schimb.\n3. Actualizează registrul, posturile ocupate și vacante.\n4. Prezintă necesarul justificat pentru aprobare.',kpis:['Registru actualizat la timp (%)','Posturi critice ocupate (%)','Dosare de personal complete (%)','Necesar aprobat acoperit (%)'],targets:['100%','≥ 95%','100%','≥ 90%']},
 hu:{purpose:'A személyi állomány pontos és naprakész nyilvántartása, valamint a vállalat tevékenységéhez szükséges létszám megtervezése.',final:'Személyzeti terv\nNaprakész személyi nyilvántartás\nBetöltött és üres pozíciók kimutatása\nAzonosított és indokolt létszámigény',evaluation:'Pontosság, naprakészség, valamint a jogi és belső határidők betartása.',job:'1. Gyűjtsd össze a munkamennyiséget és a rendelkezésre álló kapacitást.\n2. Számítsd ki a létszámigényt posztonként és műszakonként.\n3. Frissítsd a nyilvántartást, a betöltött és üres pozíciókat.\n4. Terjeszd jóváhagyásra az indokolt létszámigényt.',kpis:['Személyi nyilvántartás határidőre frissítve (%)','Betöltött kritikus pozíciók (%)','Teljes személyi dokumentáció (%)','Lefedett jóváhagyott létszámigény (%)'],targets:['100%','≥ 95%','100%','≥ 90%']},
 en:{purpose:'Maintain an accurate, current personnel register and plan staffing needs according to the company’s workload.',final:'Workforce plan\nCurrent personnel register\nOverview of filled and vacant posts\nIdentified and justified staffing requirement',evaluation:'Accuracy, timely updates, and compliance with legal and internal deadlines.',job:'1. Collect workload and available-capacity data.\n2. Calculate staffing needs by post and shift.\n3. Update the register and filled/vacant posts.\n4. Submit the justified staffing need for approval.',kpis:['Personnel register updated on time (%)','Critical posts filled (%)','Complete personnel files (%)','Approved staffing need covered (%)'],targets:['100%','≥ 95%','100%','≥ 90%']}
};

var MODERN_DIVISIONS=[
 V(7,M('Conducere, conformitate și guvernanță','Vezetés, megfelelőség és vállalatirányítás','Leadership, Compliance and Governance'),
  M('Stabilește direcția, limitele de risc și ritmul de conducere al service-ului.','Meghatározza a szerviz irányát, kockázati kereteit és vezetési ritmusát.','Sets the service business direction, risk limits and management cadence.'),
  [
   D('7.1',M('Proprietari și strategie','Tulajdonosok és stratégia','Owners and Strategy'),M('Transformă intenția proprietarilor în obiective, buget și decizii clare.','A tulajdonosi szándékot világos célokká, költségvetéssé és döntésekké alakítja.','Turns owners’ intent into clear objectives, budgets and decisions.'),M('Strategie anuală aprobată, finanțată și urmărită.','Jóváhagyott, finanszírozott és követett éves stratégia.','An approved, funded and tracked annual strategy.'),[M('Obiective trimestriale realizate (%)','Teljesített negyedéves célok (%)','Quarterly objectives achieved (%)'),M('Investiții față de buget','Beruházás a költségvetéshez képest','Investment vs budget'),M('Riscuri strategice deschise','Nyitott stratégiai kockázatok','Open strategic risks')],[X('Obiective, buget și priorități anuale','Éves célok, költségvetés és prioritások','Annual objectives, budget and priorities'),X('Decizii de investiții și capacitate','Beruházási és kapacitásdöntések','Investment and capacity decisions'),X('Revizuirea riscurilor și oportunităților','Kockázatok és lehetőségek felülvizsgálata','Review risks and opportunities'),X('Revizuirea canalului telefonic (raport lunar)','Telefonos csatorna működésének felülvizsgálata (havi riport)','Phone channel operation review (monthly report)')]),
   D('7.2',M('Juridic, SSM, PSI, mediu și GDPR','Jogi ügyek, munkavédelem, tűzvédelem, környezet és GDPR','Legal, H&S, Fire Safety, Environment and GDPR'),M('Ține activitatea în limitele legale și controlează riscurile de conformitate.','Jogi keretek között tartja a működést és ellenőrzi a megfelelőségi kockázatokat.','Keeps operations within legal limits and controls compliance risks.'),M('Autorizații valabile, obligații îndeplinite și riscuri tratate.','Érvényes engedélyek, teljesített kötelezettségek és kezelt kockázatok.','Valid permits, fulfilled obligations and treated risks.'),[M('Obligații la termen (%)','Határidőre teljesített kötelezettségek (%)','Obligations met on time (%)'),M('Neconformități legale deschise','Nyitott jogi nemmegfelelőségek','Open legal nonconformities'),M('Incidente de securitate','Biztonsági események','Safety incidents')],[X('Contracte, autorizații și cerințe legale','Szerződések, engedélyek és jogi követelmények','Contracts, permits and legal requirements'),X('SSM, PSI și protecția mediului','Munkavédelem, tűzvédelem és környezetvédelem','Health, safety, fire and environmental protection'),X('Protecția datelor și controlul accesului','Adatvédelem és hozzáférés-ellenőrzés','Data protection and access control')]),
   D('7.3',M('Conducere operațională','Operatív vállalatirányítás','Operational Management'),M('Coordonează zilnic diviziile și închide rapid blocajele și deciziile.','Naponta összehangolja a divíziókat, és gyorsan lezárja az akadályokat és döntéseket.','Coordinates divisions daily and closes blockers and decisions quickly.'),M('Plan executat, indicatori revizuiți și abateri cu responsabil și termen.','Végrehajtott terv, felülvizsgált mutatók, felelőssel és határidővel ellátott eltérések.','Executed plan, reviewed indicators, and deviations with owners and deadlines.'),[M('Acțiuni la termen (%)','Határidős intézkedések (%)','Actions completed on time (%)'),M('Blocaje peste 48 h','48 órán túli akadályok','Blockers over 48h'),M('Rezultat operațional lunar','Havi működési eredmény','Monthly operating result')],[X('Coordonarea zilnică și săptămânală','Napi és heti működési koordináció','Daily and weekly coordination'),X('Revizuirea KPI și a capacității','KPI-k és kapacitás felülvizsgálata','Review KPIs and capacity'),X('Escaladări, decizii și urmărirea acțiunilor','Eszkalációk, döntések és intézkedéskövetés','Escalations, decisions and action tracking')])
  ],M('Service coordonat, conform, profitabil și capabil să se dezvolte.','Összehangolt, szabályos, nyereséges és fejlődésre képes szerviz.','A coordinated, compliant, profitable service business able to grow.'),[M('Profit operațional','Működési eredmény','Operating profit'),M('Obiective realizate (%)','Teljesített célok (%)','Objectives achieved (%)'),M('Riscuri critice deschise','Nyitott kritikus kockázatok','Open critical risks')],M('Direcție și decizii clare pentru diviziile 1–6.','Világos irány és döntések az 1–6. divízió számára.','Clear direction and decisions for Divisions 1–6.')),
 V(1,M('Oameni, HR și comunicare internă','Emberek, HR és belső kommunikáció','People, HR and Internal Communication'),
  M('Asigură numărul potrivit de oameni competenți, documentați și informați.','Biztosítja a megfelelő számú, kompetens, dokumentált és tájékozott munkatársat.','Provides the right number of competent, documented and informed people.'),
  [
   D('1.1',M('Administrare HR și planificare personal','HR-adminisztráció és létszámtervezés','HR Administration and Workforce Planning'),M('Menține evidența personalului și planifică necesarul pe baza volumului și capacității.','Naprakészen tartja a személyi nyilvántartást, és a munkamennyiség alapján megtervezi a létszámot.','Maintains personnel records and plans staffing from workload and capacity.'),M('Plan de personal și evidențe complete, actuale și conforme.','Teljes, aktuális és szabályos személyzeti terv és nyilvántartás.','Complete, current and compliant workforce plan and records.'),[M('Registru actualizat la timp (%)','Nyilvántartás határidőre frissítve (%)','Register updated on time (%)'),M('Posturi critice ocupate (%)','Betöltött kritikus pozíciók (%)','Critical posts filled (%)'),M('Dosare complete (%)','Teljes személyi dossziék (%)','Complete personnel files (%)'),M('Necesar acoperit (%)','Lefedett létszámigény (%)','Staffing need covered (%)'),M('Documente telefonice citite (%)','Telefonos dokumentum olvasottság (%)','Phone document read rate (%)'),M('Timp răspuns cerere mecanic (ore)','Szerelői kérés átfutás (óra)','Mechanic request response time (h)')],[X('Planificarea personalului și registrul de personal','Személyzeti terv és személyi nyilvántartás','Workforce planning and personnel register',HR_PLAN_DETAIL),X('Contracte, REGES și dosare de personal','Munkaszerződések, REGES és személyi dossziék','Contracts, REGES and personnel files'),X('Pontaj, concedii și date pentru salarizare','Jelenlét, szabadság és bérszámfejtési adatok','Attendance, leave and payroll inputs'),X('Decizia privind cererile mecanicilor (zi liberă, scule, ajutor)','Szerelői kérések elbírálása (szabadnap, szerszám, segítség)','Decision on mechanic requests (day off, tools, help)'),X('Gestionarea expeditorilor din birou (tel_kuldo)','Iroda-küldők jogosultságainak kezelése (tel_kuldo)','Office sender permissions (tel_kuldo)'),X('Eliberarea fișei de lucru și evidența semnăturilor pe telefon (art. 243)','Munkalap kiadása és aláírás-nyilvántartás a telefonon (art. 243)','Worksheet issuing and signature records on phone (art. 243)')]),
   D('1.2',M('Recrutare, integrare și competențe','Toborzás, beléptetés és kompetenciák','Recruitment, Onboarding and Competence'),M('Aduce oamenii potriviți și îi face capabili să lucreze sigur și corect pe post.','Megtalálja a megfelelő embereket, és képessé teszi őket a biztonságos, pontos munkára.','Brings in the right people and enables them to work safely and correctly.'),M('Angajați integrați, autorizați și competenți pentru postul lor.','Beillesztett, felhatalmazott és a posztjukon kompetens munkatársak.','Onboarded, authorized and competent employees for their posts.'),[M('Timp de ocupare post','Pozícióbetöltési idő','Time to fill'),M('Integrare finalizată (%)','Befejezett beléptetés (%)','Onboarding completed (%)'),M('Competențe validate (%)','Igazolt kompetenciák (%)','Validated competencies (%)')],[X('Recrutare și selecție','Toborzás és kiválasztás','Recruitment and selection'),X('Integrare și autorizare pe post','Beléptetés és posztengedélyezés','Onboarding and post authorization'),X('Plan de formare și matrice de competențe','Képzési terv és kompetenciamátrix','Training plan and competence matrix')]),
   D('1.3',M('Comunicare, performanță și disciplină','Kommunikáció, teljesítmény és fegyelem','Communication, Performance and Discipline'),M('Asigură informația internă, așteptările clare și tratarea consecventă a abaterilor.','Biztosítja a belső tájékoztatást, a világos elvárásokat és az eltérések következetes kezelését.','Ensures internal information, clear expectations and consistent handling of deviations.'),M('Echipă informată, evaluată și responsabilă.','Tájékozott, értékelt és felelősen működő csapat.','An informed, assessed and accountable team.'),[M('Evaluări la termen (%)','Határidős értékelések (%)','Reviews completed on time (%)'),M('Comunicări confirmate (%)','Visszaigazolt közlések (%)','Communications acknowledged (%)'),M('Cazuri restante','Lejárt ügyek','Overdue cases')],[X('Comunicări interne și ședințe','Belső kommunikáció és értekezletek','Internal communications and meetings'),X('Evaluarea performanței și obiective','Teljesítményértékelés és célok','Performance review and objectives'),X('Regulamente, cultură și disciplină','Szabályzatok, kultúra és fegyelem','Policies, culture and discipline'),X('Eliberarea documentelor telefonice și urmărirea citirii (art. 243)','Telefonos dokumentumok kiadása és olvasottság követése (art. 243)','Phone document issuing and read tracking (art. 243)')])
  ],M('Echipă suficientă, competentă, documentată și aliniată.','Elegendő, kompetens, dokumentált és összehangolt csapat.','A sufficient, competent, documented and aligned team.'),[M('Posturi critice ocupate (%)','Betöltött kritikus pozíciók (%)','Critical posts filled (%)'),M('Dosare complete (%)','Teljes dossziék (%)','Complete files (%)'),M('Ore de formare / persoană','Képzési óra / fő','Training hours / person')],M('Oameni pregătiți și date HR corecte pentru toate diviziile.','Felkészült emberek és pontos HR-adatok minden divízió számára.','Prepared people and accurate HR data for every division.')),
 V(2,M('Marketing, vânzări și recepție service','Marketing, értékesítés és munkafelvevő','Marketing, Sales and Service Reception'),
  M('Generează cerere profitabilă și o transformă în programări și comenzi aprobate.','Nyereséges igényt teremt, majd azt időponttá és jóváhagyott megrendeléssé alakítja.','Generates profitable demand and converts it into appointments and approved orders.'),
  [
   D('2.1',M('Piață, marcă și marketing digital','Piac, márka és digitális marketing','Market, Brand and Digital Marketing'),M('Înțelege piața și produce campanii care atrag clienții potriviți.','Megérti a piacot, és a megfelelő ügyfeleket vonzó kampányokat készít.','Understands the market and creates campaigns that attract the right customers.'),M('Cerere măsurabilă de la segmentele potrivite.','Mérhető igény a megfelelő ügyfélszegmensekből.','Measurable demand from the right customer segments.'),[M('Solicitări calificate','Minősített érdeklődések','Qualified enquiries'),M('Cost per solicitare','Érdeklődésenkénti költség','Cost per enquiry'),M('Conversie digitală (%)','Digitális konverzió (%)','Digital conversion (%)')],[X('Analiza pieței și segmentelor','Piac- és szegmenselemzés','Market and segment analysis'),X('Campanii, conținut și prezență online','Kampányok, tartalom és online jelenlét','Campaigns, content and online presence'),X('Marcă, recenzii și relații publice','Márka, értékelések és PR','Brand, reviews and public relations')]),
   D('2.2',M('Programare, recepție și ofertare','Időpont, munkafelvevés és ajánlatadás','Booking, Service Reception and Quotation'),M('Transformă solicitarea clientului într-o comandă tehnică și comercială clară.','Az ügyféligényt világos műszaki és kereskedelmi megrendeléssé alakítja.','Turns the customer request into a clear technical and commercial order.'),M('Programare confirmată și comandă aprobată, cu cerințe complete.','Visszaigazolt időpont és teljes követelményű, jóváhagyott megrendelés.','A confirmed appointment and approved order with complete requirements.'),[M('Timp de răspuns','Válaszidő','Response time'),M('Ofertă → comandă (%)','Ajánlat → megrendelés (%)','Quote-to-order (%)'),M('Comenzi complete din prima (%)','Elsőre teljes munkalapok (%)','Work orders complete first time (%)')],[X('Preluarea solicitării și programarea','Igényfelvétel és időpont-egyeztetés','Capture request and book appointment'),X('Recepția vehiculului și confirmarea simptomelor','Járműátvétel és tünetpontosítás','Receive vehicle and confirm symptoms'),X('Deviz, aprobare și comandă de lucru','Árajánlat, jóváhagyás és munkalap','Quotation, approval and work order')]),
   D('2.3',M('Vânzări comerciale și parteneri','Kereskedelmi értékesítés és partnerek','Commercial Sales and Partners'),M('Dezvoltă contracte și oportunități profitabile pentru capacitatea service-ului.','Nyereséges szerződéseket és lehetőségeket fejleszt a szervizkapacitáshoz.','Develops profitable contracts and opportunities for service capacity.'),M('Portofoliu calificat, contracte profitabile și capacitate rezervată.','Minősített értékesítési csatorna, nyereséges szerződések és lefoglalt kapacitás.','Qualified pipeline, profitable contracts and reserved capacity.'),[M('Valoare portofoliu','Értékesítési csatorna értéke','Pipeline value'),M('Contracte noi','Új szerződések','New contracts'),M('Marjă ofertată (%)','Ajánlati árrés (%)','Quoted margin (%)')],[X('Contracte flote și clienți comerciali','Flotta- és vállalati szerződések','Fleet and commercial contracts'),X('Vânzare suplimentară bazată pe necesar','Igényalapú kiegészítő értékesítés','Needs-based additional sales'),X('Urmărirea ofertelor și oportunităților','Ajánlatok és lehetőségek utánkövetése','Follow up quotes and opportunities')])
  ],M('Comenzi profitabile, clare și confirmate pentru service.','Nyereséges, világos és visszaigazolt szervizmegrendelések.','Profitable, clear and confirmed service orders.'),[M('Programări confirmate','Visszaigazolt időpontok','Confirmed appointments'),M('Conversie ofertă → comandă (%)','Ajánlat → megrendelés (%)','Quote-to-order (%)'),M('Marjă estimată (%)','Tervezett árrés (%)','Estimated margin (%)')],M('Comenzi aprobate și cerințe complete pentru finanțe și producție.','Jóváhagyott megrendelések és teljes követelmények a pénzügy és termelés számára.','Approved orders and complete requirements for finance and production.')),
 V(3,M('Finanțe, achiziții și active','Pénzügy, beszerzés és eszközök','Finance, Procurement and Assets'),
  M('Protejează lichiditatea și marja și asigură la timp resursele necesare.','Védi a likviditást és az árrést, és időben biztosítja a szükséges erőforrásokat.','Protects liquidity and margin and supplies required resources on time.'),
  [
   D('3.1',M('Planificare, contabilitate și control','Tervezés, könyvelés és kontrolling','Planning, Accounting and Control'),M('Oferă o imagine financiară corectă și controlează bugetul și profitabilitatea.','Pontos pénzügyi képet ad, és ellenőrzi a költségvetést és nyereségességet.','Provides an accurate financial picture and controls budget and profitability.'),M('Închidere corectă, buget urmărit și marjă vizibilă pe activitate.','Pontos zárás, követett költségvetés és látható munkánkénti árrés.','Accurate close, tracked budget and visible margin by job.'),[M('Închidere la termen','Határidős zárás','Close on time'),M('Abatere bugetară (%)','Költségvetési eltérés (%)','Budget variance (%)'),M('Marjă brută (%)','Bruttó árrés (%)','Gross margin (%)')],[X('Buget și prognoză de numerar','Költségvetés és cash-flow előrejelzés','Budget and cash-flow forecast'),X('Contabilitate și închidere lunară','Könyvelés és havi zárás','Accounting and monthly close'),X('Control cost și marjă pe comandă','Munkalap-költség és árrés ellenőrzése','Control job cost and margin')]),
   D('3.2',M('Facturare, casierie și creanțe','Számlázás, pénzkezelés és követelések','Billing, Cash and Receivables'),M('Emite documentele corecte, încasează și urmărește fiecare creanță.','Pontos bizonylatokat állít ki, beszed és minden követelést nyomon követ.','Issues correct documents, collects payment and follows every receivable.'),M('Facturi corecte, încasări reconciliate și creanțe controlate.','Pontos számlák, egyeztetett bevételek és ellenőrzött követelések.','Correct invoices, reconciled receipts and controlled receivables.'),[M('Facturi corecte din prima (%)','Elsőre helyes számlák (%)','Invoices correct first time (%)'),M('Zile de încasare','Beszedési napok','Collection days'),M('Creanțe restante','Lejárt követelések','Overdue receivables')],[X('Facturare și documente fiscale','Számlázás és adóbizonylatok','Billing and tax documents'),X('Încasări, casierie și reconciliere','Bevételek, pénztár és egyeztetés','Receipts, cash and reconciliation'),X('Urmărirea și recuperarea creanțelor','Követelések követése és behajtása','Track and recover receivables')]),
   D('3.3',M('Achiziții, stoc și active','Beszerzés, készlet és eszközök','Procurement, Inventory and Assets'),M('Asigură piesele, consumabilele, sculele și activele potrivite la cost controlat.','Ellenőrzött költséggel biztosítja a megfelelő alkatrészeket, fogyóanyagokat, szerszámokat és eszközöket.','Provides the right parts, consumables, tools and assets at controlled cost.'),M('Materiale disponibile la timp, stoc exact și active funcționale.','Időben rendelkezésre álló anyagok, pontos készlet és működő eszközök.','Materials available on time, accurate inventory and functioning assets.'),[M('Disponibilitate piese (%)','Alkatrész-rendelkezésre állás (%)','Parts availability (%)'),M('Acuratețe stoc (%)','Készletpontosság (%)','Inventory accuracy (%)'),M('Achiziții urgente (%)','Sürgős beszerzések (%)','Emergency purchases (%)')],[X('Furnizori, prețuri și condiții','Beszállítók, árak és feltételek','Suppliers, prices and terms'),X('Comandă, recepție și trasabilitate piese','Alkatrészrendelés, átvétel és nyomonkövetés','Parts ordering, receipt and traceability'),X('Inventar, scule și active','Készlet, szerszámok és eszközök','Inventory, tools and assets')])
  ],M('Lichiditate protejată, marjă controlată și resurse disponibile.','Védett likviditás, ellenőrzött árrés és rendelkezésre álló erőforrások.','Protected liquidity, controlled margin and available resources.'),[M('Flux de numerar','Cash-flow','Cash flow'),M('Marjă brută (%)','Bruttó árrés (%)','Gross margin (%)'),M('Acuratețe stoc (%)','Készletpontosság (%)','Inventory accuracy (%)')],M('Buget, piese și resurse aprobate pentru execuție.','Jóváhagyott költségvetés, alkatrészek és erőforrások a végrehajtáshoz.','Approved budget, parts and resources for execution.')),
 V(4,M('Producție service','Szerviztermelés','Service Production'),
  M('Transformă comanda aprobată într-un vehicul reparat corect și la termen.','A jóváhagyott megrendelést pontosan és határidőre megjavított járművé alakítja.','Turns an approved order into a correctly repaired vehicle on time.'),
  [
   D('4.1',M('Recepție tehnică, diagnoză și planificare','Műszaki átvétel, diagnosztika és tervezés','Technical Reception, Diagnostics and Planning'),M('Confirmă starea vehiculului, cauza probabilă, operațiile, piesele și termenul.','Megerősíti a jármű állapotát, a valószínű okot, a műveleteket, alkatrészeket és határidőt.','Confirms vehicle condition, likely cause, operations, parts and deadline.'),M('Plan tehnic complet și fezabil, aprobat înainte de execuție.','Teljes és megvalósítható, végrehajtás előtt jóváhagyott műszaki terv.','A complete, feasible technical plan approved before execution.'),[M('Diagnoze corecte din prima (%)','Elsőre helyes diagnózisok (%)','Diagnosis correct first time (%)'),M('Planuri complete (%)','Teljes tervek (%)','Complete plans (%)'),M('Porniri la termen (%)','Határidős indítások (%)','Starts on time (%)')],[X('Inspecția de intrare și confirmarea simptomelor','Bejövő átvizsgálás és tünetpontosítás','Incoming inspection and symptom confirmation'),X('Diagnoză și plan tehnic','Diagnosztika és műszaki terv','Diagnostics and technical plan'),X('Capacitate, piese și programare','Kapacitás, alkatrészek és ütemezés','Capacity, parts and scheduling'),X('Atribuirea sarcinilor telefonice mecanicilor (Teendőim → telefon · muncă nemăsurată)','Telefonos feladatok kiosztása szerelőknek (Teendőim → telefon · nem mért munka)','Phone task assignment to mechanics (My tasks → phone · unmeasured work)')]),
   D('4.2',M('Reparație și întreținere','Javítás és karbantartás','Repair and Maintenance'),M('Execută lucrările aprobate după tehnologie și înregistrează complet operațiile.','A jóváhagyott munkákat a technológia szerint végrehajtja, és teljesen dokumentálja.','Executes approved work to technical procedure and records every operation.'),M('Lucrare executată corect, trasabil și în timpul planificat.','Pontosan, visszakövethetően és tervezett időben elvégzett munka.','Work completed correctly, traceably and within planned time.'),[M('Eficiență tehnician (%)','Szerelői hatékonyság (%)','Technician efficiency (%)'),M('Finalizat la termen (%)','Határidőre kész (%)','Completed on time (%)'),M('Refaceri (%)','Újramunka (%)','Rework (%)'),M('Timp răspuns sarcină telefonică (ore)','Telefonos feladat átfutás (óra)','Phone task response time (h)'),M('Rata sarcinilor returnate (%)','Visszaküldött feladatok aránya (%)','Returned tasks ratio (%)')],[X('Întreținere și reparații mecanice','Karbantartás és mechanikai javítás','Maintenance and mechanical repair'),X('Electrică, electronică și diagnoză avansată','Villamosság, elektronika és haladó diagnosztika','Electrical, electronic and advanced diagnostics'),X('Înregistrarea timpului, pieselor și operațiilor','Idő, alkatrészek és műveletek rögzítése','Record time, parts and operations'),X('Executarea și confirmarea sarcinilor telefonice (telefon mecanic)','Telefonos feladatok elvégzése és visszaigazolása (szerelő telefon)','Phone task execution and confirmation (mechanic phone)'),X('Preluarea și semnarea fișei de lucru pe telefon (art. 243)','Munkalap átvétele és aláírása a telefonon (art. 243)','Worksheet receipt and signing on phone (art. 243)')]),
   D('4.3',M('Logistică și predare vehicul','Logisztika és járműátadás','Logistics and Vehicle Handover'),M('Închide fluxul fizic și documentar și predă vehiculul complet și explicat.','Lezárja a fizikai és dokumentációs folyamatot, és teljesen, érthetően adja át a járművet.','Closes the physical and document flow and hands over the vehicle completely and clearly.'),M('Vehicul pregătit, documentație completă și predare confirmată.','Előkészített jármű, teljes dokumentáció és igazolt átadás.','Prepared vehicle, complete documentation and confirmed handover.'),[M('Predări la termen (%)','Határidős átadások (%)','Handovers on time (%)'),M('Dosare complete (%)','Teljes munkadossziék (%)','Complete job files (%)'),M('Diferențe de stoc','Készleteltérések','Inventory differences')],[X('Flux piese și retururi','Alkatrészáramlás és visszáru','Parts flow and returns'),X('Pregătirea vehiculului și documentelor','Jármű és dokumentumok előkészítése','Prepare vehicle and documents'),X('Explicarea lucrării și predarea către client','Munka ismertetése és ügyfélátadás','Explain work and hand over to customer')])
  ],M('Vehicul reparat corect, documentat și predat la termen.','Pontosan megjavított, dokumentált és határidőre átadott jármű.','A correctly repaired, documented vehicle handed over on time.'),[M('Productivitate ore facturate / disponibile','Termelékenység: számlázott / rendelkezésre álló óra','Productivity: billed / available hours'),M('Finalizat la termen (%)','Határidőre kész (%)','Completed on time (%)'),M('Refaceri (%)','Újramunka (%)','Rework (%)')],M('Vehicul finalizat și documentație pentru controlul calității.','Elkészült jármű és dokumentáció a minőségellenőrzéshez.','Completed vehicle and documents for quality control.')),
 V(5,M('Calitate și dezvoltare profesională','Minőség és szakmai fejlődés','Quality and Professional Development'),
  M('Previne ieșirea defectelor, dezvoltă competențele și elimină cauzele recurente.','Megakadályozza a hibák kijutását, fejleszti a kompetenciákat és megszünteti az ismétlődő okokat.','Prevents defects from escaping, develops competence and removes recurring causes.'),
  [
   D('5.1',M('Controlul calității','Minőségellenőrzés','Quality Control'),M('Verifică intrarea, etapele critice și rezultatul final după criterii documentate.','Dokumentált feltételek alapján ellenőrzi a bemenetet, a kritikus lépéseket és a végeredményt.','Checks input, critical stages and final result against documented criteria.'),M('Vehicul acceptat numai după control complet și trasabil.','Csak teljes és visszakövethető ellenőrzés után elfogadott jármű.','A vehicle accepted only after complete, traceable inspection.'),[M('Acceptat din prima (%)','Elsőre elfogadott (%)','First-pass acceptance (%)'),M('Controale complete (%)','Teljes ellenőrzések (%)','Complete inspections (%)'),M('Defecte scăpate la client','Ügyfélig kijutott hibák','Defects escaped to customer')],[X('Control la intrare și criterii de acceptare','Bejövő ellenőrzés és elfogadási feltételek','Incoming inspection and acceptance criteria'),X('Controlul etapelor critice','Kritikus lépések ellenőrzése','Inspect critical stages'),X('Control final și probă de drum','Végellenőrzés és próbaút','Final inspection and road test')]),
   D('5.2',M('Standarde, instruire și cunoștințe','Szabványok, képzés és tudás','Standards, Training and Knowledge'),M('Menține procedurile tehnice și demonstrează competența necesară fiecărui post.','Fenntartja a műszaki eljárásokat, és igazolja az egyes posztok szükséges kompetenciáját.','Maintains technical procedures and demonstrates required competence for each post.'),M('Proceduri actuale și personal instruit și verificat.','Aktuális eljárások és képzett, ellenőrzött munkatársak.','Current procedures and trained, verified personnel.'),[M('Instruiri realizate (%)','Teljesített képzések (%)','Training completed (%)'),M('Competențe valabile (%)','Érvényes kompetenciák (%)','Valid competencies (%)'),M('Proceduri actualizate (%)','Aktuális eljárások (%)','Procedures current (%)')],[X('Proceduri Bosch și instrucțiuni tehnice','Bosch eljárások és műszaki utasítások','Bosch procedures and technical instructions'),X('Plan de formare și certificări','Képzési terv és tanúsítások','Training plan and certifications'),X('Bază de cunoștințe și calibrarea echipamentelor','Tudásbázis és berendezéskalibrálás','Knowledge base and equipment calibration')]),
   D('5.3',M('Reclamații și acțiuni corective','Reklamációk és javító intézkedések','Complaints and Corrective Action'),M('Rezolvă reclamația, elimină cauza și verifică faptul că problema nu revine.','Rendezi a reklamációt, megszünteti az okot, és ellenőrzi, hogy a probléma nem tér vissza.','Resolves the complaint, removes the cause and verifies non-recurrence.'),M('Client protejat, cauză închisă și acțiune corectivă eficace.','Védett ügyfél, lezárt ok és hatásos javító intézkedés.','Protected customer, closed cause and effective corrective action.'),[M('Timp de răspuns reclamație','Reklamációs válaszidő','Complaint response time'),M('Recurență (%)','Ismétlődés (%)','Recurrence (%)'),M('Acțiuni închise la termen (%)','Határidőre lezárt intézkedések (%)','Actions closed on time (%)')],[X('Reclamații, garanții și prima reacție','Reklamációk, garancia és első reakció','Complaints, warranty and first response'),X('Analiza cauzei și controlul refacerii','Okfeltárás és újramunka-ellenőrzés','Root cause and rework control'),X('Acțiune corectivă și verificarea eficacității','Javító intézkedés és hatásosságvizsgálat','Corrective action and effectiveness check')])
  ],M('Niciun vehicul nu pleacă fără calitate verificată; cauzele problemelor sunt eliminate.','Egyetlen jármű sem távozik igazolt minőség nélkül; a problémák okai megszűnnek.','No vehicle leaves without verified quality; problem causes are removed.'),[M('Acceptat din prima (%)','Elsőre elfogadott (%)','First-pass acceptance (%)'),M('Reclamații / 100 comenzi','Reklamáció / 100 munkalap','Complaints / 100 orders'),M('Recurență (%)','Ismétlődés (%)','Recurrence (%)')],M('Vehicul verificat și lecții de îmbunătățire pentru organizație.','Ellenőrzött jármű és fejlesztési tanulságok a szervezet számára.','Verified vehicle and improvement lessons for the organization.')),
 V(6,M('Experiența clientului și creștere','Ügyfélélmény és növekedés','Customer Experience and Growth'),
  M('Transformă livrarea bună în încredere, revenire, recomandare și piețe noi.','A jó átadást bizalommá, visszatéréssé, ajánlássá és új piacokká alakítja.','Turns good delivery into trust, return visits, referrals and new markets.'),
  [
   D('6.1',M('Relații și informarea clientului','Ügyfélkapcsolat és tájékoztatás','Customer Relations and Information'),M('Ține clientul informat și obține rapid aprobările necesare.','Tájékoztatja az ügyfelet, és gyorsan beszerzi a szükséges jóváhagyásokat.','Keeps the customer informed and obtains required approvals quickly.'),M('Client informat la timp și fiecare schimbare aprobată și documentată.','Időben tájékoztatott ügyfél, minden változás jóváhagyva és dokumentálva.','Customer informed on time, every change approved and documented.'),[M('Actualizări la termen (%)','Határidős tájékoztatások (%)','Updates on time (%)'),M('Timp de aprobare','Jóváhagyási idő','Approval time'),M('Solicitări fără răspuns','Megválaszolatlan ügyek','Unanswered requests')],[X('Informarea despre starea lucrării','Tájékoztatás a munka állapotáról','Update customer on job status'),X('Aprobări pentru modificări de cost și termen','Költség- és határidőváltozás jóváhagyása','Approve cost and deadline changes'),X('Gestionarea solicitărilor și promisiunilor','Ügyek és ígéretek kezelése','Manage requests and promises')]),
   D('6.2',M('Fidelizare și satisfacție','Megtartás és elégedettség','Retention and Satisfaction'),M('Măsoară experiența, urmărește clientul și facilitează revenirea la momentul potrivit.','Méri az élményt, utánköveti az ügyfelet, és a megfelelő időben segíti a visszatérést.','Measures experience, follows up and enables the customer to return at the right time.'),M('Feedback documentat, client mulțumit și următoarea vizită planificată.','Dokumentált visszajelzés, elégedett ügyfél és megtervezett következő látogatás.','Documented feedback, satisfied customer and planned next visit.'),[M('Satisfacție / NPS','Elégedettség / NPS','Satisfaction / NPS'),M('Clienți recurenți (%)','Visszatérő ügyfelek (%)','Returning customers (%)'),M('Reprogramări din remindere (%)','Emlékeztetőből újrafoglalás (%)','Reminder rebooking (%)')],[X('Urmărire după service','Szerviz utáni utánkövetés','Post-service follow-up'),X('Măsurarea satisfacției și închiderea feedbackului','Elégedettségmérés és visszajelzéslezárás','Measure satisfaction and close feedback'),X('Remindere și programarea următoarei vizite','Emlékeztetők és következő látogatás','Reminders and next-visit booking')]),
   D('6.3',M('Parteneriate și servicii noi','Partnerségek és új szolgáltatások','Partnerships and New Services'),M('Extinde baza de clienți prin parteneri și servicii validate economic și operațional.','Gazdaságilag és működésileg igazolt partnerekkel és szolgáltatásokkal bővíti az ügyfélbázist.','Expands the customer base through economically and operationally validated partners and services.'),M('Parteneriate profitabile și servicii noi lansate controlat.','Nyereséges partnerségek és ellenőrzötten bevezetett új szolgáltatások.','Profitable partnerships and new services launched under control.'),[M('Venit din parteneriate','Partnerségi bevétel','Partnership revenue'),M('Servicii noi validate','Igazolt új szolgáltatások','Validated new services'),M('Clienți noi prin parteneri','Partnerből érkező új ügyfelek','New customers via partners')],[X('Flote, asigurători și leasing','Flotta, biztosító és lízing','Fleets, insurers and leasing'),X('Evaluarea și lansarea serviciilor noi','Új szolgáltatások értékelése és bevezetése','Evaluate and launch new services'),X('Performanța partenerilor și planul de creștere','Partnerteljesítmény és növekedési terv','Partner performance and growth plan')])
  ],M('Clienți informați, mulțumiți, recurenți și o bază profitabilă în creștere.','Tájékozott, elégedett, visszatérő ügyfelek és nyereségesen növekvő ügyfélbázis.','Informed, satisfied, returning customers and a profitably growing customer base.'),[M('Satisfacție / NPS','Elégedettség / NPS','Satisfaction / NPS'),M('Rată de revenire (%)','Visszatérési arány (%)','Return rate (%)'),M('Recomandări și clienți noi','Ajánlások és új ügyfelek','Referrals and new customers')],M('Feedback, cerere repetată și informații pentru următorul ciclu.','Visszajelzés, ismételt igény és információ a következő ciklushoz.','Feedback, repeat demand and information for the next cycle.'))
];

var MODEL_TEXT={
 ro:{
  labels:{m1:'Model existent',m2:'Model WISE',m3:'Model service auto'},
  subtitles:{m1:'Modelul existent păstrat · 7 divizii · 21 departamente',m2:'Structură publică de referință · 7 divizii · 21 departamente',m3:'Model operațional modern pentru service auto · 7 divizii · 21 departamente'},
  notes:{m1:'Structura modelului existent este păstrată într-un fișier separat. Dacă datele modelului anterior sunt accesibile în acest browser, sunt preluate la prima utilizare; salvările ulterioare sunt independente.',m2:'Model demonstrativ bazat pe structura publică în 7 divizii. Denumirile sunt de referință, iar responsabilitățile sunt reformulate pentru claritate; nu este standard juridic sau ISO.',m3:'Propunere modernă pentru un service auto. Rolurile, țintele și persoanele trebuie validate de conducere înainte de utilizarea operațională.'},
  source:'Sursa publică oficială',aria:'Modele organizaționale',deptLeader:'Șef departament',divisionLeader:'Conducător divizie',person:'Persoană',approved:'De aprobat',
  modulePurpose:'Scop',moduleResult:'Rezultat verificabil',moduleKpi:'Indicatori',moduleTasks:'Responsabilități — deschide fișa',moduleDepartments:'Departamente',modelBadge:'Model activ',
  checks:{m2:['7 divizii și 21 de departamente funcționale','Fluxul operațional trece prin diviziile 1→6','Divizia 7 coordonează deasupra fluxului','Postul descrie funcția; persoana este desemnată separat'],m3:['7 divizii și 21 de departamente pentru service auto','Fiecare departament are conducător, rezultat și KPI','Fiecare responsabilitate are fișă editabilă','Persoanele și țintele sunt aprobate de conducere']},
  modalEvaluation:'Rezultat complet, corect, trasabil și predat la termen. Orice abatere are responsabil, termen și dovada verificării.',
  modalJob:['Confirmă cererea, datele de intrare și criteriul de acceptare.','Planifică responsabilul, resursele și termenul.','Execută activitatea și înregistrează rezultatul.','Verifică, predă și închide abaterile.']
 },
 hu:{
  labels:{m1:'Meglévő modell',m2:'WISE modell',m3:'Autószerviz modell'},
  subtitles:{m1:'A meglévő modell változatlanul megőrizve · 7 divízió · 21 alosztály',m2:'Nyilvános referenciafelépítés · 7 divízió · 21 alosztály',m3:'Modern autószerviz-működési modell · 7 divízió · 21 alosztály'},
  notes:{m1:'A meglévő modell felépítése külön fájlban marad meg. Ha a korábbi modell adatai elérhetők ebben a böngészőben, első használatkor átvesszük őket; a további mentések önállóak.',m2:'A nyilvános 7 divíziós felépítésen alapuló bemutatómodell. A megnevezések referenciaértékűek, a feladatokat az érthetőség kedvéért átfogalmaztuk; ez nem jogi vagy ISO-szabvány.',m3:'Modern autószervizre készített javaslat. A szerepköröket, célértékeket és személyeket működési használat előtt a vezetésnek jóvá kell hagynia.'},
  source:'Hivatalos nyilvános forrás',aria:'Szervezési modellek',deptLeader:'Alosztályvezető',divisionLeader:'Divízióvezető',person:'Személy',approved:'Jóváhagyandó',
  modulePurpose:'Cél',moduleResult:'Ellenőrizhető eredmény',moduleKpi:'Mutatók',moduleTasks:'Felelősségek — adatlap megnyitása',moduleDepartments:'Alosztályok',modelBadge:'Aktív modell',
  checks:{m2:['7 divízió és 21 funkcionális alosztály','A működési áramlás az 1→6. divízión halad át','A 7. divízió a folyamat fölött koordinál','A poszt a funkció; a személyt külön kell kijelölni'],m3:['7 divízió és 21 autószerviz-alosztály','Minden alosztálynak van vezetője, eredménye és KPI-ja','Minden felelősséghez szerkeszthető adatlap tartozik','A személyeket és célértékeket a vezetés hagyja jóvá']},
  modalEvaluation:'Teljes, pontos, visszakövethető és határidőre átadott eredmény. Minden eltéréshez felelős, határidő és ellenőrzési bizonyíték tartozik.',
  modalJob:['Ellenőrizd az igényt, a bemeneti adatokat és az elfogadási feltételt.','Tervezd meg a felelőst, az erőforrást és a határidőt.','Hajtsd végre a feladatot, és rögzítsd az eredményt.','Ellenőrizd, add át, és zárd le az eltéréseket.']
 },
 en:{
  labels:{m1:'Existing model',m2:'WISE model',m3:'Auto service model'},
  subtitles:{m1:'Existing model retained unchanged · 7 divisions · 21 departments',m2:'Public reference structure · 7 divisions · 21 departments',m3:'Modern automotive-service operating model · 7 divisions · 21 departments'},
  notes:{m1:'The existing model structure is retained in a separate file. If previous model data is accessible in this browser, it is copied on first use; subsequent saves are independent.',m2:'A demonstration model based on the public seven-division structure. Names are referential and responsibilities are paraphrased for clarity; it is not a legal or ISO standard.',m3:'A modern proposal for an automotive service business. Roles, targets and people must be approved by management before operational use.'},
  source:'Official public source',aria:'Organizational models',deptLeader:'Department leader',divisionLeader:'Division leader',person:'Person',approved:'To approve',
  modulePurpose:'Purpose',moduleResult:'Verifiable result',moduleKpi:'Indicators',moduleTasks:'Responsibilities — open card',moduleDepartments:'Departments',modelBadge:'Active model',
  checks:{m2:['7 divisions and 21 functional departments','The operating flow passes through Divisions 1→6','Division 7 coordinates above the flow','The post defines the function; the person is assigned separately'],m3:['7 divisions and 21 automotive-service departments','Every department has a leader, result and KPI','Every responsibility has an editable card','People and targets require management approval']},
  modalEvaluation:'A complete, accurate, traceable result delivered on time. Every deviation has an owner, deadline and verification evidence.',
  modalJob:['Confirm the request, input data and acceptance criterion.','Plan the owner, resources and deadline.','Execute the activity and record the result.','Verify, hand over and close deviations.']
 }
};

var MODELS={
 m1:{id:'m1',divisions:null,owners:'RED Assistance Group',executive:'Alex Popescu'},
 m2:{id:'m2',divisions:WISE_DIVISIONS,owners:'',executive:''},
 m3:{id:'m3',divisions:MODERN_DIVISIONS,owners:'RED Assistance Group',executive:''}
};
var boardModel=standaloneModel;

function MT(){return MODEL_TEXT[appLang]||MODEL_TEXT.ro;}
function activeModel(){return MODELS[boardModel];}
function activeDivisions(){
 var base=boardModel==='m1'?legacyOrdered():activeModel().divisions;
 return base.map(function(d){
  var added=stored('departments|'+d.n),extra=added&&Array.isArray(added.list)?added.list:[];
  return Object.assign({},d,{dept:d.dept.concat(extra).map(function(dp){
   return Object.assign({},dp,stored('department-info|'+dp.code)||{});
  })});
 });
}
function scopedKey(k){return boardModel==='m1'?k:boardModel+'|'+k;}
function stored(k){return ST.store[scopedKey(k)];}

/* All 21 starting departments and any added departments share this workflow.
   Existing numeric task keys are retained; new cards have immutable IDs. */
var WORK_TEXT={
 addTask:M('+ Responsabilitate','+ Feladatkör','+ Responsibility'),
 addDept:M('+ Departament','+ Alosztály','+ Department'),
 editDept:M('Editează departamentul','Alosztály szerkesztése','Edit department'),
 newDept:M('Departament nou','Új alosztály','New department'),
 deptName:M('Denumirea departamentului','Alosztály neve','Department name'),
 taskName:M('Denumirea responsabilității','Feladatkör megnevezése','Responsibility name'),
 newTask:M('Responsabilitate nouă','Új feladatkör','New responsibility'),
 unnamed:M('Denumire lipsă în limba selectată','Ezen a nyelven még nincs megnevezés','Name missing in this language'),
 owner:M('Responsabil de rezultat','Az eredményért felelős személy','Accountable owner'),
 executor:M('Executant implicit (opțional)','Alapértelmezett végrehajtó (nem kötelező)','Default assignee (optional)'),
 executorHint:M('Responsabilul răspunde de rezultat; executantul poate fi altă persoană pentru fiecare sarcină.','A felelős az eredményért felel; az egyes munkákat más-más személy is végezheti.','The owner is accountable for the result; each work order may have a different assignee.'),
 reviewer:M('Verificator implicit (opțional)','Alapértelmezett ellenőrző (nem kötelező)','Default reviewer (optional)'),
 orders:M('Sarcini concrete în această responsabilitate','Konkrét munkakiadások ebben a feladatkörben','Work orders within this responsibility'),
 ordersHint:M('O responsabilitate poate avea oricâte sarcini. Fiecare are denumire, executant, termen și stare.','Egy feladatkörhöz tetszőleges számú munkakiadás tartozhat, külön megnevezéssel, végrehajtóval, határidővel és állapottal.','A responsibility can contain any number of work orders, each with a name, assignee, due date and status.'),
 addOrder:M('+ Sarcină concretă','+ Munkakiadás','+ Work order'),
 orderName:M('Denumirea sarcinii','Kiadott munka megnevezése','Work order name'),
 assignee:M('Executant','Végrehajtó','Assignee'),
 issuer:M('Emitent','Feladatkiadó','Assigned by'),
 checkBy:M('Verificator','Ellenőrző','Reviewer'),
 due:M('Termen','Határidő','Due date'),
 status:M('Stare','Állapot','Status'),
 result:M('Rezultat / dovadă / observație','Eredmény / igazolás / megjegyzés','Result / evidence / notes'),
 open:M('De făcut','Kiadva','To do'),
 doing:M('În lucru','Folyamatban','In progress'),
 done:M('Executată','Elvégezve','Done'),
 verified:M('Verificată','Ellenőrizve','Verified'),
 removeOrder:M('Elimină sarcina','Munkakiadás eltávolítása','Remove work order'),
 removeAsk:M('Elimini această sarcină? Modificarea se aplică la salvare.','Eltávolítod ezt a munkakiadást? A változás mentéskor lép életbe.','Remove this work order? The change takes effect when saved.'),
 empty:M('Nu există încă sarcini concrete. Adaugă prima sarcină mai jos.','Még nincs munkakiadás. Az alábbi gombbal veheted fel az elsőt.','No work orders yet. Add the first one below.'),
 cancel:M('Anulează','Mégse','Cancel'),
 discard:M('Renunți la modificările nesalvate?','Elveted a nem mentett módosításokat?','Discard unsaved changes?'),
 required:M('Completează denumirea și responsabilul de rezultat.','Add meg a megnevezést és az eredményért felelős személyt.','Enter a name and an accountable owner.'),
 deptRequired:M('Completează denumirea departamentului în limba tablei.','Add meg az alosztály nevét a tábla nyelvén.','Enter the department name in the board language.'),
 orderRequired:M('Fiecare sarcină nouă trebuie să aibă denumire, executant și termen.','Minden új munkakiadáshoz megnevezés, végrehajtó és határidő szükséges.','Every new work order needs a name, an assignee and a due date.'),
 verifyRequired:M('Pentru o sarcină verificată, completează verificatorul și rezultatul.','Ellenőrzött munkánál add meg az ellenőrzőt és az eredményt.','Verified work orders need a reviewer and a result.'),
 languageNote:M('Fereastra folosește limba tablei. Numele persoanelor sunt comune. Textele proprii nu se traduc automat.','Az ablak a tábla nyelvét követi. A személynevek közösek. A saját szövegek nem fordítódnak le automatikusan.','This window follows the board language. Person names are shared. Custom text is not automatically translated.'),
 expandable:M('Structură extensibilă: departamente, responsabilități, sarcini.','Bővíthető szerkezet: alosztályok, feladatkörök, munkakiadások.','Expandable structure: departments, responsibilities, work orders.'),
 divisions:M('divizii','divízió','divisions'),
 departments:M('departamente','alosztály','departments'),
 responsibilities:M('responsabilități','feladatkör','responsibilities'),
 assignments:M('sarcini','munkakiadás','work orders'),
 unassigned:M('Fără responsabil','Nincs felelős','Unassigned'),
 initial:M('21 de departamente inițiale; pot fi adăugate altele.','21 induló alosztály; továbbiak is hozzáadhatók.','21 starting departments; more can be added.'),
 local:M('Salvare locală în acest browser; fără sincronizare între angajați.','Helyi mentés ebben a böngészőben; nincs dolgozók közötti szinkronizálás.','Saved locally in this browser; no synchronization between employees.'),
 saveError:M('Salvarea a eșuat. Modificările sunt încă în fereastră.','Sikertelen mentés. A módosítások az ablakban maradtak.','Saving failed. Your edits remain in this window.'),
 sample:M('Exemplu de adaptat înainte de utilizare.','Használat előtt pontosítandó minta.','Sample to adapt before use.'),
 onePerLine:M('Câte un indicator pe rând','Soronként egy mutató','One indicator per line')
};
function W(key,lang){return WORK_TEXT[key][lang||appLang];}
var VIEW_TEXT={
 readable:M('Vizualizare de lucru','Munkanézet','Working view'),
 panorama:M('Tablă completă','Teljes tábla','Full board'),
 view:M('Vizualizare','Nézet','View'),
 modelInfo:M('Despre model și salvare','A modellről és a mentésről','About the model and saving'),
 principles:M('Principii de funcționare','Működési alapelvek','Operating principles'),
 divisions:M('Divizii','Divíziók','Divisions'),
 division:M('Divizie','Divízió','Division'),
 navNote:M('Selectează o divizie, apoi deschide responsabilitatea dorită.','Válassz divíziót, majd nyisd meg a kívánt feladatkört.','Choose a division, then open the responsibility you need.'),
 readableHint:M('Departamente și responsabilități','Alosztályok és feladatkörök','Departments and responsibilities'),
 panoramaHint:M('Toate diviziile · derulare orizontală','Minden divízió · vízszintes görgetéssel','All divisions · scroll horizontally'),
 r:M('Marcaj: roșu','Piros jelölés','Red marker'),
 y:M('Marcaj: galben','Sárga jelölés','Yellow marker'),
 g:M('Marcaj: verde','Zöld jelölés','Green marker'),
 changeMarker:M('Schimbă marcajul','Jelölés váltása','Change marker'),
 workCount:M('finalizate','elkészült','completed'),
 jobDetails:M('Scop, rezultat, instrucțiuni și KPI','Cél, eredmény, leírás és KPI','Purpose, result, instructions and KPIs'),
 defaults:M('Executant și verificator implicit','Alapértelmezett végrehajtó és ellenőrző','Default assignee and reviewer')
};
function B(key){return VIEW_TEXT[key][appLang];}
var boardView=readPreference('zakataka_board_view','readable');
if(boardView!=='panorama')boardView='readable';
var selectedDivision=Number(readPreference('zakataka_selected_division','7'));
if([7,1,2,3,4,5,6].indexOf(selectedDivision)<0)selectedDivision=7;
function renderDivisionNavigation(){
 var divisions=activeDivisions();
 byId('divisionNav').innerHTML=divisions.map(function(d){
  return '<button type="button" data-select-division="'+d.n+'" aria-current="'+(selectedDivision===d.n)+'" style="--dc:'+DIV_COLOR[d.n]+'"><span class="nav-number">'+d.n+'</span><span><span class="nav-title">'+esc(L(d.t))+'</span><span class="nav-meta">'+d.dept.length+' '+esc(W('departments'))+'</span></span></button>';
 }).join('');
 byId('divisionSelect').innerHTML=divisions.map(function(d){return '<option value="'+d.n+'"'+(d.n===selectedDivision?' selected':'')+'>'+d.n+' · '+esc(L(d.t))+'</option>';}).join('');
 byId('divisionSelect').value=String(selectedDivision);
}
function applyBrowserLayout(){
 document.body.setAttribute('data-layout',boardView);
 byId('orgCanvas').style.zoom=boardView==='readable'?1:boardZoom;
 byId('viewControls').setAttribute('aria-label',B('view'));
 byId('readableView').textContent=B('readable');byId('panoramaView').textContent=B('panorama');
 byId('readableView').setAttribute('aria-pressed',String(boardView==='readable'));byId('panoramaView').setAttribute('aria-pressed',String(boardView==='panorama'));
 byId('boardMode').textContent=B(boardView);byId('boardHint').textContent=B(boardView==='readable'?'readableHint':'panoramaHint');
 byId('modelInfoLabel').textContent=B('modelInfo');byId('principlesLabel').textContent=B('principles');
 byId('divisionNavTitle').textContent=B('divisions');byId('divisionSelectLabel').textContent=B('division');
 byId('divisionNav').setAttribute('aria-label',B('divisions'));byId('divisionNavNote').textContent=B('navNote');
 byId('zoomOut').setAttribute('aria-label',BOARD_UI[appLang].zoomOut);byId('zoomIn').setAttribute('aria-label',BOARD_UI[appLang].zoomIn);
}
function selectDivision(n){
 if(!activeDivisions().some(function(d){return d.n===n;}))return;
 selectedDivision=n;savePreference('zakataka_selected_division',n);renderGrid();
}
setBoardZoom=function(v){
 boardZoom=Math.max(.3,Math.min(1.5,v));savePreference('ra_org_zoom',boardZoom);
 byId('orgCanvas').style.zoom=boardView==='readable'?1:boardZoom;byId('zoomValue').textContent=Math.round(boardZoom*100)+'%';
};
byId('viewControls').addEventListener('click',function(e){
 var button=e.target.closest('[data-board-view]');if(!button)return;
 boardView=button.getAttribute('data-board-view');savePreference('zakataka_board_view',boardView);
 if(boardView==='panorama'){boardZoom=1;setBoardZoom(boardZoom);}
 applyBrowserLayout();renderGrid();byId('orgViewport').scrollLeft=0;
});
byId('divisionNav').addEventListener('click',function(e){
 var button=e.target.closest('[data-select-division]');if(!button)return;selectDivision(Number(button.getAttribute('data-select-division')));
 var heading=byId('divisionTitle'+selectedDivision);if(heading){heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});}
});
byId('divisionSelect').onchange=function(){selectDivision(Number(this.value));var heading=byId('divisionTitle'+selectedDivision);if(heading)heading.scrollIntoView({block:'start'});};
byId('zoomFit').onclick=function(){var w=byId('orgViewport').clientWidth||1200;setBoardZoom((w-4)/(byId('orgCanvas').offsetWidth||2800));byId('orgViewport').scrollLeft=0;};
function copy(value){return JSON.parse(JSON.stringify(value));}
function uid(prefix){return prefix+'-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
function emptyLanguages(){return {ro:'',hu:'',en:''};}
function deptTitle(dp,lang){lang=lang||appLang;return dp.custom?((dp.t||{})[lang]||W('unnamed',lang)):L(dp.t,lang);}
function entries(n,dp){
 var list=(dp.li||[]).concat(getCustom(n,dp.code)).map(function(task,i){
  return {task:task,id:task&&task.id?task.id:String(i)};
 });
 // Virtual seed has its own stable key; it never shifts saved numeric card IDs.
 if(boardModel==='m3'&&n===7&&dp.code==='7.3')list.push({task:PLATFORM_SAMPLE,id:'platform-maintenance'});
 return list;
}
var PLATFORM_SAMPLE=X('Întreținerea platformei','Platformkarbantartás','Platform maintenance');
PLATFORM_SAMPLE.sample=true;
PLATFORM_SAMPLE.detail={};
['ro','hu','en'].forEach(function(lang){
 PLATFORM_SAMPLE.detail[lang]={
  purpose:M('Asigurarea întreținerii platformei, sub responsabilitatea conducerii.','A platform karbantartásának biztosítása a vezetőosztály felelősségében.','Ensure platform maintenance under the executive division’s accountability.')[lang],
  final:M('Platformă întreținută; lucrări și verificări consemnate.','Karbantartott platform; dokumentált munkák és ellenőrzés.','Maintained platform; documented work and verification.')[lang],
  evaluation:M('Rezultatul este verificat de persoana desemnată. Deficiențele au responsabil și termen.','A kijelölt ellenőrző átvette az eredményt. A hiányosságokhoz felelős és határidő tartozik.','The designated reviewer accepts the result. Defects have an owner and a due date.')[lang],
  job:M('Precizați ce înseamnă „platformă” și limitele responsabilității. Conducerea stabilește responsabilul; fiecare lucrare are executant separat. Instrucțiunile tehnice se stabilesc pentru echipamentul și locul concret.','Pontosítsátok, mit jelent a „platform”, és mi tartozik ide. A vezetés kijelöli az eredmény felelősét; minden munkához külön végrehajtó adható. A műszaki utasításokat a konkrét berendezéshez és helyszínhez kell meghatározni.','Define what “platform” means and the scope. Management appoints the accountable owner; each work order has a separate assignee. Technical instructions must be defined for the actual equipment and site.')[lang],
  kpis:[M('Lucrări scadente finalizate la timp (%)','Esedékes munkák határidőre elkészülve (%)','Due work orders completed on time (%)')[lang],M('Deficiențe deschise (număr)','Nyitott hiányosságok (darab)','Open defects (count)')[lang],'',''],
  targets:['','','','']
 };
});

orderedDivisions=function(){return activeDivisions();};
rec=function(k){var s=scopedKey(k);return ST.store[s]||(ST.store[s]={});};
personName=function(k,fallback){var r=stored(k);return r&&r.name!==undefined?r.name:(fallback||'');};
ini=function(name){var p=(name||'').trim().split(/\s+/).filter(Boolean);if(!p.length||p[0]==='—')return '?';return ((p[0][0]||'')+(p[1]?p[1][0]:'')).toUpperCase();};
function personFallback(k,fallback){
 if(k==='person|owners')return activeModel().owners||'';
 if(k==='person|executive')return activeModel().executive||'';
 return fallback||'';
}
editPerson=function(k,fallback){
 var current=personName(k,personFallback(k,fallback));
 var nm=prompt(PMTXT[appLang].name,current);
 if(nm===null)return;
 commitChange(function(){rec(k).name=nm.trim();});render();
};

function taskTitle(task,lang){lang=lang||appLang;if(!task)return W('unnamed',lang);return typeof task==='string'?tlang(task,lang):task.custom?((task.title||{})[lang]||W('unnamed',lang)):L(task.title,lang);}
function cardTitle(k,task,lang){lang=lang||appLang;var r=stored(k);return r&&r.titles&&Object.prototype.hasOwnProperty.call(r.titles,lang)?r.titles[lang]||W('unnamed',lang):taskTitle(task,lang);}
function getCustom(n,code){var r=stored('custom|'+n+'|'+code);return r&&r.list?r.list:[];}
function findTask(k){
 var p=String(k||'').split('|'),n=Number(p[0]),code=p[1],id=p[2];
 var d=activeDivisions().find(function(x){return x.n===n;});
 if(!d)return null;
 var dp=d.dept.find(function(x){return x.code===code;});
 if(!dp)return null;
 var entry=entries(n,dp).find(function(x){return x.id===id;});
 return entry?{division:d,department:dp,task:entry.task,index:entry.id}:null;
}
function taskDefaults(k){
 var f=findTask(k),result={who:'',assigned:'',ro:{},hu:{},en:{}};
 if(!f)return result;
 var deptOwner=personName('dept|'+f.department.code,personName('head|'+f.division.n,f.division.head));
 result.who=f.task.sample?'':deptOwner;result.assigned='';
 ['ro','hu','en'].forEach(function(lang){
  var title=taskTitle(f.task,lang),t=MODEL_TEXT[lang],specific=(f.task&&typeof f.task==='object'&&f.task.detail&&f.task.detail[lang])||null;
  if(specific){result[lang]=JSON.parse(JSON.stringify(specific));return;}
  var deptPurpose=L(f.department.purpose||f.division.d,lang);
  var deptResult=L(f.department.vfp||f.division.vfp,lang);
  var kpis=(f.department.kpis||f.division.kpi||[]).slice(0,4).map(function(x){return L(x,lang);});
  while(kpis.length<4)kpis.push('');
  result[lang]={
   purpose:deptPurpose,
   final:title+' — '+deptResult,
   evaluation:t.modalEvaluation,
   job:title+'\n1. '+t.modalJob[0]+'\n2. '+t.modalJob[1]+'\n3. '+t.modalJob[2]+'\n4. '+t.modalJob[3],
   kpis:kpis,
   targets:kpis.map(function(x){return x?t.approved:'';})
  };
 });
 return result;
}
ensureDetail=function(r,k){
 if(boardModel==='m1'){legacyEnsure(r,k);return;}
 var def=taskDefaults(k);
 if(r.who===undefined)r.who=def.who||'';
 if(r.assigned===undefined)r.assigned=def.assigned||'';
 r.lang=r.lang||{};
 ['ro','hu','en'].forEach(function(lang){
  var src=def[lang]||{},x=r.lang[lang]||(r.lang[lang]={});
  ['purpose','final','evaluation','job','kpis','targets'].forEach(function(field){
   if(x[field]===undefined)x[field]=JSON.parse(JSON.stringify(src[field]!==undefined?src[field]:(field==='kpis'||field==='targets'?['','','','']:'') ));
  });
 });
};

liHTML=function(divn,code,task,idx){
 var k=divn+'|'+code+'|'+idx;
 if(boardModel==='m1'){
  var legacy=divn+'|'+task;
  if(!stored(k)&&ST.store[legacy])ST.store[k]=ST.store[legacy];
 }
 var r=stored(k)||{};
 if(r.deleted)return '';
 var def=boardModel==='m1'?(DETAIL_DEFAULTS[k]||{}):taskDefaults(k);
 var d=activeDivisions().find(function(x){return x.n===Number(divn);});
 var who=r.who!==undefined?r.who:(def.who||personName('dept|'+code,personName('head|'+divn,d?d.head:'')));
 if(task.sample&&r.who===undefined)who='';
 var val=['r','y','g'].indexOf(r.status)>=0?r.status:'r',glyph={r:'×',y:'·',g:'✓'}[val];
 var orders=Array.isArray(r.orders)?r.orders:[],completed=orders.filter(function(o){return o.status==='done'||o.status==='verified';}).length,title=cardTitle(k,task);
 return '<div class="li" tabindex="0" role="button" aria-label="'+esc(title)+'" data-k="'+esc(k)+'" data-div="'+divn+'" data-task="'+esc(title)+'">'+
  '<span class="txt">'+esc(title)+'</span>'+
  '<span class="who" title="'+esc(W('owner'))+'"><span class="av">'+esc(ini(who))+'</span>'+esc(who||W('unassigned'))+'</span>'+
  '<button type="button" class="st '+val+'" title="'+esc(B(val)+' · '+B('changeMarker'))+'" aria-label="'+esc(B(val)+' · '+B('changeMarker'))+'">'+glyph+'</button>'+
  '<button type="button" class="del" title="'+esc(u('remove'))+'" aria-label="'+esc(u('remove'))+'">×</button>'+
  '<span class="work-meta">'+(orders.length?completed+'/'+orders.length+' '+esc(W('assignments'))+' · '+esc(B('workCount')):'0 '+esc(W('assignments')))+(task.sample?' · '+esc(W('sample')):'')+'</span></div>';
};

renderHierarchy=function(){
 var b=BOARD_UI[appLang],all=activeDivisions(),m=activeModel();
 var leaders=all.map(function(d){
  var head=personName('head|'+d.n,d.head);
  return '<div class="lead-cell" style="--dc:'+DIV_COLOR[d.n]+'"><button type="button" class="org-node" data-head="'+d.n+'"><div class="role">'+esc(MT().divisionLeader)+' · '+d.n+'</div><div class="person">'+esc(head||'—')+' ✎</div></button></div>';
 }).join('');
 document.getElementById('hierarchy').innerHTML=
  '<div class="owner-row"><button type="button" class="org-node" data-person="owners"><div class="role">'+esc(b.owners)+'</div><div class="person">'+esc(personName('person|owners',m.owners)||'—')+' ✎</div></button></div>'+
  '<div class="executive-row"><button type="button" class="org-node" data-person="executive"><div class="role">'+esc(b.executive)+'</div><div class="person">'+esc(personName('person|executive',m.executive)||'—')+' ✎</div></button></div>'+
  '<div class="lead-row">'+leaders+'</div>';
};

renderGrid=function(){
 document.getElementById('grid').innerHTML=activeDivisions().map(function(d){
  var head=personName('head|'+d.n,d.head);
  var taskCount=0;
  var body=d.dept.map(function(dp){
   var deptHead=personName('dept|'+dp.code,head);
   var tasks=entries(d.n,dp);
   taskCount+=tasks.filter(function(entry){return !(stored(d.n+'|'+dp.code+'|'+entry.id)||{}).deleted;}).length;
   var rows=tasks.map(function(entry){return liHTML(d.n,dp.code,entry.task,entry.id);}).join('');
   return '<div class="dept"><div class="dept-h">'+
    '<button type="button" class="dept-title" data-open-dept="'+dp.code+'"><span class="code">'+dp.code+'</span><span class="dt">'+esc(deptTitle(dp))+'</span></button>'+
    '<button type="button" class="dept-person" data-dept-head="'+dp.code+'" title="'+esc(MT().deptLeader)+'"><span class="av">'+esc(ini(deptHead))+'</span>'+esc(deptHead||'—')+' ✎</button>'+
    '</div>'+rows+'<button type="button" class="addbtn" data-add="'+d.n+'|'+dp.code+'">'+esc(W('addTask'))+'</button></div>';
  }).join('');
  return '<section class="card" data-division="'+d.n+'" aria-labelledby="divisionTitle'+d.n+'"'+(boardView==='readable'&&selectedDivision!==d.n?' hidden':'')+' style="--dc:'+DIV_COLOR[d.n]+'">'+
   '<div class="hd"><span class="no">'+d.n+'</span><div class="tt"><div class="division-copy"><h2 class="nm" id="divisionTitle'+d.n+'" tabindex="-1">'+esc(L(d.t))+'</h2><div class="ds">'+esc(L(d.d))+'</div><p class="division-count">'+d.dept.length+' '+esc(W('departments'))+' · '+taskCount+' '+esc(W('responsibilities'))+'</p></div>'+
   '<div class="division-actions"><button type="button" class="head" data-head="'+d.n+'"><span class="lbl">'+esc(u('leader'))+'</span><span class="av">'+esc(ini(head))+'</span>'+esc(head||'—')+' ✎</button>'+
   '<button type="button" class="open-l" data-open-div="'+d.n+'">'+esc(u('open'))+'</button></div></div></div>'+
   '<div class="bd"><div class="department-grid">'+body+'</div><button type="button" class="secondary-action add-department" data-add-dept="'+d.n+'">'+esc(W('addDept'))+'</button><div class="foot-boxes">'+
   '<div class="fbox vfp"><div class="fl">'+esc(u('vfp'))+'</div>'+esc(L(d.vfp))+'</div>'+
   '<div class="fbox kpi"><div class="fl">'+esc(u('kpi'))+'</div>'+d.kpi.map(function(k){return '<div class="k">'+esc(L(k))+'</div>';}).join('')+'</div>'+
   '<div class="fbox out"><div class="fl">'+esc(u('output'))+'</div>'+esc(L(d.out))+'</div>'+
   '</div></div></section>';
 }).join('');
 renderDivisionNavigation();
};

function currentChecks(){
 var checks=boardModel==='m1'?UI[appLang].checks.slice():MT().checks[boardModel].slice();
 checks[0]=boardCounts();checks[1]=W('initial');return checks;
}
function boardCounts(){
 var all=activeDivisions(),depts=0,tasks=0;
 all.forEach(function(d){depts+=d.dept.length;d.dept.forEach(function(dp){tasks+=entries(d.n,dp).filter(function(e){return !(stored(d.n+'|'+dp.code+'|'+e.id)||{}).deleted;}).length;});});
 return all.length+' '+W('divisions')+' · '+depts+' '+W('departments')+' · '+tasks+' '+W('responsibilities');
}
renderStatic=function(){
 var ui=UI[appLang],mt=MT();
 document.documentElement.lang=appLang;
 document.title=ui.brand+' — '+mt.labels[boardModel]+' | RED ASSISTANCE';
 document.getElementById('pageTitle').textContent=ui.brand;
 document.getElementById('backLabel').textContent=ui.back;
 document.getElementById('brandSub').textContent=ui.brand;
 document.getElementById('pageSub').textContent=boardCounts();
 var check=function(t){return '<div class="ck"><span style="color:var(--ok);font-weight:800">✓</span>'+esc(t)+'</div>';};
 var cyc=ui.cycleNames.map(function(t,i){return (i?'<span class="a">→</span>':'')+'<div class="n"><span class="c">'+(i+1)+'</span>'+esc(t)+'</div>';}).join('');
 document.getElementById('info').innerHTML=
  '<div class="ibox"><h3>'+esc(ui.principle)+'</h3>'+currentChecks().map(check).join('')+'</div>'+
  '<div class="ibox"><h3>'+esc(ui.cycle)+'</h3><div class="cyc">'+cyc+'</div></div>'+
  '<div class="ibox"><h3>'+esc(ui.discipline)+'</h3>'+ui.disc.map(check).join('')+'</div>';
 var b=BOARD_UI[appLang];
 document.getElementById('boardMode').textContent=b.mode;
 document.getElementById('boardHint').textContent=mt.labels[boardModel];
 document.getElementById('zoomFit').textContent=b.fit;
 document.getElementById('zoomOut').title=b.zoomOut;
 document.getElementById('zoomIn').title=b.zoomIn;
 document.getElementById('goal').innerHTML=ui.goal;
 document.getElementById('modelSwitch').setAttribute('aria-label',mt.labels[boardModel]);
 document.getElementById('standaloneModelName').textContent=mt.labels[boardModel];

 var source=boardModel==='m2'?'<a href="'+WISE_PAGE+'" target="_blank" rel="noopener">'+esc(mt.source)+' ↗</a>':'';
 document.getElementById('modelContext').innerHTML='<span><b>'+esc(mt.modelBadge)+':</b> '+esc(mt.notes[boardModel])+' '+esc(W('local'))+'</span>'+source;
 document.querySelectorAll('[data-app-lang]').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-app-lang')===appLang);x.setAttribute('aria-pressed',String(x.getAttribute('data-app-lang')===appLang));});
 applyBrowserLayout();
};

var taskDraft=null,taskBaseline='',departmentDraft=null,departmentBaseline='',dialogReturn=null,previousFocus=null;
function byId(id){return document.getElementById(id);}
function showError(id,message){var el=byId(id);el.textContent=message||'';el.hidden=!message;if(message)el.scrollIntoView({block:'nearest'});}
function prepareRecord(r,k,task){
 ensureDetail(r,k);
 r.titles=r.titles||{};
 ['ro','hu','en'].forEach(function(lang){if(r.titles[lang]===undefined)r.titles[lang]=task&&task.custom?((task.title||{})[lang]||''):taskTitle(task,lang);});
 if(!Array.isArray(r.orders))r.orders=[];
 if(r.reviewer===undefined)r.reviewer='';
 return r;
}
function captureOrders(){
 if(!taskDraft)return;
 byId('pmOrders').querySelectorAll('[data-order-id]').forEach(function(el){
  var order=taskDraft.record.orders.find(function(o){return o.id===el.getAttribute('data-order-id');});if(!order)return;
  var value=function(field){return el.querySelector('[data-order-field="'+field+'"]').value;};
  order.titles[pmLang]=value('title').trim();order.results[pmLang]=value('result');
  order.assignee=value('assignee').trim();order.issuer=value('issuer').trim();order.reviewer=value('reviewer').trim();
  order.due=value('due');order.status=value('status');
 });
}
saveModalLang=function(){
 if(!taskDraft)return;
 var r=taskDraft.record,x=r.lang[pmLang];
 r.titles[pmLang]=byId('pmTaskName').value.trim();
 x.purpose=byId('pmPurpose').value;x.final=byId('pmFinal').value;x.evaluation=byId('pmEvaluation').value;x.job=byId('pmJob').value;
 x.kpis=[];x.targets=[];for(var i=1;i<=4;i++){x.kpis.push(byId('pmKpi'+i).value);x.targets.push(byId('pmTarget'+i).value);}
 r.who=byId('pmWho').value.trim();r.assigned=byId('pmAssigned').value.trim();r.reviewer=byId('pmReviewer').value.trim();
 captureOrders();
};
function orderField(label,name,value,type,wide){
 var input=type==='textarea'?'<textarea data-order-field="'+name+'">'+esc(value||'')+'</textarea>':'<input data-order-field="'+name+'" type="'+(type||'text')+'" value="'+esc(value||'')+'">';
 return '<label'+(wide?' class="wide"':'')+'>'+esc(label)+input+'</label>';
}
function renderOrders(){
 if(!taskDraft)return;
 var orders=taskDraft.record.orders;
 byId('pmOrders').innerHTML=orders.length?orders.map(function(o,i){
  var title=o.titles[appLang]||W('unnamed');
  return '<details class="work-item" data-order-id="'+esc(o.id)+'" open><summary>'+String(i+1)+'. '+esc(title)+'<div class="work-meta">'+esc(o.assignee||W('unassigned'))+' · '+esc(W(o.status))+'</div></summary><div class="work-fields">'+
   orderField(W('orderName'),'title',o.titles[appLang],'text',true)+
   orderField(W('assignee'),'assignee',o.assignee)+orderField(W('issuer'),'issuer',o.issuer)+
   orderField(W('due'),'due',o.due,'date')+
   '<label>'+esc(W('status'))+'<select data-order-field="status">'+['open','doing','done','verified'].map(function(state){return '<option value="'+state+'"'+(o.status===state?' selected':'')+'>'+esc(W(state))+'</option>';}).join('')+'</select></label>'+
   orderField(W('checkBy'),'reviewer',o.reviewer)+orderField(W('result'),'result',o.results[appLang],'textarea',true)+
   '</div><button type="button" class="secondary-action" data-remove-order="'+esc(o.id)+'">'+esc(W('removeOrder'))+'</button></details>';
 }).join(''):'<p class="empty-state">'+esc(W('empty'))+'</p>';
}
loadModalLang=function(){
 if(!taskDraft)return;
 pmLang=appLang;
 var r=taskDraft.record,x=r.lang[pmLang],t=PMTXT[pmLang];
 byId('pmTitle').textContent=r.titles[pmLang]||W('newTask');
 byId('pmDep').textContent=UI[pmLang].card+pmDiv+' · '+taskDraft.code;
 byId('pmNo').textContent=taskDraft.code;
 byId('pmTaskName').value=r.titles[pmLang]||'';
 byId('lblTaskName').textContent=W('taskName')+' *';byId('pmLanguageNote').textContent=W('languageNote');
 byId('pmPurpose').value=x.purpose||'';byId('pmFinal').value=x.final||'';byId('pmWho').value=r.who||'';byId('pmAssigned').value=r.assigned||'';byId('pmReviewer').value=r.reviewer||'';
 byId('pmEvaluation').value=x.evaluation||'';byId('pmJob').value=x.job||'';
 for(var i=1;i<=4;i++){
  byId('pmKpi'+i).value=x.kpis[i-1]||'';byId('pmTarget'+i).value=x.targets[i-1]||'';
  byId('pmKpi'+i).placeholder=t.indicator+' '+i;byId('pmTarget'+i).placeholder=t.target;
  byId('pmKpi'+i).setAttribute('aria-label',t.indicator+' '+i);byId('pmTarget'+i).setAttribute('aria-label',t.target+' '+i);
 }
 byId('lblPurpose').childNodes[0].nodeValue=t.purpose;byId('hintPurpose').textContent=t.purposeHint;
 byId('lblFinal').childNodes[0].nodeValue=t.final;byId('hintFinal').textContent=t.finalHint;
 byId('secResp').textContent=t.responsibility;byId('lblMain').textContent=W('owner')+' *';
 byId('lblAssigned').childNodes[0].nodeValue=W('executor');byId('hintAssigned').textContent=W('executorHint');byId('lblReviewer').textContent=W('reviewer');
 byId('lblEval').childNodes[0].nodeValue=t.evaluation;byId('hintEval').textContent=t.evaluationHint;
 byId('lblJob').childNodes[0].nodeValue=t.job;byId('hintJob').textContent=t.jobHint;
 byId('kpiNote').textContent=MT().notes[boardModel]+' '+W('local');
 byId('pmSave').textContent=t.save;byId('pmCancel').textContent=W('cancel');
 ['pmWho','pmAssigned','pmReviewer'].forEach(function(id){byId(id).placeholder=t.name;});
 byId('pmWho').required=true;byId('pmX').setAttribute('aria-label',EXTRA[appLang].close);
 byId('pmOrdersTitle').textContent=W('orders');byId('pmOrdersHint').textContent=W('ordersHint');byId('pmAddOrder').textContent=W('addOrder');
 byId('pmDefaultsLabel').textContent=B('defaults');byId('pmDefinitionLabel').textContent=B('jobDetails');
 byId('pmBack').setAttribute('lang',appLang);renderOrders();showError('pmError','');
};
function startTaskEditor(draft){
 previousFocus=document.activeElement;
 dialogReturn=byId('moduleBack').classList.contains('open')&&activeModule?copy(activeModule):null;
 byId('moduleBack').classList.remove('open');
 taskDraft=draft;pmCur=draft.key;pmDiv=draft.n;
 loadModalLang();saveModalLang();taskBaseline=JSON.stringify(taskDraft.record);
 byId('pmBack').classList.add('open');byId('pmTaskName').focus();
}
openModal=function(k,divn){
 var f=findTask(k);if(!f||(stored(k)||{}).deleted)return;
 startTaskEditor({key:k,n:Number(divn),code:f.department.code,isNew:false,record:prepareRecord(copy(stored(k)||{}),k,f.task)});
};
openNewTask=function(n,code){
 var d=activeDivisions().find(function(x){return x.n===n;});if(!d||!d.dept.some(function(x){return x.code===code;}))return;
 var r={who:'',assigned:'',reviewer:'',titles:emptyLanguages(),orders:[],lang:{}};
 ['ro','hu','en'].forEach(function(lang){r.lang[lang]={purpose:'',final:'',evaluation:'',job:'',kpis:['','','',''],targets:['','','','']};});
 startTaskEditor({key:n+'|'+code+'|'+uid('task'),n:n,code:code,isNew:true,record:r});
};
function closeTask(force){
 if(taskDraft&&!force){saveModalLang();if(JSON.stringify(taskDraft.record)!==taskBaseline&&!confirm(W('discard')))return false;}
 byId('pmBack').classList.remove('open');taskDraft=null;pmCur=null;
 var ret=dialogReturn;dialogReturn=null;
 if(ret)openModule(ret.n,ret.code);else if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
 return true;
}
byId('pmX').onclick=function(){closeTask(false);};
byId('pmCancel').onclick=function(){closeTask(false);};
byId('pmAddOrder').onclick=function(){
 saveModalLang();if(!taskDraft)return;
 var r=taskDraft.record;
 r.orders.push({id:uid('work'),titles:emptyLanguages(),results:emptyLanguages(),assignee:r.assigned||'',issuer:r.who||'',reviewer:r.reviewer||'',due:'',status:'open'});
 renderOrders();var all=byId('pmOrders').querySelectorAll('[data-order-field="title"]');if(all.length)all[all.length-1].focus();
};
byId('pmOrders').onclick=function(e){
 var remove=e.target.closest('[data-remove-order]');if(!remove||!taskDraft)return;
 if(!confirm(W('removeAsk')))return;
 saveModalLang();taskDraft.record.orders=taskDraft.record.orders.filter(function(o){return o.id!==remove.getAttribute('data-remove-order');});renderOrders();
};
function hasText(map){return map&&Object.keys(map).some(function(lang){return typeof map[lang]==='string'&&map[lang].trim();});}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;var date=new Date(value+'T12:00:00Z');return !isNaN(date)&&date.toISOString().slice(0,10)===value;}
byId('pmSave').onclick=function(){
 if(!taskDraft)return;saveModalLang();var r=taskDraft.record;
 if(!hasText(r.titles)||!r.who){showError('pmError',W('required'));return;}
 for(var i=0;i<r.orders.length;i++){
  var order=r.orders[i],error=!hasText(order.titles)||!order.assignee||!validDate(order.due)?'orderRequired':order.status==='verified'&&(!order.reviewer||!hasText(order.results))?'verifyRequired':null;
  if(error){showError('pmError',(i+1)+'. '+W(error));return;}
 }
 var ok=commitChange(function(){
  if(taskDraft.isNew){var c=rec('custom|'+taskDraft.n+'|'+taskDraft.code);c.list=c.list||[];c.list.push({id:taskDraft.key.split('|')[2],custom:true,title:copy(r.titles)});}
  ST.store[scopedKey(taskDraft.key)]=copy(r);
 });
 if(!ok){showError('pmError',W('saveError'));return;}
 render();closeTask(true);
};
[['lblPurpose','pmPurpose'],['lblFinal','pmFinal'],['lblMain','pmWho'],['lblAssigned','pmAssigned'],['lblEval','pmEvaluation'],['lblJob','pmJob']].forEach(function(pair){byId(pair[0]).setAttribute('for',pair[1]);});

showModule=function(title,html){
 document.getElementById('moduleTitle').textContent=title;
 document.getElementById('moduleBody').innerHTML='<p class="demo-note">'+esc(MT().notes[boardModel])+'</p>'+html;
 document.getElementById('moduleClose').title=EXTRA[appLang].close;
 document.getElementById('moduleClose').setAttribute('aria-label',EXTRA[appLang].close);
 document.getElementById('moduleBack').setAttribute('lang',appLang);
 document.getElementById('moduleBack').classList.add('open');
 document.getElementById('moduleClose').focus();
};
openModule=function(n,code){
 var d=activeDivisions().find(function(x){return x.n===Number(n);});
 if(!d)return;
 var dp=code?d.dept.find(function(x){return x.code===code;}):null,mt=MT();
 if(code&&!dp)return;
 activeModule={n:Number(n),code:code||null};
 var owner=dp?personName('dept|'+dp.code,personName('head|'+d.n,d.head)):personName('head|'+d.n,d.head);
 var ownerButton=dp?
  '<button type="button" data-dept-head="'+dp.code+'">'+esc(owner||'—')+' ✎</button>':
  '<button type="button" data-head="'+d.n+'">'+esc(owner||'—')+' ✎</button>';
 var html='<h3>'+esc(mt.modulePurpose)+'</h3><p>'+esc(L(dp?(dp.purpose||d.d):d.d))+'</p>'+
  '<h3>'+esc(dp?mt.deptLeader:mt.divisionLeader)+'</h3>'+ownerButton+
  '<h3>'+esc(mt.moduleResult)+'</h3><p>'+esc(dp?departmentResult(d,dp,appLang):L(d.vfp))+'</p>';
 if(dp){
  var tasks=entries(d.n,dp);
  html+='<button type="button" class="secondary-action" data-edit-dept="'+dp.code+'">'+esc(W('editDept'))+'</button>';
  html+='<h3>'+esc(mt.moduleTasks)+'</h3>';
  tasks.forEach(function(entry){
   var key=d.n+'|'+dp.code+'|'+entry.id,r=stored(key)||{},title=cardTitle(key,entry.task);
   if(r.deleted)return;
   html+='<button type="button" data-card-key="'+esc(key)+'" data-card-task="'+esc(title)+'" data-card-div="'+d.n+'">'+esc(title)+' →</button>';
  });
  html+='<button type="button" class="primary-action" data-add="'+d.n+'|'+dp.code+'">'+esc(W('addTask'))+'</button>';
 }else{
  html+='<h3>'+esc(mt.moduleDepartments)+'</h3>'+d.dept.map(function(x){return '<button type="button" data-department="'+x.code+'">'+x.code+' · '+esc(deptTitle(x))+' →</button>';}).join('');
  html+='<button type="button" class="primary-action" data-add-dept="'+d.n+'">'+esc(W('addDept'))+'</button>';
 }
 html+='<h3>'+esc(mt.moduleKpi)+'</h3><p>'+(dp?(dp.kpis||d.kpi||[]):d.kpi).map(function(x){return esc(L(x));}).join('<br>')+'</p>';
 if(!dp)html+='<h3>'+esc(u('output'))+'</h3><p>'+esc(L(d.out))+'</p>';
 if(boardModel==='m2')html+='<p><a href="'+WISE_PDF+'" target="_blank" rel="noopener" style="color:var(--red);font-weight:700;text-decoration:underline">'+esc(mt.source)+' — PDF ↗</a></p>';
 showModule((code?code+' · '+deptTitle(dp):n+' · '+L(d.t)),html);
};

function departmentResult(d,dp,lang){
 if(dp.vfp!==undefined)return L(dp.vfp,lang);
 if(boardModel==='m1'&&OUTPUTS[dp.code])return OUTPUTS[dp.code][['ro','hu','en'].indexOf(lang)];
 return L(d.vfp,lang);
}
function captureDepartment(){
 if(!departmentDraft)return;
 var r=departmentDraft.record,lang=departmentDraft.lang;
 r.t[lang]=byId('departmentName').value.trim();r.purpose[lang]=byId('departmentPurpose').value;
 r.vfp[lang]=byId('departmentResult').value;r.kpiText[lang]=byId('departmentKpis').value;
 departmentDraft.owner=byId('departmentOwner').value.trim();
}
function departmentSnapshot(){return departmentDraft?JSON.stringify({record:departmentDraft.record,owner:departmentDraft.owner}):'';}
function departmentField(label,id,value,multiline){
 return '<div class="pm-fl"><label for="'+id+'">'+esc(label)+'</label>'+(multiline?'<textarea id="'+id+'">'+esc(value||'')+'</textarea>':'<input id="'+id+'" value="'+esc(value||'')+'">')+'</div>';
}
function renderDepartmentEditor(){
 if(!departmentDraft)return;
 var r=departmentDraft.record;departmentDraft.lang=appLang;
 var html='<p>'+esc(departmentDraft.code)+' · '+esc(W('initial'))+'</p><p class="pm-note">'+esc(W('languageNote'))+'</p>'+
  departmentField(W('deptName')+' *','departmentName',r.t[appLang])+
  departmentField(MT().deptLeader,'departmentOwner',departmentDraft.owner)+
  departmentField(MT().modulePurpose,'departmentPurpose',r.purpose[appLang],true)+
  departmentField(MT().moduleResult,'departmentResult',r.vfp[appLang],true)+
  departmentField(MT().moduleKpi+' — '+W('onePerLine'),'departmentKpis',r.kpiText[appLang],true)+
  '<p id="departmentError" class="form-error" role="alert" hidden></p>'+
  '<div class="module-actions"><button type="button" class="secondary-action" data-cancel-dept>'+esc(W('cancel'))+'</button>'+
  '<button type="button" class="primary-action" data-save-dept>'+esc(PMTXT[appLang].save)+'</button></div>';
 showModule(W(departmentDraft.isNew?'newDept':'editDept'),html);
 byId('departmentName').required=true;byId('departmentName').maxLength=240;
}
function openDepartmentEditor(n,code){
 var d=activeDivisions().find(function(x){return x.n===Number(n);});if(!d)return;
 var dp=code?d.dept.find(function(x){return x.code===code;}):null;if(code&&!dp)return;
 var next=Math.max.apply(null,d.dept.map(function(x){return Number(x.code.split('.')[1])||0;}))+1;
 var draft={n:d.n,code:code||d.n+'.'+next,isNew:!dp,lang:appLang,owner:dp?personName('dept|'+code,personName('head|'+n,d.head)):'',record:{t:emptyLanguages(),purpose:emptyLanguages(),vfp:emptyLanguages(),kpiText:emptyLanguages()}};
 if(dp)['ro','hu','en'].forEach(function(lang){
  draft.record.t[lang]=dp.custom?(dp.t[lang]||''):deptTitle(dp,lang);
  draft.record.purpose[lang]=L(dp.purpose||d.d,lang);draft.record.vfp[lang]=departmentResult(d,dp,lang);
  draft.record.kpiText[lang]=(dp.kpis||d.kpi||[]).map(function(k){return L(k,lang);}).join('\n');
 });
 departmentDraft=draft;activeModule={kind:'department-editor',n:d.n,code:code||null};
 renderDepartmentEditor();captureDepartment();departmentBaseline=departmentSnapshot();byId('departmentName').focus();
}
function closeDepartmentEditor(force){
 if(!departmentDraft)return true;
 captureDepartment();
 if(!force&&departmentSnapshot()!==departmentBaseline&&!confirm(W('discard')))return false;
 var old=departmentDraft;departmentDraft=null;openModule(old.n,old.isNew?null:old.code);return true;
}
function saveDepartment(){
 if(!departmentDraft)return;captureDepartment();
 var draft=departmentDraft,r=draft.record;
 if(!r.t[appLang]){showError('departmentError',W('deptRequired'));return;}
 var lines={};['ro','hu','en'].forEach(function(lang){lines[lang]=r.kpiText[lang].split('\n');});
 var count=Math.max(lines.ro.length,lines.hu.length,lines.en.length),kpis=[];
 for(var i=0;i<count;i++)kpis.push(M(lines.ro[i]||'',lines.hu[i]||'',lines.en[i]||''));
 var info={t:copy(r.t),purpose:copy(r.purpose),vfp:copy(r.vfp),kpis:kpis};
 var ok=commitChange(function(){
  if(draft.isNew){var list=rec('departments|'+draft.n);list.list=list.list||[];list.list.push(Object.assign({code:draft.code,li:[],custom:true},info));}
  else ST.store[scopedKey('department-info|'+draft.code)]=info;
  rec('dept|'+draft.code).name=draft.owner;
 });
 if(!ok){showError('departmentError',W('saveError'));return;}
 departmentDraft=null;render();openModule(draft.n,draft.code);
}
byId('moduleClose').onclick=function(){
 if(departmentDraft){closeDepartmentEditor(false);return;}
 byId('moduleBack').classList.remove('open');activeModule=null;
};

document.addEventListener('click',function(e){
 var addDept=e.target.closest('[data-add-dept]'),editDept=e.target.closest('[data-edit-dept]'),saveDept=e.target.closest('[data-save-dept]'),cancelDept=e.target.closest('[data-cancel-dept]');
 if(addDept){openDepartmentEditor(Number(addDept.getAttribute('data-add-dept')));return;}
 if(editDept){var editCode=editDept.getAttribute('data-edit-dept');openDepartmentEditor(Number(editCode.split('.')[0]),editCode);return;}
 if(saveDept){saveDepartment();return;}if(cancelDept){closeDepartmentEditor(false);return;}
 var dept=e.target.closest('[data-open-dept]'),div=e.target.closest('[data-open-div]'),leader=e.target.closest('[data-dept-head]');
 if(dept){openModule(Number(dept.getAttribute('data-open-dept').split('.')[0]),dept.getAttribute('data-open-dept'));return;}
 if(div){openModule(Number(div.getAttribute('data-open-div')));return;}
 if(leader){
  var code=leader.getAttribute('data-dept-head'),n=Number(code.split('.')[0]);
  var d=activeDivisions().find(function(x){return x.n===n;});
  editPerson('dept|'+code,personName('head|'+n,d?d.head:''));
  if(activeModule&&document.getElementById('moduleBack').classList.contains('open'))openModule(activeModule.n,activeModule.code);
 }
},false);
document.querySelectorAll('[data-app-lang]').forEach(function(btn){
 btn.onclick=function(){
  var taskOpen=pmCur&&document.getElementById('pmBack').classList.contains('open');
  if(taskOpen)saveModalLang();
  if(departmentDraft)captureDepartment();
  appLang=this.getAttribute('data-app-lang');
  savePreference('ra_org_lang',appLang);
  render();
  if(taskOpen)loadModalLang();
  if(departmentDraft)renderDepartmentEditor();
  else if(activeModule&&document.getElementById('moduleBack').classList.contains('open'))openModule(activeModule.n,activeModule.code);
 };
});
back.onclick=function(){openModule(1,'1.1');return false;};

document.addEventListener('keydown',function(e){
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('.li')){e.preventDefault();e.target.click();}
 // Keep keyboard focus in the currently open window.
 if(e.key!=='Tab')return;
 var dialog=byId('pmBack').classList.contains('open')?byId('pmBack'):byId('moduleBack').classList.contains('open')?byId('moduleBack'):null;
 if(!dialog)return;
 var focusable=Array.prototype.filter.call(dialog.querySelectorAll('button,input,textarea,select,summary,[tabindex="0"]'),function(el){return !el.disabled&&el.getClientRects().length;});
 if(!focusable.length)return;
 var first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
window.addEventListener('beforeunload',function(e){
 if(taskDraft)saveModalLang();if(departmentDraft)captureDepartment();
 if((taskDraft&&JSON.stringify(taskDraft.record)!==taskBaseline)||(departmentDraft&&departmentSnapshot()!==departmentBaseline)){e.preventDefault();e.returnValue='';}
});
window.ST=ST;window.render=render;window.renderGrid=(typeof renderGrid==='function'?renderGrid:null);window.persist=persist;window.commitChange=commitChange;window.setBoardZoom=setBoardZoom;window.boardZoom=boardZoom;if(!window.__SB_BOOT__){render();setBoardZoom(boardZoom);}
})();
