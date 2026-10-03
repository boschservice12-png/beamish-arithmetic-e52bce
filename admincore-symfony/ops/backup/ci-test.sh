#!/bin/sh
# A mentés → titkosítás → visszaállítási próba → kézi visszaállítás teljes láncának automatikus tesztje
# egy Supabase-szerű próbaadatbázison (ci-fixture.sql). Futtatás: ops/backup/ci-test.sh  (Docker kell)
set -eu
cd "$(dirname "$0")"
IMG=${BACKUP_TEST_IMAGE:-redassistance-backup:ci}
NET=ra-backup-ci-$$; DB=ra-backup-ci-db-$$; OUT=$(mktemp -d)
chmod 777 "$OUT"
cleanup() { docker rm -f "$DB" >/dev/null 2>&1 || true; docker network rm "$NET" >/dev/null 2>&1 || true; rm -rf "$OUT"; }
trap cleanup EXIT
ok() { echo "✓ $*"; }; die() { echo "✗ $*"; exit 1; }

docker network create "$NET" >/dev/null
docker run -d --name "$DB" --network "$NET" -e POSTGRES_PASSWORD=ci -v "$PWD/ci-fixture.sql:/docker-entrypoint-initdb.d/1.sql:ro" postgres:17-alpine >/dev/null
for _ in $(seq 1 60); do docker exec "$DB" pg_isready -U postgres -q 2>/dev/null && docker exec "$DB" psql -U postgres -Atc "select count(*) from fin.asm_manopera_tetel" 2>/dev/null | grep -q 5000 && break; sleep 1; done
ok "próbaadatbázis kész"

KEY=$(docker run --rm --entrypoint age-keygen "$IMG" 2>/dev/null)
echo "$KEY" > "$OUT/age.key"; RCPT=$(echo "$KEY" | sed -n 's/^# public key: //p')
RUN="docker run --rm --network $NET -v $OUT:/backups -v $OUT:/metrics -e BACKUP_DB_URL=postgresql://postgres:ci@$DB/postgres -e AGE_RECIPIENT=$RCPT"

$RUN "$IMG" run-now | tee "$OUT/run.log"
grep -q "mentés KÉSZ" "$OUT/run.log" || die "a mentés nem futott le"
grep -q "\[próba\] SIKERES" "$OUT/run.log" || die "a visszaállítási próba nem sikerült"
ok "mentés + automatikus visszaállítási próba"

ENC=$(ls "$OUT"/redassistance_*.dump.age | head -1); BASE=$(basename "${ENC%.dump.age}")
[ -s "$ENC" ] && [ -s "$OUT/$BASE.counts" ] && [ -s "$OUT/$BASE.sha256" ] || die "hiányzó mentésfájl"
head -c 30 "$ENC" | grep -q "age-encryption.org" || die "a mentés nincs titkosítva"
grep -aq "u1@szerviz.ro" "$ENC" && die "titkosítatlan személyes adat a mentésben"
ok "titkosítva (age), ellenőrzőösszeg megvan"

grep -qx "$(printf 'fin.asm_manopera_tetel\t5000')" "$OUT/$BASE.counts" || die "manifest: asm_manopera_tetel"
grep -qx "$(printf 'auth.users\t6')" "$OUT/$BASE.counts" || die "manifest: auth.users"
grep -qx "$(printf 'public.ures_tabla\t0')" "$OUT/$BASE.counts" || die "manifest: üres tábla"
grep -q "^realtime\.\|^vault\." "$OUT/$BASE.counts" && die "kezelt séma került a mentésbe"
ok "manifest: $(wc -l < "$OUT/$BASE.counts" | tr -d ' ') tábla, kezelt sémák kizárva"

grep -q "^ra_backup_last_status 1" "$OUT/ra_backup.prom" && grep -q "^ra_restore_test_last_success_timestamp_seconds" "$OUT/ra_backup.prom" || die "mérések"
ok "Prometheus textfile-mérések"

$RUN -v "$OUT/age.key:/tmp/age.key:ro" "$IMG" restore verify "/backups/$BASE.dump.age" /tmp/age.key | tee "$OUT/verify.log"
grep -q "\[próba\] SIKERES" "$OUT/verify.log" || die "kézi visszafejtés + próba"
ok "kézi visszafejtés (titkos kulccsal) + teljes próba"

$RUN -v "$OUT/age.key:/tmp/age.key:ro" "$IMG" restore extract "/backups/$BASE.dump.age" /tmp/age.key public.employees /backups/employees.csv >/dev/null
[ "$(($(wc -l < "$OUT/employees.csv") - 1))" = 25 ] && grep -q "ăâîșț" "$OUT/employees.csv" || die "egy tábla kinyerése"
ok "egy tábla kinyerése CSV-be (25 sor, ékezetek épek)"

# negatív próba: ha a mentés és a valóság eltér, a próbának el KELL buknia
sed -i "s/^public.employees\t25$/public.employees\t26/" "$OUT/$BASE.counts"
docker run --rm -v "$OUT:/backups" -v "$OUT/age.key:/tmp/age.key:ro" --entrypoint sh "$IMG" -c \
  "age -d -i /tmp/age.key -o /tmp/d.dump /backups/$BASE.dump.age && restore-drill.sh /tmp/d.dump /backups/$BASE.counts" > "$OUT/neg.log" 2>&1 \
  && die "a próba NEM vette észre az eltérést"
grep -q "ELTÉRÉS" "$OUT/neg.log" || die "negatív próba: rossz hibaüzenet"
ok "negatív próba: az eltérést észreveszi"

# negatív próba: hiányzó adatbázis-elérés → hiba + ra_backup_last_status 0, az előző siker ideje megmarad
docker run --rm --network "$NET" -v "$OUT:/backups" -v "$OUT:/metrics" -e BACKUP_DB_URL="postgresql://postgres:rossz@$DB/postgres" -e AGE_RECIPIENT="$RCPT" "$IMG" run-now > "$OUT/fail.log" 2>&1 && die "rossz jelszóval is sikeres lett"
grep -q "^ra_backup_last_status 0" "$OUT/ra_backup.prom" && grep -q "^ra_backup_last_success_timestamp_seconds" "$OUT/ra_backup.prom" || die "hiba-mérés"
ok "sikertelen mentés jelez (ra_backup_last_status 0), az utolsó siker ideje megmarad"
echo "MINDEN MENTÉSI TESZT SIKERES"
