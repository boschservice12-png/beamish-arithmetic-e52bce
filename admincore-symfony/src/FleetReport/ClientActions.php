<?php

namespace App\FleetReport;

/**
 * A B2B riport ajánlásai: amit a szerviz a flotta-ügyfélnek javasol, fontossági sorrendben — mindegyik biztonsági
 * kockázattal vagy konkrét teendővel, és csak olyan szolgáltatással, amit a szerviz a márka-fájl szerint nyújt.
 * Belső adat (keret, üzemanyag-gyanú, sofőrnév) nem kerül bele.
 */
final class ClientActions
{
    /** @return list<array{level: string, text: string}> */
    public static function for(Report $r, Brand $b): array
    {
        $st = $r->state;
        $byStatus = static fn (string $s) => array_values(array_map(static fn (array $v) => $v['plate'], array_filter($r->vehicles, static fn (array $v) => ($v['tyres']['status'] ?? null) === $s)));
        $list = static fn (array $p) => implode(', ', \array_slice($p, 0, 6)).(\count($p) > 6 ? ' și încă '.(\count($p) - 6) : '');
        $out = [];

        $now = $byStatus('now');
        if ($b->offers('anvelope') && ($now || $st['tyres']['now'] > 0)) {
            $out[] = ['red', ($now ? \count($now).' vehicule ('.$list($now).')' : $st['tyres']['now'].' vehicule').' au anvelope sub pragul de siguranță — recomandăm înlocuirea înainte de următoarea cursă. Vă trimitem oferta la cerere.'];
        }
        if ($b->offers('anvelope') && $st['summerTyresInWinter']) {
            $out[] = ['red', \count($st['summerTyresInWinter']).' vehicule circulă încă pe anvelope de vară ('.$list($st['summerTyresInWinter']).') — programați schimbul sezonier.'];
        }
        if ($b->offers('anvelope') && $st['tyreOrders3m']['count'] > 0) {
            $out[] = ['amb', $st['tyreOrders3m']['count'].' seturi ajung la limită în următoarele 3 luni (estimat '.Money::lei($st['tyreOrders3m']['cost']).' fără TVA) — rezervarea din timp asigură dimensiunea și prețul.'];
        }
        if ($b->offers('depozitare') && $st['setsWithoutProof'] > 0) {
            $out[] = ['amb', $st['setsWithoutProof'].' seturi nu au un depozit confirmat — le putem prelua în depozitul nostru, cu etichetă QR, fișă de evaluare și foto la predare.'];
        }
        $itp = array_values(array_filter($st['documents'], static fn (array $d) => str_starts_with($d['label'], 'ITP')));
        if ($b->offers('itp') && $itp) {
            $exp = \count(array_filter($itp, static fn (array $d) => $d['expired']));
            $out[] = [$exp ? 'red' : 'amb', \count($itp).' ITP '.($exp ? '('.$exp.' expirate) ' : '').'în următoarele 30 de zile — vă putem face programarea.'];
        }
        $soon = $byStatus('soon');
        if ($b->offers('anvelope') && $soon) {
            $out[] = ['amb', \count($soon).' vehicule se apropie de pragul de schimb ('.$list($soon).') — le verificăm la următoarea vizită.'];
        }
        if (!$out) {
            $out[] = ['ok', 'Flota dumneavoastră este în regulă pentru perioada următoare. Vă anunțăm din timp când apare ceva.'];
        }

        return array_map(static fn (array $a) => ['level' => $a[0], 'text' => $a[1]], $out);
    }

    /** CSV az ügyfélnek: járművek gumiállapota + műveletek + ajánlások (költségkeret, üzemanyag, sofőr nélkül). */
    public static function csv(Report $r, Brand $b): string
    {
        $rows = [[$b->legalName, 'Raport servicii flota', $r->fleetName, $r->period->label(), 'generat '.$r->generatedAt->format('d.m.Y')], [],
            ['Inmatriculare', 'Model', 'Sezon', 'Min. mm', 'Stare', 'Schimb estimat']];
        $label = ['ok' => 'in regula', 'soon' => 'curand', 'now' => 'acum'];
        foreach ($r->vehicles as $v) {
            $t = $v['tyres'];
            $rows[] = [$v['plate'], $v['model'], $t ? ('iarna' === $t['season'] ? 'iarna' : 'vara') : '', $t ? number_format($t['minMm'], 1, ',', '') : '', $t ? $label[$t['status']] ?? '' : '', $t['replaceBy'] ?? ''];
        }
        $rows[] = [];
        $rows[] = ['Data', 'Inmatriculare', 'Operatiune', 'Cost lei fara TVA'];
        foreach ($r->operations as $o) {
            $rows[] = [$o['date'], $o['plate'], $o['type'], number_format($o['cost'], 2, ',', '')];
        }
        $rows[] = [];
        $rows[] = ['Recomandare', 'Prioritate'];
        foreach (self::for($r, $b) as $a) {
            $rows[] = [$a['text'], ['red' => 'urgent', 'amb' => 'in perioada urmatoare'][$a['level']] ?? 'ok'];
        }

        return "\u{FEFF}".implode("\r\n", array_map(static fn (array $row) => implode(';', array_map(static function ($c) {
            $s = (string) $c;
            if ('' !== $s && \in_array($s[0], ['=', '+', '-', '@', "\t", "\r"], true) && !is_numeric(str_replace(',', '.', $s))) {
                $s = "'".$s;
            }

            return '"'.str_replace('"', '""', $s).'"';
        }, $row)), $rows))."\r\n";
    }
}
