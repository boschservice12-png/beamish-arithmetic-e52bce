<?php

namespace App\Tests\Functional;

use App\Tests\Support\FakeSupabase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpClient\Response\MockResponse;

final class MetricsTest extends WebTestCase
{
    private const AUTH = ['HTTP_AUTHORIZATION' => 'Bearer test-metrics-token'];

    protected function setUp(): void
    {
        FakeSupabase::reset();
        @unlink(\dirname(__DIR__, 2).'/var/log/metrics.json');
    }

    private function scrape(KernelBrowser $client): string
    {
        $client->request('GET', '/metrics', server: self::AUTH);
        self::assertResponseIsSuccessful();

        return (string) $client->getResponse()->getContent();
    }

    public function testDisabledWithoutToken(): void
    {
        $prev = [$_SERVER['METRICS_TOKEN'] ?? null, $_ENV['METRICS_TOKEN'] ?? null];
        $_SERVER['METRICS_TOKEN'] = $_ENV['METRICS_TOKEN'] = '';
        try {
            $client = static::createClient();
            $client->request('GET', '/metrics', server: self::AUTH);
            self::assertResponseStatusCodeSame(404);
        } finally {
            [$_SERVER['METRICS_TOKEN'], $_ENV['METRICS_TOKEN']] = $prev;
        }
    }

    public function testTokenFromDockerSecretFile(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'mt');
        file_put_contents($file, "fajl-token\n");
        $prev = [$_SERVER['METRICS_TOKEN'] ?? null, $_ENV['METRICS_TOKEN'] ?? null];
        $_SERVER['METRICS_TOKEN'] = $_ENV['METRICS_TOKEN'] = '';
        $_SERVER['METRICS_TOKEN_FILE'] = $_ENV['METRICS_TOKEN_FILE'] = $file;
        try {
            $client = static::createClient();
            FakeSupabase::$responder = static fn () => new MockResponse('{}', ['http_code' => 200]);
            $client->request('GET', '/metrics', server: ['HTTP_AUTHORIZATION' => 'Bearer fajl-token']);
            self::assertResponseIsSuccessful();
            $client->request('GET', '/metrics', server: self::AUTH);
            self::assertResponseStatusCodeSame(401);
        } finally {
            [$_SERVER['METRICS_TOKEN'], $_ENV['METRICS_TOKEN']] = $prev;
            unset($_SERVER['METRICS_TOKEN_FILE'], $_ENV['METRICS_TOKEN_FILE']);
            @unlink($file);
        }
    }

    public function testWrongTokenRejected(): void
    {
        $client = static::createClient();
        $client->request('GET', '/metrics', server: ['HTTP_AUTHORIZATION' => 'Bearer rossz']);
        self::assertResponseStatusCodeSame(401);
        $client->request('GET', '/metrics');
        self::assertResponseStatusCodeSame(401);
    }

    public function testExpositionContainsReadinessAndTraffic(): void
    {
        $client = static::createClient();
        FakeSupabase::$responder = static function (string $method, string $url) {
            if (str_ends_with($url, '/auth/v1/health')) {
                return new MockResponse('{}', ['http_code' => 200]);
            }

            return new MockResponse('{"error":"invalid_grant"}', ['http_code' => 400]);
        };

        $client->request('GET', '/health');
        $client->request('POST', '/sb/auth/v1/token?grant_type=password', content: '{"email":"a@b.c","password":"x"}');
        $client->request('GET', '/sb/rest/v1/nem_engedelyezett_tabla');
        self::assertResponseStatusCodeSame(403);

        $m = $this->scrape($client);
        self::assertStringContainsString('text/plain; version=0.0.4', (string) $client->getResponse()->headers->get('content-type'));
        self::assertStringContainsString("ra_ready 1\n", $m);
        self::assertStringContainsString('ra_check_ok{check="supabase"} 1', $m);
        self::assertStringContainsString('ra_http_requests_total{method="GET",route="health",status="2xx"} 1', $m);
        self::assertStringContainsString('ra_login_total{result="fail",type="jelszo"} 1', $m);
        self::assertStringContainsString('ra_gateway_requests_total{outcome="client_error",resource="auth:login"} 1', $m);
        self::assertStringContainsString('ra_gateway_requests_total{outcome="denied",resource="-"} 1', $m);
        self::assertStringContainsString('ra_http_request_duration_seconds_bucket{route="health",le="+Inf"} 1', $m);
        self::assertStringContainsString('ra_http_request_duration_seconds_count{route="health"} 1', $m);
        // a lekérés önmagát nem számolja, és nincs benne felhasználó / IP / e-mail
        self::assertStringNotContainsString('route="metrics"', $m);
        self::assertStringNotContainsString('a@b.c', $m);
        self::assertStringNotContainsString('127.0.0.1', $m);
    }

    public function testNotReadyIsVisible(): void
    {
        $client = static::createClient();
        FakeSupabase::$responder = static fn () => new MockResponse('', ['http_code' => 503]);
        $m = $this->scrape($client);
        self::assertStringContainsString("ra_ready 0\n", $m);
        self::assertStringContainsString('ra_check_ok{check="supabase"} 0', $m);
    }
}
