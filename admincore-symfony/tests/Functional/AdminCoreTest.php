<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Console\Tester\CommandTester;

final class AdminCoreTest extends WebTestCase
{
    public function testPageRendersWithAllAssetsInOrder(): void
    {
        $client = static::createClient();
        $client->request('GET', '/');

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('X-Content-Type-Options', 'nosniff');
        self::assertResponseHeaderSame('X-Frame-Options', 'SAMEORIGIN');

        $html = $client->getResponse()->getContent();
        self::assertStringStartsWith('<!DOCTYPE html>', $html);
        self::assertSame(23, preg_match_all('#<script src="/assets/admincore/js/\d\d-[\w-]+\.js\?v=\w{10}"></script>#', $html));
        self::assertSame(6, preg_match_all('#<link rel="stylesheet"(?: id="\w+")? href="/assets/admincore/css/\d\d-[\w-]+\.css\?v=\w{10}">#', $html));
        // A konfiguráció a Supabase SDK ELŐTT kerül a lapra.
        self::assertGreaterThan(0, strpos($html, 'window.ADMINCORE_CFG={"supabaseUrl":"http://localhost/sb"'));
        self::assertLessThan(strpos($html, 'supabase-js'), (int) strpos($html, 'window.ADMINCORE_CFG={"supabaseUrl":"http://localhost/sb"'));
    }

    public function testRenderedPageIsByteIdenticalToLegacyV33(): void
    {
        self::bootKernel();
        $tester = new CommandTester((new Application(self::$kernel))->find('app:verify-legacy'));

        self::assertSame(0, $tester->execute([]), $tester->getDisplay());
    }

    public function testHealthAndLegacyRedirect(): void
    {
        $client = static::createClient();

        $client->request('GET', '/health');
        self::assertResponseIsSuccessful();
        self::assertJsonStringEqualsJsonString('{"status":"ok"}', $client->getResponse()->getContent());

        $client->request('GET', '/AdminCore_Szervezesi_tabla_33_3.html');
        self::assertResponseRedirects('/', 301);
    }
}
