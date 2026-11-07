<?php

namespace App\FleetReport;

/**
 * Az elkészült riport — minden szám itt van kiszámolva; a sablon, a CSV és az e-mail csak megjeleníti.
 * Költség, km, fogyasztás = a riportolt időszak; a flotta állapota (gumi, papírok, depó) = a generálás napja.
 */
final class Report
{
    /**
     * @param list<array{plate: string, model: string, driver: string, tyres: array{status: string, minMm: float, season: string, replaceBy: string|null}|null, totals: CostTotals, budget: float, budgetPct: float, baseline: float|null, vsBaseline: float|null}> $vehicles
     * @param list<array{month: string, label: string, total: float, over: bool}> $trend
     * @param list<array{cat: string, sub: string, net: float, pct: float}> $bySub
     * @param list<array{plate: string, month: string, kind: string, detail: string}> $exceptions
     * @param list<array{plate: string, date: string, type: string, cost: float}> $operations
     * @param array{tyres: array{ok: int, soon: int, now: int}, blocked: list<string>, summerTyresInWinter: list<string>, documents: list<array{label: string, for: string, due: string, expired: bool}>, tyreOrders3m: array{count: int, cost: float}, setsWithoutProof: int, storedSets: int} $state
     * @param list<array{level: string, text: string}> $decisions
     * @param list<string> $overBudget
     */
    public function __construct(
        public readonly Period $period,
        public readonly Period $previousPeriod,
        public readonly string $fleetId,
        public readonly string $fleetName,
        public readonly \DateTimeImmutable $generatedAt,
        public readonly CostTotals $totals,
        public readonly ?CostTotals $previous,
        public readonly float $budget,
        public readonly float $warnPct,
        public readonly array $vehicles,
        public readonly array $trend,
        public readonly array $bySub,
        public readonly array $exceptions,
        public readonly array $operations,
        public readonly array $state,
        public readonly array $decisions,
        public readonly array $overBudget,
        public readonly int $vehicleCount,
    ) {
    }

    public function budgetPct(): float
    {
        return $this->budget > 0 ? $this->totals->total() / $this->budget * 100 : 0.0;
    }

    public function budgetLevel(): string
    {
        $p = $this->budgetPct();

        return $p >= 100 ? 'red' : ($p >= $this->warnPct ? 'amb' : 'ok');
    }

    public function openDecisions(): int
    {
        return \count(array_filter($this->decisions, static fn (array $d) => 'ok' !== $d['level']));
    }

    /** Fájlnév-alap: raport-flota-<flotta>-<időszak> */
    public function fileStem(): string
    {
        return 'raport-flota-'.$this->fleetId.'-'.strtolower($this->period->key);
    }
}
