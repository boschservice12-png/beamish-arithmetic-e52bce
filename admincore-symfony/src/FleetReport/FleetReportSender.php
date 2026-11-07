<?php

namespace App\FleetReport;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Riport → fájlok (PDF + CSV + HTML) → e-mail → küldési napló + auditnapló.
 * Két változat: belső ($brand = null; a flotta vezetőjének) és B2B ($brand megadva; a szerviz küldi az ügyfélnek).
 * A dupla küldés ellen: flottánként, időszakonként és változatonként egyszer megy ki (csak $force-szal újra).
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

    /** @return array{report: Report, html: string, pdf: string, csv: string, stem: string} */
    public function render(FleetSnapshot $s, Period $period, ?Brand $brand = null): array
    {
        $r = $this->builder->build($s, $period);
        $html = $this->renderer->html($r, $brand);

        return ['report' => $r, 'html' => $html, 'pdf' => $this->renderer->pdf($html),
            'csv' => null === $brand ? $this->csv->render($r) : ClientActions::csv($r, $brand),
            'stem' => $r->fileStem().(null === $brand ? '' : '-client')];
    }

    /**
     * @param list<string> $to
     * @param list<string> $cc
     *
     * @return array{status: string, report: Report, ledgerKey: string, sentAt?: string}
     */
    public function send(FleetSnapshot $s, Period $period, array $to, array $cc = [], bool $withCsv = true, bool $force = false, ?Brand $brand = null): array
    {
        $variant = null === $brand ? 'internal' : 'client';
        $key = SendLedger::key($s->fleetId, $period->key, $variant);
        $prev = $this->ledger->find($key);
        if ($prev && !$force) {
            return ['status' => 'already_sent', 'report' => $this->builder->build($s, $period), 'ledgerKey' => $key, 'sentAt' => (string) ($prev['sentAt'] ?? '')];
        }
        $to = self::addresses($to, 'to');
        $cc = self::addresses($cc, 'cc');
        if (!$to) {
            throw new \InvalidArgumentException('Nincs címzett ('.(null === $brand ? '--to vagy FLEET_REPORT_TO' : '--to vagy FLEET_REPORT_CLIENT_TO').').');
        }
        if (\count($to) + \count($cc) > 10) {
            throw new \InvalidArgumentException('Legfeljebb 10 címzett.');
        }
        if (!$this->from) {
            throw new \InvalidArgumentException('Nincs feladó: FLEET_REPORT_FROM (pl. "TyreFleet <raport@cegem.ro>").');
        }

        $f = $this->render($s, $period, $brand);
        $r = $f['report'];
        $from = Address::create($this->from);
        $subject = null === $brand
            ? \sprintf('Raport flotă · %s · %s · %s (%s din buget)', $r->fleetName, $r->period->label(), Money::lei($r->totals->total()), Money::num($r->budgetPct()).'%')
            : \sprintf('%s · Raport flotă %s · %s', $brand->name, $r->fleetName, $r->period->label());
        $email = (new Email())
            ->from(null === $brand ? $from : new Address($from->getAddress(), $brand->name))
            ->to(...array_map(static fn (string $a) => new Address($a), $to))
            ->subject($subject)
            ->html($this->renderer->emailHtml($r, $withCsv, $brand))
            ->text(null === $brand ? $this->text($r, $withCsv) : $this->clientText($r, $brand, $withCsv))
            ->attach($f['pdf'], $f['stem'].'.pdf', 'application/pdf');
        if (null !== $brand && null !== $brand->email) {
            $email->replyTo(new Address($brand->email, $brand->name));
        }
        if ($cc) {
            $email->cc(...array_map(static fn (string $a) => new Address($a), $cc));
        }
        if ($withCsv) {
            $email->attach($f['csv'], $f['stem'].'.csv', 'text/csv; charset=UTF-8');
        }
        $email->getHeaders()->addTextHeader('X-TyreFleet-Report', $key);

        $this->mailer->send($email);

        $sentAt = (new \DateTimeImmutable('now', new \DateTimeZone('Europe/Bucharest')))->format(\DATE_ATOM);
        $this->ledger->record($key, [
            'sentAt' => $sentAt, 'variant' => $variant, 'to' => $to, 'cc' => $cc, 'forced' => $force && null !== $prev,
            'total' => round($r->totals->total(), 2), 'budgetPct' => round($r->budgetPct(), 1), 'decisions' => $r->openDecisions(),
            'pdfSha256' => hash('sha256', $f['pdf']), 'csvSha256' => $withCsv ? hash('sha256', $f['csv']) : null,
            'snapshotGeneratedAt' => $s->generatedAt->format('Y-m-d'),
        ]);
        $this->audit->info('fleet_report.sent', ['key' => $key, 'variant' => $variant, 'to' => \count($to), 'cc' => \count($cc), 'forced' => $force && null !== $prev]);

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

    private function clientText(Report $r, Brand $b, bool $withCsv): string
    {
        $st = $r->state;
        $lines = [
            $b->name.' · Raport flotă · '.$r->fleetName.' · '.$r->period->label(),
            '',
            'Bună ziua,',
            $r->operations ? 'în '.$r->period->label().' am efectuat '.\count($r->operations).' operațiuni pentru flota dumneavoastră.' : 'vă trimitem starea flotei dumneavoastră după '.$r->period->label().'.',
            'Anvelope: '.$st['tyres']['ok'].' în regulă · '.$st['tyres']['soon'].' curând · '.$st['tyres']['now'].' de schimbat acum.',
            '',
            'Ce vă recomandăm:',
        ];
        foreach (ClientActions::for($r, $b) as $i => $a) {
            $lines[] = ('ok' === $a['level'] ? '✓' : ($i + 1).'.').' '.$a['text'];
        }
        $lines[] = '';
        if ('' !== $b->contactLine()) {
            $lines[] = 'Programări și oferte: '.$b->contactLine();
        }
        $lines[] = 'Atașat: raportul complet (PDF)'.($withCsv ? ' și lista pentru Excel (CSV).' : '.');
        $lines[] = '';
        $lines[] = $b->legalName.($b->cui ? ' · CUI '.$b->cui : '');

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
