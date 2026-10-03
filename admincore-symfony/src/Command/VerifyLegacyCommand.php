<?php

namespace App\Command;

use App\AdminCore\AdminCoreConfig;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Environment;

/**
 * Regressziós őr: a Symfony által renderelt oldalt visszaépíti egyetlen HTML-lé
 * (asset-ek visszainline-olva, konfiguráció visszaírva), és bájtra összeveti a v33 monolittal.
 * Ha bárki véletlenül módosít egy JS/CSS/Twig fájlt, ez azonnal jelez.
 */
#[AsCommand(name: 'app:verify-legacy', description: 'Ellenőrzi, hogy a Symfony-oldal bájtra azonos-e a v33 HTML-lel')]
final class VerifyLegacyCommand
{
    /**
     * Szándékos, dokumentált eltérések a v33-hoz képest (eredeti → javított).
     * Minden új javítás ide kerül, indoklással — így az eltérés auditálható marad.
     */
    public const KNOWN_FIXES = [
        // FIX-001 (21-production.js): a "Panou Operațional" menügomb ellenőrzése a [data-adm4]-et kereste,
        // amit a gomb létrehozás után elveszít → minden újrarajzolásnál új gomb + a NAV_SHIM figyelője
        // újrarajzol → végtelen ciklus, a böngészőfül betöltéskor lefagyott.
        "if(!n||n.querySelector('[data-adm4]'))return;" => "if(!n||n.querySelector('[data-adm4],[data-powin]'))return;",
    ];

    public function __construct(
        private readonly Environment $twig,
        private readonly AdminCoreConfig $config,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Argument('Az összevetendő monolit HTML')]
        string $legacy = 'legacy/AdminCore_Szervezesi_tabla_33_3.html',
    ): int {
        $path = str_starts_with($legacy, '/') ? $legacy : $this->projectDir.'/'.$legacy;
        $expected = file_get_contents($path);
        foreach (self::KNOWN_FIXES as $from => $to) {
            if (1 !== substr_count($expected, $from)) {
                $io->error('A javítás forrásszövege nem pontosan egyszer szerepel: '.$from);

                return Command::FAILURE;
            }
            $expected = str_replace($from, $to, $expected);
        }
        $actual = $this->reassemble($this->twig->render('admincore/index.html.twig'));

        if ($actual === $expected) {
            $io->success(\sprintf('Azonos: %s (%d bájt, %d dokumentált javítással)', $legacy, \strlen($expected), \count(self::KNOWN_FIXES)));

            return Command::SUCCESS;
        }

        $at = strspn($actual ^ $expected, "\0");
        $io->error(\sprintf('ELTÉR a(z) %d. bájtnál.', $at));
        $io->writeln('Várt:   '.json_encode(substr($expected, max(0, $at - 80), 200), \JSON_UNESCAPED_UNICODE));
        $io->writeln('Kapott: '.json_encode(substr($actual, max(0, $at - 80), 200), \JSON_UNESCAPED_UNICODE));

        return Command::FAILURE;
    }

    /** A render inverze: <script src>/<link> → inline, ADMINCORE_CFG → konkrét értékek. */
    public function reassemble(string $html): string
    {
        $public = $this->projectDir.'/public/';
        $cfg = $this->config->getClientConfig();

        $html = preg_replace('#<script>window\.ADMINCORE_CFG=.*?;</script>#', '', $html, 1);
        $html = preg_replace_callback(
            '#<script src="/(admincore/js/[^"?]+)(?:\?v=\w+)?"></script>#',
            static fn (array $m) => '<script>'.file_get_contents($public.$m[1]).'</script>',
            $html,
        );
        $html = preg_replace_callback(
            '#<link rel="stylesheet"((?: id="[^"]*")?) href="/(admincore/css/[^"?]+)(?:\?v=\w+)?">#',
            static fn (array $m) => '<style'.$m[1].'>'.file_get_contents($public.$m[2]).'</style>',
            $html,
        );

        return strtr($html, [
            'var SB_URL=window.ADMINCORE_CFG.supabaseUrl;' => "var SB_URL='".$cfg['supabaseUrl']."';",
            'var SB_KEY=window.ADMINCORE_CFG.supabaseKey;' => "var SB_KEY='".$cfg['supabaseKey']."';",
        ]);
    }
}
