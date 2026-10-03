
var standaloneModel='m3';
var standaloneStorageKey='red_assistance_auto_service_board_v1';
var standalonePreferencePrefix='red_assistance_auto_service_';
var DIV=[
 {n:1,c:'#1E9D55',t:'Szervezet, HR és kommunikáció',d:'A megfelelő emberek megszerzése, dokumentálása, fejlesztése és együttműködésük biztosítása',head:'Denisa',link:'admin-core/index.html',
  dept:[{code:'1.1',t:'Administrare HR',li:['Planificare personal și registru','Contract de muncă și REGES','Recrutare, onboarding, dosar și încetare','Szerelői kérések elbírálása (szabadnap, szerszám, segítség)','Iroda-küldők jogosultságainak kezelése (tel_kuldo)','Munkalap kiadása és aláírás-nyilvántartás a telefonon (art. 243)']},
        {code:'1.2',t:'Képzés és teljesítmény',li:['Szakmai és vezetői képzés','Teljesítményértékelés','Karrier- és utánpótlás tervezés']},
        {code:'1.3',t:'Kommunikáció és fegyelem',li:['Belső kommunikáció','Szabályzatok és kultúra','Fegyelmi ügyek és munkatársi elkötelezettség','Telefonos dokumentumok kiadása és olvasottság követése (art. 243)']}],
  vfp:'Kompetens, dokumentált, szabálykövető és eredményes csapat',kpi:['Fluktuáció %','Személyi dokumentumok teljessége %','Képzési órák / fő','Munkatársi elkötelezettség','Telefonos dokumentum olvasottság %','Szerelői kérés átfutás (óra)'],out:'Felkészült és szabályosan dokumentált munkatársak minden divízió számára'},
 {n:2,c:'#2A6FDB',t:'Marketing és értékesítés',d:'Új ügyfelek szerzése és a bevétel növelése',head:'Farkas Anna',link:'Marketing.html',
  dept:[{code:'2.1',t:'Piackutatás és stratégia',li:['Piac- és versenytárs elemzés','Célcsoport meghatározás','Marketingstratégia']},
        {code:'2.2',t:'Értékesítés és ajánlat',li:['Kapcsolatépítés','Árajánlatok, tárgyalás','Értékesítés, megrendelés']},
        {code:'2.3',t:'Marketing és márkaépítés',li:['Reklám, online jelenlét','Rendezvények, promóciók','Márkaépítés, PR']}],
  vfp:'Új ügyfelek és megrendelések folyamatosan',kpi:['Új ügyfelek száma','Árbevétel növekedés %','Ajánlat → megrendelés arány'],out:'Megrendelések, ügyféligények a pénzügy és termelés felé'},
 {n:3,c:'#C08A2B',t:'Pénzügy és kontroll',d:'A pénzügyi erőforrások tervezése és kezelése',head:'Dima Victor',link:'Gazdasagi Platform.html',
  dept:[{code:'3.1',t:'Könyvelés és kontrolling',li:['Könyvelés, riportok','Költségkontroll, elemzések','Pénzügyi tervezés']},
        {code:'3.2',t:'Pénzkezelés és behajtás',li:['Cash-flow kezelés','Számlázás, követelés kezelés','Pénzbeszedés']},
        {code:'3.3',t:'Beszerzési pénzügyi kontroll',li:['Kifizetések ellenőrzése','Leltár- és eszköznyilvántartás','Biztosítások, adók']}],
  vfp:'Stabil pénzügyi helyzet és pontos információk',kpi:['Cash-flow','Követelés behajtási napok','Költségarány %'],out:'Pénzügyi források, jóváhagyott keretek a termelés felé'},
 {n:4,c:'#E8712B',t:'Termelés és szolgáltatás',d:'Az ügyfél számára értéket teremtő fő tevékenység',head:'Kovács Béla',link:'Admin Dashboard Demo.html',
  dept:[{code:'4.1',t:'Tervezés és előkészítés',li:['Munkatervezés','Anyag- és kapacitástervezés','Ütemezés','Telefonos feladatok kiosztása szerelőknek (Teendőim → telefon · nem mért munka)']},
        {code:'4.2',t:'Végrehajtás',li:['Javítás / gyártás / szolgáltatás','Erőforrások felhasználása','Folyamatirányítás','Telefonos feladatok elvégzése és visszaigazolása (szerelő telefon)','Munkalap átvétele és aláírása a telefonon (art. 243)']},
        {code:'4.3',t:'Logisztika és kiszállítás',li:['Raktár és anyagmozgatás','Késztermék / autó átadás','Szállítás, átvétel']}],
  vfp:'Minőségi munka, határidőre, ügyfél-elégedettséggel',kpi:['Termelékenység (óra / nap)','Határidő kész %','Munkák száma / hónap','Telefonos feladat átfutás (óra)','Visszaküldött feladatok aránya %'],out:'Kész munka, szolgáltatás átadása az ügyfélnek'},
 {n:5,c:'#6B5BA8',t:'Minőség, képzés és korrekció',d:'A minőség fenntartása és folyamatos fejlesztés',head:'Marincaș Elena',link:'index.html#ai',
  dept:[{code:'5.1',t:'Minőségellenőrzés',li:['Bejövő és kimenő ellenőrzés','Munkafolyamat ellenőrzés','Végső minőségbiztosítás']},
        {code:'5.2',t:'Képzés és szabványok',li:['Belső képzések','Szabványok, eljárások','Tudásmenedzsment']},
        {code:'5.3',t:'Hibakezelés és korrekció',li:['Reklamációk kezelése','Okfeltárás, javító intézkedés','Folyamatos fejlesztés (PDCA)']}],
  vfp:'Hibamentes működés és folyamatos fejlődés',kpi:['Hibaarány %','Reklamációk száma','Fejlesztési intézkedések száma'],out:'Minősített folyamatok és javított rendszerek'},
 {n:6,c:'#1E8A8A',t:'Ügyfélkapcsolat, terjeszkedés és új piacok',d:'Ügyfelek megtartása, új piacok és hosszú távú kapcsolatok',head:'Popescu Andrei',link:'Ertekesites.html',
  dept:[{code:'6.1',t:'Ügyfélszolgálat',li:['Ügyféltámogatás','Információ, kapcsolattartás','Panaszkezelés']},
        {code:'6.2',t:'Ügyfélmegtartás',li:['Hűségprogramok','Utánkövetés, visszajelzések','Ügyfél-elégedettség']},
        {code:'6.3',t:'Terjeszkedés és partnerek',li:['Új szolgáltatások, piacok','Partnerkapcsolatok','Stratégiai együttműködések']}],
  vfp:'Hosszú távú ügyfelek és növekvő piaci jelenlét',kpi:['Ügyfél-megtartási arány','Ismételt munkák aránya','Új piacok / partnerek száma'],out:'Ügyfélvisszajelzés, piacinformáció az egész vállalat felé'}
];
var DIV7={n:7,t:'Ügyvezetés, stratégia és irányítás',d:'A vállalat egységének fenntartása és irányítása',head:'Szabó Zoltán',link:'Cegvezetes.html',
  tasks:['Stratégia, célok, döntések','Szervezeti egység és kultúra','Erőforrások jóváhagyása','Teljesítmény áttekintése','Telefonos csatorna működésének felülvizsgálata (havi riport)'],
  vfp:'Világos irány, erős szervezet és fenntartható növekedés',kpi:['Vállalati eredmény','Növekedés (%)','Ügyfél-elégedettség','Munkatársi elkötelezettség']};

