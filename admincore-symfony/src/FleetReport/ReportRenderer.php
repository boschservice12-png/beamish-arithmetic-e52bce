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

    /** internal = a flotta vezetőjének (költség, keret, kivételek); client = a szerviz arculatával az ügyfélnek. */
    public function html(Report $r, ?Brand $brand = null): string
    {
        return null === $brand
            ? $this->twig->render('fleet_report/report.html.twig', ['r' => $r])
            : $this->twig->render('fleet_report/client.html.twig', ['r' => $r, 'brand' => $brand, 'actions' => ClientActions::for($r, $brand)]);
    }

    public function emailHtml(Report $r, bool $withCsv, ?Brand $brand = null): string
    {
        return null === $brand
            ? $this->twig->render('fleet_report/email.html.twig', ['r' => $r, 'csv' => $withCsv])
            : $this->twig->render('fleet_report/email_client.html.twig', ['r' => $r, 'csv' => $withCsv, 'brand' => $brand, 'actions' => ClientActions::for($r, $brand)]);
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
