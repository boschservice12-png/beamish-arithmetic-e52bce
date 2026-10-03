<?php

namespace App\Tests\Functional;

use App\Tests\Support\FakeSupabase;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Component\HttpClient\Response\MockResponse;

final class HealthTest extends WebTestCase
{
    protected function setUp(): void
    {
        FakeSupabase::reset();
    }

    public function testReadyWhenSupabaseUpAndDirsWritable(): void
    {
        $client = static::createClient();
        FakeSupabase::$responder = static fn () => new MockResponse('{"name":"GoTrue"}', ['http_code' => 200]);
        $client->request('GET', '/health/ready');

        self::assertResponseIsSuccessful();
        $j = json_decode($client->getResponse()->getContent(), true);
        self::assertSame('ok', $j['status']);
        self::assertTrue($j['checks']['supabase']['ok']);
        self::assertTrue($j['checks']['naplo_irhato']['ok']);
        self::assertStringEndsWith('/auth/v1/health', FakeSupabase::$requests[0]['url']);
    }

    public function testNotReadyWhenSupabaseDown(): void
    {
        $client = static::createClient();
        FakeSupabase::$responder = static fn () => throw new TransportException('down');
        $client->request('GET', '/health/ready');

        self::assertResponseStatusCodeSame(503);
        $j = json_decode($client->getResponse()->getContent(), true);
        self::assertFalse($j['checks']['supabase']['ok']);
        self::assertSame('nem érhető el', $j['checks']['supabase']['error']);
    }

    public function testLivenessNeedsNoUpstream(): void
    {
        $client = static::createClient();
        FakeSupabase::$responder = static fn () => throw new TransportException('down');
        $client->request('GET', '/health');
        self::assertResponseIsSuccessful();
        self::assertSame([], FakeSupabase::$requests);
    }
}
