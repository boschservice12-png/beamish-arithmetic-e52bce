# RedAssistance — adatbázis-mentő: pg_dump 17 (= a Supabase szerververziója) + age titkosítás + rclone (off-site)
# Rögzített verziók, csomagtár nélkül (reprodukálható build).

FROM golang:1.25-alpine AS age
ENV CGO_ENABLED=0 GOFLAGS=-trimpath
# Opcionális build-titok TLS-ellenőrző proxy mögötti buildhez (csak ebben a build-lépcsőben, a kész képben nincs)
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -s /run/secrets/extra_ca ]; then cat /etc/ssl/certs/ca-certificates.crt /run/secrets/extra_ca > /tmp/ca.pem; export SSL_CERT_FILE=/tmp/ca.pem; fi; \
    go install -ldflags="-s -w" filippo.io/age/cmd/age@v1.2.1 \
 && go install -ldflags="-s -w" filippo.io/age/cmd/age-keygen@v1.2.1

FROM rclone/rclone:1.71 AS rclone

FROM postgres:17-alpine
COPY --from=age /go/bin/age /go/bin/age-keygen /usr/local/bin/
COPY --from=rclone /usr/local/bin/rclone /usr/local/bin/rclone
COPY --chmod=0755 entrypoint.sh backup.sh restore-drill.sh restore.sh /usr/local/bin/
RUN mkdir -p /backups /metrics && chown postgres:postgres /backups /metrics && chmod 0750 /backups && chmod 0755 /metrics
ENV TZ=Europe/Bucharest BACKUP_TIME=03:15 BACKUP_DIR=/backups METRICS_DIR=/metrics
USER postgres
WORKDIR /tmp
ENTRYPOINT ["entrypoint.sh"]
CMD ["schedule"]
