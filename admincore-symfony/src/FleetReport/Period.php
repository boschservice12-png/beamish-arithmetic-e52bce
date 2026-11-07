<?php

namespace App\FleetReport;

/**
 * A riport időszaka: egy lezárt hónap ("2026-10"), negyedév ("2026-Q3"), év ("2026") vagy az év eleje óta
 * eltelt lezárt hónapok ("2026-YTD-10" = jan–okt; év közbeni éves nézet, előrejelzéssel).
 * A hónapok "ÉÉÉÉ-HH" kulcsok — ugyanaz a kulcs, amivel a költségsorokat csoportosítjuk.
 */
final class Period
{
    private const MONTHS_RO = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    /** @param list<string> $months */
    private function __construct(
        public readonly string $kind,
        public readonly string $key,
        public readonly array $months,
    ) {
    }

    public static function parse(string $key): self
    {
        $key = strtoupper(trim($key));
        if (preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $key, $m)) {
            return new self('month', $key, [$key]);
        }
        if (preg_match('/^(\d{4})-Q([1-4])$/', $key, $m)) {
            $first = ((int) $m[2] - 1) * 3 + 1;

            return new self('quarter', $key, array_map(static fn (int $i) => \sprintf('%s-%02d', $m[1], $first + $i), [0, 1, 2]));
        }
        if (preg_match('/^(\d{4})-YTD-(0[1-9]|1[0-2])$/', $key, $m)) {
            return new self('ytd', $key, array_map(static fn (int $i) => \sprintf('%s-%02d', $m[1], $i), range(1, (int) $m[2])));
        }
        if (preg_match('/^\d{4}$/', $key)) {
            return new self('year', $key, array_map(static fn (int $i) => \sprintf('%s-%02d', $key, $i), range(1, 12)));
        }

        throw new \InvalidArgumentException(\sprintf('Időszak: "ÉÉÉÉ-HH", "ÉÉÉÉ-Q1…Q4", "ÉÉÉÉ" vagy "ÉÉÉÉ-YTD-HH" — kaptam: "%s"', $key));
    }

    /** Az utolsó lezárt hónap / negyedév / év a megadott naphoz képest. */
    public static function lastClosed(string $kind, \DateTimeImmutable $today): self
    {
        $y = (int) $today->format('Y');
        $mo = (int) $today->format('n');

        return match ($kind) {
            'month' => self::parse($today->modify('first day of last month')->format('Y-m')),
            'quarter' => self::parse(1 === intdiv($mo - 1, 3) + 1 ? ($y - 1).'-Q4' : $y.'-Q'.intdiv($mo - 1, 3)),
            'year' => self::parse((string) ($y - 1)),
            'ytd' => self::parse($today->modify('first day of last month')->format('Y').'-YTD-'.$today->modify('first day of last month')->format('m')),
            default => throw new \InvalidArgumentException('Időszak-típus: month | quarter | year | ytd'),
        };
    }

    public function previous(): self
    {
        $first = new \DateTimeImmutable($this->months[0].'-01');

        return match ($this->kind) {
            'month' => self::parse($first->modify('-1 month')->format('Y-m')),
            'quarter' => self::parse(self::quarterKey($first->modify('-3 months'))),
            'ytd' => self::parse(((int) substr($this->key, 0, 4) - 1).substr($this->key, 4)),
            default => self::parse((string) ((int) $this->key - 1)),
        };
    }

    public function contains(string $month): bool
    {
        return \in_array($month, $this->months, true);
    }

    public function first(): string
    {
        return $this->months[0];
    }

    public function last(): string
    {
        return $this->months[\count($this->months) - 1];
    }

    /** Az időszak utolsó napja utáni nap (a riport legkorábbi küldési napja). */
    public function end(): \DateTimeImmutable
    {
        return (new \DateTimeImmutable($this->last().'-01'))->modify('first day of next month');
    }

    /**
     * $n hónap kulcsa visszafelé, $month-tal bezárólag (régi → új).
     *
     * @return list<string>
     */
    public static function monthsEndingAt(string $month, int $n): array
    {
        $d = new \DateTimeImmutable($month.'-01');
        $out = [];
        for ($i = $n - 1; $i >= 0; --$i) {
            $out[] = $d->modify(\sprintf('-%d months', $i))->format('Y-m');
        }

        return $out;
    }

    public function label(): string
    {
        return match ($this->kind) {
            'month' => self::monthLabel($this->key, true),
            'quarter' => 'T'.substr($this->key, -1).' '.substr($this->key, 0, 4),
            'ytd' => substr($this->key, 0, 4).' · '.explode(' ', self::monthLabel($this->first()))[0].'–'.explode(' ', self::monthLabel($this->last()))[0],
            default => 'anul '.$this->key,
        };
    }

    public static function monthLabel(string $month, bool $longYear = false): string
    {
        return self::MONTHS_RO[(int) substr($month, 5, 2) - 1].' '.($longYear ? substr($month, 0, 4) : substr($month, 2, 2));
    }

    private static function quarterKey(\DateTimeImmutable $d): string
    {
        return $d->format('Y').'-Q'.(intdiv((int) $d->format('n') - 1, 3) + 1);
    }
}
