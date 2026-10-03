<?php

namespace App\Tests\Functional;

use App\Tests\Support\FakeSupabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Component\HttpClient\Response\MockResponse;

final class SupabaseGatewayTest extends WebTestCase
{
    private const USER_ID = '6f1b2c3d-0000-4000-8000-000000000001';
    private KernelBrowser $client;
    private string $auditFile;

    protected function setUp(): void
    {
        FakeSupabase::reset();
        $this->client = static::createClient();
        $this->auditFile = static::getContainer()->getParameter('kernel.logs_dir').'/audit-'.date('Y-m-d').'.log';
        @unlink($this->auditFile);
    }

    /** @param array<string, mixed> $claims */
    private static function jwt(array $claims): string
    {
        $b64 = static fn (string $s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');

        return 'Bearer '.$b64('{"alg":"HS256","typ":"JWT"}').'.'.$b64(json_encode($claims)).'.c2lnbmF0dXJl';
    }

    /** @return array<string, string> */
    private function userHeaders(): array
    {
        return [
            'HTTP_APIKEY' => 'sb_publishable_test',
            'HTTP_AUTHORIZATION' => self::jwt(['sub' => self::USER_ID, 'email' => 'ferenc@szkaliczki.local', 'role' => 'authenticated']),
            'HTTP_ACCEPT_PROFILE' => 'public',
            'HTTP_X_CLIENT_INFO' => 'supabase-js-web/2.0.0',
        ];
    }

    /** @return list<array<string, mixed>> */
    private function auditLines(): array
    {
        return is_file($this->auditFile)
            ? array_map(static fn (string $l) => json_decode($l, true), file($this->auditFile, \FILE_IGNORE_NEW_LINES | \FILE_SKIP_EMPTY_LINES))
            : [];
    }

    public function testPageUsesGatewayUrl(): void
    {
        $this->client->request('GET', '/');
        self::assertStringContainsString('window.ADMINCORE_CFG={"supabaseUrl":"http://localhost/sb","supabaseKey":"', $this->client->getResponse()->getContent());
    }

    public function testSelectIsForwardedVerbatimAndNotAudited(): void
    {
        FakeSupabase::$responder = static fn () => new MockResponse('[{"id":1}]', ['http_code' => 206, 'response_headers' => [
            'content-type' => 'application/json; charset=utf-8', 'content-range' => '0-0/1', 'set-cookie' => 'x=1',
        ]]);
        $qs = 'select=*&or=(block_date.eq.2026-10-03,status.in.(in_progress,paused))&order=created_at.desc';
        $this->client->request('GET', '/sb/rest/v1/prod_task?'.$qs, server: $this->userHeaders());

        self::assertResponseStatusCodeSame(206);
        self::assertSame('[{"id":1}]', $this->client->getResponse()->getContent());
        self::assertResponseHeaderSame('content-range', '0-0/1');
        self::assertResponseNotHasHeader('set-cookie');

        $sent = FakeSupabase::$requests[0];
        self::assertSame('GET', $sent['method']);
        self::assertSame('https://zwsjfzqtskicrukidaog.supabase.co/rest/v1/prod_task?'.$qs, $sent['url']);
        $h = implode("\n", $sent['options']['headers']);
        self::assertStringContainsString('apikey: sb_publishable_test', $h);
        self::assertStringContainsString('authorization: Bearer ', $h);
        self::assertStringContainsString('accept-profile: public', $h);
        self::assertStringNotContainsString('cookie', strtolower($h));
        self::assertSame([], $this->auditLines());
    }

    public function testWriteIsAuditedWithFieldNamesButNoValues(): void
    {
        $this->client->request('PATCH', '/sb/rest/v1/prod_task?id=eq.42', server: $this->userHeaders() + ['CONTENT_TYPE' => 'application/json', 'HTTP_PREFER' => 'return=minimal'],
            content: '{"status":"closed","closed_by":"Gipsz Jakab"}');

        self::assertResponseIsSuccessful();
        self::assertSame('{"status":"closed","closed_by":"Gipsz Jakab"}', FakeSupabase::$requests[0]['options']['body']);
        [$line] = $this->auditLines();
        self::assertSame('gateway.write', $line['message']);
        self::assertSame('table:prod_task', $line['context']['resource']);
        self::assertSame('PATCH', $line['context']['method']);
        self::assertSame('id=eq.42', $line['context']['filter']);
        self::assertSame(['status', 'closed_by'], $line['context']['fields']);
        self::assertSame(self::USER_ID, $line['context']['user']['id']);
        self::assertStringNotContainsString('Gipsz Jakab', file_get_contents($this->auditFile));
    }

    public function testPinIsNeverWrittenToAuditLog(): void
    {
        $this->client->request('POST', '/sb/rest/v1/rpc/f_set_pin', server: $this->userHeaders() + ['CONTENT_TYPE' => 'application/json'],
            content: '{"p_emp":"e1","p_pin":"987654"}');

        self::assertResponseIsSuccessful();
        [$line] = $this->auditLines();
        self::assertSame('rpc:f_set_pin', $line['context']['resource']);
        self::assertSame(['p_emp', 'p_pin'], $line['context']['fields']);
        self::assertStringNotContainsString('987654', file_get_contents($this->auditFile));
    }

    public function testLoginIsAuditedWithoutPassword(): void
    {
        $this->client->request('POST', '/sb/auth/v1/token?grant_type=password', server: ['HTTP_APIKEY' => 'k', 'CONTENT_TYPE' => 'application/json'],
            content: '{"email":"yvonne@szkaliczki.local","password":"Titok-123"}');

        self::assertResponseIsSuccessful();
        self::assertSame('https://zwsjfzqtskicrukidaog.supabase.co/auth/v1/token?grant_type=password', FakeSupabase::$requests[0]['url']);
        [$line] = $this->auditLines();
        self::assertSame('auth:login', $line['context']['resource']);
        self::assertSame('yvonne@szkaliczki.local', $line['context']['user']['email']);
        self::assertStringNotContainsString('Titok-123', file_get_contents($this->auditFile));
    }

    #[DataProvider('forbiddenRequests')]
    public function testForbiddenRequestsNeverReachSupabase(string $method, string $uri, bool $withUser): void
    {
        $this->client->request($method, $uri, server: $withUser ? $this->userHeaders() : ['HTTP_APIKEY' => 'k']);

        self::assertResponseStatusCodeSame(403);
        self::assertSame('GATEWAY_FORBIDDEN', json_decode($this->client->getResponse()->getContent(), true)['code']);
        self::assertSame([], FakeSupabase::$requests);
        self::assertSame('gateway.denied', $this->auditLines()[0]['message']);
    }

    /** @return iterable<string, array{string, string, bool}> */
    public static function forbiddenRequests(): iterable
    {
        yield 'ismeretlen tábla' => ['GET', '/sb/rest/v1/finance_havi_snapshot', true];
        yield 'ismeretlen függvény' => ['POST', '/sb/rest/v1/rpc/f_drop_everything', true];
        yield 'regisztráció' => ['POST', '/sb/auth/v1/signup', false];
        yield 'admin auth API' => ['GET', '/sb/auth/v1/admin/users', true];
        yield 'bejelentkezés nélküli olvasás' => ['GET', '/sb/rest/v1/employees', false];
        yield 'bejelentkezés nélküli pénzügyi jelentés' => ['POST', '/sb/rest/v1/rpc/f_gazdasagi_jelentes_utolso', false];
        yield 'bejelentkezés nélküli irányelv' => ['POST', '/sb/rest/v1/rpc/f_iranyelv_uj', false];
        yield 'PUT táblára' => ['PUT', '/sb/rest/v1/employees', true];
        yield 'ismeretlen grant' => ['POST', '/sb/auth/v1/token?grant_type=id_token', false];
    }

    public function testUpstreamOutageReturns502(): void
    {
        FakeSupabase::$responder = static fn () => throw new TransportException('Connection refused');
        $this->client->request('GET', '/sb/rest/v1/employees?select=id', server: $this->userHeaders());

        self::assertResponseStatusCodeSame(502);
        self::assertSame('GATEWAY_UPSTREAM', json_decode($this->client->getResponse()->getContent(), true)['code']);
    }

    public function testUpstreamErrorStatusIsPassedThrough(): void
    {
        FakeSupabase::$responder = static fn () => new MockResponse('{"code":"42501","message":"permission denied"}', ['http_code' => 401, 'response_headers' => ['content-type' => 'application/json']]);
        $this->client->request('DELETE', '/sb/rest/v1/hr_verif_lista?id=eq.5', server: $this->userHeaders());

        self::assertResponseStatusCodeSame(401);
        self::assertSame(401, $this->auditLines()[0]['context']['status']);
    }
}
