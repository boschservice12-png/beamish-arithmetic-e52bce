<?php

namespace App\FleetReport;

/**
 * A riport bemenete — a "tyrefleet.fleet-report/1" szerződés. Ma a flotta-demó „Export date” gombja írja,
 * később a flotta-adatbázis (Supabase) ugyanezt a szerkezetet adja; a riport csak ebből dolgozik.
 *
 * Összegek: lei, ÁFA nélkül. Dátumok: ÉÉÉÉ-HH-NN. Rendszám: a jármű kulcsa.
 * Személyes adat: csak sofőrnév — CNP, egészségügyi adat soha nem kerül bele.
 */
final class FleetSnapshot
{
    public const SCHEMA = 'tyrefleet.fleet-report/1';
    public const CATEGORIES = ['admin', 'oper', 'fuel'];

    /**
     * @param array{fleetMonth: float, fleetYear: float|null, vehicleMonth: float, warnPct: float, vehicles: array<string, float>} $budget
     * @param array<string, array{plate: string, model: string, driver: string, tyres: array{status: string, minMm: float, season: string, replaceBy: string|null}|null}> $vehicles
     * @param list<array{plate: string, month: string, date: string, cat: string, sub: string, net: float, liters: float, km: float}> $costs
     * @param list<array{plate: string, month: string, kind: string, detail: string}> $exceptions
     * @param list<array{plate: string, date: string, type: string, cost: float}> $operations
     * @param array{tyres: array{ok: int, soon: int, now: int}, blocked: list<string>, summerTyresInWinter: list<string>, documents: list<array{label: string, for: string, due: string, expired: bool}>, tyreOrders3m: array{count: int, cost: float}, setsWithoutProof: int, storedSets: int} $state
     */
    private function __construct(
        public readonly string $fleetId,
        public readonly string $fleetName,
        public readonly \DateTimeImmutable $generatedAt,
        public readonly array $budget,
        public readonly array $vehicles,
        public readonly array $costs,
        public readonly array $exceptions,
        public readonly array $operations,
        public readonly array $state,
    ) {
    }

