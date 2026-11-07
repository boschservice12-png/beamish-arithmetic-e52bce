<?php

namespace App\FleetReport;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Riport → fájlok (PDF + CSV + HTML) → e-mail → küldési napló + auditnapló.
 * A dupla küldés ellen: ugyanarra a flottára, időszakra és változatra egyszer megy ki (csak $force-szal újra).
 */
final class FleetReportSender
{
    public function __construct(
        private readonly ReportBuilder $builder,
        private readonly ReportRenderer $renderer,
        private readonly ReportCsv $csv,
        private readonly MailerInterface $mailer,
        private readonly SendLedger $ledger,
        #[Autowire(service: 'monolog.logger.audit')]
        private readonly LoggerInterface $audit,
        #[Autowire('%env(default::FLEET_REPORT_FROM)%')]
        private readonly ?string $from,
    ) {
    }

    /** @return array{report: Report, html: string, pdf: string, csv: string} */
    public function render(FleetSnapshot $s, Period $period): array
    {
        $r = $this->builder->build($s, $period);
        $html = $this->renderer->html($r);

        return ['report' => $r, 'html' => $html, 'pdf' => $this->renderer->pdf($html), 'csv' => $this->csv->render($r)];
    }

    /**
     * @param list<string> $to
     * @param list<string> $cc
     *
     * @return array{status: string, report: Report, ledgerKey: string, sentAt?: string}
     */
    public function send(FleetSnapshot $s, Period $period, array $to, array $cc = [], bool $withCsv = true, bool $force = false): array
    {
        $key = SendLedger::key($s->fleetId, $period->key);
        $prev = $this->ledger->find($key);
        if ($prev && !$force) {
            return ['status' => 'already_sent', 'report' => $this->builder->build($s, $period), 'ledgerKey' => $key, 'sentAt' => (string) ($prev['sentAt'] ?? '')];
        }
        $to = self::addresses($to, 'to');
        $cc = self::addresses($cc, 'cc');
        if (!$to) {
            throw new \InvalidArgumentException('Nincs címzett (--to vagy FLEET_REPORT_TO).');
        }
        if (\count($to) + \count($cc) > 10) {
            throw new \InvalidArgumentException('Legfeljebb 10 címzett.');
        }
        if (!$this->from) {
            throw new \InvalidArgumentException('Nincs feladó: FLEET_REPORT_FROM (pl. "TyreFleet <raport@cegem.ro>").');
        }

        $f = $this->render($s, $period);
        $r = $f['report'];
        $email = (new Email())
            ->from(Address::create($this->from))
            ->to(...array_map(static fn (string $a) => new Address($a), $to))
            ->subject(\sprintf('Raport flotă · %s · %s · %s (%s din buget)', $r->fleetName, $r->period->label(), Money::lei($r->totals->total()), Money::num($r->budgetPct()).'%'))
            ->html($this->renderer->emailHtml($r, $withCsv))
            ->text($this->text($r, $withCsv))
            ->attach($f['pdf'], $r->fileStem().'.pdf', 'application/pdf');
        if ($cc) {
            $email->cc(...array_map(static fn (string $a) => new Address($a), $cc));
        }
        if ($withCsv) {
            $email->attach($f['csv'], $r->fileStem().'.csv', 'text/csv; charset=UTF-8');
        }
        $email->getHeaders()->addTextHeader('X-TyreFleet-Report', $key);

        $this->mailer->send($email);

        $sentAt = (new \DateTimeImmutable('now', new \DateTimeZone('Europe/Bucharest')))->format(\DATE_ATOM);
        $this->ledger->record($key, [
            'sentAt' => $sentAt, 'to' => $to, 'cc' => $cc, 'forced' => $force && null !== $prev,
            'total' => round($r->totals->total(), 2), 'budgetPct' => round($r->budgetPct(), 1), 'decisions' => $r->openDecisions(),
            'pdfSha256' => hash('sha256', $f['pdf']), 'csvSha256' => $withCsv ? hash('sha256', $f['csv']) : null,
            'snapshotGeneratedAt' => $s->generatedAt->format('Y-m-d'),
        ]);
        $this->audit->info('fleet_report.sent', ['key' => $key, 'to' => \count($to), 'cc' => \count($cc), 'forced' => $force && null !== $prev]);

        return ['status' => 'sent', 'report' => $r, 'ledgerKey' => $key, 'sentAt' => $sentAt];
    }

    private function text(Report $r, bool $withCsv): string
    {
        $lines = [
            'Raport flotă · '.$r->fleetName.' · '.$r->period->label(),
            '',
            'Cost total: '.Money::lei($r->totals->total()).' fără TVA · '.Money::num($r->budgetPct()).'% din buget ('.Money::lei($r->budget).')',
            Money::num($r->totals->perKm(), 2).' lei/km · '.Money::num($r->totals->consumption(), 1).' l/100 km · '.Money::num($r->totals->km).' km',
            '',
            'Ce trebuie decis:',
        ];
        foreach ($r->decisions as $i => $d) {
            $lines[] = ('ok' === $d['level'] ? '✓' : ($i + 1).'.').' '.$d['text'];
        }
        $lines[] = '';
        $lines[] = 'Atașat: raportul complet (PDF)'.($withCsv ? ' și datele pentru Excel (CSV).' : '.');

        return implode("\n", $lines)."\n";
    }

    /**
     * @param list<string> $list
     *
     * @return list<string>
     */
    public static function addresses(array $list, string $field): array
    {
        $out = [];
        foreach ($list as $a) {
            foreach (preg_split('/[,;\s]+/', $a) ?: [] as $x) {
                if ('' === $x) {
                    continue;
                }
                if (false === filter_var($x, \FILTER_VALIDATE_EMAIL)) {
                    throw new \InvalidArgumentException(\sprintf('%s: érvénytelen e-mail-cím: %s', $field, $x));
                }
                $out[strtolower($x)] = $x;
            }
        }

        return array_values($out);
    }
}
