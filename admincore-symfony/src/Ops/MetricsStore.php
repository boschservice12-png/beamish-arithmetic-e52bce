<?php

namespace App\Ops;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Prometheus-számlálók külső függőség nélkül: egy kis JSON-fájl, kizárólagos zárral írva.
 * A forgalom (egy szerviz irodája + műhely) kicsi, így kérésenként egy rövid fájlírás elhanyagolható.
 * A fájl a naplókötetben van → konténercsere után is megmarad (a számlálók nem nullázódnak).
 *
 * Csak alacsony kardinalitású címkék: útvonalnév, engedélyezett erőforrás, státuszosztály — soha felhasználó vagy IP.
 */
final class MetricsStore
{
    /** Válaszidő-hisztogram határai (másodperc). */
    public const BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];

    private readonly string $file;

    public function __construct(#[Autowire('%kernel.logs_dir%')] string $logsDir)
    {
        $this->file = $logsDir.'/metrics.json';
    }

    /**
     * Egy kérés összes mérését egyetlen zárolt írással rögzíti.
     *
     * @param list<array{0: string, 1: array<string, string>, 2?: float}> $counters [név, címkék, növekmény]
     * @param list<array{0: string, 1: array<string, string>, 2: float}>  $histograms [név, címkék, érték]
     * @param list<array{0: string, 1: array<string, string>, 2: float}>  $gauges [név, címkék, érték]
     */
    public function record(array $counters = [], array $histograms = [], array $gauges = []): void
    {
        $dir = \dirname($this->file);
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            return;
        }
        $h = @fopen($this->file, 'c+');
        if (false === $h) {
            return;
        }
        try {
            if (!flock($h, \LOCK_EX)) {
                return;
            }
            $data = self::decode(stream_get_contents($h) ?: '');
            foreach ($counters as $c) {
                $k = self::key($c[0], $c[1]);
                $data['c'][$k] = ($data['c'][$k] ?? 0) + ($c[2] ?? 1);
            }
            foreach ($histograms as [$name, $labels, $value]) {
                $k = self::key($name, $labels);
                $hist = $data['h'][$k] ?? ['b' => array_fill(0, \count(self::BUCKETS), 0), 's' => 0.0, 'n' => 0];
                foreach (self::BUCKETS as $i => $le) {
                    if ($value <= $le) {
                        ++$hist['b'][$i];
                    }
                }
                $hist['s'] += $value;
                ++$hist['n'];
                $data['h'][$k] = $hist;
            }
            foreach ($gauges as [$name, $labels, $value]) {
                $data['g'][self::key($name, $labels)] = $value;
            }
            ftruncate($h, 0);
            rewind($h);
            fwrite($h, json_encode($data, \JSON_THROW_ON_ERROR));
            fflush($h);
        } catch (\Throwable) {
            // a mérés soha nem törheti el a kiszolgálást
        } finally {
            flock($h, \LOCK_UN);
            fclose($h);
        }
    }

    /** @return array{c: array<string, float>, h: array<string, array{b: list<int>, s: float, n: int}>, g: array<string, float>} */
    public function snapshot(): array
    {
        $raw = @file_get_contents($this->file);

        return self::decode(false === $raw ? '' : $raw);
    }

    /** @param array<string, string> $labels */
    public static function key(string $name, array $labels): string
    {
        ksort($labels);

        return $name.'|'.http_build_query($labels);
    }

    /** @return array{0: string, 1: array<string, string>} */
    public static function parseKey(string $key): array
    {
        [$name, $q] = explode('|', $key, 2) + [1 => ''];
        parse_str($q, $labels);

        return [$name, array_map('strval', $labels)];
    }

    /** @return array{c: array<string, float>, h: array<string, array{b: list<int>, s: float, n: int}>, g: array<string, float>} */
    private static function decode(string $raw): array
    {
        $d = '' === $raw ? null : json_decode($raw, true);

        return [
            'c' => \is_array($d['c'] ?? null) ? $d['c'] : [],
            'h' => \is_array($d['h'] ?? null) ? $d['h'] : [],
            'g' => \is_array($d['g'] ?? null) ? $d['g'] : [],
        ];
    }
}
