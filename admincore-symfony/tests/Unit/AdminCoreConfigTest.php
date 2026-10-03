<?php

namespace App\Tests\Unit;

use App\AdminCore\AdminCoreConfig;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

final class AdminCoreConfigTest extends TestCase
{
    private static function config(bool $gateway, ?Request $request): AdminCoreConfig
    {
        $stack = new RequestStack();
        if ($request) {
            $stack->push($request);
        }

        return new AdminCoreConfig($stack, 'https://abc.supabase.co', 'sb_publishable_x', 'https://cdn/sdk.js', $gateway);
    }

    public function testGatewayOnPointsBrowserToOwnDomain(): void
    {
        $cfg = self::config(true, Request::create('https://szerviz.example.ro/'))->getClientConfig();
        self::assertSame(['supabaseUrl' => 'https://szerviz.example.ro/sb', 'supabaseKey' => 'sb_publishable_x'], $cfg);
    }

    public function testGatewayOffIsDirectSupabaseLikeV33(): void
    {
        $cfg = self::config(false, Request::create('https://szerviz.example.ro/'))->getClientConfig();
        self::assertSame('https://abc.supabase.co', $cfg['supabaseUrl']);
    }

    public function testWithoutRequestFallsBackToUpstream(): void
    {
        self::assertSame('https://abc.supabase.co', self::config(true, null)->getClientConfig()['supabaseUrl']);
    }
}
