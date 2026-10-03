<?php

namespace App\Asset;

use Symfony\Component\Asset\VersionStrategy\VersionStrategyInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * ?v=<tartalom-hash> az asset URL-ekre: minden módosított JS/CSS azonnal frissül a böngészőben,
 * a változatlanok cache-ből jönnek. Nincs build-lépés, nincs manifest, amit elfelejthetünk frissíteni.
 */
final class ContentHashVersionStrategy implements VersionStrategyInterface
{
    /** @var array<string, string> */
    private array $cache = [];

    public function __construct(
        #[Autowire('%kernel.project_dir%/public')]
        private readonly string $publicDir,
    ) {
    }

    public function getVersion(string $path): string
    {
        $file = $this->publicDir.'/'.ltrim($path, '/');

        return $this->cache[$path] ??= is_file($file) ? substr(md5_file($file), 0, 10) : '';
    }

    public function applyVersion(string $path): string
    {
        $version = $this->getVersion($path);

        return '' === $version ? $path : $path.'?v='.$version;
    }
}
