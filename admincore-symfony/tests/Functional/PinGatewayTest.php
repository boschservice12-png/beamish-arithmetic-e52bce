<?php

namespace App\Tests\Functional;

use App\Tests\Support\FakeSupabase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpClient\Response\MockResponse;

/** Szerelő-telefon / Teendőim: PIN-belépés és munkamenet-tokenes hívások a gatewayen át. */
final class PinGatewayTest extends WebTestCase
{
    private const EMP = '11111111-2222-4333-8444-555555555555';
    private const TOKEN = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    private KernelBrowser $client;
    private string $auditFile;

    protected function setUp(): void
    {
        FakeSupabase::reset();
        $this->client = static::createClient();
        $this->client->disableReboot();
        static::getContainer()->get('cache.rate_limiter')->clear();
        $this->auditFile = static::getContainer()->getParameter('kernel.logs_dir').'/audit-'.date('Y-m-d').'.log';
        @unlink($this->auditFile);
        // a valódi f_pin_login viselkedése: jó PIN → [{token,...}], rossz PIN → 400 P0001
        FakeSupabase::$responder = static function (string $method, string $url, array $options) {
            if (str_ends_with($url, '/rpc/f_pin_login')) {
                return str_contains($options['body'], '"p_pin":"4321"')
                    ? new MockResponse(json_encode([['token' => self::TOKEN, 'employee_id' => self::EMP, 'name' => 'Kovács Tamás', 'expires_at' => '2026-10-04T06:00:00Z']]), ['http_code' => 200])
                    : new MockResponse('{"code":"P0001","message":"Hibas PIN"}', ['http_code' => 400]);
            }

            return new MockResponse('[]', ['http_code' => 200]);
        };
    }

    private function login(string $pin, string $emp = self::EMP, string $ip = '10.0.0.7'): int
    {
        $this->client->request('POST', '/sb/rest/v1/rpc/f_pin_login', server: ['HTTP_APIKEY' => 'k', 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => $ip],
            content: json_encode(['p_emp' => $emp, 'p_pin' => $pin, 'p_device' => 'Android 14']));

        return $this->client->getResponse()->getStatusCode();
    }

    /** @return list<array<string, mixed>> */
    private function audit(): array
    {
        return is_file($this->auditFile)
            ? array_map(static fn (string $l) => json_decode($l, true), file($this->auditFile, \FILE_IGNORE_NEW_LINES | \FILE_SKIP_EMPTY_LINES))
            : [];
    }

    public function testSuccessfulLoginIsAuditedWithSessionFingerprintOnly(): void
    {
        self::assertSame(200, $this->login('4321'));
        self::assertStringContainsString(self::TOKEN, $this->client->getResponse()->getContent());

        [$line] = $this->audit();
        self::assertSame('gateway.pin_login', $line['message']);
        self::assertSame(self::EMP, $line['context']['employee']);
        self::assertSame('Kovács Tamás', $line['context']['name']);
        self::assertSame(substr(hash('sha256', self::TOKEN), 0, 12), $line['context']['session']);
        $raw = file_get_contents($this->auditFile);
        self::assertStringNotContainsString(self::TOKEN, $raw);
        self::assertStringNotContainsString('4321', $raw);
    }

    public function testSixthWrongPinIsBlockedBeforeReachingSupabase(): void
    {
        for ($i = 0; $i < 5; ++$i) {
            self::assertSame(400, $this->login('000'.$i));
        }
        self::assertSame(429, $this->login('4321'), 'a helyes PIN is tiltott, amíg a fék aktív');
        self::assertResponseHasHeader('Retry-After');
        self::assertSame('GATEWAY_RATE_LIMIT', json_decode($this->client->getResponse()->getContent(), true)['code']);
        self::assertCount(5, FakeSupabase::$requests, 'a 6. kérés nem ment ki');
        self::assertSame('gateway.pin_throttled', array_slice($this->audit(), -1)[0]['message']);
    }

    public function testEmptyAnswerFromDbBrakeCountsAsFailure(): void
    {
        // Az adatbázis-szintű PIN-fék (pin_brake) API-hívásra hibás PIN-nél 200 + [] választ ad kivétel helyett.
        FakeSupabase::$responder = static fn () => new MockResponse('[]', ['http_code' => 200]);
        for ($i = 0; $i < 5; ++$i) {
            self::assertSame(200, $this->login('000'.$i));
        }
        self::assertSame(429, $this->login('4321'));
        self::assertSame('gateway.pin_login_failed', $this->audit()[0]['message']);
    }

    public function testOtherEmployeeIsNotBlockedByOneEmployeesFailures(): void
    {
        for ($i = 0; $i < 5; ++$i) {
            $this->login('000'.$i);
        }
        self::assertSame(200, $this->login('4321', '99999999-2222-4333-8444-555555555555'));
    }

