<?php

namespace App\Tests\Unit\FleetReport;

use App\FleetReport\FleetSnapshot;
use App\FleetReport\Period;
use App\FleetReport\ReportBuilder;
use App\FleetReport\ReportCsv;
use PHPUnit\Framework\TestCase;

/** A flotta-demó exportja (tests/fixtures/fleet-report/curier-demo.json): a szerver ugyanazt számolja, mint a demó. */
final class ReportBuilderTest extends TestCase
{
    public static function fixture(): string
    {
        return \dirname(__DIR__, 2).'/fixtures/fleet-report/curier-demo.json';
    }

    public function testOctoberMatchesTheDemo(): void
    {
        $r = (new ReportBuilder())->build(FleetSnapshot::fromFile(self::fixture()), Period::parse('2026-10'));
        self::assertSame(32558.0, round($r->totals->total()));
        self::assertSame(90.0, round($r->budgetPct()));
        self::assertSame('amb', $r->budgetLevel());
        self::assertSame(8, $r->openDecisions());
        self::assertSame('B 60 XNU', $r->vehicles[0]['plate']);
        self::assertCount(5, $r->overBudget);
        self::assertCount(8, $r->exceptions);
        self::assertSame('2026-09', $r->previousPeriod->key);
        self::assertNotNull($r->previous);
        self::assertSame(20.0, round((float) \App\FleetReport\CostTotals::delta($r->totals->total(), $r->previous->total())));
        self::assertCount(6, $r->trend);
        self::assertSame('red', $r->decisions[0]['level']);
    }

    public function testDeterministic(): void
    {
        $s = FleetSnapshot::fromFile(self::fixture());
        $csv = new ReportCsv();
        self::assertSame($csv->render((new ReportBuilder())->build($s, Period::parse('2026-10'))), $csv->render((new ReportBuilder())->build($s, Period::parse('2026-10'))));
    }

    public function testQuarterUsesThreeMonthsOfBudget(): void
    {
        $s = FleetSnapshot::fromFile(self::fixture());
        $r = (new ReportBuilder())->build($s, Period::parse('2026-Q3'));
        self::assertSame($s->budget['fleetMonth'] * 3, $r->budget);
    }

    public function testCsvHasBomSectionsAndNoFormulaInjection(): void
    {
        $d = json_decode((string) file_get_contents(self::fixture()), true);
        $d['vehicles'][0]['driver'] = '=HYPERLINK("http://x")';
        $csv = (new ReportCsv())->render((new ReportBuilder())->build(FleetSnapshot::fromArray($d), Period::parse('2026-10')));
        self::assertStringStartsWith("\u{FEFF}", $csv);
        self::assertStringContainsString('"Indicator";"oct 2026";"sep 2026";"Delta %"', $csv);
        self::assertStringContainsString('"Decizie";"Prioritate"', $csv);
        self::assertStringContainsString("\"'=HYPERLINK(\"\"http://x\"\")\"", $csv);
        self::assertStringNotContainsString(';"=HYPERLINK', $csv);
    }

    /** @return iterable<string, array{callable(array<mixed>): array<mixed>, string}> */
    public static function badInputs(): iterable
    {
        yield 'schema' => [static fn (array $d) => ['schema' => 'x'] + $d, 'schema'];
        yield 'ismeretlen rendszám' => [static function (array $d) { $d['costs'][0]['plate'] = 'XX 00 ZZZ'; return $d; }, 'ismeretlen rendszám'];
        yield 'negatív összeg' => [static function (array $d) { $d['costs'][0]['net'] = -5; return $d; }, 'nem negatív'];
        yield 'rossz kategória' => [static function (array $d) { $d['costs'][0]['cat'] = 'misc'; return $d; }, 'admin | oper | fuel'];
        yield 'rossz dátum' => [static function (array $d) { $d['costs'][0]['date'] = '2026-02-30'; return $d; }, 'dátum'];
        yield 'nulla keret' => [static function (array $d) { $d['budget']['fleetMonth'] = 0; return $d; }, 'pozitív'];
        yield 'kétszer ugyanaz az autó' => [static function (array $d) { $d['vehicles'][1]['plate'] = strtolower($d['vehicles'][0]['plate']); return $d; }, 'kétszer'];
    }

    /** @param callable(array<mixed>): array<mixed> $mutate */
    #[\PHPUnit\Framework\Attributes\DataProvider('badInputs')]
    public function testRejectsBadInput(callable $mutate, string $message): void
    {
        $d = json_decode((string) file_get_contents(self::fixture()), true);
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage($message);
        FleetSnapshot::fromArray($mutate($d));
    }

    public function testClientActionsOnlyOfferWhatTheServiceProvides(): void
    {
        $r = (new ReportBuilder())->build(FleetSnapshot::fromFile(self::fixture()), Period::parse('2026-10'));
        $all = \App\FleetReport\ClientActions::for($r, \App\FleetReport\Brand::fromArray(['name' => 'S', 'services' => ['anvelope', 'depozitare']]));
        self::assertSame('red', $all[0]['level']);
        self::assertStringContainsString('TM 69 CLU', $all[0]['text']);
        self::assertTrue((bool) array_filter($all, static fn (array $a) => str_contains($a['text'], 'depozitul nostru')));

        $noStorage = \App\FleetReport\ClientActions::for($r, \App\FleetReport\Brand::fromArray(['name' => 'S', 'services' => ['anvelope']]));
        self::assertFalse((bool) array_filter($noStorage, static fn (array $a) => str_contains($a['text'], 'depozitul nostru')));

        $nothing = \App\FleetReport\ClientActions::for($r, \App\FleetReport\Brand::fromArray(['name' => 'S', 'services' => []]));
        self::assertSame('ok', $nothing[0]['level']);
    }
}
