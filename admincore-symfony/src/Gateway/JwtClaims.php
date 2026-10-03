<?php

namespace App\Gateway;

/**
 * A böngésző által küldött Supabase JWT állításai — ELLENŐRZÉS NÉLKÜL, csak naplózáshoz és
 * előszűréshez. Az aláírást a Supabase ellenőrzi minden továbbított kérésnél (hamis token → 401).
 */
final class JwtClaims
{
    /** @return array<string, mixed> */
    public static function fromAuthorizationHeader(?string $header): array
    {
        if (null === $header || !preg_match('/^Bearer\s+[\w-]+\.([\w-]+)\.[\w-]+$/', $header, $m)) {
            return [];
        }
        $json = base64_decode(strtr($m[1], '-_', '+/'), true);
        $claims = false === $json ? null : json_decode($json, true);

        return \is_array($claims) ? $claims : [];
    }
}
