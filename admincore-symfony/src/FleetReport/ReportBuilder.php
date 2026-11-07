<?php

namespace App\FleetReport;

/**
 * Pillanatkép + időszak → Riport. Tiszta függvény: nincs I/O, ugyanarra a bemenetre bájtra ugyanazt adja
 * (ez teszi visszakereshetővé és tesztelhetővé a kiküldött riportot).
 *
 * Szabályok (ugyanazok, mint a flotta-demó „Raport lunar” fülén):
 *  - keret: flotta havi keret × az időszak hónapjai; évre az éves keret, ha meg van adva;
 *  - jármű-keret: a jármű saját havi kerete (vagy az alapértelmezett) × hónapok;
 *  - „vs 6 havi átlag”: a jármű átlagos havi költsége az időszak előtti 6 hónapban × az időszak hónapjai;
 *  - döntési lista: fontossági sorrendben, mindegyik pénzzel vagy kockázattal.
 */
final class ReportBuilder
{
    public function build(FleetSnapshot $s, Period $period): Report
    {
        $prevPeriod = $period->previous();
        $in = static fn (Period $p) => array_filter($s->costs, static fn (array $c) => $p->contains($c['month']));
        $cur = CostTotals::of($in($period));
        $prevRows = $in($prevPeriod);
        $prev = $prevRows ? CostTotals::of($prevRows) : null;
        $n = \count($period->months);

        $budget = 'year' === $period->kind && null !== $s->budget['fleetYear'] ? $s->budget['fleetYear'] : $s->budget['fleetMonth'] * $n;

        $base = Period::monthsEndingAt((new \DateTimeImmutable($period->first().'-01'))->modify('-1 month')->format('Y-m'), 6);
        $baseMonths = array_values(array_intersect($base, $s->monthsWithData()));

        $vehicles = [];
        foreach ($s->vehicles as $plate => $v) {
            $t = CostTotals::of(array_filter($s->costs, static fn (array $c) => $c['plate'] === $plate && $period->contains($c['month'])));
            $b = $s->vehicleBudget($plate) * $n;
            $baseline = $baseMonths
                ? array_sum(array_column(array_filter($s->costs, static fn (array $c) => $c['plate'] === $plate && \in_array($c['month'], $baseMonths, true)), 'net')) / \count($baseMonths) * $n
                : null;
            $vehicles[] = $v + ['totals' => $t, 'budget' => $b, 'budgetPct' => $b > 0 ? $t->total() / $b * 100 : 0.0,
                'baseline' => $baseline, 'vsBaseline' => CostTotals::delta($t->total(), $baseline)];
        }
        usort($vehicles, static fn (array $a, array $b) => $b['totals']->total() <=> $a['totals']->total() ?: strcmp($a['plate'], $b['plate']));
        $over = array_values(array_map(static fn (array $v) => $v['plate'], array_filter($vehicles, static fn (array $v) => $v['budgetPct'] >= 100)));

        $monthBudget = $s->budget['fleetMonth'];
        $trend = array_map(static function (string $m) use ($s, $monthBudget) {
            $t = CostTotals::of(array_filter($s->costs, static fn (array $c) => $c['month'] === $m))->total();

            return ['month' => $m, 'label' => Period::monthLabel($m), 'total' => $t, 'over' => $t > $monthBudget];
        }, Period::monthsEndingAt($period->last(), max(6, $n)));

        $subs = [];
        foreach ($in($period) as $c) {
            $k = $c['cat'].'|'.$c['sub'];
            $subs[$k] = ($subs[$k] ?? 0.0) + $c['net'];
        }
        arsort($subs);
        $bySub = [];
        foreach ($subs as $k => $net) {
            [$cat, $sub] = explode('|', (string) $k, 2);
            $bySub[] = ['cat' => $cat, 'sub' => $sub, 'net' => $net, 'pct' => $cur->total() > 0 ? $net / $cur->total() * 100 : 0.0];
        }

        $exceptions = array_values(array_filter($s->exceptions, static fn (array $x) => $period->contains($x['month'])));
        $operations = array_values(array_filter($s->operations, static fn (array $o) => $period->contains(substr($o['date'], 0, 7))));
        usort($operations, static fn (array $a, array $b) => strcmp($a['date'], $b['date']));
        $state = $s->state;
        usort($state['documents'], static fn (array $a, array $b) => [$b['expired'], $a['due']] <=> [$a['expired'], $b['due']]);

        $r = new Report($period, $prevPeriod, $s->fleetId, $s->fleetName, $s->generatedAt, $cur, $prev, $budget, $s->budget['warnPct'],
            $vehicles, $trend, $bySub, $exceptions, $operations, $state, [], $over, \count($s->vehicles));

        return new Report($period, $prevPeriod, $s->fleetId, $s->fleetName, $s->generatedAt, $cur, $prev, $budget, $s->budget['warnPct'],
            $vehicles, $trend, $bySub, $exceptions, $operations, $state, $this->decisions($r), $over, \count($s->vehicles));
    }

