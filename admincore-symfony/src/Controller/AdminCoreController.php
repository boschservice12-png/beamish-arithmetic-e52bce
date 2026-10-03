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
