<?php

namespace App\Controller;

use App\Ops\MetricsStore;
use App\Ops\ReadinessChecker;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Prometheus-végpont. Csak METRICS_TOKEN megadásával él (Authorization: Bearer …); token nélkül 404,
 * mintha nem is létezne. A készenléti állapotot (Supabase, napló, cache) minden lekéréskor élőben méri.
 */
final class MetricsController
{
    public function __construct(
        private readonly MetricsStore $store,
        private readonly ReadinessChecker $readiness,
        #[Autowire('%env(METRICS_TOKEN)%')]
        private readonly string $token,
        #[Autowire('%env(default::APP_VERSION)%')]
        private readonly ?string $version = null,
        // Docker-titokként is megadható: METRICS_TOKEN_FILE=/run/secrets/metrics_token
        #[Autowire('%env(default::METRICS_TOKEN_FILE)%')]
        private readonly ?string $tokenFile = null,
    ) {
    }

    private function token(): string
    {
        if ('' !== $this->token || null === $this->tokenFile || '' === $this->tokenFile) {
            return $this->token;
        }
        $t = @file_get_contents($this->tokenFile);

        return false === $t ? '' : trim($t);
    }

    #[Route('/metrics', name: 'metrics', methods: ['GET'])]
    public function __invoke(Request $request): Response
    {
        $given = (string) preg_replace('/^Bearer\s+/i', '', (string) $request->headers->get('authorization', ''));
        $token = $this->token();
        if ('' === $token) {
            return new Response('', Response::HTTP_NOT_FOUND);
        }
        if (!hash_equals($token, $given)) {
            return new Response('', Response::HTTP_UNAUTHORIZED, ['WWW-Authenticate' => 'Bearer']);
        }

        $out = [];
        $help = static function (string $name, string $type, string $text) use (&$out): void {
            $out[] = '# HELP '.$name.' '.$text;
            $out[] = '# TYPE '.$name.' '.$type;
        };

        $help('ra_build_info', 'gauge', 'Futó verzió (a konténer-kép címkéje).');
        $out[] = 'ra_build_info'.self::labels(['version' => $this->version ?: 'dev']).' 1';

        $r = $this->readiness->check();
        $help('ra_ready', 'gauge', '1 = ki tud szolgálni (Supabase elérhető, napló és cache írható).');
        $out[] = 'ra_ready '.($r['ok'] ? 1 : 0);
        $help('ra_check_ok', 'gauge', 'Egyes készenléti ellenőrzések eredménye.');
        foreach ($r['checks'] as $name => $c) {
            $out[] = 'ra_check_ok'.self::labels(['check' => $name]).' '.($c['ok'] ? 1 : 0);
        }
        $help('ra_check_duration_seconds', 'gauge', 'A készenléti ellenőrzés ideje.');
        foreach ($r['checks'] as $name => $c) {
            if (isset($c['ms'])) {
                $out[] = 'ra_check_duration_seconds'.self::labels(['check' => $name]).' '.self::num($c['ms'] / 1000);
            }
        }

        $snap = $this->store->snapshot();
        $texts = [
            'ra_http_requests_total' => 'HTTP-kérések útvonal, metódus és státuszosztály szerint.',
            'ra_gateway_requests_total' => 'Supabase-kapu kérések erőforrás és kimenet szerint (ok, client_error, server_error, denied, throttled, upstream_down).',
            'ra_login_total' => 'Belépések típus (jelszo, pin, iroda_kulcs) és eredmény (ok, fail, throttled) szerint.',
            'ra_asm_import_total' => 'ASM-importok forrás (manual, api) és eredmény szerint.',
        ];
        $byName = [];
        foreach ($snap['c'] as $key => $value) {
            [$name, $labels] = MetricsStore::parseKey($key);
            $byName[$name][] = $name.self::labels($labels).' '.self::num($value);
        }
        foreach ($texts as $name => $text) {
            $help($name, 'counter', $text);
            array_push($out, ...($byName[$name] ?? []));
        }

        $help('ra_http_request_duration_seconds', 'histogram', 'Válaszidő útvonalanként.');
        foreach ($snap['h'] as $key => $h) {
            [$name, $labels] = MetricsStore::parseKey($key);
            foreach (MetricsStore::BUCKETS as $i => $le) {
                $out[] = $name.'_bucket'.self::labels($labels + ['le' => self::num($le)]).' '.(int) ($h['b'][$i] ?? 0);
            }
            $out[] = $name.'_bucket'.self::labels($labels + ['le' => '+Inf']).' '.(int) $h['n'];
            $out[] = $name.'_sum'.self::labels($labels).' '.self::num($h['s']);
            $out[] = $name.'_count'.self::labels($labels).' '.(int) $h['n'];
        }

        $help('ra_asm_import_last_success_timestamp_seconds', 'gauge', 'Az utolsó sikeres ASM-import ideje (Unix).');
        foreach ($snap['g'] as $key => $value) {
            [$name, $labels] = MetricsStore::parseKey($key);
            if ('ra_asm_import_last_success_timestamp_seconds' === $name) {
                $out[] = $name.self::labels($labels).' '.self::num($value);
            }
        }

        return new Response(implode("\n", $out)."\n", 200, [
            'Content-Type' => 'text/plain; version=0.0.4; charset=utf-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    /** @param array<string, string> $labels */
    private static function labels(array $labels): string
    {
        if ([] === $labels) {
            return '';
        }
        $parts = [];
        foreach ($labels as $k => $v) {
            $parts[] = $k.'="'.str_replace(['\\', '"', "\n"], ['\\\\', '\\"', '\\n'], (string) $v).'"';
        }

        return '{'.implode(',', $parts).'}';
    }

    private static function num(float|int $v): string
    {
        return rtrim(rtrim(\sprintf('%.6F', $v), '0'), '.') ?: '0';
    }
}