var appLang=readPreference('ra_org_lang','hu');
var UI={
 ro:{title:'RED ASSISTANCE — Tablă de organizare',back:'Predare HR',brand:'Tablă de organizare',sub:'Sistem organizațional cu 7 divizii · 21 departamente · circuit închis 1→2→3→4→5→6',leader:'DIR.',open:'Deschide modulul →',mainTasks:'Sarcini principale',vfp:'Produs final valoros (VFP)',kpi:'Indicatori principali (KPI)',output:'Ieșire principală / predare',add:'+ Responsabilitate',filled:'Fișă de rezultat completată',status:'stare',remove:'Ștergere',deleteAsk:'Ștergi această responsabilitate?',newTask:'Responsabilitate nouă (sarcină):',leaderName:'Numele conducătorului:',card:'Fișa rezultatului · Divizia ',principle:'Principiul de funcționare',cycle:'Ciclul operațional de bază (1→2→3→4→5→6)',discipline:'Disciplina de conducere',checks:['7 divizii — 21 departamente','Fiecare divizie are 3 departamente','Fiecare departament are responsabil, VFP și KPI','Sistemul are circuit închis: 1→2→3→4→5→6','Divizia 7 coordonează întregul sistem'],disc:['Rapoarte statistice săptămânale de la fiecare departament','Revizuire lunară de management','Problemă → Cauză → Soluție → Verificare','Îmbunătățire continuă (Kaizen)'],cycleNames:['Oameni','Nevoia clientului','Aprobare financiară','Execuție','Calitate','Satisfacția clientului'],goal:'SCOP: <b>CALITATE</b> — <b>EFICIENȚĂ</b> — <b>SATISFACȚIA CLIENTULUI</b> — <b>CREȘTERE PROFITABILĂ</b>'},
 hu:{title:'RED ASSISTANCE — Szervezési tábla',back:'HR átadás',brand:'Szervezési tábla',sub:'7 divíziós vállalatszervezeti rendszer · 21 osztály · zárt kör 1→2→3→4→5→6',leader:'VEZ.',open:'Modul megnyitása →',mainTasks:'Fő feladatok',vfp:'Értékes végtermék (VFP)',kpi:'Fő mutatók (KPI)',output:'Fő kimenet / továbbadás',add:'+ Felelősség',filled:'Kitöltött eredménykártya',status:'állapot',remove:'Törlés',deleteAsk:'Törlöd ezt a felelősséget?',newTask:'Új felelősség (feladat):',leaderName:'Osztályvezető neve:',card:'Eredménykártya · Divízió ',principle:'Működési elv',cycle:'Alap működési ciklus (1→2→3→4→5→6)',discipline:'Irányítási fegyelem',checks:['7 divízió — 21 osztály','Minden divízió 3 osztályból áll','Minden osztálynak van felelőse, VFP-je és KPI-ja','A rendszer zárt körű: 1→2→3→4→5→6','A 7. divízió felülről hangolja össze az egész rendszert'],disc:['Heti statisztikai jelentések minden osztálytól','Havi vezetői felülvizsgálat','Probléma → Ok → Megoldás → Ellenőrzés','Folyamatos fejlesztés (Kaizen)'],cycleNames:['Emberek','Ügyféligény','Pénzügyi jóváhagyás','Megvalósítás','Minőség','Ügyfél-elégedettség'],goal:'CÉL: <b>MINŐSÉG</b> — <b>HATÉKONYSÁG</b> — <b>ÜGYFÉLELÉGEDETTSÉG</b> — <b>NYERESÉGES NÖVEKEDÉS</b>'},
 en:{title:'RED ASSISTANCE — Organizing Board',back:'HR handover',brand:'Organizing Board',sub:'7-division organizational system · 21 departments · closed loop 1→2→3→4→5→6',leader:'LEAD',open:'Open module →',mainTasks:'Main tasks',vfp:'Valuable final product (VFP)',kpi:'Main indicators (KPI)',output:'Main output / handover',add:'+ Responsibility',filled:'Completed result card',status:'status',remove:'Delete',deleteAsk:'Delete this responsibility?',newTask:'New responsibility (task):',leaderName:'Department leader name:',card:'Result card · Division ',principle:'Operating principle',cycle:'Core operating cycle (1→2→3→4→5→6)',discipline:'Management discipline',checks:['7 divisions — 21 departments','Each division has 3 departments','Every department has an owner, VFP and KPI','The system is a closed loop: 1→2→3→4→5→6','Division 7 coordinates the entire system'],disc:['Weekly statistical reports from every department','Monthly management review','Problem → Cause → Solution → Verification','Continuous improvement (Kaizen)'],cycleNames:['People','Customer need','Financial approval','Execution','Quality','Customer satisfaction'],goal:'GOAL: <b>QUALITY</b> — <b>EFFICIENCY</b> — <b>CUSTOMER SATISFACTION</b> — <b>PROFITABLE GROWTH</b>'}
};
if(!UI[appLang])appLang='ro';
var TR={ro:{
'Szervezet, HR és kommunikáció':'Organizare, HR și comunicare','A megfelelő emberek megszerzése, dokumentálása, fejlesztése és együttműködésük biztosítása':'Asigurarea oamenilor potriviți, documentarea și dezvoltarea lor și susținerea colaborării','Képzés és teljesítmény':'Formare și performanță','Szakmai és vezetői képzés':'Formare profesională și managerială','Teljesítményértékelés':'Evaluarea performanței','Karrier- és utánpótlás tervezés':'Planificarea carierei și a succesiunii','Kommunikáció és fegyelem':'Comunicare și disciplină','Belső kommunikáció':'Comunicare internă','Szabályzatok és kultúra':'Regulamente și cultură','Fegyelmi ügyek és munkatársi elkötelezettség':'Cazuri disciplinare și implicarea angajaților','Kompetens, dokumentált, szabálykövető és eredményes csapat':'Echipă competentă, documentată, disciplinată și performantă','Fluktuáció %':'Rata fluctuației %','Személyi dokumentumok teljessége %':'Documente de personal complete %','Képzési órák / fő':'Ore de formare / persoană','Munkatársi elkötelezettség':'Implicarea angajaților','Felkészült és szabályosan dokumentált munkatársak minden divízió számára':'Angajați pregătiți și documentați conform pentru toate diviziile',
'Marketing és értékesítés':'Marketing și vânzări','Új ügyfelek szerzése és a bevétel növelése':'Atragerea de clienți noi și creșterea veniturilor','Piackutatás és stratégia':'Cercetare de piață și strategie','Piac- és versenytárs elemzés':'Analiza pieței și a concurenței','Célcsoport meghatározás':'Definirea grupului țintă','Marketingstratégia':'Strategie de marketing','Értékesítés és ajánlat':'Vânzări și ofertare','Kapcsolatépítés':'Dezvoltarea relațiilor','Árajánlatok, tárgyalás':'Oferte și negociere','Értékesítés, megrendelés':'Vânzare și comandă','Marketing és márkaépítés':'Marketing și dezvoltarea mărcii','Reklám, online jelenlét':'Publicitate și prezență online','Rendezvények, promóciók':'Evenimente și promoții','Márkaépítés, PR':'Dezvoltarea mărcii și PR','Új ügyfelek és megrendelések folyamatosan':'Flux continuu de clienți noi și comenzi','Új ügyfelek száma':'Număr de clienți noi','Árbevétel növekedés %':'Creșterea veniturilor %','Ajánlat → megrendelés arány':'Rata ofertă → comandă','Megrendelések, ügyféligények a pénzügy és termelés felé':'Comenzi și cerințe ale clienților transmise către financiar și producție',
'Pénzügy és kontroll':'Finanțe și control','A pénzügyi erőforrások tervezése és kezelése':'Planificarea și gestionarea resurselor financiare','Könyvelés és kontrolling':'Contabilitate și controlling','Könyvelés, riportok':'Contabilitate și rapoarte','Költségkontroll, elemzések':'Controlul costurilor și analize','Pénzügyi tervezés':'Planificare financiară','Pénzkezelés és behajtás':'Gestionarea numerarului și recuperarea creanțelor','Cash-flow kezelés':'Gestionarea fluxului de numerar','Számlázás, követelés kezelés':'Facturare și gestionarea creanțelor','Pénzbeszedés':'Încasări','Beszerzési pénzügyi kontroll':'Control financiar al achizițiilor','Kifizetések ellenőrzése':'Controlul plăților','Leltár- és eszköznyilvántartás':'Evidența inventarului și activelor','Biztosítások, adók':'Asigurări și taxe','Stabil pénzügyi helyzet és pontos információk':'Situație financiară stabilă și informații exacte','Cash-flow':'Flux de numerar','Követelés behajtási napok':'Zile de recuperare a creanțelor','Költségarány %':'Rata costurilor %','Pénzügyi források, jóváhagyott keretek a termelés felé':'Resurse financiare și bugete aprobate pentru producție',
'Termelés és szolgáltatás':'Producție și servicii','Az ügyfél számára értéket teremtő fő tevékenység':'Activitatea principală care creează valoare pentru client','Tervezés és előkészítés':'Planificare și pregătire','Munkatervezés':'Planificarea lucrărilor','Anyag- és kapacitástervezés':'Planificarea materialelor și capacității','Ütemezés':'Programare','Végrehajtás':'Execuție','Javítás / gyártás / szolgáltatás':'Reparație / producție / serviciu','Erőforrások felhasználása':'Utilizarea resurselor','Folyamatirányítás':'Managementul proceselor','Logisztika és kiszállítás':'Logistică și livrare','Raktár és anyagmozgatás':'Depozit și manipularea materialelor','Késztermék / autó átadás':'Predarea produsului finit / vehiculului','Szállítás, átvétel':'Transport și recepție','Minőségi munka, határidőre, ügyfél-elégedettséggel':'Lucrare de calitate, la termen, cu satisfacția clientului','Termelékenység (óra / nap)':'Productivitate (ore / zi)','Határidő kész %':'Finalizat la termen %','Munkák száma / hónap':'Număr de lucrări / lună','Kész munka, szolgáltatás átadása az ügyfélnek':'Lucrare sau serviciu finalizat și predat clientului',
'Minőség, képzés és korrekció':'Calitate, formare și corecție','A minőség fenntartása és folyamatos fejlesztés':'Menținerea calității și îmbunătățirea continuă','Minőségellenőrzés':'Controlul calității','Bejövő és kimenő ellenőrzés':'Control la intrare și la ieșire','Munkafolyamat ellenőrzés':'Controlul fluxului de lucru','Végső minőségbiztosítás':'Asigurarea finală a calității','Képzés és szabványok':'Formare și standarde','Belső képzések':'Formări interne','Szabványok, eljárások':'Standarde și proceduri','Tudásmenedzsment':'Managementul cunoștințelor','Hibakezelés és korrekció':'Gestionarea erorilor și corecție','Reklamációk kezelése':'Gestionarea reclamațiilor','Okfeltárás, javító intézkedés':'Analiza cauzei și acțiune corectivă','Folyamatos fejlesztés (PDCA)':'Îmbunătățire continuă (PDCA)','Hibamentes működés és folyamatos fejlődés':'Funcționare fără erori și dezvoltare continuă','Hibaarány %':'Rata erorilor %','Reklamációk száma':'Număr de reclamații','Fejlesztési intézkedések száma':'Număr de acțiuni de îmbunătățire','Minősített folyamatok és javított rendszerek':'Procese validate și sisteme îmbunătățite',
'Ügyfélkapcsolat, terjeszkedés és új piacok':'Relații cu clienții, extindere și piețe noi','Ügyfelek megtartása, új piacok és hosszú távú kapcsolatok':'Păstrarea clienților, dezvoltarea piețelor noi și a relațiilor pe termen lung','Ügyfélszolgálat':'Serviciu clienți','Ügyféltámogatás':'Asistență pentru clienți','Információ, kapcsolattartás':'Informare și comunicare','Panaszkezelés':'Gestionarea sesizărilor','Ügyfélmegtartás':'Fidelizarea clienților','Hűségprogramok':'Programe de fidelizare','Utánkövetés, visszajelzések':'Urmărire și feedback','Ügyfél-elégedettség':'Satisfacția clienților','Terjeszkedés és partnerek':'Extindere și parteneri','Új szolgáltatások, piacok':'Servicii și piețe noi','Partnerkapcsolatok':'Relații cu partenerii','Stratégiai együttműködések':'Colaborări strategice','Hosszú távú ügyfelek és növekvő piaci jelenlét':'Clienți pe termen lung și prezență în creștere pe piață','Ügyfél-megtartási arány':'Rata de retenție a clienților','Ismételt munkák aránya':'Rata lucrărilor repetate','Új piacok / partnerek száma':'Număr de piețe / parteneri noi','Ügyfélvisszajelzés, piacinformáció az egész vállalat felé':'Feedback de la clienți și informații de piață pentru întreaga companie',
'Ügyvezetés, stratégia és irányítás':'Conducere, strategie și coordonare','A vállalat egységének fenntartása és irányítása':'Menținerea unității și conducerii companiei','Stratégia, célok, döntések':'Strategie, obiective și decizii','Szervezeti egység és kultúra':'Unitate organizațională și cultură','Erőforrások jóváhagyása':'Aprobarea resurselor','Teljesítmény áttekintése':'Revizuirea performanței','Világos irány, erős szervezet és fenntartható növekedés':'Direcție clară, organizație puternică și creștere sustenabilă','Vállalati eredmény':'Rezultatul companiei','Növekedés (%)':'Creștere (%)'
},hu:{'Administrare HR':'HR-adminisztráció','Planificare personal și registru':'Létszámtervezés és nyilvántartás','Contract de muncă și REGES':'Munkaszerződés és REGES','Recrutare, onboarding, dosar și încetare':'Toborzás, beléptetés, személyi dosszié és kiléptetés'},en:{
'Szervezet, HR és kommunikáció':'Organization, HR and communication','A megfelelő emberek megszerzése, dokumentálása, fejlesztése és együttműködésük biztosítása':'Recruiting, documenting and developing the right people and enabling effective collaboration','Administrare HR':'HR administration','Planificare personal și registru':'Workforce planning and personnel register','Contract de muncă și REGES':'Employment contract and REGES','Recrutare, onboarding, dosar și încetare':'Recruitment, onboarding, personnel file and offboarding','Képzés és teljesítmény':'Training and performance','Szakmai és vezetői képzés':'Professional and management training','Teljesítményértékelés':'Performance evaluation','Karrier- és utánpótlás tervezés':'Career and succession planning','Kommunikáció és fegyelem':'Communication and discipline','Belső kommunikáció':'Internal communication','Szabályzatok és kultúra':'Policies and culture','Fegyelmi ügyek és munkatársi elkötelezettség':'Disciplinary cases and employee engagement','Kompetens, dokumentált, szabálykövető és eredményes csapat':'Competent, documented, compliant and effective team','Fluktuáció %':'Employee turnover %','Személyi dokumentumok teljessége %':'Complete personnel documents %','Képzési órák / fő':'Training hours / person','Munkatársi elkötelezettség':'Employee engagement','Felkészült és szabályosan dokumentált munkatársak minden divízió számára':'Prepared and properly documented employees for every division',
'Marketing és értékesítés':'Marketing and sales','Új ügyfelek szerzése és a bevétel növelése':'Acquiring new customers and increasing revenue','Piackutatás és stratégia':'Market research and strategy','Piac- és versenytárs elemzés':'Market and competitor analysis','Célcsoport meghatározás':'Target group definition','Marketingstratégia':'Marketing strategy','Értékesítés és ajánlat':'Sales and quotations','Kapcsolatépítés':'Relationship building','Árajánlatok, tárgyalás':'Quotations and negotiation','Értékesítés, megrendelés':'Sales and orders','Marketing és márkaépítés':'Marketing and brand building','Reklám, online jelenlét':'Advertising and online presence','Rendezvények, promóciók':'Events and promotions','Márkaépítés, PR':'Brand building and PR','Új ügyfelek és megrendelések folyamatosan':'Continuous flow of new customers and orders','Új ügyfelek száma':'Number of new customers','Árbevétel növekedés %':'Revenue growth %','Ajánlat → megrendelés arány':'Quotation → order rate','Megrendelések, ügyféligények a pénzügy és termelés felé':'Orders and customer requirements passed to finance and production',
'Pénzügy és kontroll':'Finance and control','A pénzügyi erőforrások tervezése és kezelése':'Planning and managing financial resources','Könyvelés és kontrolling':'Accounting and controlling','Könyvelés, riportok':'Accounting and reports','Költségkontroll, elemzések':'Cost control and analysis','Pénzügyi tervezés':'Financial planning','Pénzkezelés és behajtás':'Cash management and collections','Cash-flow kezelés':'Cash-flow management','Számlázás, követelés kezelés':'Invoicing and receivables management','Pénzbeszedés':'Collections','Beszerzési pénzügyi kontroll':'Procurement financial control','Kifizetések ellenőrzése':'Payment control','Leltár- és eszköznyilvántartás':'Inventory and asset register','Biztosítások, adók':'Insurance and taxes','Stabil pénzügyi helyzet és pontos információk':'Stable financial position and accurate information','Cash-flow':'Cash flow','Követelés behajtási napok':'Receivables collection days','Költségarány %':'Cost ratio %','Pénzügyi források, jóváhagyott keretek a termelés felé':'Financial resources and approved budgets for production',
'Termelés és szolgáltatás':'Production and service','Az ügyfél számára értéket teremtő fő tevékenység':'The core activity that creates value for the customer','Tervezés és előkészítés':'Planning and preparation','Munkatervezés':'Work planning','Anyag- és kapacitástervezés':'Material and capacity planning','Ütemezés':'Scheduling','Végrehajtás':'Execution','Javítás / gyártás / szolgáltatás':'Repair / production / service','Erőforrások felhasználása':'Resource utilization','Folyamatirányítás':'Process management','Logisztika és kiszállítás':'Logistics and delivery','Raktár és anyagmozgatás':'Warehouse and material handling','Késztermék / autó átadás':'Finished product / vehicle handover','Szállítás, átvétel':'Transport and receipt','Minőségi munka, határidőre, ügyfél-elégedettséggel':'Quality work, on time, with customer satisfaction','Termelékenység (óra / nap)':'Productivity (hours / day)','Határidő kész %':'Completed on time %','Munkák száma / hónap':'Jobs per month','Kész munka, szolgáltatás átadása az ügyfélnek':'Completed work or service handed over to the customer',
'Minőség, képzés és korrekció':'Quality, training and correction','A minőség fenntartása és folyamatos fejlesztés':'Maintaining quality and continuous improvement','Minőségellenőrzés':'Quality control','Bejövő és kimenő ellenőrzés':'Incoming and outgoing inspection','Munkafolyamat ellenőrzés':'Workflow inspection','Végső minőségbiztosítás':'Final quality assurance','Képzés és szabványok':'Training and standards','Belső képzések':'Internal training','Szabványok, eljárások':'Standards and procedures','Tudásmenedzsment':'Knowledge management','Hibakezelés és korrekció':'Error management and correction','Reklamációk kezelése':'Complaint management','Okfeltárás, javító intézkedés':'Root cause analysis and corrective action','Folyamatos fejlesztés (PDCA)':'Continuous improvement (PDCA)','Hibamentes működés és folyamatos fejlődés':'Error-free operation and continuous development','Hibaarány %':'Error rate %','Reklamációk száma':'Number of complaints','Fejlesztési intézkedések száma':'Number of improvement actions','Minősített folyamatok és javított rendszerek':'Validated processes and improved systems',
'Ügyfélkapcsolat, terjeszkedés és új piacok':'Customer relations, expansion and new markets','Ügyfelek megtartása, új piacok és hosszú távú kapcsolatok':'Customer retention, new markets and long-term relationships','Ügyfélszolgálat':'Customer service','Ügyféltámogatás':'Customer support','Információ, kapcsolattartás':'Information and communication','Panaszkezelés':'Complaint handling','Ügyfélmegtartás':'Customer retention','Hűségprogramok':'Loyalty programs','Utánkövetés, visszajelzések':'Follow-up and feedback','Ügyfél-elégedettség':'Customer satisfaction','Terjeszkedés és partnerek':'Expansion and partners','Új szolgáltatások, piacok':'New services and markets','Partnerkapcsolatok':'Partner relations','Stratégiai együttműködések':'Strategic partnerships','Hosszú távú ügyfelek és növekvő piaci jelenlét':'Long-term customers and growing market presence','Ügyfél-megtartási arány':'Customer retention rate','Ismételt munkák aránya':'Repeat work rate','Új piacok / partnerek száma':'Number of new markets / partners','Ügyfélvisszajelzés, piacinformáció az egész vállalat felé':'Customer feedback and market information for the whole company',
'Ügyvezetés, stratégia és irányítás':'Executive management, strategy and direction','A vállalat egységének fenntartása és irányítása':'Maintaining the unity and direction of the company','Stratégia, célok, döntések':'Strategy, goals and decisions','Szervezeti egység és kultúra':'Organizational unity and culture','Erőforrások jóváhagyása':'Resource approval','Teljesítmény áttekintése':'Performance review','Világos irány, erős szervezet és fenntartható növekedés':'Clear direction, strong organization and sustainable growth','Vállalati eredmény':'Company result','Növekedés (%)':'Growth (%)'
}};
function u(k){return UI[appLang][k];}
function tlang(s,lang){return (TR[lang]&&TR[lang][s])||s;}
function tx(s){return tlang(s,appLang);}
var BOARD_UI={
 ro:{mode:'Tablă organizațională panoramică',hint:'Întreaga organizație într-o singură hartă conectată',owners:'Proprietari',executive:'Director general',divisionLead:'Conducător de divizie',fit:'Încadrează',zoomOut:'Micșorează',zoomIn:'Mărește'},
 hu:{mode:'Panorámás szervezési tábla',hint:'A teljes szervezet egyetlen összekapcsolt térképen',owners:'Tulajdonosok',executive:'Ügyvezető igazgató',divisionLead:'Divízióvezető',fit:'Illesztés',zoomOut:'Kicsinyítés',zoomIn:'Nagyítás'},
 en:{mode:'Panoramic organizing board',hint:'The entire organization in one connected map',owners:'Owners',executive:'Managing director',divisionLead:'Division leader',fit:'Fit',zoomOut:'Zoom out',zoomIn:'Zoom in'}
};
Object.assign(TR.ro,{'Vezetés és stratégia':'Conducere și strategie','Koordináció és erőforrások':'Coordonare și resurse','Teljesítmény és vállalatirányítás':'Performanță și guvernanță','Irányított és összehangolt vállalati működés':'Funcționare coordonată și bine condusă a companiei',
'Szerelői kérések elbírálása (szabadnap, szerszám, segítség)':'Soluționarea cererilor mecanicilor (zile libere, scule, ajutor)',
'Iroda-küldők jogosultságainak kezelése (tel_kuldo)':'Gestionarea drepturilor expeditorilor din birou (tel_kuldo)',
'Munkalap kiadása és aláírás-nyilvántartás a telefonon (art. 243)':'Emiterea fișei postului și evidența semnăturilor pe telefon (art. 243)',
'Telefonos dokumentumok kiadása és olvasottság követése (art. 243)':'Emiterea documentelor pe telefon și urmărirea citirii (art. 243)',
'Telefonos feladatok kiosztása szerelőknek (Teendőim → telefon · nem mért munka)':'Alocarea sarcinilor telefonice mecanicilor (Sarcinile mele → telefon · muncă nemăsurată)',
'Telefonos feladatok elvégzése és visszaigazolása (szerelő telefon)':'Executarea și confirmarea sarcinilor telefonice (telefonul mecanicului)',
'Munkalap átvétele és aláírása a telefonon (art. 243)':'Preluarea și semnarea fișei postului pe telefon (art. 243)',
'Telefonos csatorna működésének felülvizsgálata (havi riport)':'Revizuirea funcționării canalului telefonic (raport lunar)',
'Telefonos dokumentum olvasottság %':'Rata de citire a documentelor pe telefon %',
'Szerelői kérés átfutás (óra)':'Timp de soluționare cerere mecanic (ore)',
'Telefonos feladat átfutás (óra)':'Timp de execuție sarcină telefonică (ore)',
'Visszaküldött feladatok aránya %':'Rata sarcinilor trimise înapoi %'});
Object.assign(TR.en,{'Vezetés és stratégia':'Leadership and strategy','Koordináció és erőforrások':'Coordination and resources','Teljesítmény és vállalatirányítás':'Performance and governance','Irányított és összehangolt vállalati működés':'Directed and coordinated company operation',
'Szerelői kérések elbírálása (szabadnap, szerszám, segítség)':'Resolving mechanic requests (days off, tools, help)',
'Iroda-küldők jogosultságainak kezelése (tel_kuldo)':'Managing office sender permissions (tel_kuldo)',
'Munkalap kiadása és aláírás-nyilvántartás a telefonon (art. 243)':'Issuing the job description and tracking signatures on the phone (art. 243)',
'Telefonos dokumentumok kiadása és olvasottság követése (art. 243)':'Issuing phone documents and tracking read confirmation (art. 243)',
'Telefonos feladatok kiosztása szerelőknek (Teendőim → telefon · nem mért munka)':'Phone task assignment to mechanics (My tasks → phone · non-measured work)',
'Telefonos feladatok elvégzése és visszaigazolása (szerelő telefon)':'Phone task execution and confirmation (mechanic phone)',
'Munkalap átvétele és aláírása a telefonon (art. 243)':'Receiving and signing the job description on the phone (art. 243)',
'Telefonos csatorna működésének felülvizsgálata (havi riport)':'Monthly review of the phone channel operation',
'Telefonos dokumentum olvasottság %':'Phone document read rate %',
'Szerelői kérés átfutás (óra)':'Mechanic request turnaround (hours)',
'Telefonos feladat átfutás (óra)':'Phone task turnaround (hours)',
'Visszaküldött feladatok aránya %':'Rate of returned tasks %'});
var DIV_COLOR={7:'#D4D6DA',1:'#D4D6DA',2:'#D4D6DA',3:'#D4D6DA',4:'#D4D6DA',5:'#D4D6DA',6:'#D4D6DA'};
function division7(){return {n:7,c:DIV_COLOR[7],t:DIV7.t,d:DIV7.d,head:DIV7.head,link:DIV7.link,dept:[{code:'7.1',t:'Vezetés és stratégia',li:[DIV7.tasks[0],DIV7.tasks[1],DIV7.tasks[4]]},{code:'7.2',t:'Koordináció és erőforrások',li:[DIV7.tasks[2]]},{code:'7.3',t:'Teljesítmény és vállalatirányítás',li:[DIV7.tasks[3]]}],vfp:DIV7.vfp,kpi:DIV7.kpi,out:'Irányított és összehangolt vállalati működés'};}
function orderedDivisions(){return [division7()].concat(DIV);}

