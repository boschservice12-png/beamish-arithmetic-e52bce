#!/bin/sh
# Kézi visszaállítás (vészhelyzet). A titkos age-kulcs csak ilyenkor kerül a gépre, utána töröld.
#
#   restore.sh verify  <mentés.dump.age> <age-kulcs.txt>
#       visszafejti, ellenőrzi az ellenőrzőösszeget, és lefuttatja a teljes visszaállítási próbát (semmit nem ír az élesbe)
#
#   restore.sh extract <mentés.dump.age> <age-kulcs.txt> <séma.tábla> [kimenet.csv]
#       EGY tábla tartalma CSV-ben, a mentés pillanatából (pl. véletlenül törölt sorok visszahozásához)
#
#   restore.sh full    <mentés.dump.age> <age-kulcs.txt> <cél-adatbázis-URL>
#       teljes visszaállítás egy ÚJ, ÜRES Supabase-projektbe (a régi elveszett). Lásd OPERATIONS.md → Vészhelyzet.
set -eu
MODE=${1:?mód: verify | extract | full}; ENC=${2:?mentésfájl}; KEY=${3:?age titkos kulcs fájl}
log() { echo "$(date '+%F %T') [visszaállítás] $*"; }
WORK=$(mktemp -d /tmp/vissza.XXXXXX); trap 'rm -rf "$WORK"' EXIT
base=${ENC%.dump.age}

if [ -f "$base.sha256" ]; then
  ( cd "$(dirname "$ENC")" && sha256sum -c "$(basename "$base").sha256" ) || { log "HIBA: az ellenőrzőösszeg nem egyezik — sérült fájl"; exit 1; }
else
  log "figyelem: nincs .sha256 a mentés mellett — az épség nem ellenőrizhető"
fi
age -d -i "$KEY" -o "$WORK/db.dump" "$ENC"
log "visszafejtve: $(du -h "$WORK/db.dump" | cut -f1)"

case "$MODE" in
  verify)
    [ -f "$base.counts" ] || { log "HIBA: hiányzik $base.counts"; exit 1; }
    restore-drill.sh "$WORK/db.dump" "$base.counts" ;;
  extract)
    T=${4:?séma.tábla}; OUT=${5:-/backups/$(echo "$T" | tr . _)_$(basename "$base").csv}
    PGTMP=$(mktemp -d /tmp/kivon.XXXXXX); PORT=55433
    initdb -D "$PGTMP/data" -U postgres --auth=trust --encoding=UTF8 --no-locale >/dev/null
    pg_ctl -D "$PGTMP/data" -o "-p $PORT -k $PGTMP -c listen_addresses=''" -l "$PGTMP/pg.log" -w start >/dev/null
    trap 'pg_ctl -D "$PGTMP/data" -m immediate stop >/dev/null 2>&1; rm -rf "$PGTMP" "$WORK"' EXIT
    psql -X -q -h "$PGTMP" -p $PORT -U postgres -d postgres -c "create schema if not exists ${T%%.*}"
    pg_restore -h "$PGTMP" -p $PORT -U postgres -d postgres --no-owner --no-privileges --no-comments \
      -n "${T%%.*}" -t "${T#*.}" "$WORK/db.dump" 2> "$PGTMP/err" || true
    psql -X -q -h "$PGTMP" -p $PORT -U postgres -d postgres -c "\\copy $T to '$OUT' csv header"
    log "kész: $OUT ($(($(wc -l < "$OUT") - 1)) sor) — innen válogatva tölthető vissza (\\copy … from … csv header)" ;;
  full)
    TARGET=${4:?cél-adatbázis URL}
    log "TELJES visszaállítás ide: $(echo "$TARGET" | sed -E 's#//[^@]*@#//***@#')"
    printf 'Biztosan? A cél legyen ÚJ, ÜRES projekt. Írd be: VISSZAALLIT > '; read -r ok
    [ "$ok" = VISSZAALLIT ] || { log "megszakítva"; exit 1; }
    SCHEMAS=$( { echo public; pg_restore -l "$WORK/db.dump" | sed -nE 's/^[0-9]+; [0-9]+ [0-9]+ SCHEMA - ([a-z_0-9]+) .*/\1/p' | grep -vxE 'auth|storage|extensions'; } | sort -u)
    log "alkalmazás-sémák: $(echo $SCHEMAS)"
    # 1) bővítmények (a Supabase az extensions sémába teszi őket)
    for e in $(pg_restore -l "$WORK/db.dump" | sed -nE 's/.* EXTENSION - ([a-z_0-9-]+) .*/\1/p' | grep -vxE 'plpgsql|supabase_vault|pgsodium|pg_graphql'); do
      psql -X -q "$TARGET" -c "create extension if not exists \"$e\" schema extensions" || true
    done
    # 2) felhasználók (belépések) — előbb, mert az alkalmazás táblái hivatkozhatnak rájuk
    pg_restore -d "$TARGET" --data-only --no-owner --no-comments -n auth -t users -t identities "$WORK/db.dump" > "$WORK/out" 2>&1 || true
    # 3) az alkalmazás sémái: szerkezet, adat, jogosultságok, RLS
    NS=""; for x in $SCHEMAS; do NS="$NS -n $x"; done
    # shellcheck disable=SC2086
    pg_restore -d "$TARGET" --no-owner --no-comments $NS "$WORK/db.dump" >> "$WORK/out" 2>&1 || true
    grep -E 'error' "$WORK/out" | head -30 || true
    log "kész. Ellenőrizd: OPERATIONS.md → Vészhelyzet → ellenőrzőlista (sorszámok: $base.counts)" ;;
  *) log "ismeretlen mód: $MODE"; exit 2 ;;
esac
