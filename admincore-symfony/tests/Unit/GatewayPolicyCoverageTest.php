<?php

namespace App\Tests\Unit;

use App\Gateway\GatewayPolicy;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Őr: minden tábla/nézet/függvény, amit az appok JS-kódja megnevez, rajta van-e a gateway
 * engedélylistáján. Ha egy új modul új táblát kezd használni, ez a teszt bukik — nem élesben derül ki.
 * A tests/fixtures/supabase_relations.txt a redassistance-v2 public séma táblái és nézetei (2026-10-03).
 */
final class GatewayPolicyCoverageTest extends TestCase
{
    private static function js(string $app = '*'): string
    {
        return implode("\n", array_map('file_get_contents', glob(\dirname(__DIR__, 2).'/public/assets/'.$app.'/js/*.js')));
    }

    /** @return list<string> */
    private static function allRpcs(): array
    {
        return [GatewayPolicy::PIN_LOGIN_RPC, ...GatewayPolicy::PIN_WRITE_RPCS, ...GatewayPolicy::PIN_READ_RPCS,
            ...GatewayPolicy::WRITE_RPCS, ...GatewayPolicy::READ_RPCS];
    }

    public static function apps(): iterable
    {
        yield 'admincore' => ['admincore', 13];
        yield 'szerelo' => ['szerelo', 22];
        yield 'teendoim' => ['teendoim', 16];
        yield 'penzugy' => ['penzugy', 1];
    }

    #[DataProvider('apps')]
    public function testEveryRpcCalledInJsIsAllowed(string $app, int $expectedCount): void
    {
        preg_match_all('/\.rpc\(\s*[\'"]([a-z0-9_]+)[\'"]/', self::js($app), $m);
        $called = array_values(array_unique($m[1]));

        self::assertCount($expectedCount, $called);
        self::assertSame([], array_values(array_diff($called, self::allRpcs())), $app.' hív olyan függvényt, ami nincs a GatewayPolicy-ben');
    }

    public function testFinancePanelTouchesOnlyItsStateTable(): void
    {
        // A pénzügyi modell (01-app.js) maga nem hív Supabase-t; csak a 02-db-sync.js réteg, és csak a saját táblát + profilt.
        $app = file_get_contents(\dirname(__DIR__, 2).'/public/assets/penzugy/js/01-app.js');
        self::assertDoesNotMatchRegularExpression('/\.rpc\(|createClient\(|supabase/i', $app);
        preg_match_all('/\.from\(\s*([A-Za-z_\'"]+)\s*\)/', file_get_contents(\dirname(__DIR__, 2).'/public/assets/penzugy/js/02-db-sync.js'), $m);
        self::assertEqualsCanonicalizing(['TABLE', "'profiles'", 'TABLE'], $m[1]); // betöltés, profil, mentés
        self::assertDoesNotMatchRegularExpression('/\.rpc\(/', file_get_contents(\dirname(__DIR__, 2).'/public/assets/penzugy/js/02-db-sync.js'));

        // Az ASM-import réteg: egyetlen függvény (f_asm_import) és a kötegek olvasása — más táblához nem nyúl
        $imp = file_get_contents(\dirname(__DIR__, 2).'/public/assets/penzugy/js/03-asm-import.js');
        preg_match_all('/\.(rpc|from)\(\s*\'([a-z_]+)\'/', $imp, $m);
        self::assertEqualsCanonicalizing(['rpc:f_asm_import', 'from:asm_import_batch'], array_map(static fn ($a, $b) => $a.':'.$b, $m[1], $m[2]));
    }

    public function testPhoneAppsUseNoTablesOrSupabaseAuthDirectly(): void
    {
        // A telefonos appok csak munkamenet-tokenes függvényeket hívnak — ha ez változik, a policyt át kell gondolni.
        foreach (['szerelo', 'teendoim'] as $app) {
            self::assertDoesNotMatchRegularExpression('/\.from\(|\.auth\./', self::js($app), $app);
        }
    }

    public function testPinRpcsAreOnlyThoseThePhoneAppsCall(): void
    {
        preg_match_all('/\.rpc\(\s*[\'"]([a-z0-9_]+)[\'"]/', self::js('szerelo')."\n".self::js('teendoim'), $m);
        $pin = [GatewayPolicy::PIN_LOGIN_RPC, ...GatewayPolicy::PIN_WRITE_RPCS, ...GatewayPolicy::PIN_READ_RPCS];

        self::assertEqualsCanonicalizing(array_values(array_unique($m[1])), $pin, 'bejelentkezés nélkül csak az mehet át, amit a telefonos appok tényleg hívnak');
    }

    public function testEveryRelationNamedInJsIsAllowed(): void
    {
        $relations = file(__DIR__.'/../fixtures/supabase_relations.txt', \FILE_IGNORE_NEW_LINES | \FILE_SKIP_EMPTY_LINES);
        // Csak az AdminCore ér táblához (a telefonos appoknál a fenti teszt tiltja); ott a 'jobs' egy képernyő neve.
        preg_match_all('/[\'"]([a-z][a-z0-9_]*)[\'"]/', self::js('admincore').self::js('penzugy'), $m);
        $named = array_values(array_intersect($relations, array_unique($m[1])));

        self::assertNotEmpty($named);
        self::assertSame([], array_values(array_diff($named, GatewayPolicy::TABLES)), 'A JS használja, de a GatewayPolicy::TABLES-ből hiányzik');
    }

    public function testAllowlistHasNoDeadEntries(): void
    {
        $js = self::js();
        foreach ([...GatewayPolicy::TABLES, ...self::allRpcs()] as $name) {
            self::assertMatchesRegularExpression('/[\'"]'.$name.'[\'"]/', $js, $name.' engedélyezve, de a kód nem használja');
        }
    }

    public function testNoRpcIsListedTwice(): void
    {
        self::assertSame(array_unique(self::allRpcs()), self::allRpcs());
    }

    public function testNoDynamicTableAccessBeyondKnownHelper(): void
    {
        // Az egyetlen nem-literál .from() hívás a 13-ra-loop.js q(t) segédje, ami literálokkal hívódik.
        // (Csak az AdminCore: a pénzügyi panel Array.from(fileList)-je nem Supabase-hívás.)
        preg_match_all('/\.from\(\s*[a-zA-Z_]\w*\s*\)/', self::js('admincore'), $m);
        self::assertSame(['.from(t)'], $m[0]);
    }
}
