<?php

namespace App\Command;

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
 *   php bin/console app:fleet-report:send --input=… --dry-run --out=var/share/fleet-report/out        (csak fájlok)
 *   php bin/console app:fleet-report:send --if-due                                                   (ütemező)
 */
#[AsCommand(name: 'app:fleet-report:send', description: 'Flotta-riport (PDF + CSV) küldése e-mailben — ütemezve is')]
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
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('input', 'i', InputOption::VALUE_REQUIRED, 'A flotta pillanatképe (tyrefleet.fleet-report/1 JSON) — alap: FLEET_REPORT_INPUT')
            ->addOption('period', 'p', InputOption::VALUE_REQUIRED, 'ÉÉÉÉ-HH · ÉÉÉÉ-Q1…Q4 · ÉÉÉÉ — alap: az előző (lezárt) hónap')
            ->addOption('to', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Címzett(ek) — alap: FLEET_REPORT_TO')
            ->addOption('cc', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Másolat — alap: FLEET_REPORT_CC')
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
        $tz = new \DateTimeZone(self::TZ);
        try {
            $now = new \DateTimeImmutable((string) ($input->getOption('now') ?? 'now'), $tz);
            $period = $input->getOption('period') ? Period::parse((string) $input->getOption('period')) : Period::lastClosed('month', $now);

            if ($input->getOption('if-due')) {
                $day = max(1, min(28, (int) ($this->day ?: 1)));
                $hour = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $this->hour) ? (string) $this->hour : '08:00';
                $due = new \DateTimeImmutable($period->end()->format('Y-m-').\sprintf('%02d', $day).' '.$hour, $tz);
                if ($now < $due) {
                    $io->writeln(\sprintf('Még nem esedékes: %s riport %s-kor megy.', $period->label(), $due->format('Y-m-d H:i')));

                    return Command::SUCCESS;
                }
            }

            $path = (string) ($input->getOption('input') ?: $this->defaultInput);
            if ('' === $path) {
                throw new \InvalidArgumentException('Hiányzik a bemenet: --input vagy FLEET_REPORT_INPUT.');
            }
            if (!str_starts_with($path, '/')) {
                $path = $this->projectDir.'/'.$path;
            }
            $snapshot = FleetSnapshot::fromFile($path);
            if ($snapshot->generatedAt < $period->end()) {
                throw new \InvalidArgumentException(\sprintf('A pillanatkép (%s) az időszak vége (%s) előtt készült — a %s még nem teljes. Friss exportot kérek.',
                    $snapshot->generatedAt->format('Y-m-d'), $period->end()->format('Y-m-d'), $period->label()));
            }

            if ($input->getOption('dry-run')) {
                $f = $this->sender->render($snapshot, $period);
                $dir = (string) $input->getOption('out');
                if (!str_starts_with($dir, '/')) {
                    $dir = $this->projectDir.'/'.$dir;
                }
                if (!is_dir($dir) && !mkdir($dir, 0770, true) && !is_dir($dir)) {
                    throw new \RuntimeException('A kimeneti mappa nem hozható létre: '.$dir);
                }
                $stem = $dir.'/'.$f['report']->fileStem();
                file_put_contents($stem.'.pdf', $f['pdf']);
                file_put_contents($stem.'.csv', $f['csv']);
                file_put_contents($stem.'.html', $f['html']);
                $io->success(\sprintf('%s · %s · %s (%s%% din buget) · %d decizii → %s.{pdf,csv,html}',
                    $f['report']->fleetName, $period->label(), Money::lei($f['report']->totals->total()),
                    Money::num($f['report']->budgetPct()), $f['report']->openDecisions(), $stem));

                return Command::SUCCESS;
            }

            $to = self::strings($input->getOption('to')) ?: self::strings($this->defaultTo);
            $cc = self::strings($input->getOption('cc')) ?: self::strings($this->defaultCc);
            $res = $this->sender->send($snapshot, $period, $to, $cc, !$input->getOption('no-csv'), (bool) $input->getOption('force'));
            if ('already_sent' === $res['status']) {
                $io->writeln(\sprintf('Már kiment: %s · %s (%s). Újraküldés: --force.', $snapshot->fleetName, $period->label(), $res['sentAt'] ?? ''));

                return Command::SUCCESS;
            }
            $io->success(\sprintf('Elküldve: %s · %s → %s', $snapshot->fleetName, $period->label(), implode(', ', FleetReportSender::addresses(array_merge($to, $cc), 'to'))));

            return Command::SUCCESS;
        } catch (\InvalidArgumentException $e) {
            $io->error($e->getMessage());

            return Command::INVALID;
        }
    }

    /** @return list<string> */
    private static function strings(mixed $v): array
    {
        $v = \is_array($v) ? $v : (null === $v || '' === $v ? [] : [$v]);

        return array_values(array_filter(array_map(static fn ($x) => \is_scalar($x) ? trim((string) $x) : '', $v), static fn (string $x) => '' !== $x));
    }
}
