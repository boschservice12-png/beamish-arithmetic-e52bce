<?php

namespace App\Controller;

use App\Gateway\GatewayPolicy;
use App\Gateway\JwtClaims;
use App\Gateway\PinLoginThrottle;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Supabase API-kapu: a böngésző a saját domainünkön (/sb/...) hívja a Supabase-t, mi továbbítjuk.
 *  - csak az engedélyezett táblák / függvények / auth végpontok mennek át (GatewayPolicy)
 *  - minden írás és bejelentkezés naplózva: ki, mikor, mit, milyen eredménnyel (var/log/audit-*.log)
 *  - a felhasználó saját tokenje megy tovább → a Supabase jogosultságai (RLS) változatlanul érvényesek
 *  - szerelő-telefon / Teendőim: PIN-belépés fékezve, a műveletek munkamenet szerint naplózva
 */
final class SupabaseGatewayController
{
    /** A böngészőtől továbbított fejlécek (PostgREST + GoTrue + supabase-js). */
    private const REQUEST_HEADERS = [
        'apikey', 'authorization', 'content-type', 'accept', 'prefer', 'range', 'range-unit',
        'accept-profile', 'content-profile', 'x-client-info', 'x-supabase-api-version',
    ];

    /** A böngészőnek visszaadott fejlécek. */
    private const RESPONSE_HEADERS = [
        'content-type', 'content-range', 'preference-applied', 'location', 'x-supabase-api-version',
    ];

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly GatewayPolicy $policy,
        private readonly PinLoginThrottle $throttle,
        #[Autowire(service: 'monolog.logger.audit')]
        private readonly LoggerInterface $audit,
        #[Autowire('%env(ADMINCORE_SUPABASE_URL)%')]
        private readonly string $upstream,
    ) {
    }

    #[Route('/sb/{service}/v1/{path}', name: 'supabase_gateway', requirements: ['service' => 'rest|auth', 'path' => '[a-z0-9_/]+'], methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'])]
    public function __invoke(Request $request, string $service, string $path): Response
    {
        $method = $request->getMethod();
        $grantType = 'auth' === $service ? $request->query->get('grant_type') : null;
        $decision = $this->policy->decide($service, $method, $path, $grantType);
        $claims = JwtClaims::fromAuthorizationHeader($request->headers->get('authorization'));
        $user = ['id' => $claims['sub'] ?? null, 'email' => $claims['email'] ?? null];

        if (!$decision->allowed || ($decision->requiresUser && null === $user['id'])) {
            $reason = $decision->allowed ? 'nincs bejelentkezve' : 'nem engedélyezett végpont';
            $this->audit->warning('gateway.denied', [
                'service' => $service, 'path' => $path, 'method' => $method, 'reason' => $reason,
                'user' => $user, 'ip' => $request->getClientIp(),
            ]);

            return new JsonResponse(['code' => 'GATEWAY_FORBIDDEN', 'message' => 'Gateway: '.$reason, 'details' => null, 'hint' => null], Response::HTTP_FORBIDDEN);
        }

        $body = $request->getContent();
        $args = self::jsonObject($body);
        $ip = (string) $request->getClientIp();
        $pinEmployee = 'pin:login' === $decision->resource ? (string) ($args['p_emp'] ?? '') : null;

        $keyLogin = 'pin:f_tf_ki' === $decision->resource;
        $retry = match (true) {
            null !== $pinEmployee => $this->throttle->retryAfter($pinEmployee, $ip),
            $keyLogin => $this->throttle->keyRetryAfter($ip),
            default => null,
        };
        if (null !== $retry) {
            $this->audit->warning('gateway.pin_throttled', ['employee' => $pinEmployee, 'resource' => $decision->resource, 'retry_after' => $retry, 'ip' => $ip]);

            return new JsonResponse(['code' => 'GATEWAY_RATE_LIMIT', 'message' => 'Túl sok hibás PIN. Próbáld újra később.', 'details' => null, 'hint' => null],
                Response::HTTP_TOO_MANY_REQUESTS, ['Retry-After' => (string) $retry]);
        }

        // A nyers query stringet adjuk tovább: a PostgREST-szűrők (or=(...), in.(...)) sorrendje és alakja számít.
        $query = (string) $request->server->get('QUERY_STRING', '');
        $url = rtrim($this->upstream, '/').'/'.$service.'/v1/'.$path.('' !== $query ? '?'.$query : '');
        $headers = [];
        foreach (self::REQUEST_HEADERS as $name) {
            if ($request->headers->has($name)) {
                $headers[$name] = $request->headers->get($name);
            }
        }

        $started = microtime(true);
        try {
            $upstream = $this->httpClient->request($method, $url, ['headers' => $headers, 'body' => $body, 'timeout' => 30]);
            $status = $upstream->getStatusCode();
            $content = 'HEAD' === $method ? '' : $upstream->getContent(false);
            $upstreamHeaders = $upstream->getHeaders(false);
        } catch (TransportExceptionInterface $e) {
            $this->audit->error('gateway.upstream_error', ['resource' => $decision->resource, 'method' => $method, 'error' => $e->getMessage(), 'user' => $user]);

            return new JsonResponse(['code' => 'GATEWAY_UPSTREAM', 'message' => 'A Supabase nem érhető el', 'details' => null, 'hint' => null], Response::HTTP_BAD_GATEWAY);
        }

        if (null !== $pinEmployee) {
            $session = self::jsonList($content)[0] ?? null;
            $ok = $status < 300 && \is_array($session) && isset($session['token']);
            $ok ? $this->throttle->success($pinEmployee) : $this->throttle->failure($pinEmployee, $ip);
            $this->audit->info($ok ? 'gateway.pin_login' : 'gateway.pin_login_failed', [
                'employee' => $pinEmployee,
                'name' => $ok ? ($session['name'] ?? null) : null,
                'session' => $ok ? self::sessionId((string) $session['token']) : null,
                'device' => $args['p_device'] ?? null,
                'status' => $status,
                'ip' => $ip,
            ]);
        } elseif ($keyLogin && [] === self::jsonList($content)) {
            // érvénytelen iroda-kulcs vagy lejárt munkamenet: üres válasz
            $this->throttle->keyFailure($ip);
            $this->audit->info('gateway.key_login_failed', ['status' => $status, 'ip' => $ip]);
        } elseif ($decision->audit && str_starts_with($decision->resource, 'pin:')) {
            $this->audit->info('gateway.write', [
                'resource' => $decision->resource,
                'method' => $method,
                'status' => $status,
                'ms' => (int) round((microtime(true) - $started) * 1000),
                'session' => self::sessionId((string) ($args['p_token'] ?? $args['p_key'] ?? '')),
                'fields' => array_map('strval', array_keys($args)),
                'ip' => $ip,
            ]);
        } elseif ($decision->audit) {
            $this->audit->info('gateway.write', [
                'resource' => $decision->resource,
                'method' => $method,
                'status' => $status,
                'ms' => (int) round((microtime(true) - $started) * 1000),
                'user' => 'auth:login' === $decision->resource ? ['id' => null, 'email' => self::loginEmail($body)] : $user,
                'filter' => 'auth' === $service ? null : ($query ?: null),
                'fields' => 'auth' === $service ? null : self::fieldNames($body),
                'ip' => $request->getClientIp(),
            ]);
        }

        $response = new Response($content, $status);
        foreach (self::RESPONSE_HEADERS as $name) {
            if (isset($upstreamHeaders[$name])) {
                $response->headers->set($name, $upstreamHeaders[$name]);
            }
        }
        $response->headers->set('Cache-Control', 'no-store');

        return $response;
    }

    /**
     * Csak a mezőnevek kerülnek a naplóba, az értékek soha (PIN, jelszó, személyes adat).
     *
     * @return list<string>|null
     */
    private static function fieldNames(string $body): ?array
    {
        $data = '' === $body ? null : json_decode($body, true);
        if (!\is_array($data)) {
            return null;
        }
        $row = array_is_list($data) ? ($data[0] ?? []) : $data;

        return \is_array($row) ? array_map('strval', array_keys($row)) : null;
    }

    /** @return array<string, mixed> */
    private static function jsonObject(string $body): array
    {
        $data = '' === $body ? null : json_decode($body, true);

        return \is_array($data) && !array_is_list($data) ? $data : [];
    }

    /** @return list<mixed> */
    private static function jsonList(string $body): array
    {
        $data = json_decode($body, true);

        return \is_array($data) && array_is_list($data) ? $data : [];
    }

    /**
     * A munkamenet-token maga belépési jog, ezért a naplóba csak a lenyomata kerül.
     * A pin_login sor ugyanezt a lenyomatot a dolgozó nevével rögzíti → minden művelet visszakövethető.
     */
    private static function sessionId(string $token): ?string
    {
        return '' === $token ? null : substr(hash('sha256', $token), 0, 12);
    }

    private static function loginEmail(string $body): ?string
    {
        $data = json_decode($body, true);

        return \is_array($data) && \is_string($data['email'] ?? null) ? $data['email'] : null;
    }
}
