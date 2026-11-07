<?php

namespace App\Command;

use App\FleetReport\Brand;
use App\FleetReport\ClientActions;
use App\FleetReport\FleetReportSender;
use App\FleetReport\FleetSnapshot;
use App\FleetReport\Money;
use App\FleetReport\Period;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Flotta-riport küldése e-mailben (PDF + CSV). Az ütemező óránként hívja --if-due kapcsolóval: a beállított
 * nap és óra után egyszer küld, a küldési napló miatt soha kétszer; ha a szerver akkor állt, a következő futás pótolja.
 *
 *   php bin/console app:fleet-report:send --input=var/share/fleet-report/in/curier-demo.json            (előző hónap, most)
 *   php bin/console app:fleet-report:send --input=… --period=2026-09 --to=a@b.ro --cc=c@d.ro
 *   php bin/console app:fleet-report:send --input=… --period=2026-Q3          (negyedév)  · --period=2025 (év)
 *   php bin/console app:fleet-report:send --input=… --period=2026-YTD-10      (év eleje óta, év végi előrejelzéssel)
 *   php bin/console app:fleet-report:send --input=… --dry-run --out=var/share/fleet-report/out        (csak fájlok)
 *   php bin/console app:fleet-report:send --if-due --kind=month --kind=quarter --kind=year           (ütemező)
 *   php bin/console app:fleet-report:send --variant=client --if-due     (B2B: a szerviz küldi az ügyfélnek, márka-fájllal)
 */
#[AsCommand(name: 'app:fleet-report:send', description: 'Flotta-riport (PDF + CSV) küldése e-mailben — havi, negyedéves, éves; ütemezve is')]
final class FleetReportSendCommand extends Command
{
    private const TZ = 'Europe/Bucharest';

