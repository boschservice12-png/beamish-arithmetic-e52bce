#!/bin/sh
# Az Alertmanager nem ismeri a környezeti változókat → indításkor a konfigurációt kitöltjük.
# DEADMAN_URL (opcionális, pl. https://hc-ping.com/<uuid>): a „Watchdog” percenként pingeli; ha a monitoring
# leáll (szerver, Prometheus vagy Alertmanager), a külső szolgáltatás e-mailt küld — a riasztórendszer saját kiesése is látszik.
set -eu
OUT=/alertmanager/runtime.yml
sed -e "s|\${SMTP_SMARTHOST}|${SMTP_SMARTHOST}|g" -e "s|\${ALERT_EMAIL_FROM}|${ALERT_EMAIL_FROM}|g" \
    -e "s|\${SMTP_USER}|${SMTP_USER}|g" -e "s|\${ALERT_EMAIL_TO}|${ALERT_EMAIL_TO}|g" \
    /etc/alertmanager/alertmanager.yml > "$OUT"
if [ -n "${DEADMAN_URL:-}" ]; then
  printf '    webhook_configs:\n      - url: %s\n        send_resolved: false\n' "$DEADMAN_URL" >> "$OUT"
fi
exec /bin/alertmanager --config.file="$OUT" --storage.path=/alertmanager
