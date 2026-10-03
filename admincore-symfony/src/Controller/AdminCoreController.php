<?php

namespace App\Controller;

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

    /** Az AdminCore „Pénzügy ↗” gombja relatív címen nyitja: finance-dashboard.html. */
    #[Route('/finance-dashboard.html', name: 'penzugy_legacy', methods: ['GET', 'HEAD'])]
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

    /** Terheléselosztó / monitoring ellenőrzés. */
    #[Route('/health', name: 'health', methods: ['GET', 'HEAD'])]
    public function health(): Response
    {
        return $this->json(['status' => 'ok']);
    }
}
