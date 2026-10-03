<?php

namespace App\Ops;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Készenlét-ellenőrzés: tud-e a rendszer valóban kiszolgálni (nem csak fut-e a folyamat).
 * Használja: /health/ready (Docker / terheléselosztó) és /metrics (ra_ready, ra_check_ok).
 */
final class ReadinessChecker
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        #[Autowire('%env(ADMINCORE_SUPABASE_URL)%')]
        private readonly string $supabaseUrl,
        #[Autowire('%env(ADMINCORE_SUPABASE_KEY)%')]
        private readonly string $supabaseKey,
        #[Autowire('%kernel.logs_dir%')]
        private readonly string $logsDir,
        #[Autowire('%kernel.cache_dir%')]
        private readonly string $cacheDir,
    ) {
    }

    /** @return array{ok: bool, checks: array<string, array{ok: bool, ms?: int, error?: string}>} */
    public function check(): array
    {
        $checks = [
            'supabase' => $this->supabase(),
            'naplo_irhato' => $this->writable($this->logsDir),
            'cache_irhato' => $this->writable($this->cacheDir),
        ];

        return ['ok' => !\in_array(false, array_column($checks, 'ok'), true), 'checks' => $checks];
    }

    /** @return array{ok: bool, ms?: int, error?: string} */
    private function supabase(): array
    {
        $t = microtime(true);
        try {
            $r = $this->httpClient->request('GET', rtrim($this->supabaseUrl, '/').'/auth/v1/health', [
                'headers' => ['apikey' => $this->supabaseKey], 'timeout' => 3, 'max_duration' => 4,
            ]);
            $ok = 200 === $r->getStatusCode();

            return ['ok' => $ok, 'ms' => (int) round((microtime(true) - $t) * 1000)] + ($ok ? [] : ['error' => 'HTTP '.$r->getStatusCode()]);
        } catch (\Throwable $e) {
            return ['ok' => false, 'ms' => (int) round((microtime(true) - $t) * 1000), 'error' => 'nem érhető el'];
        }
    }

    /** @return array{ok: bool, error?: string} */
    private function writable(string $dir): array
    {
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            return ['ok' => false, 'error' => 'hiányzik'];
        }
        $probe = $dir.'/.ready-'.getmypid();
        $ok = false !== @file_put_contents($probe, '1');
        @unlink($probe);

        return $ok ? ['ok' => true] : ['ok' => false, 'error' => 'nem írható'];
    }
}
