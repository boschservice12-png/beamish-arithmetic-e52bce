# RedAssistance — Hyper-V virtuális gép az ASM-szerver mellé (Windows Server, rendszergazdaként futtatva)
#
#   1) Hyper-V szerepkör (egyszer, újraindítással):  Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart
#   2) Ubuntu 24.04 LTS Server ISO letöltése: https://ubuntu.com/download/server  →  pl. C:\ISO\ubuntu-24.04-live-server-amd64.iso
#   3) PowerShell (rendszergazda):  .\hyperv-vm.ps1 -IsoPath C:\ISO\ubuntu-24.04-live-server-amd64.iso
#
# Elszigetelés: a virtuális gép saját IP-t kap a szerviz hálózatán; a routeren a 80/443 ERRE az IP-re mutat,
# NEM a Windows szerverre. Az ASM és az SQL Server továbbra sem érhető el kívülről.
# Erőforrás: legfeljebb 6 GB RAM és 4 mag — az ASM-nek mindig marad elég (16 GB-os gépen).

param(
  [Parameter(Mandatory = $true)][string]$IsoPath,
  [string]$Name = "RedAssistance",
  [string]$VmRoot = "D:\Hyper-V",          # lehetőleg NEM a rendszerlemez (C:)
  [int64]$DiskGB = 120,
  [int]$Cpu = 4,
  [int64]$RamStartupGB = 4,
  [int64]$RamMaxGB = 6,
  [string]$SwitchName = "RA-Kulso"
)
$ErrorActionPreference = "Stop"

if (-not (Get-Command New-VM -ErrorAction SilentlyContinue)) { throw "Nincs Hyper-V. Futtasd: Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart" }
if (-not (Test-Path $IsoPath)) { throw "Nem található az ISO: $IsoPath" }
if (-not (Test-Path $VmRoot)) { New-Item -ItemType Directory -Path $VmRoot | Out-Null }

# Külső (hídolt) virtuális kapcsoló a fizikai hálókártyára — a gép a router DHCP-jéből kap címet
if (-not (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue)) {
  $nic = Get-NetAdapter -Physical | Where-Object Status -eq "Up" | Sort-Object -Property LinkSpeed -Descending | Select-Object -First 1
  if (-not $nic) { throw "Nincs aktív fizikai hálókártya" }
  Write-Host "Külső virtuális kapcsoló: $SwitchName → $($nic.Name) (a hálózat 2-3 mp-re megszakadhat)"
  New-VMSwitch -Name $SwitchName -NetAdapterName $nic.Name -AllowManagementOS $true | Out-Null
}

if (Get-VM -Name $Name -ErrorAction SilentlyContinue) { throw "Már létezik '$Name' nevű virtuális gép" }
$vhd = Join-Path $VmRoot "$Name.vhdx"
New-VM -Name $Name -Generation 2 -MemoryStartupBytes ($RamStartupGB * 1GB) -NewVHDPath $vhd -NewVHDSizeBytes ($DiskGB * 1GB) -SwitchName $SwitchName -Path $VmRoot | Out-Null
Set-VMMemory -VMName $Name -DynamicMemoryEnabled $true -MinimumBytes 2GB -StartupBytes ($RamStartupGB * 1GB) -MaximumBytes ($RamMaxGB * 1GB) -Priority 50
Set-VMProcessor -VMName $Name -Count $Cpu -Reserve 0 -Maximum 75 -RelativeWeight 50   # max. 75% a kiosztott magokból
Set-VMFirmware -VMName $Name -SecureBootTemplate "MicrosoftUEFICertificateAuthority"  # Ubuntu Secure Boot
Add-VMDvdDrive -VMName $Name -Path $IsoPath
Set-VMFirmware -VMName $Name -FirstBootDevice (Get-VMDvdDrive -VMName $Name)
# áramszünet / újraindítás után magától induljon (az ASM után 60 mp-cel), leálláskor szabályosan álljon le
Set-VM -Name $Name -AutomaticStartAction Start -AutomaticStartDelay 60 -AutomaticStopAction ShutDown -CheckpointType Production
Enable-VMIntegrationService -VMName $Name -Name "Guest Service Interface", "Heartbeat", "Shutdown", "Time Synchronization", "Key-Value Pair Exchange"

Start-VM -Name $Name
Write-Host ""
Write-Host "KÉSZ: a '$Name' virtuális gép elindult az Ubuntu telepítővel."
Write-Host "Következő: Hyper-V kezelő → $Name → Kapcsolódás, és az útmutató 3. lépése (Ubuntu telepítése)."
Write-Host "A telepítés után a DVD-t vedd ki:  Get-VMDvdDrive -VMName $Name | Remove-VMDvdDrive"
