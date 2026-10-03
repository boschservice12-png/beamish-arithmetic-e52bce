#!/bin/sh
# Telepítés a szerveren, automatikus visszaállással. A CI hívja SSH-n, de kézzel is futtatható:
#   ops/deploy.sh <kép-címke>          pl. ops/deploy.sh sha-1a2b3c4   vagy   ops/deploy.sh v1.4.0
#   ops/deploy.sh --rollback           vissza az előző sikeres címkére
# Lépések: kép letöltése → app csere → /health/ready 90 mp-ig → ha nem kész: vissza az előző címkére (exit 1).
# Állapot: .deploy/<projekt>/current, previous (melyik címke fut / futott), history (napló).
# Staging ugyanabból a checkoutból:
#   COMPOSE_PROJECT_NAME=redassistance-staging ENV_FILE=.env.staging APP_ENV_FILE=.env.staging \
#   EXTRA_COMPOSE=compose.staging.yml WITH_OPS=0 ops/deploy.sh <címke>
set -eu
cd "$(dirname "$0")/.."
ENV_FILE=${ENV_FILE:-.env.prod}
export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-redassistance}
FILES="-f compose.yml"
if [ "${WITH_OPS:-1}" = 1 ]; then   # monitoring + mentés csak az éles projekthez, ha a titkai megvannak
  [ -f ops/secrets/metrics_token ] && FILES="$FILES -f compose.monitoring.yml"
  [ -f ops/secrets/backup_db_url ] && FILES="$FILES -f compose.backup.yml"
fi
# saját szerver HTTPS-kapuval: ha az env-fájlban van PUBLIC_DOMAIN, a kapu is része a stacknek
grep -q '^PUBLIC_DOMAIN=.' "$ENV_FILE" 2>/dev/null && FILES="$FILES -f compose.edge.yml"
[ -n "${EXTRA_COMPOSE:-}" ] && FILES="$FILES -f $EXTRA_COMPOSE"
PORT=$(sed -n 's/^APP_PORT=//p' "$ENV_FILE" 2>/dev/null | tail -1); PORT=${PORT:-8080}
PORT=${DEPLOY_PORT:-$PORT}   # staging: DEPLOY_PORT=8081
ST=.deploy/$COMPOSE_PROJECT_NAME; mkdir -p "$ST"
log() { echo "$(date '+%F %T') [deploy] $*" | tee -a "$ST/history"; }

if [ "${1:-}" = "--rollback" ]; then
  TAG=$(cat "$ST/previous" 2>/dev/null) || { log "nincs előző címke"; exit 1; }
else
  TAG=${1:?kép-címke kell (pl. sha-1a2b3c4)}
fi
CUR=$(cat "$ST/current" 2>/dev/null || echo "")

ready() {
  i=0
  while [ $i -lt 45 ]; do
    if curl -sf -m 3 "http://127.0.0.1:$PORT/health/ready" | grep -q '"status":"ok"'; then return 0; fi
    sleep 2; i=$((i + 1))
  done
  return 1
}

log "telepítés: ${CUR:-(semmi)} → $TAG"
# shellcheck disable=SC2086
APP_TAG=$TAG docker compose $FILES --env-file "$ENV_FILE" pull app 2>/dev/null || {
  # shellcheck disable=SC2086
  IMG=$(APP_TAG=$TAG docker compose $FILES --env-file "$ENV_FILE" config --images 2>/dev/null | grep -m1 admincore)
  docker image inspect "$IMG" >/dev/null 2>&1 && log "helyben épített kép: $IMG" || { log "HIBA: a $TAG kép nem tölthető le"; exit 1; }
}
# shellcheck disable=SC2086
APP_TAG=$TAG docker compose $FILES --env-file "$ENV_FILE" pull --ignore-pull-failures --quiet 2>/dev/null || true
# shellcheck disable=SC2086
APP_TAG=$TAG docker compose $FILES --env-file "$ENV_FILE" up -d --remove-orphans
if ready; then
  [ -n "$CUR" ] && [ "$CUR" != "$TAG" ] && echo "$CUR" > "$ST/previous"
  echo "$TAG" > "$ST/current"
  log "KÉSZ: $TAG fut és kiszolgál"
  docker image prune -f >/dev/null 2>&1 || true
  exit 0
fi

log "HIBA: $TAG nem lett kész 90 mp alatt"
# shellcheck disable=SC2086
APP_TAG=$TAG docker compose $FILES --env-file "$ENV_FILE" logs --tail=60 app || true
if [ -n "$CUR" ] && [ "$CUR" != "$TAG" ]; then
  log "visszaállás: $CUR"
  # shellcheck disable=SC2086
  APP_TAG=$CUR docker compose $FILES --env-file "$ENV_FILE" up -d --remove-orphans
  ready && log "visszaállás KÉSZ: $CUR fut" || log "VISSZAÁLLÁS IS SIKERTELEN — kézi beavatkozás kell (OPERATIONS.md → Vészhelyzet)"
fi
exit 1
