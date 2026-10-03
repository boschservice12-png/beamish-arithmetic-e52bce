<?php

namespace App\Controller;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Automatikus ASM-import (előkészítve). Ugyanazt az f_asm_import adatbázis-függvényt hívja, mint a pénzügyi
 * panel kézi importja, 'api' forrással és ugyanazzal a JSON-formátummal:
 *   POST /api/asm/import   Authorization: Bearer <ASM_API_TOKEN>
 *   { "ho": "2026-09-01", "fajlok": {...}, "osszesitok": { "total": {...}, "diszkont": -123.4 }, "sorok": [ {...}, ... ] }
 * Alapból KI van kapcsolva: csak akkor él, ha ASM_API_TOKEN és ADMINCORE_SUPABASE_SERVICE_KEY be van állítva
 * (.env.local / szerver-környezet — soha nem kerül a böngészőbe).
 */
final class AsmApiController
{
    private const MAX_BYTES = 15 * 1024 * 1024;

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        #[Autowire(service: 'monolog.logger.audit')]
        private readonly LoggerInterface $audit,
        #[Autowire('%env(ADMINCORE_SUPABASE_URL)%')]
        private readonly string $upstream,
        #[Autowire('%env(default::ASM_API_TOKEN)%')]
        private readonly ?string $apiToken,
        #[Autowire('%env(default::ADMINCORE_SUPABASE_SERVICE_KEY)%')]
        private readonly ?string $serviceKey,
    ) {
    }

    #[Route('/api/asm/import', name: 'asm_api_import', methods: ['POST'])]
    public function import(Request $request): Response
    {
        if (!$this->apiToken || !$this->serviceKey) {
            return new JsonResponse(['error' => 'Az ASM-API nincs bekapcsolva (ASM_API_TOKEN / ADMINCORE_SUPABASE_SERVICE_KEY)'], Response::HTTP_SERVICE_UNAVAILABLE);
        }
        $given = (string) preg_replace('/^Bearer\s+/i', '', (string) $request->headers->get('authorization', ''));
        if ('' === $given || !hash_equals($this->apiToken, $given)) {
            $this->audit->warning('asm_api.denied', ['ip' => $request->getClientIp()]);

            return new JsonResponse(['error' => 'Érvénytelen API-token'], Response::HTTP_UNAUTHORIZED);
        }
        if (\strlen($request->getContent()) > self::MAX_BYTES) {
            return new JsonResponse(['error' => 'Túl nagy kérés'], Response::HTTP_REQUEST_ENTITY_TOO_LARGE);
        }
        $p = json_decode($request->getContent(), true);
        if (!\is_array($p) || !\is_string($p['ho'] ?? null) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $p['ho'])
            || !\is_array($p['sorok'] ?? null) || !array_is_list($p['sorok'])) {
            return new JsonResponse(['error' => 'Formátum: { ho: "ÉÉÉÉ-HH-NN", fajlok: {}, osszesitok: {}, sorok: [] }'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $r = $this->httpClient->request('POST', rtrim($this->upstream, '/').'/rest/v1/rpc/f_asm_import', [
                'headers' => ['apikey' => $this->serviceKey, 'authorization' => 'Bearer '.$this->serviceKey, 'content-type' => 'application/json'],
                'json' => [
                    'p_ho' => $p['ho'], 'p_forras' => 'api',
                    'p_fajlok' => \is_array($p['fajlok'] ?? null) ? $p['fajlok'] : new \stdClass(),
                    'p_osszesitok' => \is_array($p['osszesitok'] ?? null) ? $p['osszesitok'] : new \stdClass(),
                    'p_sorok' => $p['sorok'],
                ],
                'timeout' => 120,
            ]);
            $status = $r->getStatusCode();
            $body = $r->getContent(false);
        } catch (TransportExceptionInterface $e) {
            $request->attributes->set('_ra_asm', ['source' => 'api', 'ok' => false]);
            $this->audit->error('asm_api.upstream_error', ['error' => $e->getMessage()]);

            return new JsonResponse(['error' => 'A Supabase nem érhető el'], Response::HTTP_BAD_GATEWAY);
        }

        $result = json_decode($body, true);
        $request->attributes->set('_ra_asm', ['source' => 'api', 'ok' => $status < 300]);
        $this->audit->info('asm_api.import', [
            'ho' => $p['ho'], 'sorok_bejott' => \count($p['sorok']), 'status' => $status,
            'batch' => $result['batch'] ?? null, 'sorok_betoltve' => $result['sorok'] ?? null, 'ip' => $request->getClientIp(),
        ]);

        return new JsonResponse($result ?? ['error' => 'Érvénytelen válasz'], $status);
    }
}