    public static function fromFile(string $path): self
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new \InvalidArgumentException(\sprintf('A bemeneti fájl nem olvasható: %s', $path));
        }
        if (filesize($path) > 20 * 1024 * 1024) {
            throw new \InvalidArgumentException('A bemeneti fájl nagyobb 20 MB-nál.');
        }

        return self::fromJson((string) file_get_contents($path));
    }

    public static function fromJson(string $json): self
    {
        try {
            $d = json_decode($json, true, 64, \JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new \InvalidArgumentException('Érvénytelen JSON: '.$e->getMessage(), 0, $e);
        }
        if (!\is_array($d)) {
            throw new \InvalidArgumentException('A bemenet JSON-objektum legyen.');
        }

        return self::fromArray($d);
    }

    /** @param array<mixed> $d */
    public static function fromArray(array $d): self
    {
        if (($d['schema'] ?? null) !== self::SCHEMA) {
            throw new \InvalidArgumentException(\sprintf('schema: "%s" kell.', self::SCHEMA));
        }
        $fleet = self::arr($d, 'fleet');
        $id = self::str($fleet, 'id', 'fleet.id');
        if (!preg_match('/^[a-z0-9][a-z0-9-]{1,62}$/', $id)) {
            throw new \InvalidArgumentException('fleet.id: kisbetű, szám, kötőjel (2–63 karakter).');
        }
        $generated = self::date(self::str($d, 'generatedAt', 'generatedAt'), 'generatedAt');

        $b = self::arr($d, 'budget');
        $vehBudgets = [];
        foreach (\is_array($b['vehicles'] ?? null) ? $b['vehicles'] : [] as $plate => $v) {
            $vehBudgets[self::plate((string) $plate)] = self::num($v, 'budget.vehicles.'.$plate);
        }
        $budget = [
            'fleetMonth' => self::num($b['fleetMonth'] ?? null, 'budget.fleetMonth', true),
            'fleetYear' => isset($b['fleetYear']) ? self::num($b['fleetYear'], 'budget.fleetYear', true) : null,
            'vehicleMonth' => self::num($b['vehicleMonth'] ?? null, 'budget.vehicleMonth', true),
            'warnPct' => isset($b['warnPct']) ? self::num($b['warnPct'], 'budget.warnPct') : 80.0,
            'vehicles' => $vehBudgets,
        ];

        $vehicles = [];
        foreach (self::list($d, 'vehicles') as $i => $v) {
            $p = self::plate(self::str($v, 'plate', "vehicles[$i].plate"));
            if (isset($vehicles[$p])) {
                throw new \InvalidArgumentException("vehicles[$i]: a rendszám kétszer szerepel ($p).");
            }
            $vehicles[$p] = ['plate' => $p, 'model' => self::str($v, 'model', "vehicles[$i].model", true), 'driver' => self::str($v, 'driver', "vehicles[$i].driver", true),
                'tyres' => \is_array($v['tyres'] ?? null) ? self::tyres($v['tyres'], "vehicles[$i].tyres") : null];
        }
        if (!$vehicles) {
            throw new \InvalidArgumentException('vehicles: legalább egy jármű kell.');
        }
        $known = static function (string $plate, string $where) use ($vehicles): string {
            $p = self::plate($plate);
            if (!isset($vehicles[$p])) {
                throw new \InvalidArgumentException("$where: ismeretlen rendszám ($plate).");
            }

            return $p;
        };

        $costs = [];
        foreach (self::list($d, 'costs') as $i => $c) {
            $date = self::str($c, 'date', "costs[$i].date");
            self::date($date, "costs[$i].date");
            $cat = self::str($c, 'cat', "costs[$i].cat");
            if (!\in_array($cat, self::CATEGORIES, true)) {
                throw new \InvalidArgumentException("costs[$i].cat: admin | oper | fuel.");
            }
            $costs[] = [
                'plate' => $known(self::str($c, 'plate', "costs[$i].plate"), "costs[$i]"),
                'month' => substr($date, 0, 7), 'date' => $date, 'cat' => $cat,
                'sub' => self::str($c, 'sub', "costs[$i].sub", true) ?: 'Altele',
                'net' => self::num($c['net'] ?? null, "costs[$i].net"),
                'liters' => isset($c['liters']) ? self::num($c['liters'], "costs[$i].liters") : 0.0,
                'km' => isset($c['km']) ? self::num($c['km'], "costs[$i].km") : 0.0,
            ];
        }

        $exceptions = [];
        foreach (self::list($d, 'exceptions', true) as $i => $x) {
            $m = self::str($x, 'month', "exceptions[$i].month");
            if (!preg_match('/^\d{4}-\d{2}$/', $m)) {
                throw new \InvalidArgumentException("exceptions[$i].month: ÉÉÉÉ-HH.");
            }
            $exceptions[] = ['plate' => $known(self::str($x, 'plate', "exceptions[$i].plate"), "exceptions[$i]"), 'month' => $m,
                'kind' => self::str($x, 'kind', "exceptions[$i].kind"), 'detail' => mb_substr(self::str($x, 'detail', "exceptions[$i].detail", true), 0, 240)];
        }

        $operations = [];
        foreach (self::list($d, 'operations', true) as $i => $o) {
            $date = self::str($o, 'date', "operations[$i].date");
            self::date($date, "operations[$i].date");
            $operations[] = ['plate' => $known(self::str($o, 'plate', "operations[$i].plate"), "operations[$i]"), 'date' => $date,
                'type' => self::str($o, 'type', "operations[$i].type"), 'cost' => isset($o['cost']) ? self::num($o['cost'], "operations[$i].cost") : 0.0];
        }

        $s = \is_array($d['state'] ?? null) ? $d['state'] : [];
        $t = \is_array($s['tyres'] ?? null) ? $s['tyres'] : [];
        $docs = [];
        foreach (\is_array($s['documents'] ?? null) ? array_values($s['documents']) : [] as $i => $doc) {
            if (!\is_array($doc)) {
                throw new \InvalidArgumentException("state.documents[$i]: objektum kell.");
            }
            $due = self::str($doc, 'due', "state.documents[$i].due");
            self::date($due, "state.documents[$i].due");
            $docs[] = ['label' => self::str($doc, 'label', "state.documents[$i].label"), 'for' => self::str($doc, 'for', "state.documents[$i].for", true), 'due' => $due, 'expired' => true === ($doc['expired'] ?? false)];
        }
        $orders = \is_array($s['tyreOrders3m'] ?? null) ? $s['tyreOrders3m'] : [];
        $state = [
            'tyres' => ['ok' => self::int($t['ok'] ?? 0), 'soon' => self::int($t['soon'] ?? 0), 'now' => self::int($t['now'] ?? 0)],
            'blocked' => self::plates($s['blocked'] ?? []),
            'summerTyresInWinter' => self::plates($s['summerTyresInWinter'] ?? []),
            'documents' => $docs,
            'tyreOrders3m' => ['count' => self::int($orders['count'] ?? 0), 'cost' => self::num($orders['cost'] ?? 0, 'state.tyreOrders3m.cost')],
            'setsWithoutProof' => self::int($s['setsWithoutProof'] ?? 0),
            'storedSets' => self::int($s['storedSets'] ?? 0),
        ];

        return new self($id, self::str($fleet, 'name', 'fleet.name'), $generated, $budget, $vehicles, $costs, $exceptions, $operations, $state);
    }

    public function vehicleBudget(string $plate): float
    {
        return $this->budget['vehicles'][$plate] ?? $this->budget['vehicleMonth'];
    }

    /**
     * Hónapok, amelyekre van költségadat (növekvő).
     *
     * @return list<string>
     */
    public function monthsWithData(): array
    {
        $m = array_values(array_unique(array_column($this->costs, 'month')));
        sort($m);

        return $m;
    }

    public static function plate(string $p): string
    {
        return trim((string) preg_replace('/\s+/', ' ', strtoupper($p)));
    }

    /**
     * @param array<mixed> $d
     *
     * @return array<mixed>
     */
    private static function arr(array $d, string $k): array
    {
        if (!\is_array($d[$k] ?? null)) {
            throw new \InvalidArgumentException("$k: objektum kell.");
        }

        return $d[$k];
    }

    /**
     * @param array<mixed> $d
     *
     * @return list<array<mixed>>
     */
    private static function list(array $d, string $k, bool $optional = false): array
    {
        $v = $d[$k] ?? ($optional ? [] : null);
        if (!\is_array($v) || !array_is_list($v)) {
            throw new \InvalidArgumentException("$k: lista kell.");
        }
        foreach ($v as $i => $row) {
            if (!\is_array($row)) {
                throw new \InvalidArgumentException("{$k}[$i]: objektum kell.");
            }
        }

        return $v;
    }

    /** @param array<mixed> $d */
    private static function str(array $d, string $k, string $where, bool $allowEmpty = false): string
    {
        $v = $d[$k] ?? null;
        if (!\is_string($v) || (!$allowEmpty && '' === trim($v))) {
            throw new \InvalidArgumentException("$where: szöveg kell.");
        }

        return trim(mb_substr($v, 0, 200));
    }

    private static function num(mixed $v, string $where, bool $positive = false): float
    {
        if (!\is_int($v) && !\is_float($v)) {
            throw new \InvalidArgumentException("$where: szám kell.");
        }
        $f = (float) $v;
        if (!is_finite($f) || $f < 0 || ($positive && 0.0 === $f) || $f > 1e9) {
            throw new \InvalidArgumentException("$where: ".($positive ? 'pozitív' : 'nem negatív').' szám kell.');
        }

        return $f;
    }

    /**
     * Opcionális, járművenkénti gumiállapot (a B2B riporthoz): status ok|soon|now, legkisebb mm, évszak, csere várható dátuma.
     *
     * @param array<mixed> $t
     *
     * @return array{status: string, minMm: float, season: string, replaceBy: string|null}
     */
    private static function tyres(array $t, string $where): array
    {
        $status = $t['status'] ?? null;
        if (!\in_array($status, ['ok', 'soon', 'now'], true)) {
            throw new \InvalidArgumentException("$where.status: ok | soon | now.");
        }
        $season = $t['season'] ?? null;
        if (!\in_array($season, ['vara', 'iarna'], true)) {
            throw new \InvalidArgumentException("$where.season: vara | iarna.");
        }
        $by = $t['replaceBy'] ?? null;
        if (null !== $by) {
            $by = self::str($t, 'replaceBy', "$where.replaceBy");
            self::date($by, "$where.replaceBy");
        }

        return ['status' => $status, 'minMm' => self::num($t['minMm'] ?? null, "$where.minMm"), 'season' => $season, 'replaceBy' => $by];
    }

    private static function int(mixed $v): int
    {
        return \is_int($v) && $v >= 0 ? $v : 0;
    }

    /** @return list<string> */
    private static function plates(mixed $v): array
    {
        return \is_array($v) ? array_values(array_map(static fn ($p) => self::plate((string) $p), array_filter($v, 'is_string'))) : [];
    }

    private static function date(string $s, string $where): \DateTimeImmutable
    {
        $d = \DateTimeImmutable::createFromFormat('!Y-m-d', $s);
        if (!$d || $d->format('Y-m-d') !== $s) {
            throw new \InvalidArgumentException("$where: ÉÉÉÉ-HH-NN dátum kell.");
        }

        return $d;
    }
}
