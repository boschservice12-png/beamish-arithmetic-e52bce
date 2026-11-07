<?php

namespace App\FleetReport;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Lock\LockFactory;

/**
 * Küldési napló: flottánként és időszakonként egy sor (címzettek, fájlok SHA-256-ja, időpont). Ezért biztonságos
 * óránként futtatni az ütemezőt: ami egyszer kiment, nem megy ki újra (csak --force-szal), és ha a szerver
 * 1-jén állt, a következő futás pótolja. Egy JSON-fájl a tartós `var/share` alatt; írás zárral és atomikus cserével.
 */
final class SendLedger
{
    public function __construct(
        private readonly LockFactory $locks,
        #[Autowire('%kernel.project_dir%/var/share/fleet-report/ledger.json')]
        private readonly string $path,
    ) {
    }

    public static function key(string $fleetId, string $periodKey, string $variant = 'internal'): string
    {
        return $fleetId.'|'.$periodKey.'|'.$variant;
    }

    /** @return array<string, mixed>|null */
    public function find(string $key): ?array
    {
        $all = $this->all();

        return isset($all[$key]) && \is_array($all[$key]) ? $all[$key] : null;
    }

    /** @param array<string, mixed> $entry */
    public function record(string $key, array $entry): void
    {
        $lock = $this->locks->createLock('fleet-report-ledger', 30);
        $lock->acquire(true);
        try {
            $all = $this->all();
            $all[$key] = $entry;
            $dir = \dirname($this->path);
            if (!is_dir($dir) && !mkdir($dir, 0770, true) && !is_dir($dir)) {
                throw new \RuntimeException('A küldési napló mappája nem hozható létre: '.$dir);
            }
            $tmp = $this->path.'.tmp';
            file_put_contents($tmp, json_encode($all, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR));
            rename($tmp, $this->path);
        } finally {
            $lock->release();
        }
    }

    /** @return array<string, mixed> */
    private function all(): array
    {
        if (!is_file($this->path)) {
            return [];
        }
        $d = json_decode((string) file_get_contents($this->path), true);

        return \is_array($d) ? $d : [];
    }
}