    public function __construct(
        private readonly FleetReportSender $sender,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
        #[Autowire('%env(default::FLEET_REPORT_INPUT)%')]
        private readonly ?string $defaultInput,
        #[Autowire('%env(default::FLEET_REPORT_TO)%')]
        private readonly ?string $defaultTo,
        #[Autowire('%env(default::FLEET_REPORT_CC)%')]
        private readonly ?string $defaultCc,
        #[Autowire('%env(default::FLEET_REPORT_DAY)%')]
        private readonly ?string $day,
        #[Autowire('%env(default::FLEET_REPORT_HOUR)%')]
        private readonly ?string $hour,
        #[Autowire('%env(default::FLEET_REPORT_CLIENT_TO)%')]
        private readonly ?string $clientTo,
        #[Autowire('%env(default::FLEET_REPORT_CLIENT_CC)%')]
        private readonly ?string $clientCc,
        #[Autowire('%env(default::FLEET_REPORT_BRAND)%')]
        private readonly ?string $brandFile,
        #[Autowire('%env(default::FLEET_REPORT_KINDS)%')]
        private readonly ?string $defaultKinds,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('input', 'i', InputOption::VALUE_REQUIRED, 'A flotta pillanatképe (tyrefleet.fleet-report/1 JSON) — alap: FLEET_REPORT_INPUT')
            ->addOption('period', 'p', InputOption::VALUE_REQUIRED, 'ÉÉÉÉ-HH · ÉÉÉÉ-Q1…Q4 · ÉÉÉÉ · ÉÉÉÉ-YTD-HH — alap: a --kind szerinti utolsó lezárt időszak')
            ->addOption('kind', 'k', InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'month | quarter | year | ytd (több is) — alap: FLEET_REPORT_KINDS, különben month')
            ->addOption('variant', null, InputOption::VALUE_REQUIRED, 'internal = a flotta vezetőjének · client = B2B, a szerviz arculatával (FLEET_REPORT_CLIENT_TO, FLEET_REPORT_BRAND)', 'internal')
            ->addOption('brand', null, InputOption::VALUE_REQUIRED, 'Márka-fájl a client változathoz — alap: FLEET_REPORT_BRAND, különben config/fleet-report/brand.json')
            ->addOption('to', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Címzett(ek) — alap: FLEET_REPORT_TO / FLEET_REPORT_CLIENT_TO')
            ->addOption('cc', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Másolat — alap: FLEET_REPORT_CC / FLEET_REPORT_CLIENT_CC')
            ->addOption('no-csv', null, InputOption::VALUE_NONE, 'Csak PDF, CSV nélkül')
            ->addOption('if-due', null, InputOption::VALUE_NONE, 'Csak ha elérkezett a küldés ideje (FLEET_REPORT_DAY, FLEET_REPORT_HOUR) — az ütemezőnek')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Nem küld: a PDF-et, CSV-t és HTML-t az --out mappába írja')
            ->addOption('out', null, InputOption::VALUE_REQUIRED, 'Mappa a --dry-run fájljainak', 'var/share/fleet-report/out')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Újraküldés akkor is, ha erre az időszakra már kiment')
            ->addOption('now', null, InputOption::VALUE_REQUIRED, 'A „most” felülírása (ÉÉÉÉ-HH-NN ÓÓ:PP) — teszteléshez');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        try {
            $now = new \DateTimeImmutable((string) ($input->getOption('now') ?? 'now'), new \DateTimeZone(self::TZ));
            if ($input->getOption('period')) {
                $periods = [Period::parse((string) $input->getOption('period'))];
            } else {
                $kinds = self::strings($input->getOption('kind')) ?: self::strings(str_replace(' ', '', (string) $this->defaultKinds) ?: 'month');
                $kinds = array_values(array_unique(array_merge(...array_map(static fn (string $k) => explode(',', $k), $kinds))));
                $periods = array_map(static fn (string $k) => Period::lastClosed($k, $now), $kinds);
            }
            $variant = (string) $input->getOption('variant');
            if (!\in_array($variant, ['internal', 'client'], true)) {
                throw new \InvalidArgumentException('--variant: internal | client');
            }

            $code = Command::SUCCESS;
            foreach ($periods as $period) { // egy időszak hibája nem akasztja meg a többit (az ütemező minden típust végigjár)
                try {
                    $code = max($code, $this->one($input, $io, $period, $variant, $now));
                } catch (\InvalidArgumentException $e) {
                    $io->error($period->label().': '.$e->getMessage());
                    $code = Command::INVALID;
                }
            }

            return $code;
        } catch (\InvalidArgumentException $e) {
            $io->error($e->getMessage());

            return Command::INVALID;
        }
    }

    private function one(InputInterface $input, SymfonyStyle $io, Period $period, string $variant, \DateTimeImmutable $now): int
    {
        $client = 'client' === $variant;
        $to = self::strings($input->getOption('to')) ?: self::strings($client ? $this->clientTo : $this->defaultTo);
        $cc = self::strings($input->getOption('cc')) ?: self::strings($client ? $this->clientCc : $this->defaultCc);
        $dry = (bool) $input->getOption('dry-run');

        if ($input->getOption('if-due')) {
            if (!$to && !$dry) {
                $io->writeln(\sprintf('%s · %s: nincs címzett (%s) — kihagyva.', $period->label(), $variant, $client ? 'FLEET_REPORT_CLIENT_TO' : 'FLEET_REPORT_TO'));

                return Command::SUCCESS;
            }
            $day = max(1, min(28, (int) ($this->day ?: 1)));
            $hour = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $this->hour) ? (string) $this->hour : '08:00';
            $due = new \DateTimeImmutable($period->end()->format('Y-m-').\sprintf('%02d', $day).' '.$hour, $now->getTimezone());
            if ($now < $due) {
                $io->writeln(\sprintf('Még nem esedékes: %s riport %s-kor megy.', $period->label(), $due->format('Y-m-d H:i')));

                return Command::SUCCESS;
            }
        }

        $path = (string) ($input->getOption('input') ?: $this->defaultInput);
        if ('' === $path) {
            throw new \InvalidArgumentException('Hiányzik a bemenet: --input vagy FLEET_REPORT_INPUT.');
        }
        $snapshot = FleetSnapshot::fromFile(str_starts_with($path, '/') ? $path : $this->projectDir.'/'.$path);
        if ($snapshot->generatedAt < $period->end()) {
            throw new \InvalidArgumentException(\sprintf('A pillanatkép (%s) az időszak vége (%s) előtt készült — a %s még nem teljes. Friss exportot kérek.',
                $snapshot->generatedAt->format('Y-m-d'), $period->end()->format('Y-m-d'), $period->label()));
        }
        $brand = null;
        if ($client) {
            $bf = (string) ($input->getOption('brand') ?: $this->brandFile ?: 'config/fleet-report/brand.json');
            $brand = Brand::fromFile(str_starts_with($bf, '/') ? $bf : $this->projectDir.'/'.$bf);
        }

        if ($dry) {
            $f = $this->sender->render($snapshot, $period, $brand);
            $dir = (string) $input->getOption('out');
            $dir = str_starts_with($dir, '/') ? $dir : $this->projectDir.'/'.$dir;
            if (!is_dir($dir) && !mkdir($dir, 0770, true) && !is_dir($dir)) {
                throw new \RuntimeException('A kimeneti mappa nem hozható létre: '.$dir);
            }
            $stem = $dir.'/'.$f['stem'];
            file_put_contents($stem.'.pdf', $f['pdf']);
            file_put_contents($stem.'.csv', $f['csv']);
            file_put_contents($stem.'.html', $f['html']);
            $r = $f['report'];
            $io->success(null === $brand
                ? \sprintf('%s · %s · %s (%s%% din buget) · %d decizii → %s.{pdf,csv,html}', $r->fleetName, $period->label(),
                    Money::lei($r->totals->total()), Money::num($r->budgetPct()), $r->openDecisions(), $stem)
                : \sprintf('B2B · %s → %s · %s · %d recomandări → %s.{pdf,csv,html}', $brand->name, $r->fleetName, $period->label(),
                    \count(ClientActions::for($r, $brand)), $stem));

            return Command::SUCCESS;
        }

        $res = $this->sender->send($snapshot, $period, $to, $cc, !$input->getOption('no-csv'), (bool) $input->getOption('force'), $brand);
        if ('already_sent' === $res['status']) {
            $io->writeln(\sprintf('Már kiment (%s): %s · %s (%s). Újraküldés: --force.', $variant, $snapshot->fleetName, $period->label(), $res['sentAt'] ?? ''));

            return Command::SUCCESS;
        }
        $io->success(\sprintf('Elküldve (%s): %s · %s → %s', $variant, $snapshot->fleetName, $period->label(), implode(', ', FleetReportSender::addresses(array_merge($to, $cc), 'to'))));

        return Command::SUCCESS;
    }

    /** @return list<string> */
    private static function strings(mixed $v): array
    {
        $v = \is_array($v) ? $v : (null === $v || '' === $v ? [] : [$v]);

        return array_values(array_filter(array_map(static fn ($x) => \is_scalar($x) ? trim((string) $x) : '', $v), static fn (string $x) => '' !== $x));
    }
}
