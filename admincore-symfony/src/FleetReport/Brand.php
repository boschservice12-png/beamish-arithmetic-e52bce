<?php

namespace App\FleetReport;

/**
 * A szerviz arculata a B2B (ügyfélnek szóló) riporton: név, cégadatok, elérhetőség, két szín, opcionális logó,
 * és mely szolgáltatásokat ajánlhatja fel a riport (pl. ITP csak RAR-engedéllyel). Forrás: JSON-fájl
 * (alap: config/fleet-report/brand.json, felülírás: FLEET_REPORT_BRAND). A null mező a riportból kimarad.
 */
final class Brand
{
    public const SERVICES = ['anvelope', 'depozitare', 'itp', 'service'];

    /** @param list<string> $services */
    private function __construct(
        public readonly string $name,
        public readonly string $legalName,
        public readonly ?string $cui,
        public readonly ?string $regcom,
        public readonly ?string $address,
        public readonly ?string $phone,
        public readonly ?string $email,
        public readonly ?string $web,
        public readonly string $color,
        public readonly string $colorSoft,
        public readonly ?string $logoDataUri,
        public readonly array $services,
    ) {
    }

    public static function fromFile(string $path): self
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new \InvalidArgumentException('A márka-fájl nem olvasható: '.$path);
        }
        try {
            $d = json_decode((string) file_get_contents($path), true, 16, \JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new \InvalidArgumentException('Márka-fájl: érvénytelen JSON — '.$e->getMessage(), 0, $e);
        }
        if (!\is_array($d)) {
            throw new \InvalidArgumentException('Márka-fájl: JSON-objektum kell.');
        }

        return self::fromArray($d, \dirname($path));
    }

    /** @param array<mixed> $d */
    public static function fromArray(array $d, string $baseDir = '.'): self
    {
        $opt = static function (string $k, int $max = 120) use ($d): ?string {
            $v = $d[$k] ?? null;

            return \is_string($v) && '' !== trim($v) ? trim(mb_substr($v, 0, $max)) : null;
        };
        $name = $opt('name', 60) ?? throw new \InvalidArgumentException('Márka: a "name" kötelező.');
        $color = $opt('color', 7) ?? '#c8102e';
        $soft = $opt('colorSoft', 7) ?? '#fbe9ec';
        foreach (['color' => $color, 'colorSoft' => $soft] as $k => $c) {
            if (!preg_match('/^#[0-9a-fA-F]{6}$/', $c)) {
                throw new \InvalidArgumentException("Márka: \"$k\" #RRGGBB formában.");
            }
        }
        $email = $opt('email');
        if (null !== $email && false === filter_var($email, \FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Márka: érvénytelen e-mail-cím.');
        }
        $web = $opt('web');
        if (null !== $web && !preg_match('#^https://[^\s"<>]+$#', $web)) {
            throw new \InvalidArgumentException('Márka: a "web" https:// címmel kezdődjön.');
        }
        $services = array_values(array_intersect(self::SERVICES, \is_array($d['services'] ?? null) ? $d['services'] : self::SERVICES));

        return new self($name, $opt('legalName') ?? $name, $opt('cui', 20), $opt('regcom', 30), $opt('address', 160), $opt('phone', 30),
            $email, $web, strtolower($color), strtolower($soft), self::logo($opt('logo', 200), $baseDir), $services);
    }

    public function offers(string $service): bool
    {
        return \in_array($service, $this->services, true);
    }

    /** Elérhetőség egy sorban: telefon · e-mail · web (ami meg van adva). */
    public function contactLine(): string
    {
        return implode(' · ', array_filter([$this->phone, $this->email, $this->web ? preg_replace('#^https://#', '', $this->web) : null]));
    }

    /** A logót beágyazzuk (data: URI), mert a PDF-motor nem tölt le semmit. PNG / JPEG / SVG, legfeljebb 300 KB. */
    private static function logo(?string $file, string $baseDir): ?string
    {
        if (null === $file) {
            return null;
        }
        $path = str_starts_with($file, '/') ? $file : $baseDir.'/'.$file;
        if (!is_file($path) || filesize($path) > 300 * 1024) {
            throw new \InvalidArgumentException('Márka: a logó nem található vagy nagyobb 300 KB-nál: '.$path);
        }
        $mime = match (strtolower(pathinfo($path, \PATHINFO_EXTENSION))) {
            'png' => 'image/png', 'jpg', 'jpeg' => 'image/jpeg', 'svg' => 'image/svg+xml',
            default => throw new \InvalidArgumentException('Márka: a logó PNG, JPEG vagy SVG legyen.'),
        };

        return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($path));
    }
}
