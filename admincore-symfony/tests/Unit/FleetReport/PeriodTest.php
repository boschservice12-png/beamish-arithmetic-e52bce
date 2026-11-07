<?php

namespace App\Tests\Unit\FleetReport;

use App\FleetReport\Period;
use PHPUnit\Framework\TestCase;

final class PeriodTest extends TestCase
{
    public function testParsesMonthQuarterYear(): void
    {
        self::assertSame(['2026-10'], Period::parse('2026-10')->months);
        self::assertSame(['2026-07', '2026-08', '2026-09'], Period::parse('2026-q3')->months);
        self::assertCount(12, Period::parse('2026')->months);
        self::assertSame('oct 2026', Period::parse('2026-10')->label());
        self::assertSame('T3 2026', Period::parse('2026-Q3')->label());
        self::assertSame('anul 2026', Period::parse('2026')->label());
    }

    public function testRejectsGarbage(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        Period::parse('2026-13');
    }

    public function testPreviousAcrossYearBoundary(): void
    {
        self::assertSame('2025-12', Period::parse('2026-01')->previous()->key);
        self::assertSame('2025-Q4', Period::parse('2026-Q1')->previous()->key);
        self::assertSame('2025', Period::parse('2026')->previous()->key);
    }

    public function testLastClosed(): void
    {
        $nov = new \DateTimeImmutable('2026-11-07');
        self::assertSame('2026-10', Period::lastClosed('month', $nov)->key);
        self::assertSame('2026-Q3', Period::lastClosed('quarter', $nov)->key);
        self::assertSame('2025', Period::lastClosed('year', $nov)->key);
        self::assertSame('2025-Q4', Period::lastClosed('quarter', new \DateTimeImmutable('2026-02-01'))->key);
        self::assertSame('2025-12', Period::lastClosed('month', new \DateTimeImmutable('2026-01-31'))->key);
    }

    public function testEndIsFirstDayAfterThePeriod(): void
    {
        self::assertSame('2026-11-01', Period::parse('2026-10')->end()->format('Y-m-d'));
        self::assertSame('2027-01-01', Period::parse('2026-Q4')->end()->format('Y-m-d'));
        self::assertSame(['2026-08', '2026-09', '2026-10'], Period::monthsEndingAt('2026-10', 3));
    }
}