var POOL=['Kovács B.','Nagy A.','Szabó P.','Tóth M.','Kiss É.','Farkas Z.','Popescu A.','Ionescu M.','Marincaș E.','Dima V.','Balogh R.','Varga T.','Horváth L.','Simon K.','Lung C.','Radu S.','Fehér G.','Molnár D.','Oláh N.','Barbu I.','Pop V.','Mureșan A.','Takács B.','Deák Zs.','Sandu R.','Ilie M.','Gál F.','Vasile T.','Kelemen O.','Antal J.'];
var DETAIL_DEFAULTS={
 '1|1.1|0':{
  who:'Denisa',assigned:'Sz. F.',
  ro:{purpose:'Asigurarea unei evidențe corecte și actualizate a personalului și planificarea necesarului de angajați în funcție de activitatea firmei.',final:'Planul de personal\nRegistrul / evidența personalului actualizat(ă)\nSituația posturilor ocupate și vacante\nNecesarul de personal identificat și justificat',evaluation:'Corectitudinea, actualizarea și respectarea termenelor.',job:'Planifică necesarul de personal și menține evidența angajaților.',kpis:['% actualizare la timp a registrului de personal','% posturi ocupate','% documente de personal complete','% necesar de personal acoperit'],targets:['100%','≥ 95%','100%','≥ 90%']},
  hu:{purpose:'A személyi állomány pontos és naprakész nyilvántartása, valamint a vállalat tevékenységéhez szükséges létszám megtervezése.',final:'Személyzeti terv\nNaprakész személyi nyilvántartás\nBetöltött és üres pozíciók kimutatása\nAzonosított és indokolt létszámigény',evaluation:'Pontosság, naprakészség és a határidők betartása.',job:'Megtervezi a szükséges létszámot és naprakészen tartja a munkavállalók nyilvántartását.',kpis:['A személyi nyilvántartás határidőre frissítve','Betöltött pozíciók aránya','Teljes személyi dokumentáció aránya','Lefedett létszámigény aránya'],targets:['100%','≥ 95%','100%','≥ 90%']},
  en:{purpose:'Maintain an accurate and up-to-date personnel register and plan staffing needs according to the company’s activity.',final:'Workforce plan\nUpdated personnel register\nOverview of filled and vacant positions\nIdentified and justified staffing requirement',evaluation:'Accuracy, timely updates and compliance with deadlines.',job:'Plans staffing requirements and maintains the employee register.',kpis:['Personnel register updated on time','Filled positions','Complete personnel documents','Staffing requirement covered'],targets:['100%','≥ 95%','100%','≥ 90%']}
 }
};
function ini(n){var p=String(n||'').trim().split(/\s+/).filter(Boolean);return p.length?((p[0][0]||'')+(p[1]?p[1][0]:'')).toUpperCase():'?';}
var storageReadError=false;
function readPreference(key,fallback){try{var own=localStorage.getItem(standalonePreferencePrefix+key);if(own!==null)return own||fallback;return key==='ra_org_lang'?(localStorage.getItem(key)||fallback):fallback;}catch(e){return fallback;}}
function savePreference(key,value){try{localStorage.setItem(standalonePreferencePrefix+key,value);}catch(e){}}
function readBoardStore(){
 try{
  var own=localStorage.getItem(standaloneStorageKey);
  var raw=own!==null?own:localStorage.getItem('ra_org_hr_v1');
  var data=JSON.parse(raw||'{}');
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid board data');
  if(own!==null)return data;
  // Copy only this model's legacy records if accessible; never write the combined board.
  var imported={};
  Object.keys(data).forEach(function(key){
   var belongs=standaloneModel==='m1'?!/^(m2|m3)\|/.test(key):key.indexOf(standaloneModel+'|')===0;
   if(belongs)Object.defineProperty(imported,key,{value:data[key],enumerable:true,configurable:true,writable:true});
  });
  return imported;
 }catch(e){storageReadError=true;return {};}
}
var ST={store:readBoardStore()};
function persist(){try{if(storageReadError)throw new Error('Original data could not be read');localStorage.setItem(standaloneStorageKey,JSON.stringify(ST.store));return true;}catch(e){alert(({ro:'Salvarea nu a reușit. Păstrează fereastra deschisă; datele anterioare nu au fost suprascrise.',hu:'Nem sikerült menteni. Hagyd nyitva az ablakot; a korábbi adatok nem lettek felülírva.',en:'Saving failed. Keep this window open; previously saved data has not been overwritten.'})[appLang]);return false;}}
function commitChange(change){var before=JSON.stringify(ST.store);change();if(persist())return true;ST.store=JSON.parse(before);return false;}
var openNewTask;
function rec(k){return ST.store[k]||(ST.store[k]={});}
function personName(k,fallback){var r=ST.store[k];return r&&r.name!==undefined?r.name:fallback;}
function editPerson(k,fallback){var nm=prompt(PMTXT[appLang].name,personName(k,fallback));if(nm===null)return;rec(k).name=nm.trim();persist();render();}

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var pIdx=0;
function liHTML(divn,code,task,idx){
  var k=divn+'|'+code+'|'+idx,legacy=divn+'|'+task;
  if(!ST.store[k]&&ST.store[legacy])ST.store[k]=ST.store[legacy];
  var r=ST.store[k]||{};
  if(r.deleted)return '';
  var who=r.who!==undefined?r.who:(DETAIL_DEFAULTS[k]||{}).who||orderedDivisions().find(function(d){return d.n===Number(divn);}).head;
  var val=r.status||'r'; var glyph={r:'\u00d7',y:'\u00b7',g:'\u2713'}[val];
  var vfpDot=(r.lang||r.desc||r.role||r.vfp)?'<span class="vfp-dot" title="'+esc(u('filled'))+'"></span>':'';
  return '<div class="li" data-k="'+esc(k)+'" data-div="'+divn+'" data-task="'+esc(task)+'">'+
    '<span class="txt">'+esc(tx(task))+'</span>'+vfpDot+
    '<span class="who"><span class="av">'+esc(ini(who))+'</span>'+esc(who)+'</span>'+
    '<span class="st '+val+'" title="'+esc(u('status'))+'">'+glyph+'</span>'+
    '<span class="del" title="'+esc(u('remove'))+'">×</span></div>';
}
function renderHierarchy(){
 var b=BOARD_UI[appLang],all=orderedDivisions();
 var leaders=all.map(function(d){var head=personName('head|'+d.n,d.head);return '<div class="lead-cell" style="--dc:'+DIV_COLOR[d.n]+'"><button type="button" class="org-node" data-head="'+d.n+'"><div class="role">'+esc(b.divisionLead)+' · '+d.n+'</div><div class="person">'+esc(head||'—')+' ✎</div></button></div>';}).join('');
 document.getElementById('hierarchy').innerHTML='<div class="owner-row"><button type="button" class="org-node" data-person="owners"><div class="role">'+esc(b.owners)+'</div><div class="person">'+esc(personName('person|owners','RED Assistance Group')||'—')+' ✎</div></button></div><div class="executive-row"><button type="button" class="org-node" data-person="executive"><div class="role">'+esc(b.executive)+'</div><div class="person">'+esc(personName('person|executive','Alex Popescu')||'—')+' ✎</div></button></div><div class="lead-row">'+leaders+'</div>';
}
function renderGrid(){
  pIdx=0;
  document.getElementById('grid').innerHTML=orderedDivisions().map(function(d){
    var head=personName('head|'+d.n,d.head);
    var body=d.dept.map(function(dp){
      var custom=(ST.store['custom|'+d.n+'|'+dp.code]||{}).list||[];
      var rows=dp.li.concat(custom).map(function(t,idx){return liHTML(d.n,dp.code,t,idx);}).join('');
      return '<div class="dept"><div class="dept-h"><span class="code">'+dp.code+'</span><span class="dt">'+esc(tx(dp.t))+'</span></div>'+rows+
        '<button class="addbtn" data-add="'+d.n+'|'+dp.code+'">'+esc(u('add'))+'</button></div>';
    }).join('');
    return '<div class="card" style="--dc:'+DIV_COLOR[d.n]+'">'+
      '<div class="hd"><span class="no">'+d.n+'</span><div class="tt"><div class="nm">'+esc(tx(d.t))+'</div><div class="ds">'+esc(tx(d.d))+'</div>'+
        '<span class="head" data-head="'+d.n+'"><span class="lbl">'+esc(u('leader'))+'</span><span class="av">'+esc(ini(head))+'</span>'+esc(head)+'</span><br>'+
        '<a class="open-l" href="'+d.link+'">'+esc(u('open'))+'</a></div></div>'+
      '<div class="bd">'+body+
        '<div class="foot-boxes">'+
          '<div class="fbox vfp"><div class="fl">'+esc(u('vfp'))+'</div>'+esc(tx(d.vfp))+'</div>'+
          '<div class="fbox kpi"><div class="fl">'+esc(u('kpi'))+'</div>'+d.kpi.map(function(k){return '<div class="k">'+esc(tx(k))+'</div>';}).join('')+'</div>'+
          '<div class="fbox out"><div class="fl">'+esc(u('output'))+'</div>'+esc(tx(d.out))+'</div>'+
        '</div></div></div>';
  }).join('');
}
function renderStatic(){
 document.documentElement.lang=appLang;document.title=u('title');document.getElementById('backLabel').textContent=u('back');document.getElementById('brandSub').textContent=u('brand');document.getElementById('pageSub').textContent=u('sub');
 var check=function(t){return '<div class="ck"><span style="color:var(--ok);font-weight:800">✓</span>'+esc(t)+'</div>';};
 var cyc=UI[appLang].cycleNames.map(function(t,i){return (i?'<span class="a">→</span>':'')+'<div class="n"><span class="c">'+(i+1)+'</span>'+esc(t)+'</div>';}).join('');
 document.getElementById('info').innerHTML='<div class="ibox"><h3>'+esc(u('principle'))+'</h3>'+UI[appLang].checks.map(check).join('')+'</div><div class="ibox"><h3>'+esc(u('cycle'))+'</h3><div class="cyc">'+cyc+'</div></div><div class="ibox"><h3>'+esc(u('discipline'))+'</h3>'+UI[appLang].disc.map(check).join('')+'</div>';
 var b=BOARD_UI[appLang];document.getElementById('boardMode').textContent=b.mode;document.getElementById('boardHint').textContent=b.hint;document.getElementById('zoomFit').textContent=b.fit;document.getElementById('zoomOut').title=b.zoomOut;document.getElementById('zoomIn').title=b.zoomIn;
 document.getElementById('goal').innerHTML=u('goal');document.querySelectorAll('[data-app-lang]').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-app-lang')===appLang);});
}
function render(){renderStatic();renderHierarchy();renderGrid();}

