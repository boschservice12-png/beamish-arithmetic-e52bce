#!/bin/sh
# RedAssistance — szerver-alapozás és első indítás egy friss Ubuntu 24.04 LTS gépen (a Hyper-V virtuális gépen).
#
#   sudo sh bootstrap.sh
#
# Mit csinál (újrafuttatható; ami kész, azt kihagyja):
#   1) frissítések + automatikus biztonsági frissítések (újraindítás 04:30-kor, a 03:15-ös mentés után)
#   2) tűzfal: kívülről csak 80/443; SSH csak a szerviz belső hálójáról; fail2ban
#   3) Docker (hivatalos csomagtár), naplóméret-korlátok
#   4) "deploy" felhasználó, csak SSH-kulcsos belépés (jelszavas tiltás csak ha már van kulcs → nem zárhatod ki magad)
#   5) a repó letöltése GitHub Deploy Key-jel (csak olvasás) → /opt/redassistance
#   6) titkok generálása (APP_SECRET, METRICS_TOKEN, Grafana-jelszó) — semmi nem kerül gitbe
#   7) első indítás: app + HTTPS-kapu (Let's Encrypt) + monitoring; ellenőrzés
set -eu

REPO_SSH=${REPO_SSH:-git@github.com:boschservice12-png/beamish-arithmetic-e52bce.git}
BRANCH=${BRANCH:-main}
BASE=${BASE:-/opt/redassistance}
APP_DIR="$BASE/admincore-symfony"
DEPLOY_USER=${DEPLOY_USER:-deploy}

say()  { printf '\n\033[1;31m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
ask()  { printf '  %s: ' "$1" >&2; read -r REPLY; printf '%s' "$REPLY"; }

[ "$(id -u)" = 0 ] || { echo "Rendszergazdaként futtasd: sudo sh $0"; exit 1; }
. /etc/os-release
[ "${ID:-}" = ubuntu ] || [ "${ID:-}" = debian ] || { echo "Ubuntu 24.04 / Debian 12+ kell (ez: ${PRETTY_NAME:-ismeretlen})"; exit 1; }
export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------- 1) frissítések
say "1/7 Rendszerfrissítés és alapcsomagok"
apt-get update -qq
apt-get -y -qq upgrade
apt-get -y -qq install ca-certificates curl git ufw fail2ban unattended-upgrades chrony openssl jq >/dev/null
cat > /etc/apt/apt.conf.d/52redassistance-upgrades <<'EOF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' > /etc/apt/apt.conf.d/20auto-upgrades
timedatectl set-timezone Europe/Bucharest
ok "frissítve; automatikus biztonsági frissítés bekapcsolva; időzóna: Europe/Bucharest"

# ---------------------------------------------------------------- 2) tűzfal
say "2/7 Tűzfal"
LAN_CIDR=${LAN_CIDR:-$(ip -o -f inet route show scope link | awk '!/docker|br-/ {print $1; exit}')}
[ -n "$LAN_CIDR" ] || LAN_CIDR=$(ask "A szerviz belső hálója (pl. 192.168.1.0/24)")
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 80/tcp comment 'HTTP (tanúsítvány + átirányítás)' >/dev/null
ufw allow 443/tcp comment 'HTTPS' >/dev/null
ufw allow 443/udp comment 'HTTP/3' >/dev/null
ufw allow from "$LAN_CIDR" to any port 22 proto tcp comment 'SSH csak belső hálóról' >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban >/dev/null 2>&1
ok "kívülről: csak 80/443 · SSH: csak $LAN_CIDR · fail2ban aktív"
# Megjegyzés: a Docker a publikált portokat az ufw előtt kezeli — ezért az app és a Grafana
# szándékosan csak 127.0.0.1-en publikált (compose.edge.yml, compose.monitoring.yml); kívülre csak az edge (80/443) néz.

# ---------------------------------------------------------------- 3) Docker
say "3/7 Docker"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get -y -qq install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >/dev/null
fi
mkdir -p /etc/docker
[ -f /etc/docker/daemon.json ] || printf '{\n  "log-driver": "json-file",\n  "log-opts": {"max-size": "10m", "max-file": "5"},\n  "live-restore": true\n}\n' > /etc/docker/daemon.json
systemctl enable --now docker >/dev/null 2>&1
systemctl restart docker
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=500M\n' > /etc/systemd/journald.conf.d/10-redassistance.conf
systemctl restart systemd-journald
ok "$(docker --version | cut -d, -f1) · $(docker compose version --short)"

# ---------------------------------------------------------------- 4) deploy felhasználó + SSH
say "4/7 Felhasználó és SSH"
id "$DEPLOY_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash -G docker "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
H=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$H/.ssh"
SUDO_HOME=$(getent passwd "${SUDO_USER:-root}" | cut -d: -f6)
if [ -s "$SUDO_HOME/.ssh/authorized_keys" ] && [ ! -s "$H/.ssh/authorized_keys" ]; then
  cp "$SUDO_HOME/.ssh/authorized_keys" "$H/.ssh/authorized_keys"
fi
[ -f "$H/.ssh/authorized_keys" ] && chown "$DEPLOY_USER:$DEPLOY_USER" "$H/.ssh/authorized_keys" && chmod 600 "$H/.ssh/authorized_keys"
if [ -s "$H/.ssh/authorized_keys" ] || [ -s "$SUDO_HOME/.ssh/authorized_keys" ]; then
  printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin no\n' > /etc/ssh/sshd_config.d/10-redassistance.conf
  systemctl reload ssh 2>/dev/null || systemctl reload sshd
  ok "SSH: csak kulccsal, root-belépés tiltva"
