#!/bin/sh
# RedAssistance — egy teljes adatbázis-mentés:
#  1) pg_dump (custom formátum) és MINDEN tábla sorszáma UGYANABBAN a pillanatképben (exportált snapshot)
#  2) visszaállítási próba egy ideiglenes, helyi Postgresbe → minden tábla sorszáma egyezik-e (restore-drill.sh)
#  3) titkosítás age-dzsel (a szerveren csak a NYILVÁNOS kulcs van; a titkos kulcs offline, Ferencnél)
#  4) megőrzés: 14 napi + 8 heti (vasárnap) + 12 havi (hónap 1.) · opcionális off-site másolat (rclone)
#  5) mérések a node-exporter textfile-gyűjtőjének → Prometheus-riasztás, ha elmarad
#
# Környezet:
#   BACKUP_DB_URL vagy BACKUP_DB_URL_FILE  postgresql://… (Supabase: Session pooler vagy direct — NEM transaction pooler)
#   AGE_RECIPIENT vagy AGE_RECIPIENT_FILE  age1… nyilvános kulcs (kötelező, titkosítatlan mentés nem marad a lemezen)
#   RCLONE_REMOTE                          pl. b2:redassistance-mentes (opcionális; rclone.conf: /config/rclone/rclone.conf)
#   BACKUP_DIR=/backups  METRICS_DIR=/metrics  RESTORE_ALLOWED_ERRORS=0
set -eu

log() { echo "$(date '+%F %T') $*"; }
read_secret() { eval "v=\${$1:-}"; eval "f=\${$1_FILE:-}"; if [ -z "$v" ] && [ -n "$f" ] && [ -r "$f" ]; then v=$(cat "$f"); fi; printf '%s' "$v"; }

DB_URL=$(read_secret BACKUP_DB_URL)
AGE_RCPT=$(read_secret AGE_RECIPIENT)
BACKUP_DIR=${BACKUP_DIR:-/backups}
METRICS_DIR=${METRICS_DIR:-/metrics}
[ -n "$DB_URL" ] || { log "HIBA: nincs BACKUP_DB_URL"; exit 2; }
[ -n "$AGE_RCPT" ] || { log "HIBA: nincs AGE_RECIPIENT (titkosítás nélkül nem mentünk)"; exit 2; }

# A Supabase saját, kezelt sémái: ezeket a Supabase maga építi fel, a mentésből nem kellenek
EXCLUDE_SCHEMAS="realtime _realtime vault pgsodium pgsodium_masks graphql graphql_public supabase_functions net cron _analytics pgbouncer"
EXCLUDE_ARGS=""; EXCLUDE_SQL="'pg_catalog','information_schema','pg_toast'"
for s in $EXCLUDE_SCHEMAS; do EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude-schema=$s"; EXCLUDE_SQL="$EXCLUDE_SQL,'$s'"; done

STAMP=$(date +%Y-%m-%d_%H%M)
WORK=$(mktemp -d /tmp/mentes.XXXXXX)
trap 'rm -rf "$WORK"' EXIT
DUMP="$WORK/redassistance_$STAMP.dump"
MANIFEST="$WORK/redassistance_$STAMP.counts"
STARTED=$(date +%s)
mkdir -p "$BACKUP_DIR" "$METRICS_DIR"

metrics() { # $1 = 1 siker / 0 hiba
  tmp="$METRICS_DIR/.ra_backup.prom.$$"
  {
    echo "# HELP ra_backup_last_status 1 = az utolsó mentés sikeres"
    echo "# TYPE ra_backup_last_status gauge"
    echo "ra_backup_last_status $1"
    echo "ra_backup_last_run_timestamp_seconds $(date +%s)"
    if [ "$1" = 1 ]; then
      echo "ra_backup_last_success_timestamp_seconds $(date +%s)"
      echo "ra_backup_last_size_bytes ${SIZE:-0}"
      echo "ra_backup_last_duration_seconds $(( $(date +%s) - STARTED ))"
      echo "ra_backup_tables ${TABLES:-0}"
      echo "ra_backup_rows ${ROWS:-0}"
      echo "ra_restore_test_last_success_timestamp_seconds $(date +%s)"
    elif [ -f "$METRICS_DIR/ra_backup.prom" ]; then
      grep -E '^ra_(backup_last_success_timestamp|backup_last_size|backup_last_duration|backup_tables|backup_rows|restore_test_last_success)' "$METRICS_DIR/ra_backup.prom" || true
    fi
  } > "$tmp" && mv "$tmp" "$METRICS_DIR/ra_backup.prom"
}
fail() { log "HIBA: $*"; metrics 0; exit 1; }

