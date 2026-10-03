#!/bin/sh
# schedule  = naponta BACKUP_TIME-kor (helyi idő, TZ) mentés + visszaállítási próba
# run-now   = egy mentés azonnal (kézi / teszt)
# drill F M = visszaállítási próba egy meglévő dumpra (F) és manifestre (M)
set -eu
case "${1:-schedule}" in
  run-now) exec backup.sh ;;
  drill)   shift; exec restore-drill.sh "$@" ;;
  restore) shift; exec restore.sh "$@" ;;
  schedule)
    echo "mentő: naponta ${BACKUP_TIME} (${TZ})"
    while true; do
      now=$(date +%s)
      next=$(date -d "$(date +%Y-%m-%d) ${BACKUP_TIME}" +%s)
      [ "$next" -le "$now" ] && next=$((next + 86400))
      sleep $((next - now))
      backup.sh || echo "MENTÉS SIKERTELEN ($(date -Iseconds)) — a riasztás (RA_MentesElmaradt) jelez"
    done ;;
  *) exec "$@" ;;
esac
