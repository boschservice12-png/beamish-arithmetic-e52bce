<?php

namespace App\Tests\Support;

use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Contracts\HttpClient\ResponseInterface;

/** Teszt-Supabase: rögzíti a kapott kéréseket, és előre beállított választ ad. */
final class FakeSupabase
{
    /** @var list<array{method: string, url: string, options: array<string, mixed>}> */
    public static array $requests = [];
    public static ?\Closure $responder = null;

    /** @param array<string, mixed> $options */
    public function __invoke(string $method, string $url, array $options = []): ResponseInterface
    {
        self::$requests[] = ['method' => $method, 'url' => $url, 'options' => $options];

        return self::$responder ? (self::$responder)($method, $url, $options)
            : new MockResponse('[]', ['http_code' => 200, 'response_headers' => ['content-type' => 'application/json; charset=utf-8']]);
    }

    public static function reset(): void
    {
        self::$requests = [];
        self::$responder = null;
    }
}
