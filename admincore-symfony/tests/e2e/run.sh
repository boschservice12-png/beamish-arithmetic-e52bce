#!/bin/sh
# E2E futtatása: Supabase-utánzat + a valódi Symfony (prod mód, beépített PHP-szerver) + Playwright.
#   cd tests/e2e && npm ci && sh run.sh
set -eu
HERE=$(cd "$(dirname "$0")" && pwd); APP=$(cd "$HERE/../.." && pwd)
PORT=${E2E_PORT:-8765}; FAKE=${FAKE_SUPABASE_PORT:-8767}
[ -e "$APP/.env.local" ] && { echo "Van már $APP/.env.local — az e2e nem írja felül. Nevezd át ideiglenesen."; exit 2; }
printf 'APP_ENV=prod\nAPP_DEBUG=0\nAPP_SECRET=e2e-only\nADMINCORE_SUPABASE_URL=http://127.0.0.1:%s\nADMINCORE_GATEWAY=1\n' "$FAKE" > "$APP/.env.local"
cleanup() { kill "${PHP_PID:-}" "${FAKE_PID:-}" 2>/dev/null || true; rm -f "$APP/.env.local"; rm -rf "$APP/var/cache/prod"; }
trap cleanup EXIT INT TERM
rm -rf "$APP/var/cache/prod"
FAKE_SUPABASE_PORT=$FAKE node "$HERE/fake-supabase.mjs" & FAKE_PID=$!
env -u HTTPS_PROXY -u https_proxy -u HTTP_PROXY -u http_proxy php -S 127.0.0.1:$PORT -t "$APP/public" > "$HERE/php.log" 2>&1 & PHP_PID=$!
for _ in $(seq 1 50); do curl -sf -o /dev/null "http://127.0.0.1:$PORT/health" && break; sleep 0.2; done
BASE_URL="http://127.0.0.1:$PORT" node "$HERE/smoke.mjs"