    /** @return list<array{level: string, text: string}> */
    private function decisions(Report $r): array
    {
        $out = [];
        $st = $r->state;
        $docs = $st['documents'];
        $expired = \count(array_filter($docs, static fn (array $d) => $d['expired']));
        $fmt = static fn (float $x) => Money::lei($x);

        if ($st['blocked']) {
            $out[] = ['red', \count($st['blocked']).' vehicule nu pot pleca (document obligatoriu expirat): '.implode(', ', $st['blocked']).' — reînnoire azi; altfel amendă și vehicul oprit.'];
        }
        if ($st['tyres']['now'] > 0) {
            $out[] = ['red', $st['tyres']['now'].' vehicule cu anvelope sub limită — schimb imediat (risc de amendă, daună, refuz CASCO).'];
        }
        if ($st['summerTyresInWinter']) {
            $out[] = ['red', \count($st['summerTyresInWinter']).' vehicule încă pe anvelope de vară în sezonul de iarnă — programează schimbul sezonier săptămâna aceasta.'];
        }
        if ($r->totals->total() > $r->budget) {
            $out[] = ['red', 'Buget parc depășit cu '.$fmt($r->totals->total() - $r->budget).' ('.round($r->budgetPct()).'%) — vezi vehiculele de mai jos sau ajustează bugetul.'];
        }
        if ($r->overBudget) {
            $pct = [];
            foreach ($r->vehicles as $v) {
                if ($v['budgetPct'] >= 100) {
                    $pct[] = $v['plate'].' ('.round($v['budgetPct']).'%)';
                }
            }
            $out[] = ['amb', \count($r->overBudget).' vehicule peste buget: '.implode(', ', \array_slice($pct, 0, 5)).(\count($pct) > 5 ? '…' : '').'.'];
        }
        if ($r->exceptions) {
            $out[] = ['amb', \count($r->exceptions).' semnale de combustibil de verificat (consum anormal, alimentări ≠ km) — cere bonurile, verifică cardul.'];
        }
        if ($docs) {
            $out[] = ['amb', $expired.' documente expirate și '.(\count($docs) - $expired).' care expiră în 30 de zile — lista în raport.'];
        }
        if ($st['tyreOrders3m']['count'] > 0) {
            $out[] = ['amb', 'Comandă '.$st['tyreOrders3m']['count'].' seturi de anvelope în următoarele 3 luni · buget estimat '.$fmt($st['tyreOrders3m']['cost']).'.'];
        }
        if ($st['setsWithoutProof'] > 0) {
            $out[] = ['amb', $st['setsWithoutProof'].' seturi depozitate fără locație sigură / dovadă — cere foto șoferilor.'];
        }
        if (!$out) {
            $out[] = ['ok', 'Nimic de decis: costuri în buget, documente și anvelope în regulă.'];
        }

        return array_map(static fn (array $d) => ['level' => $d[0], 'text' => $d[1]], $out);
    }
}
