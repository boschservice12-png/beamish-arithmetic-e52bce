<?php

namespace App\FleetReport;

use Dompdf\Dompdf;
use Dompdf\Options;
use Twig\Environment;

/**
 * Riport → HTML (Twig) → PDF (Dompdf, A4). A PDF a szerveren készül, külső szolgáltatás és böngésző nélkül;
 * a Dompdf távoli erőforrást nem tölt le (isRemoteEnabled = false), a betű a beépített DejaVu Sans (ș, ț, ă, î, â).
 */
final class ReportRenderer
{
    public function __construct(private readonly Environment $twig)
    {
    }

    public function html(Report $r, string $variant = 'internal'): string
    {
        return $this->twig->render('fleet_report/report.html.twig', ['r' => $r, 'variant' => $variant]);
    }

    public function emailHtml(Report $r, bool $withCsv): string
    {
        return $this->twig->render('fleet_report/email.html.twig', ['r' => $r, 'csv' => $withCsv]);
    }

    public function pdf(string $html): string
    {
        $o = new Options();
        $o->setIsRemoteEnabled(false);
        $o->setIsPhpEnabled(false);
        $o->setIsJavascriptEnabled(false);
        $o->setDefaultFont('DejaVu Sans');
        $o->setDefaultPaperSize('a4');
        $o->setChroot([sys_get_temp_dir()]);
        $o->setTempDir(sys_get_temp_dir());
        $pdf = new Dompdf($o);
        $pdf->loadHtml($html, 'UTF-8');
        $pdf->render();

        return (string) $pdf->output();
    }
}
