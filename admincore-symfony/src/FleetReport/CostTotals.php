<?php

namespace App\FleetReport;

/** Egy halmaz költségsor összesítése (lei, ÁFA nélkül). */
final class CostTotals
{
    public function __construct(
        public readonly float $admin = 0.0,
        public readonly float $oper = 0.0,
        public readonly float $fuel = 0.0,
        public readonly float $km = 0.0,
        public readonly float $liters = 0.0,
    ) {
    }

    /** @param iterable<array{cat: string, net: float, liters: float, km: float}> $rows */
    public static function of(iterable $rows): self
    {
        $a = ['admin' => 0.0, 'oper' => 0.0, 'fuel' => 0.0];
        $km = $l = 0.0;
        foreach ($rows as $r) {
            $a[$r['cat']] = ($a[$r['cat']] ?? 0.0) + $r['net'];
            if ('fuel' === $r['cat']) {
                $km += $r['km'];
                $l += $r['liters'];
            }
        }

        return new self($a['admin'], $a['oper'], $a['fuel'], $km, $l);
    }

    public function total(): float
    {
        return $this->admin + $this->oper + $this->fuel;
    }

    public function perKm(): ?float
    {
        return $this->km > 0 ? $this->total() / $this->km : null;
    }

    public function consumption(): ?float
    {
        return $this->km > 0 ? $this->liters / $this->km * 100 : null;
    }

    public function get(string $metric): ?float
    {
        return match ($metric) {
            'total' => $this->total(), 'admin' => $this->admin, 'oper' => $this->oper, 'fuel' => $this->fuel,
            'km' => $this->km, 'liters' => $this->liters, 'perKm' => $this->perKm(), 'consumption' => $this->consumption(),
            default => throw new \InvalidArgumentException($metric),
        };
    }

    /** Százalékos változás egy korábbi értékhez képest; null, ha nincs mihez mérni. */
    public static function delta(?float $now, ?float $before): ?float
    {
        return null === $now || null === $before || $before <= 0 ? null : ($now / $before - 1) * 100;
    }
}
