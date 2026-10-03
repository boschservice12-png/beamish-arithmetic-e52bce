#!/bin/sh
# Visszaállítási próba: a dumpot egy ideiglenes, helyi Postgresbe tölti, és MINDEN tábla sorszámát
# összeveti a mentéskor (ugyanazon a pillanatképen) rögzített manifesttel. Bármi eltérés = sikertelen.
#   restore-drill.sh <dump> <manifest>
# A Supabase szerepköreit (anon, authenticated, service_role, …) üres, belépni nem tudó szerepként hozza létre,
# hogy a jogosultságok és RLS-szabályok is visszaálljanak — így a próba a sémát is ellenőrzi, nem csak az adatot.
set -eu
DUMP=$1; MANIFEST=$2
ALLOWED=${RESTORE_ALLOWED_ERRORS:-0}
log() { echo "$(date '+%F %T') [próba] $*"; }

PGTMP=$(mktemp -d /tmp/proba.XXXXXX)
PORT=${DRILL_PORT:-55432}
cleanup() { pg_ctl -D "$PGTMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$PGTMP"; }
trap cleanup EXIT

initdb -D "$PGTMP/data" -U postgres --auth=trust --encoding=UTF8 --no-locale >/dev/null
pg_ctl -D "$PGTMP/data" -o "-p $PORT -k $PGTMP -c listen_addresses='' -c fsync=off -c full_page_writes=off -c max_wal_size=2GB" -l "$PGTMP/pg.log" -w start >/dev/null
P="psql -X -q -At -h $PGTMP -p $PORT -U postgres -v ON_ERROR_STOP=1"

attempt=1
while :; do
  $P -d postgres -c "drop database if exists proba" -c "create database proba template template0"
  pg_restore -h "$PGTMP" -p "$PORT" -U postgres -d proba --no-comments "$DUMP" > "$PGTMP/restore.out" 2>&1 || true
  # hiányzó szerepkörök (Supabase-specifikusak) → létrehozzuk, és újra
  missing=$(grep -oE 'role "[^"]+" does not exist' "$PGTMP/restore.out" | sed -E 's/role "([^"]+)".*/\1/' | sort -u)
  [ -z "$missing" ] && break
  [ $attempt -ge 3 ] && break
  for r in $missing; do
    $P -d postgres -c "do \$\$ begin if not exists (select 1 from pg_roles where rolname = '$r') then execute format('create role %I nologin', '$r'); end if; end \$\$"
  done
  log "Supabase-szerepkörök létrehozva: $(echo $missing | tr '\n' ' ')"
  attempt=$((attempt + 1))
done

errors=$(sed -nE 's/.*errors ignored on restore: ([0-9]+).*/\1/p' "$PGTMP/restore.out" | tail -1)
errors=${errors:-0}
if [ "$errors" -gt 0 ]; then
  log "pg_restore hibák: $errors (megengedett: $ALLOWED)"
  grep -E '^pg_restore: error' "$PGTMP/restore.out" | head -20
fi

# sorszámok a visszaállított adatbázisban, ugyanarra a táblalistára (hiányzó tábla → kimarad → eltérés)
psql -X -q -At -h "$PGTMP" -p "$PORT" -U postgres -d proba 2> "$PGTMP/count.err" <<SQL | grep "$(printf '\t')" | sort > "$PGTMP/restored.counts" || true
create temp table m (t text, n bigint);
\\copy m from '$MANIFEST'
select format('select %L || chr(9) || count(*) from %I.%I;', t, split_part(t, '.', 1), substr(t, length(split_part(t, '.', 1)) + 2))
  from m order by t \\gexec
SQL

if ! diff -u "$MANIFEST" "$PGTMP/restored.counts" > "$PGTMP/diff.txt"; then
  log "ELTÉRÉS a mentéskori és a visszaállított sorszámok között:"
  head -30 "$PGTMP/diff.txt"; cat "$PGTMP/count.err" | head -5
  exit 1
fi
if [ "$errors" -gt "$ALLOWED" ]; then
  log "SIKERTELEN: $errors visszaállítási hiba"
  exit 1
fi
log "SIKERES: $(wc -l < "$MANIFEST" | tr -d ' ') tábla, $(awk -F'\t' '{s += $2} END {print s + 0}' "$MANIFEST") sor — mind egyezik"
