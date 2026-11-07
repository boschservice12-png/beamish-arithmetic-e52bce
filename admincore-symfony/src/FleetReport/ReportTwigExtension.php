<?php

namespace App\FleetReport;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

/** A riport-sablonok formázói: |lei · |num(2) · |pct · |trend · |pct_of · |trend_of · |rodate */
final class ReportTwigExtension extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            new TwigFilter('lei', static fn (?float $x) => null === $x ? '—' : Money::lei($x)),
            new TwigFilter('num', static fn (?float $x, int $d = 0) => Money::num($x, $d)),
            new TwigFilter('pct', static fn (?float $x) => Money::pct($x)),
            new TwigFilter('trend', static fn (?float $x) => Money::trend($x)),
            // a változás egy korábbi értékhez képest: |pct_of(előző) · |trend_of(előző)
            new TwigFilter('pct_of', static fn (?float $x, ?float $before) => Money::pct(CostTotals::delta($x, $before))),
            new TwigFilter('trend_of', static fn (?float $x, ?float $before) => Money::trend(CostTotals::delta($x, $before))),
            new TwigFilter('rodate', static fn (string $iso) => implode('.', array_reverse(explode('-', $iso)))),
        ];
    }
}
