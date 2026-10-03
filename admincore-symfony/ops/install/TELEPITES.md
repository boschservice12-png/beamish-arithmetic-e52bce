# Telepítés a saját szerverre (Windows Server + ASM mellé, Hyper-V)

**Cél:** a rendszer a szerviz saját gépén fut, az ASM mellett, attól **elszigetelve**, kívülről HTTPS-en elérhetően.
**Időigény:** kb. 1,5–2 óra (ebből kb. 30 perc várakozás). **Költség:** 0 lei szoftver; ajánlott: UPS (ha még nincs).

```
Internet ──► Router (fix IP) ──80/443──► Ubuntu VM (Hyper-V)  ──HTTPS──► Supabase (adatok)
                                            │ app + HTTPS-kapu + monitoring + mentés
                                            │
                          Windows Server ───┘ (ugyanaz a fizikai gép)
                          ASM + SQL Server  ◄── kívülről NEM érhető el (nincs port nyitva rá)
```

## 0. Előfeltételek — ellenőrizd mielőtt kezded

| # | Mi | Hogyan |
|---|---|---|
| 1 | Windows Server, 16 GB RAM, ≥150 GB szabad hely (lehetőleg nem a C:-n) | Feladatkezelő → Teljesítmény; Fájlkezelő |
| 2 | A processzor támogatja a virtualizációt | Feladatkezelő → Teljesítmény → CPU → „Virtualizáció: Engedélyezve”. Ha nem: BIOS-ban VT-x / AMD-V bekapcsolása |
| 3 | Fix nyilvános IP a szerviz internetén | Szolgáltatótól (Digi/Orange/Vodafone) — havidíjas opció |
| 4 | Domain, aminek a DNS-ét kezelni tudod | pl. `szerviz.redassistance.ro` |
| 5 | A router admin-felülete (port-továbbításhoz) | felhasználó/jelszó |
| 6 | **Friss ASM-mentés** a Hyper-V telepítése előtt | ASM / SQL Server biztonsági mentés — a Hyper-V telepítése újraindítást kér |

## 1. Hyper-V bekapcsolása (Windows Server, egyszer)

Munkaidőn kívül (újraindít). PowerShell **rendszergazdaként**:

```powershell
Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart
```

## 2. A virtuális gép létrehozása

1. Ubuntu 24.04 LTS **Server** ISO: https://ubuntu.com/download/server → mentsd ide: `C:\ISO\`
2. Másold a szerverre: `ops/install/hyperv-vm.ps1`
3. PowerShell rendszergazdaként:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\hyperv-vm.ps1 -IsoPath C:\ISO\ubuntu-24.04.3-live-server-amd64.iso -VmRoot D:\Hyper-V
```

A szkript: 4 mag (legfeljebb 75%-uk), 4–6 GB RAM (dinamikus, az ASM elsőbbséget élvez), 120 GB lemez, külső
hálózati kapcsoló, automatikus indulás áramszünet után (60 mp-cel az ASM után), szabályos leállás.

## 3. Ubuntu telepítése (Hyper-V kezelő → RedAssistance → Kapcsolódás)

| Képernyő | Választás |
|---|---|
| Language | English (a szerver nyelve; a rendszer magyar marad) |
| Network | DHCP-vel kap címet → **jegyezd fel** (pl. 192.168.1.50). Ajánlott: a routeren rögzítsd ehhez a géphez (DHCP-foglalás) |
| Storage | Use an entire disk (a virtuális 120 GB-os lemez — az ASM-et nem érinti) |
| Profile | név: `ferenc`, szervernév: `redassistance`, erős jelszó |
| SSH | ✅ **Install OpenSSH server** · ha van GitHub-fiókod SSH-kulccsal: „Import SSH identity → GitHub” |
| Featured snaps | semmit ne válassz |

Telepítés után: **Reboot**, majd PowerShellben: `Get-VMDvdDrive -VMName RedAssistance | Remove-VMDvdDrive`

## 4. Router és DNS

1. **Port-továbbítás** a routeren: TCP 80 és TCP 443 (+UDP 443) → a VM IP-je (pl. 192.168.1.50). **Ne** a Windows szerver IP-je!
2. **DNS**: `A` rekord: `szerviz.redassistance.ro` → a fix nyilvános IP. Ellenőrzés: `nslookup szerviz.redassistance.ro`
3. A routeren **ne legyen** továbbítva az RDP (3389) és az SQL Server (1433) — ha eddig volt, most zárd le.

## 5. A rendszer telepítése (a VM-en, egy parancs)

A saját gépedről (a belső hálón) másold át a szkriptet, majd lépj be és futtasd:

```sh
scp admincore-symfony/ops/install/bootstrap.sh ferenc@192.168.1.50:
ssh ferenc@192.168.1.50
sudo BRANCH=claude/website-red-assistance-tu9cwr sh bootstrap.sh
```

(`BRANCH=…` csak addig kell, amíg a fejlesztés nincs a `main` ágba összefésülve.) A szkript közben:
- kiír egy **Deploy Key**-t → GitHub: repó → Settings → Deploy keys → Add (írási jog **nélkül**) → Enter;
- megkérdezi a **domaint** és az **e-mail-címet** (tanúsítvány-értesítés + riasztások).

A végén: `✓ KÉSZ: https://szerviz.redassistance.ro — kívülről is elérhető, érvényes tanúsítvánnyal`