else
  warn "még nincs SSH-kulcs → a jelszavas belépés MARAD (különben kizárnád magad). Kulcs hozzáadása után futtasd újra."
fi

# ---------------------------------------------------------------- 5) repó (Deploy Key, csak olvasás)
say "5/7 A rendszer letöltése (GitHub)"
KEY="$H/.ssh/github_deploy"
if [ ! -f "$KEY" ]; then
  sudo -u "$DEPLOY_USER" ssh-keygen -q -t ed25519 -N '' -C "redassistance-deploy@$(hostname)" -f "$KEY"
fi
sudo -u "$DEPLOY_USER" sh -c "printf 'Host github.com\n  IdentityFile %s\n  IdentitiesOnly yes\n' '$KEY' > '$H/.ssh/config'; chmod 600 '$H/.ssh/config'"
sudo -u "$DEPLOY_USER" sh -c "ssh-keyscan -t ed25519 github.com >> '$H/.ssh/known_hosts' 2>/dev/null"
mkdir -p "$BASE"; chown "$DEPLOY_USER:$DEPLOY_USER" "$BASE"
if [ ! -d "$BASE/.git" ]; then
  until sudo -u "$DEPLOY_USER" git ls-remote "$REPO_SSH" >/dev/null 2>&1; do
    echo ""
    echo "  Add hozzá ezt a kulcsot a GitHubon: repó → Settings → Deploy keys → Add deploy key"
    echo "  (Cím: RedAssistance szerver · \"Allow write access\" NE legyen bepipálva):"
    echo ""; cat "$KEY.pub"; echo ""
    ask "Ha hozzáadtad, nyomj Entert" >/dev/null
  done
  sudo -u "$DEPLOY_USER" git clone -q --branch "$BRANCH" "$REPO_SSH" "$BASE"
fi
ok "repó: $BASE (ág: $(sudo -u "$DEPLOY_USER" git -C "$BASE" rev-parse --abbrev-ref HEAD))"

# ---------------------------------------------------------------- 6) titkok és beállítások
say "6/7 Titkok és beállítások"
cd "$APP_DIR"
umask 077
mkdir -p ops/secrets
rnd() { openssl rand -hex "$1" | tr -d '\n'; }
[ -s ops/secrets/metrics_token ] || rnd 32 > ops/secrets/metrics_token
[ -s ops/secrets/grafana_admin_password ] || openssl rand -base64 18 | tr -d '\n/+=' > ops/secrets/grafana_admin_password
[ -e ops/secrets/smtp_password ] || printf 'nincs-beallitva' > ops/secrets/smtp_password
if [ ! -s .env.prod ]; then
  DOMAIN=${PUBLIC_DOMAIN:-$(ask "A rendszer címe (domain, pl. szerviz.pelda.ro — a DNS A-rekordja a szerviz fix IP-jére mutasson)")}
  MAIL=${ACME_EMAIL:-$(ask "E-mail a tanúsítvány-értesítésekhez")}
  sed -e "s|^APP_SECRET=.*|APP_SECRET=$(rnd 32)|" \
      -e "s|^TRUSTED_PROXIES=.*|TRUSTED_PROXIES=REMOTE_ADDR|" \
      -e "s|^DEFAULT_URI=.*|DEFAULT_URI=https://$DOMAIN|" \
      -e "s|^# METRICS_TOKEN=.*|METRICS_TOKEN_FILE=/run/secrets/metrics_token|" .env.prod.example > .env.prod
  printf 'PUBLIC_DOMAIN=%s\nACME_EMAIL=%s\nALERT_EMAIL_TO=%s\n' "$DOMAIN" "$MAIL" "$MAIL" >> .env.prod
fi
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BASE"
chmod 600 .env.prod ops/secrets/*
DOMAIN=$(sed -n 's/^PUBLIC_DOMAIN=//p' .env.prod)
ok "titkok: ops/secrets/ (600) · .env.prod (600) · domain: $DOMAIN"

# ---------------------------------------------------------------- 7) első indítás
say "7/7 Első indítás"
# Ha a GHCR-ben még nincs kép, helyben épít (első telepítés); később a CI tölti a kész képeket.
TAG=${APP_TAG:-local}
if [ "$TAG" = local ]; then
  sudo -u "$DEPLOY_USER" sh -c "cd '$APP_DIR' && APP_IMAGE=redassistance-admincore APP_TAG=local docker compose -f compose.yml build -q app"
  grep -q '^APP_IMAGE=' .env.prod || echo 'APP_IMAGE=redassistance-admincore' >> .env.prod
fi
sudo -u "$DEPLOY_USER" sh -c "cd '$APP_DIR' && ops/deploy.sh '$TAG'" || {
  warn "Az indítás nem lett kész — lásd fent. Gyakori ok: a DNS még nem mutat ide, vagy a routeren nincs továbbítva a 80/443."
  exit 1
}
sleep 5
if curl -sf -m 10 "https://$DOMAIN/health/ready" | grep -q '"status":"ok"'; then
  ok "KÉSZ: https://$DOMAIN — kívülről is elérhető, érvényes tanúsítvánnyal"
else
  warn "Belül fut, de https://$DOMAIN még nem válaszol: DNS-propagáció vagy router-továbbítás (80/443 → $(hostname -I | awk '{print $1}'))."
fi
echo ""
echo "  Grafana: ssh -L 3000:localhost:3000 $DEPLOY_USER@$(hostname -I | awk '{print $1}')  →  http://localhost:3000"
echo "           felhasználó: admin · jelszó: $APP_DIR/ops/secrets/grafana_admin_password"
echo "  Következő: mentés (OPERATIONS.md 5.) és riasztó e-mail (ops/secrets/smtp_password + .env.prod SMTP_*)."