# --- 1) pillanatkép: egy nyitott REPEATABLE READ tranzakció exportálja; a dump és a számlálás is ezt látja ---
log "mentés indul ($STAMP)"
mkfifo "$WORK/q"
psql "$DB_URL" -X -q -At -v ON_ERROR_STOP=1 < "$WORK/q" > "$WORK/snap.out" 2> "$WORK/snap.err" &
PSQL_PID=$!
exec 3> "$WORK/q"
echo "begin isolation level repeatable read read only; select pg_export_snapshot();" >&3
i=0; SNAP=""
while [ $i -lt 300 ]; do
  SNAP=$(head -n1 "$WORK/snap.out" 2>/dev/null || true)
  [ -n "$SNAP" ] && break
  kill -0 $PSQL_PID 2>/dev/null || break
  sleep 0.2; i=$((i + 1))
done
[ -n "$SNAP" ] || { exec 3>&-; fail "nem sikerült pillanatképet nyitni: $(cat "$WORK/snap.err")"; }

# shellcheck disable=SC2086
if ! pg_dump "$DB_URL" --snapshot="$SNAP" --format=custom --compress=6 --no-comments \
      $EXCLUDE_ARGS --exclude-extension=supabase_vault --exclude-extension=pgsodium \
      --file="$DUMP" 2> "$WORK/dump.err"; then
  exec 3>&-; fail "pg_dump: $(tail -5 "$WORK/dump.err")"
fi

# minden mentett tábla sorszáma — ugyanabban a tranzakcióban, tehát ugyanazon a pillanatképen
cat >&3 <<SQL
\\pset tuples_only on
select format('select %L || chr(9) || count(*) from %I.%I;', n.nspname || '.' || c.relname, n.nspname, c.relname)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('r', 'p') and n.nspname not in ($EXCLUDE_SQL) and n.nspname not like 'pg\\_temp%'
   and not c.relispartition
 order by 1 \\gexec
commit;
SQL
exec 3>&-
wait $PSQL_PID || fail "számlálás: $(cat "$WORK/snap.err")"
tail -n +2 "$WORK/snap.out" | grep "$(printf '\t')" | sort > "$MANIFEST"
TABLES=$(wc -l < "$MANIFEST" | tr -d ' ')
ROWS=$(awk -F'\t' '{s += $2} END {print s + 0}' "$MANIFEST")
[ "$TABLES" -gt 0 ] || fail "a manifest üres"
log "dump kész: $(du -h "$DUMP" | cut -f1), $TABLES tábla, $ROWS sor"

# --- 2) visszaállítási próba ---
restore-drill.sh "$DUMP" "$MANIFEST" || fail "a visszaállítási próba NEM sikerült — a mentés nem megbízható"

# --- 3) titkosítás + ellenőrzőösszeg ---
OUT="$BACKUP_DIR/redassistance_$STAMP.dump.age"
age -r "$AGE_RCPT" -o "$OUT.part" "$DUMP" || fail "titkosítás"
mv "$OUT.part" "$OUT"
cp "$MANIFEST" "$BACKUP_DIR/redassistance_$STAMP.counts"
( cd "$BACKUP_DIR" && sha256sum "redassistance_$STAMP.dump.age" "redassistance_$STAMP.counts" > "redassistance_$STAMP.sha256" )
SIZE=$(stat -c %s "$OUT")
log "titkosítva: $OUT ($SIZE bájt)"

# --- 4) megőrzés: 14 napi + 8 heti (vasárnapi) + 12 havi (hónap 1-jei) ---
now=$(date +%s)
for f in "$BACKUP_DIR"/redassistance_*.dump.age; do
  [ -e "$f" ] || continue
  d=$(basename "$f" | sed -E 's/^redassistance_([0-9-]{10})_.*/\1/')
  t=$(date -d "$d" +%s 2>/dev/null) || continue
  age_days=$(( (now - t) / 86400 ))
  keep=0
  [ $age_days -lt 14 ] && keep=1
  [ $age_days -lt 56 ] && [ "$(date -d "$d" +%u)" = 7 ] && keep=1
  [ $age_days -lt 366 ] && [ "$(date -d "$d" +%d)" = 01 ] && keep=1
  if [ $keep = 0 ]; then
    base=${f%.dump.age}
    rm -f "$f" "$base.counts" "$base.sha256"
    log "törölve (megőrzésen túl): $(basename "$f")"
  fi
done

# --- 5) off-site másolat (3-2-1: a szerver elvesztése után is megvan) ---
if [ -n "${RCLONE_REMOTE:-}" ]; then
  rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE" --include "redassistance_$STAMP.*" --quiet \
    || fail "off-site másolat ($RCLONE_REMOTE)"
  log "off-site: $RCLONE_REMOTE"
fi

metrics 1
log "mentés KÉSZ: $(basename "$OUT") · $TABLES tábla · $ROWS sor · $(( $(date +%s) - STARTED )) mp"
