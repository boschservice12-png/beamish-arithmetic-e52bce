<?php

namespace App\Controller;

use App\Ops\ReadinessChecker;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class AdminCoreController extends AbstractController
{
    /** A szervezési tábla (AdminCore) — a v33 HTML-lel azonos felület. */
    #[Route('/', name: 'admincore_index', methods: ['GET', 'HEAD'])]
    public function index(): Response
    {
        return $this->render('admincore/index.html.twig');
    }

    /** Szerelő telefon (PIN-es belépés) — a szerelo-telefon.html-lel azonos felület. */
    #[Route('/szerelo', name: 'szerelo_index', methods: ['GET', 'HEAD'])]
    public function szerelo(): Response
    {
        return $this->render('szerelo/index.html.twig');
    }

    /** Teendőim — az iroda oldala a szerelő-telefon csatornához (teendoim.html). */
    #[Route('/teendoim', name: 'teendoim_index', methods: ['GET', 'HEAD'])]
    public function teendoim(): Response
    {
        return $this->render('teendoim/index.html.twig');
    }

    /** Pénzügyi panel (Panou de control operațional, 2026-04 modell) — fejlesztés alatt. */
    #[Route('/penzugy', name: 'penzugy_index', methods: ['GET', 'HEAD'])]
    public function penzugy(): Response
    {
        return $this->render('penzugy/index.html.twig');
    }

    /**
     * Az AdminCore „Pénzügy ↗” (finance-dashboard.html) és „Panou Operațional ↗” (panou-operational.html)
     * gombja relatív címen nyit — mindkettő a pénzügyi panel (Panou de control operațional).
     */
    #[Route('/finance-dashboard.html', name: 'penzugy_legacy', methods: ['GET', 'HEAD'])]
    #[Route('/panou-operational.html', name: 'penzugy_legacy_panou', methods: ['GET', 'HEAD'])]
    public function penzugyLegacy(): Response
    {
        return $this->redirectToRoute('penzugy_index', [], Response::HTTP_MOVED_PERMANENTLY);
    }

    /** A Netlify-os fájlnevek → új címek (régi könyvjelzők, kiosztott QR-kódok). */
    #[Route('/szerelo-telefon.html', name: 'szerelo_legacy', methods: ['GET', 'HEAD'])]
    public function szereloLegacy(): Response
    {
        return $this->redirectToRoute('szerelo_index', [], Response::HTTP_MOVED_PERMANENTLY);
    }

    #[Route('/teendoim.html', name: 'teendoim_legacy', methods: ['GET', 'HEAD'])]
    public function teendoimLegacy(): Response
    {
        return $this->redirectToRoute('teendoim_index', [], Response::HTTP_MOVED_PERMANENTLY);
    }

    /** Régi könyvjelzők (a monolit fájlneve) → új cím. */
    #[Route('/AdminCore_Szervezesi_tabla_{version}.html', name: 'admincore_legacy', requirements: ['version' => '[0-9_]+'], methods: ['GET', 'HEAD'])]
    public function legacy(): Response
    {
        return $this->redirectToRoute('admincore_index', [], Response::HTTP_MOVED_PERMANENTLY);
    }

    /** Élő-e a folyamat (liveness) — külső függés nélkül, mindig gyors. */
    #[Route('/health', name: 'health', methods: ['GET', 'HEAD'])]
    public function health(): Response
    {
        return $this->json(['status' => 'ok']);
    }

    /** Ki tud-e szolgálni (readiness): Supabase elérhető, napló és cache írható. 503, ha nem. */
    #[Route('/health/ready', name: 'health_ready', methods: ['GET', 'HEAD'])]
    public function ready(ReadinessChecker $checker): Response
    {
        $r = $checker->check();

        return $this->json(['status' => $r['ok'] ? 'ok' : 'hiba', 'checks' => $r['checks']], $r['ok'] ? 200 : 503, ['Cache-Control' => 'no-store']);
    }
}
