<?php

namespace App\FleetReport;

/**
 * Év végi előrejelzés — szándékosan egyszerű, szóban elmagyarázható módszer (vezetői döntéshez, nem könyveléshez):
 *
 *   várható év vége = eddigi tény (jan → az időszak vége)
 *                   + hátralévő hónaponként: működés + üzemanyag = az utolsó 3 lezárt hónap átlaga (futási ütem)
 *                                            admin = ugyanaz a hónap tavaly (RCA, adó, ITP évente ugyanakkor esedékes),
 *                                                    ha nincs ilyen adat: az utolsó 12 hónap admin-átlaga
 *                   + tervezett gumirendelés (3 hónapon belül esedékes szettek becsült ára), ha belefér az évbe
 *   sáv: a hátralévő hónapokra az utolsó 6 hónap legolcsóbb / legdrágább hónapja (+ a terv) — ennyi a bizonytalanság.
 *
 * Ha az időszak decemberrel zárul (nincs hátralévő hónap), a következő év keretjavaslata készül:
 * az utolsó 6 hónap átlaga × 12 + a tervezett gumirendelés, ezresre kerekítve — csak ha mind a 6 hónapra van adat.
 * Ha az év elejéről hiányzik adat (a rendszer év közben indult), a riport ezt kiírja: az „eddigi tény” akkor nem teljes év.
 */
final class Forecast
{
    /**
     * @param list<array{month: string, label: string, total: float, forecast: bool}> $months
     */
    public function __construct(
        public readonly int $year,
        public readonly float $ytd,
        public readonly int $closedMonths,
        public readonly int $closedMonthsInYear,
        public readonly int $remainingMonths,
        public readonly float $runRate,
        public readonly float $planned,
        public readonly float $expected,
        public readonly float $low,
        public readonly float $high,
        public readonly float $budgetYear,
        public readonly ?float $nextYearProposal,
        public readonly array $months,
    ) {
    }

    public static function build(FleetSnapshot $s, Period $period): ?self
    {
        $year = (int) substr($period->last(), 0, 4);
        $total = static fn (string $m) => array_sum(array_column(array_filter($s->costs, static fn (array $c) => $c['month'] === $m), 'net'));
        $sumCat = static fn (string $m, array $cats) => array_sum(array_column(array_filter($s->costs, static fn (array $c) => $c['month'] === $m && \in_array($c['cat'], $cats, true)), 'net'));
        $have = $s->monthsWithData();

        $yearMonths = Period::parse((string) $year)->months;
        $closed = array_values(array_filter($yearMonths, static fn (string $m) => $m <= $period->last()));
        $remaining = array_values(array_filter($yearMonths, static fn (string $m) => $m > $period->last()));
        $closedWithData = array_values(array_intersect($closed, $have));
        if (!$closedWithData) {
            return null;
        }
        $ytd = array_sum(array_map($total, $closedWithData));

        $last3 = array_values(array_intersect(Period::monthsEndingAt($period->last(), 3), $have));
        $last6 = array_values(array_intersect(Period::monthsEndingAt($period->last(), 6), $have));
        $last12 = array_values(array_intersect(Period::monthsEndingAt($period->last(), 12), $have));
        $avg = static fn (array $ms, callable $f) => $ms ? array_sum(array_map($f, $ms)) / \count($ms) : 0.0;
        $runOperFuel = $avg($last3, static fn (string $m) => $sumCat($m, ['oper', 'fuel']));
        $adminAvg = $avg($last12, static fn (string $m) => $sumCat($m, ['admin']));
        $totals6 = array_map($total, $last6);
        $min6 = $totals6 ? min($totals6) : 0.0;
        $max6 = $totals6 ? max($totals6) : 0.0;

        $planned = 0.0;
        $months = array_map(static fn (string $m) => ['month' => $m, 'label' => Period::monthLabel($m), 'total' => $total($m), 'forecast' => false], $closedWithData);
        $rest = 0.0;
        foreach ($remaining as $i => $m) {
            $lastYear = ($year - 1).substr($m, 4);
            $admin = \in_array($lastYear, $have, true) ? $sumCat($lastYear, ['admin']) : $adminAvg;
            $f = $runOperFuel + $admin;
            if ($i < 3 && $s->state['tyreOrders3m']['cost'] > 0) {
                $share = $s->state['tyreOrders3m']['cost'] / min(3, \count($remaining));
                $f += $share;
                $planned += $share;
            }
            $rest += $f;
            $months[] = ['month' => $m, 'label' => Period::monthLabel($m), 'total' => $f, 'forecast' => true];
        }
        $n = \count($remaining);
        $budgetYear = $s->budget['fleetYear'] ?? $s->budget['fleetMonth'] * 12;
        $proposal = 0 === $n && 6 === \count($totals6) ? round((array_sum($totals6) / \count($totals6) * 12 + $s->state['tyreOrders3m']['cost']) / 1000) * 1000 : null;

        return new self($year, $ytd, \count($closedWithData), \count($closed), $n, $n ? $rest / $n : 0.0, $planned, $ytd + $rest,
            $ytd + $n * $min6 + $planned, $ytd + $n * $max6 + $planned, $budgetYear, $proposal, $months);
    }

    public function partialYear(): bool
    {
        return $this->closedMonths < $this->closedMonthsInYear;
    }

    public function expectedPct(): float
    {
        return $this->budgetYear > 0 ? $this->expected / $this->budgetYear * 100 : 0.0;
    }

    /** red: a várható év vége a keret fölött · amb: a sáv teteje lépi át · ok: a sávval együtt is belefér */
    public function level(): string
    {
        return $this->expected > $this->budgetYear ? 'red' : ($this->high > $this->budgetYear ? 'amb' : 'ok');
    }
}