    public function testSuccessResetsTheEmployeeCounter(): void
    {
        for ($i = 0; $i < 4; ++$i) {
            $this->login('000'.$i);
        }
        self::assertSame(200, $this->login('4321'));
        for ($i = 0; $i < 4; ++$i) {
            self::assertSame(400, $this->login('000'.$i));
        }
    }

    public function testIpLimitStopsSprayingAcrossEmployees(): void
    {
        for ($i = 0; $i < 30; ++$i) {
            $this->login('0000', sprintf('%08d-2222-4333-8444-555555555555', $i));
        }
        self::assertSame(429, $this->login('4321', '77777777-2222-4333-8444-555555555555'));
        self::assertSame(200, $this->login('4321', '77777777-2222-4333-8444-555555555555', '10.0.0.8'), 'más IP-ről mehet');
    }

    public function testWrongOfficeKeysAreThrottledPerIp(): void
    {
        for ($i = 0; $i < 30; ++$i) {
            $this->client->request('POST', '/sb/rest/v1/rpc/f_tf_ki', server: ['HTTP_APIKEY' => 'k', 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '10.0.0.9'],
                content: json_encode(['p_key' => 'probalkozas-'.$i]));
            self::assertResponseIsSuccessful();
        }
        $this->client->request('POST', '/sb/rest/v1/rpc/f_tf_ki', server: ['HTTP_APIKEY' => 'k', 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '10.0.0.9'],
            content: json_encode(['p_key' => 'a-helyes-kulcs']));
        self::assertResponseStatusCodeSame(429);
        self::assertCount(30, FakeSupabase::$requests);
        self::assertStringNotContainsString('probalkozas-', file_get_contents($this->auditFile));
    }

    public function testValidOfficeKeyIsNotCountedAsFailure(): void
    {
        FakeSupabase::$responder = static fn () => new MockResponse('[{"id":"k1","nev":"Yvonne","szerep":"hr"}]', ['http_code' => 200]);
        for ($i = 0; $i < 40; ++$i) {
            $this->client->request('POST', '/sb/rest/v1/rpc/f_tf_ki', server: ['HTTP_APIKEY' => 'k', 'CONTENT_TYPE' => 'application/json'], content: '{"p_key":"jo-kulcs"}');
            self::assertResponseIsSuccessful();
        }
    }

    public function testSessionWriteIsAuditedWithoutToken(): void
    {
        $this->client->request('POST', '/sb/rest/v1/rpc/f_task_finish', server: ['HTTP_APIKEY' => 'k', 'CONTENT_TYPE' => 'application/json'],
            content: json_encode(['p_token' => self::TOKEN, 'p_task' => 't-1', 'p_note' => 'kész']));

        self::assertResponseIsSuccessful();
        [$line] = $this->audit();
        self::assertSame('pin:f_task_finish', $line['context']['resource']);
        self::assertSame(substr(hash('sha256', self::TOKEN), 0, 12), $line['context']['session']);
        self::assertSame(['p_token', 'p_task', 'p_note'], $line['context']['fields']);
        self::assertStringNotContainsString(self::TOKEN, file_get_contents($this->auditFile));
    }

    public function testSessionReadIsNotAudited(): void
    {
        $this->client->request('POST', '/sb/rest/v1/rpc/f_my_tasks_on', server: ['HTTP_APIKEY' => 'k', 'CONTENT_TYPE' => 'application/json'],
            content: json_encode(['p_token' => self::TOKEN, 'p_date' => '2026-10-03']));
        self::assertResponseIsSuccessful();
        self::assertSame([], $this->audit());
    }

    public function testMechanicListIsReachableBeforeLoginButOfficeFunctionsAreNot(): void
    {
        $this->client->request('POST', '/sb/rest/v1/rpc/f_szerelok', server: ['HTTP_APIKEY' => 'k']);
        self::assertResponseIsSuccessful();

        $this->client->request('POST', '/sb/rest/v1/rpc/f_kalap', server: ['HTTP_APIKEY' => 'k']);
        self::assertResponseStatusCodeSame(403);
        $this->client->request('POST', '/sb/rest/v1/rpc/f_set_pin', server: ['HTTP_APIKEY' => 'k']);
        self::assertResponseStatusCodeSame(403);
    }

    public function testPhonePagesAndLegacyRedirects(): void
    {
        foreach (['/szerelo' => 'assets/szerelo/js/01-app.js', '/teendoim' => 'assets/teendoim/js/01-app.js'] as $uri => $js) {
            $this->client->request('GET', $uri);
            self::assertResponseIsSuccessful();
            $html = $this->client->getResponse()->getContent();
            self::assertStringContainsString('window.ADMINCORE_CFG={"supabaseUrl":"http://localhost/sb"', $html);
            self::assertMatchesRegularExpression('#<script src="/'.preg_quote($js, '#').'\?v=\w{10}"></script>#', $html);
        }
        $this->client->request('GET', '/szerelo-telefon.html');
        self::assertResponseRedirects('/szerelo', 301);
        $this->client->request('GET', '/teendoim.html');
        self::assertResponseRedirects('/teendoim', 301);
    }
}
