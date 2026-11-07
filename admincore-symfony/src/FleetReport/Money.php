<?php

namespace App\FleetReport;

/** Román formázás: 32.558 lei · 0,62 · +12,5% — ugyanaz a riportban, a CSV-ben és az e-mailben. */
final class Money
{
    public static function lei(float $x): string
    {
        return number_format(round($x), 0, ',', '.').' lei';
    }

    public static function num(?float $x, int $dec = 0): string
    {
        return null === $x ? '—' : number_format($x, $dec, ',', '.');
    }

    public static function pct(?float $x): string
    {
        if (null === $x) {
            return '—';
        }

        return ($x > 0 ? '+' : '').number_format($x, abs($x) < 10 ? 1 : 0, ',', '.').'%';
    }

    /** Költségnél a növekedés rossz (piros), a csökkenés jó (zöld). */
    public static function trend(?float $x): string
    {
        return null === $x || abs($x) < 1 ? 'eq' : ($x > 0 ? 'up' : 'dn');
    }
}
