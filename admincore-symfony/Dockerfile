# syntax=docker/dockerfile:1
# RedAssistance AdminCore — éles konténer (FrankenPHP = Caddy + PHP 8.3, egy folyamat)

# --- 1. függőségek (dev csomagok nélkül) ---
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock symfony.lock ./
# Opcionális build-titok vállalati/TLS-ellenőrző proxy mögötti buildhez (élesben nincs megadva):
#   docker build --secret id=extra_ca,src=/útvonal/ca.crt .
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -s /run/secrets/extra_ca ]; then export COMPOSER_CAFILE=/run/secrets/extra_ca; fi; \
    composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress
COPY . .
RUN composer dump-autoload --no-dev --classmap-authoritative --no-interaction

# --- 2. futtató kép ---
FROM dunglas/frankenphp:1-php8.3-alpine AS app
ARG APP_VERSION=dev
ENV APP_ENV=prod \
    APP_DEBUG=0 \
    APP_VERSION=${APP_VERSION} \
    SERVER_NAME=:8080 \
    XDG_CONFIG_HOME=/tmp/caddy-config \
    XDG_DATA_HOME=/tmp/caddy-data
# Az OPcache a képben van; további bővítmény nem kell (nincs letöltés a futtató képben).
# A frankenphp binárison lévő fájl-capability (alacsony port) eltávolítása: 8080-on fut, és így
# cap_drop: ALL + no-new-privileges mellett is elindul (a cp nem viszi át a capability-t).
RUN cp /usr/local/bin/frankenphp /tmp/frankenphp && mv /tmp/frankenphp /usr/local/bin/frankenphp && chmod 0755 /usr/local/bin/frankenphp
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/Caddyfile /etc/frankenphp/Caddyfile
WORKDIR /app
COPY --from=vendor --chown=www-data:www-data /app /app
# Gyorsítótár előmelegítése a build alatt (a titkos értékek futásidőben jönnek)
RUN APP_SECRET=build-only php bin/console cache:warmup --no-interaction \
 && mkdir -p var/log var/share \
 && chown -R www-data:www-data var
USER www-data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
LABEL org.opencontainers.image.title="redassistance-admincore" \
      org.opencontainers.image.version="${APP_VERSION}"