## 6. Ellenőrzőlista az átadás előtt

| # | Próba | Elvárt |
|---|---|---|
| 1 | Telefonon, **mobilneten** (nem a szerviz Wi-Fi-jén): `https://<domain>` | Lakat ikon, belépőoldal |
| 2 | Belépés owner-ként → Admin Core → KPI · mért | adatok látszanak |
| 3 | `https://<domain>/szerelo` szerelő-telefonon, PIN-nel | saját munkák |
| 4 | `https://<domain>/penzugy` | pénzügyi panel (iroda) |
| 5 | `https://<domain>/metrics` | 404 (kívülről nem elérhető) |
| 6 | A VM újraindítása (`sudo reboot`) | 2 percen belül magától újra elérhető |
| 7 | A Windows szerver újraindítása (munkaidőn kívül) | ASM indul, a VM 60 mp-cel később, a rendszer magától elérhető |
| 8 | ASM sebessége a következő munkanapon | nem lassabb, mint eddig |

## 7. Utána (ugyanaznap)

1. **Mentés** — `OPERATIONS.md` 5. fejezet (age-kulcs + Supabase-URL) → `docker compose … run --rm backup run-now`
2. **Off-site mentés kötelező**: a szerver és az ASM ugyanabban az épületben van — tűz / betörés / zsarolóvírus egyszerre vinné mindkettőt. Backblaze B2 (~1 €/hó) → `BACKUP_RCLONE_REMOTE`
3. **Riasztó e-mail**: SMTP-adatok `.env.prod`-ba (`SMTP_SMARTHOST`, `SMTP_USER`, `ALERT_EMAIL_FROM`) + `ops/secrets/smtp_password`
4. **UPS**: ha még nincs, a szerver mögé (az ASM-et is védi). A Windows UPS-szoftvere szabályosan leállítja a gépet → a Hyper-V előtte a VM-et.
5. **CI/CD**: GitHub → Variables: `PRODUCTION_HOST` = (belső hálón futó self-hosted runner kell, mert az SSH csak belülről nyitott — vagy kézi `ops/deploy.sh <címke>`)

## 8. Következő lépés: automatikus ASM-import (SQL Server)

Ugyanazon a gépen van az ASM → a havi 6 fájl kézi feltöltése kiváltható:
- az ASM SQL Serverén egy **csak olvasó** felhasználó, csak a szükséges nézetekre;
- a Windows-on egy ütemezett feladat (éjjel) lekérdezi a napi tételeket és a belső hálón elküldi a már kész
  `POST /api/asm/import` végpontnak (tokennel) → `f_asm_import` → havi jelentés + KPI automatikusan;
- **semmilyen port nem nyílik** az SQL Serverre (a Windows küld, nem a VM olvas).

Ehhez kell: az ASM adatbázis neve és a munkalap-/deviz-tételek táblái (az ASM forgalmazójától vagy SQL Server
Management Studióból). Amíg ez nincs meg, a kézi betöltés változatlanul működik.

## Kockázatok és kezelésük

| Kockázat | Kezelés |
|---|---|
| Áramszünet | UPS + automatikus indulás (VM: `AutomaticStartAction Start`); BIOS: „Restore on AC power loss = Power On” |
| Internetkiesés | a műhely belső hálóján az app tovább elérhető (`https://<VM IP>` helyett a domain a routeren belül is működik, ha a router támogatja a hairpin NAT-ot) — az adatok a Supabase-ben vannak, internet kell hozzájuk |
| Az ASM lassul | VM-korlátok (max 6 GB RAM, 75% CPU, alacsonyabb prioritás); ellenőrzőlista 8. pont |
| Támadás kívülről | csak a VM 80/443-a nyitott, a VM-en tűzfal + automatikus frissítések + fail2ban; az ASM/SQL Server nem érhető el |
| Hardverhiba / tűz | napi titkosított mentés + **off-site** másolat; a VM-lemez a Windows-mentésbe is bevonható (Hyper-V export hetente) |
