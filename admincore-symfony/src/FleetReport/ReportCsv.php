<?php

namespace App\FleetReport;

/**
 * CSV Excelhez: „;” elválasztó, UTF-8 BOM (az Excel így ismeri fel az ș/ț betűket), tizedesvessző.
 * Szakaszok: mutatók · járművek · kivételek · döntések. Képletnek látszó cella elé ' kerül (CSV-injekció ellen).
 */
final class ReportCsv
{
    public function render(Report $r): string
    {
        $c = $r->totals;
        $p = $r->previous;
        $n = static fn (?float $x, int $d = 0) => null === $x ? '' : number_format($x, $d, ',', '');
        $d = static fn (?float $x) => null === $x ? '' : number_format($x, 1, ',', '');
        $rows = [
            ['Raport flota', $r->fleetName, $r->period->label(), 'generat '.$r->generatedAt->format('d.m.Y'), 'lei fara TVA'],
            [],
            ['Indicator', $r->period->label(), $r->previousPeriod->label(), 'Delta %'],
        ];
        foreach (['total' => 'Cost total', 'admin' => 'Administrativ', 'oper' => 'Functionare', 'fuel' => 'Combustibil', 'km' => 'km', 'liters' => 'Litri'] as $k => $label) {
            $rows[] = [$label, $n($c->get($k)), $n($p?->get($k)), $d(CostTotals::delta($c->get($k), $p?->get($k)))];
        }
        $rows[] = ['lei/km', $n($c->perKm(), 2), $n($p?->perKm(), 2), $d(CostTotals::delta($c->perKm(), $p?->perKm()))];
        $rows[] = ['l/100 km', $n($c->consumption(), 1), $n($p?->consumption(), 1), $d(CostTotals::delta($c->consumption(), $p?->consumption()))];
        $rows[] = ['Buget parc', $n($r->budget), '', ''];
        $rows[] = ['% din buget', $n($r->budgetPct()), '', ''];
        if ($r->sameLastYear) {
            $rows[] = ['Aceeasi perioada anul trecut', $n($r->sameLastYear->total()), '', $d(CostTotals::delta($c->total(), $r->sameLastYear->total()))];
        }
        if ($r->monthly) {
            $rows[] = [];
            $rows[] = ['Luna', 'Admin', 'Functionare', 'Combustibil', 'Total', 'km'];
            foreach ($r->monthly as $m) {
                $t = $m['totals'];
                $rows[] = [$m['month'], $n($t->admin), $n($t->oper), $n($t->fuel), $n($t->total()), $n($t->km)];
            }
        }
        if ($f = $r->forecast) {
            $rows[] = [];
            $rows[] = ['Prognoza '.$f->year, 'Valoare lei', 'Nota'];
            $rows[] = ['Realizat', $n($f->ytd), $f->closedMonths.' luni'.($f->partialYear() ? ' din '.$f->closedMonthsInYear.' (date incomplete)' : '')];
            if ($f->remainingMonths > 0) {
                $rows[] = ['Estimat la 31.12', $n($f->expected), $n($f->expectedPct()).'% din buget anual'];
                $rows[] = ['Interval minim', $n($f->low), ''];
                $rows[] = ['Interval maxim', $n($f->high), ''];
                $rows[] = ['Anvelope planificate', $n($f->planned), 'inclus'];
            }
            $rows[] = ['Buget anual', $n($f->budgetYear), ''];
            if (null !== $f->nextYearProposal) {
                $rows[] = ['Propunere buget '.($f->year + 1), $n($f->nextYearProposal), 'media 6 luni x 12 + anvelope'];
            }
        }
        $rows[] = [];
        $rows[] = ['Inmatriculare', 'Model', 'Sofer', 'Admin', 'Functionare', 'Combustibil', 'Total', 'km', 'lei/km', 'l/100 km', 'Buget', '% buget', 'vs medie 6 luni %'];
        foreach ($r->vehicles as $v) {
            $t = $v['totals'];
            $rows[] = [$v['plate'], $v['model'], $v['driver'], $n($t->admin), $n($t->oper), $n($t->fuel), $n($t->total()), $n($t->km), $n($t->perKm(), 2), $n($t->consumption(), 1), $n($v['budget']), $n($v['budgetPct']), $d($v['vsBaseline'])];
        }
        $rows[] = [];
        $rows[] = ['Exceptie', 'Luna', 'Inmatriculare', 'Detaliu'];
        foreach ($r->exceptions as $x) {
            $rows[] = [$x['kind'], $x['month'], $x['plate'], $x['detail']];
        }
        foreach ($r->vehicles as $v) {
            if ($v['budgetPct'] >= 100) {
                $rows[] = ['peste_buget', $r->period->key, $v['plate'], $n($v['totals']->total()).' din '.$n($v['budget']).' lei'];
            }
        }
        $rows[] = [];
        $rows[] = ['Decizie', 'Prioritate'];
        foreach ($r->decisions as $x) {
            $rows[] = [$x['text'], ['red' => 'urgent', 'amb' => 'in aceasta perioada'][$x['level']] ?? 'ok'];
        }

        return "\u{FEFF}".implode("\r\n", array_map(static fn (array $row) => implode(';', array_map(self::cell(...), $row)), $rows))."\r\n";
    }

    private static function cell(string|int|float $v): string
    {
        $s = (string) $v;
        if ('' !== $s && \in_array($s[0], ['=', '+', '-', '@', "\t", "\r"], true) && !is_numeric(str_replace(',', '.', $s))) {
            $s = "'".$s;
        }

        return '"'.str_replace('"', '""', $s).'"';
    }
}
