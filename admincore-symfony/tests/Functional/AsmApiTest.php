<?php

namespace App\Tests\Functional;

use App\Tests\Support\FakeSupabase;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpClient\Response\MockResponse;

final class AsmApiTest extends WebTestCase
{
    private const PAYLOAD = '{"ho":"2026-09-01","fajlok":{"pers":"PersonalManopere.xls"},"osszesitok":{"total":{"tx":3,"nManop":100}},"sorok":[{"deviz_nr":"AAA1","data_exec":"2026-09-02","asm_nev":"01.ARNOLD TAMAS","norma_ora":1.5,"val_manopera":270,"tip":"AAA"}]}';

    protected function setUp(): void
    {
        FakeSupabase::reset();
    }

    public function testDisabledByDefault(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/asm/import', content: self::PAYLOAD);
        self::assertResponseStatusCodeSame(503);
        self::assertSame([], FakeSupabase::$requests);
    }

    public function testWrongTokenRejectedWithoutReachingSupabase(): void
    {
        $_SERVER['ASM_API_TOKEN'] = $_ENV['ASM_API_TOKEN'] = 'helyes-token';
        $_SERVER['ADMINCORE_SUPABASE_SERVICE_KEY'] = $_ENV['ADMINCORE_SUPABASE_SERVICE_KEY'] = 'service-kulcs';
        try {
            $client = static::createClient();
            $client->request('POST', '/api/asm/import', server: ['HTTP_AUTHORIZATION' => 'Bearer rossz'], content: self::PAYLOAD);
            self::assertResponseStatusCodeSame(401);
            self::assertSame([], FakeSupabase::$requests);
        } finally {
            unset($_SERVER['ASM_API_TOKEN'], $_ENV['ASM_API_TOKEN'], $_SERVER['ADMINCORE_SUPABASE_SERVICE_KEY'], $_ENV['ADMINCORE_SUPABASE_SERVICE_KEY']);
        }
    }

    public function testValidImportCallsTheSameDbFunctionWithApiSource(): void
    {
        $_SERVER['ASM_API_TOKEN'] = $_ENV['ASM_API_TOKEN'] = 'helyes-token';
        $_SERVER['ADMINCORE_SUPABASE_SERVICE_KEY'] = $_ENV['ADMINCORE_SUPABASE_SERVICE_KEY'] = 'service-kulcs';
        FakeSupabase::$responder = static fn () => new MockResponse('{"batch":7,"sorok":1,"parositatlan":[]}', ['http_code' => 200]);
        try {
            $client = static::createClient();
            $client->request('POST', '/api/asm/import', server: ['HTTP_AUTHORIZATION' => 'Bearer helyes-token'], content: self::PAYLOAD);
            self::assertResponseIsSuccessful();
            self::assertSame(7, json_decode($client->getResponse()->getContent(), true)['batch']);

            $sent = FakeSupabase::$requests[0];
            self::assertStringEndsWith('/rest/v1/rpc/f_asm_import', $sent['url']);
            $body = json_decode($sent['options']['body'], true);
            self::assertSame('api', $body['p_forras']);
            self::assertSame('2026-09-01', $body['p_ho']);
            self::assertCount(1, $body['p_sorok']);
            self::assertStringContainsString('apikey: service-kulcs', implode("\n", $sent['options']['headers']));
        } finally {
            unset($_SERVER['ASM_API_TOKEN'], $_ENV['ASM_API_TOKEN'], $_SERVER['ADMINCORE_SUPABASE_SERVICE_KEY'], $_ENV['ADMINCORE_SUPABASE_SERVICE_KEY']);
        }
    }

    public function testMalformedPayload(): void
    {
        $_SERVER['ASM_API_TOKEN'] = $_ENV['ASM_API_TOKEN'] = 'helyes-token';
        $_SERVER['ADMINCORE_SUPABASE_SERVICE_KEY'] = $_ENV['ADMINCORE_SUPABASE_SERVICE_KEY'] = 'service-kulcs';
        try {
            $client = static::createClient();
            $client->request('POST', '/api/asm/import', server: ['HTTP_AUTHORIZATION' => 'Bearer helyes-token'], content: '{"ho":"szept"}');
            self::assertResponseStatusCodeSame(422);
            self::assertSame([], FakeSupabase::$requests);
        } finally {
            unset($_SERVER['ASM_API_TOKEN'], $_ENV['ASM_API_TOKEN'], $_SERVER['ADMINCORE_SUPABASE_SERVICE_KEY'], $_ENV['ADMINCORE_SUPABASE_SERVICE_KEY']);
        }
    }
}
