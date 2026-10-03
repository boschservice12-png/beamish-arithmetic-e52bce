<?php

namespace App\Tests\Unit;

use App\Gateway\GatewayPolicy;
use PHPUnit\Framework\TestCase;

/**
 * Őr: minden tábla/nézet/függvény, amit az AdminCore JS-kódja megnevez, rajta van-e a gateway
 * engedélylistáján. Ha egy új modul új táblát kezd használni, ez a teszt bukik — nem élesben derül ki.
 * A tests/fixtures/supabase_relations.txt a redassistance-v2 public séma táblái és nézetei (2026-10-03).
 */
final class GatewayPolicyCoverageTest extends TestCase
{
    private static function js(): string
    {
        return implode("\n", array_map('file_get_contents', glob(\dirname(__DIR__, 2).'/public/admincore/js/*.js')));
    }

    public function testEveryRelationNamedInJsIsAllowed(): void
    {
        $relations = file(__DIR__.'/../fixtures/supabase_relations.txt', \FILE_IGNORE_NEW_LINES | \FILE_SKIP_EMPTY_LINES);
        preg_match_all('/[\'"]([a-z][a-z0-9_]*)[\'"]/', self::js(), $m);
        $named = array_values(array_intersect($relations, array_unique($m[1])));

        self::assertNotEmpty($named);
        self::assertSame([], array_values(array_diff($named, GatewayPolicy::TABLES)), 'A JS használja, de a GatewayPolicy::TABLES-ből hiányzik');
    }

    public function testEveryRpcCalledInJsIsAllowed(): void
    {
        preg_match_all('/\.rpc\(\s*[\'"]([a-z0-9_]+)[\'"]/', self::js(), $m);
        $called = array_unique($m[1]);

        self::assertCount(12, $called);
        self::assertSame([], array_values(array_diff($called, [...GatewayPolicy::WRITE_RPCS, ...GatewayPolicy::READ_RPCS])));
    }

    public function testAllowlistHasNoDeadEntries(): void
    {
        $js = self::js();
        foreach ([...GatewayPolicy::TABLES, ...GatewayPolicy::WRITE_RPCS, ...GatewayPolicy::READ_RPCS] as $name) {
            self::assertMatchesRegularExpression('/[\'"]'.$name.'[\'"]/', $js, $name.' engedélyezve, de a kód nem használja');
        }
    }

    public function testNoDynamicTableAccessBeyondKnownHelper(): void
    {
        // Az egyetlen nem-literál .from() hívás a 13-ra-loop.js q(t) segédje, ami literálokkal hívódik.
        preg_match_all('/\.from\(\s*[a-zA-Z_]\w*\s*\)/', self::js(), $m);
        self::assertSame(['.from(t)'], $m[0]);
    }
}
