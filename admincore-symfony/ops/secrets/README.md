# Titkok (NEM kerülnek gitbe)

Egy fájl = egy titok, sorvége nélkül. Létrehozás a szerveren:

```sh
cd ops/secrets
openssl rand -hex 32 | tr -d '\n' > metrics_token        # ugyanez kerül az app METRICS_TOKEN változójába
openssl rand -base64 24 | tr -d '\n' > grafana_admin_password
printf '%s' 'SMTP-JELSZÓ' > smtp_password                 # riasztó e-mailekhez
printf '%s' 'postgresql://…' > backup_db_url             # mentéshez: Supabase „Session pooler” / direct URL
chmod 600 *
```