/* interactions */
var pmCur=null;
var pmLang='ro';
var pmTask='';
var pmDiv='';
var PMTXT={
 ro:{purpose:'Scopul activității',purposeHint:'De ce există această activitate?',final:'Produsul final valoros',finalHint:'Rezultatele concrete și verificabile, câte unul pe rând',responsibility:'Responsabilitate',main:'Responsabil principal',assigned:'Persoană desemnată de HR',assignedHint:'Cine execută administrativ activitatea?',evaluation:'Evaluare',evaluationHint:'Criteriile după care rezultatul este acceptat',job:'Descrierea postului',jobHint:'Ce trebuie să execute această poziție?',note:'Indicator și țintă. Valorile sunt salvate în acest dispozitiv.',save:'Salvează',name:'Nume',indicator:'Indicator',target:'Țintă'},
 hu:{purpose:'A tevékenység célja',purposeHint:'Miért létezik ez a tevékenység?',final:'Értékes végtermék',finalHint:'Konkrét és ellenőrizhető eredmények, soronként egy',responsibility:'Felelősség',main:'Fő felelős',assigned:'HR által kijelölt személy',assignedHint:'Ki végzi az adminisztratív munkát?',evaluation:'Értékelés',evaluationHint:'Milyen feltételekkel fogadható el az eredmény?',job:'Munkaköri leírás',jobHint:'Mit kell ennek a pozíciónak végrehajtania?',note:'Mutató és célérték. Az adatok ezen az eszközön tárolódnak.',save:'Mentés',name:'Név',indicator:'Mutató',target:'Cél'},
 en:{purpose:'Purpose of the activity',purposeHint:'Why does this activity exist?',final:'Valuable final product',finalHint:'Concrete, verifiable results, one per line',responsibility:'Responsibility',main:'Primary owner',assigned:'Person assigned by HR',assignedHint:'Who performs the administrative work?',evaluation:'Evaluation',evaluationHint:'The criteria used to accept the result',job:'Job description',jobHint:'What must this position execute?',note:'Indicator and target. Values are saved on this device.',save:'Save',name:'Name',indicator:'Indicator',target:'Target'}
};
function ensureDetail(r,k){
 var def=DETAIL_DEFAULTS[k]||{};
 r.who=r.who||def.who||'';r.assigned=r.assigned||def.assigned||'';r.lang=r.lang||{};
 ['ro','hu','en'].forEach(function(lang){var src=def[lang]||{};var x=r.lang[lang]||(r.lang[lang]={});x.purpose=x.purpose||src.purpose||'';x.final=x.final||src.final||r.vfp||'';x.evaluation=x.evaluation||src.evaluation||'';x.job=x.job||src.job||r.desc||'';x.kpis=x.kpis||src.kpis||['','','',''];x.targets=x.targets||src.targets||['','','',''];});
}
function saveModalLang(){
 if(!pmCur)return;var r=rec(pmCur);ensureDetail(r,pmCur);var x=r.lang[pmLang];
 x.purpose=document.getElementById('pmPurpose').value;x.final=document.getElementById('pmFinal').value;x.evaluation=document.getElementById('pmEvaluation').value;x.job=document.getElementById('pmJob').value;
 x.kpis=[];x.targets=[];for(var i=1;i<=4;i++){x.kpis.push(document.getElementById('pmKpi'+i).value);x.targets.push(document.getElementById('pmTarget'+i).value);}
 r.who=document.getElementById('pmWho').value.trim();r.assigned=document.getElementById('pmAssigned').value.trim();
}
function loadModalLang(){
 pmLang=appLang;
 var r=rec(pmCur);ensureDetail(r,pmCur);var x=r.lang[pmLang],t=PMTXT[pmLang];
 document.getElementById('pmTitle').textContent=tlang(pmTask,pmLang);document.getElementById('pmDep').textContent=UI[pmLang].card+pmDiv;
 document.getElementById('pmPurpose').value=x.purpose;document.getElementById('pmFinal').value=x.final;document.getElementById('pmWho').value=r.who;document.getElementById('pmAssigned').value=r.assigned;document.getElementById('pmEvaluation').value=x.evaluation;document.getElementById('pmJob').value=x.job;
 for(var i=1;i<=4;i++){document.getElementById('pmKpi'+i).value=x.kpis[i-1]||'';document.getElementById('pmTarget'+i).value=x.targets[i-1]||'';document.getElementById('pmKpi'+i).placeholder=t.indicator+' '+i;document.getElementById('pmTarget'+i).placeholder=t.target;}
 document.getElementById('lblPurpose').childNodes[0].nodeValue=t.purpose;document.getElementById('hintPurpose').textContent=t.purposeHint;document.getElementById('lblFinal').childNodes[0].nodeValue=t.final;document.getElementById('hintFinal').textContent=t.finalHint;document.getElementById('secResp').textContent=t.responsibility;document.getElementById('lblMain').textContent=t.main;document.getElementById('lblAssigned').childNodes[0].nodeValue=t.assigned;document.getElementById('hintAssigned').textContent=t.assignedHint;document.getElementById('lblEval').childNodes[0].nodeValue=t.evaluation;document.getElementById('hintEval').textContent=t.evaluationHint;document.getElementById('lblJob').childNodes[0].nodeValue=t.job;document.getElementById('hintJob').textContent=t.jobHint;document.getElementById('kpiNote').textContent=t.note;document.getElementById('pmSave').textContent=t.save;document.getElementById('pmWho').placeholder=t.name;document.getElementById('pmAssigned').placeholder=t.name;
}
function openModal(k,divn,task){
  var r=rec(k);
  pmCur=k;pmTask=task;pmDiv=divn;pmLang=appLang;ensureDetail(r,k);
  document.getElementById('pmNo').textContent=divn;
  loadModalLang();
  document.getElementById('pmBack').classList.add('open');
}
document.querySelectorAll('[data-app-lang]').forEach(function(b){b.onclick=function(){appLang=this.getAttribute('data-app-lang');savePreference('ra_org_lang',appLang);render();};});
var boardZoom=parseFloat(readPreference('ra_org_zoom',''))||.72;
function setBoardZoom(v){boardZoom=Math.max(.45,Math.min(1.15,v));document.getElementById('orgCanvas').style.zoom=boardZoom;document.getElementById('zoomValue').textContent=Math.round(boardZoom*100)+'%';savePreference('ra_org_zoom',boardZoom);}
document.getElementById('zoomOut').onclick=function(){setBoardZoom(boardZoom-.1);};
document.getElementById('zoomIn').onclick=function(){setBoardZoom(boardZoom+.1);};
document.getElementById('zoomFit').onclick=function(){var w=document.getElementById('orgViewport').clientWidth||1200;setBoardZoom((w-6)/2240);document.getElementById('orgViewport').scrollLeft=0;};
document.addEventListener('click',function(e){
  var st=e.target.closest('.st'), del=e.target.closest('.del'), add=e.target.closest('[data-add]'), head=e.target.closest('[data-head]'), li=e.target.closest('.li');
  if(st){var li2=st.closest('.li');var k=li2.getAttribute('data-k');commitChange(function(){var r=rec(k);var o=['r','y','g'];r.status=o[(o.indexOf(r.status||'r')+1)%3];});renderGrid();return;}
  if(del){var li3=del.closest('.li');var k2=li3.getAttribute('data-k');if(confirm(u('deleteAsk'))){commitChange(function(){rec(k2).deleted=true;});render();}return;}
  if(add){e.preventDefault();var parts=add.getAttribute('data-add').split('|');openNewTask(Number(parts[0]),parts[1]);return;}
  if(head){e.preventDefault();var hn=head.getAttribute('data-head');var d=orderedDivisions().find(function(d){return d.n===Number(hn);});editPerson('head|'+hn,d.head);if(activeModule&&document.getElementById('moduleBack').classList.contains('open'))openModule(activeModule.n,activeModule.code);return;}
  if(li){var divn=li.getAttribute('data-div');var task=li.getAttribute('data-task');openModal(li.getAttribute('data-k'),divn,task);return;}
},false);
document.getElementById('pmX').onclick=function(){document.getElementById('pmBack').classList.remove('open');pmCur=null;};
document.getElementById('pmBack').addEventListener('click',function(e){if(e.target===this)document.getElementById('pmX').click();});
document.getElementById('pmSave').onclick=function(){
  if(!pmCur)return;saveModalLang();
  persist();document.getElementById('pmBack').classList.remove('open');pmCur=null;renderGrid();
};
render();setBoardZoom(boardZoom);
